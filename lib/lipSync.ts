/**
 * Lip sync engine adapted from imogen's frequency-analysis approach.
 * Plays PCM audio through Web Audio API AnalyserNode and maps
 * frequency bands to 5 mouth viseme states (aa/ee/ih/oh/ou).
 */

export type MouthState = "closed" | "aa" | "ee" | "ih" | "oh" | "ou";

const SAMPLE_RATE = 24000;
const FFT_SIZE = 256;
const VOWEL_SMOOTH = 0.25;
const LIP_INTENSITY = 0.6;
const AMPLITUDE_THRESHOLD = 0.01;
const AUDIO_GAIN = 3.0; // Amplify Gemini's quiet audio output

export class LipSyncEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private currentMouthState: MouthState = "closed";
  private animationFrame: number | null = null;
  private isPlaying = false;
  private onStateChange: (state: MouthState) => void;
  private frequencyData: Float32Array<ArrayBuffer> | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  private vowelWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
  private targetVowelWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
  private currentAmplitude = 0;
  private targetAmplitude = 0;

  constructor(onStateChange: (state: MouthState) => void) {
    this.onStateChange = onStateChange;
  }

  private initAudioContext() {
    if (this.audioContext) return;
    // Use default sample rate for best browser compatibility
    this.audioContext = new AudioContext();

    // Gain node to boost volume
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = AUDIO_GAIN;

    // Analyser for lip sync
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0.5;
    this.analyser.minDecibels = -85;
    this.analyser.maxDecibels = -20;

    // Chain: source → analyser → gain → destination
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.frequencyData = new Float32Array(this.analyser.frequencyBinCount) as Float32Array<ArrayBuffer>;
  }

  async playAudio(base64Audio: string): Promise<void> {
    this.initAudioContext();
    if (!this.audioContext || !this.analyser) return;

    if (this.audioContext.state === "suspended") {
      try { await this.audioContext.resume(); } catch { return; }
    }

    // Stop any current playback
    this.stopCurrentSource();

    // Decode base64 → PCM16 → Float32
    const binaryStr = atob(base64Audio);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }

    // Create buffer at the source sample rate (24kHz)
    // The AudioContext will resample to its native rate automatically
    const audioBuffer = this.audioContext.createBuffer(1, float32.length, SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.analyser);
    this.currentSource = source;

    return new Promise<void>((resolve) => {
      this.isPlaying = true;
      this.startAnimation();

      source.onended = () => {
        this.isPlaying = false;
        this.currentSource = null;
        this.currentMouthState = "closed";
        this.currentAmplitude = 0;
        this.targetAmplitude = 0;
        this.vowelWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
        this.onStateChange("closed");
        this.stopAnimation();
        resolve();
      };

      source.start();
    });
  }

  private analyzeFrame() {
    if (!this.analyser || !this.frequencyData || !this.isPlaying) {
      this.targetAmplitude = 0;
      return;
    }

    this.analyser.getFloatFrequencyData(this.frequencyData);

    const lowBand = this.getAverageEnergy(200, 500);
    const midBand = this.getAverageEnergy(500, 1500);
    const highBand = this.getAverageEnergy(1500, 3000);

    const total = lowBand + midBand + highBand + 0.0001;
    const lowRatio = lowBand / total;
    const midRatio = midBand / total;
    const highRatio = highBand / total;

    const amplitude = Math.min(1, total * 50);
    this.targetAmplitude = amplitude;

    const tw = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };

    if (amplitude > AMPLITUDE_THRESHOLD) {
      tw.aa = midRatio * 1.5;
      tw.ih = highRatio * 2.0;
      tw.ee = highRatio * 1.5;
      tw.ou = lowRatio * 2.0 * (1 - highRatio);
      tw.oh = (lowRatio + midRatio) * 0.8 * (1 - highRatio * 2);

      const maxWeight = Math.max(tw.aa, tw.ih, tw.ou, tw.ee, tw.oh, 0.1);
      for (const key of Object.keys(tw) as (keyof typeof tw)[]) {
        tw[key] = Math.max(0, Math.min(1, tw[key] / maxWeight));
      }
    }

    this.targetVowelWeights = tw;

    for (const key of Object.keys(this.vowelWeights) as (keyof typeof this.vowelWeights)[]) {
      this.vowelWeights[key] +=
        (this.targetVowelWeights[key] - this.vowelWeights[key]) * VOWEL_SMOOTH;
    }
    this.currentAmplitude +=
      (this.targetAmplitude - this.currentAmplitude) * VOWEL_SMOOTH;

    const intensity = this.currentAmplitude * LIP_INTENSITY;

    if (intensity < AMPLITUDE_THRESHOLD) {
      this.setMouth("closed");
      return;
    }

    const w = this.vowelWeights;
    const weighted = {
      aa: w.aa * intensity,
      ee: w.ee * intensity,
      ih: w.ih * intensity,
      oh: w.oh * intensity,
      ou: w.ou * intensity,
    };

    let maxKey: MouthState = "aa";
    let maxVal = 0;
    for (const [key, val] of Object.entries(weighted)) {
      if (val > maxVal) {
        maxVal = val;
        maxKey = key as MouthState;
      }
    }

    this.setMouth(maxVal > 0.02 ? maxKey : "closed");
  }

  private setMouth(state: MouthState) {
    if (state !== this.currentMouthState) {
      this.currentMouthState = state;
      this.onStateChange(state);
    }
  }

  private getAverageEnergy(minHz: number, maxHz: number): number {
    if (!this.frequencyData) return 0;
    const nyquist = (this.audioContext?.sampleRate || SAMPLE_RATE) / 2;
    const binCount = this.frequencyData.length;
    const binSize = nyquist / binCount;
    const minBin = Math.floor(minHz / binSize);
    const maxBin = Math.min(Math.ceil(maxHz / binSize), binCount - 1);

    let sum = 0;
    let count = 0;
    for (let i = minBin; i <= maxBin; i++) {
      const db = this.frequencyData[i];
      sum += Math.pow(10, db / 20);
      count++;
    }
    return count > 0 ? sum / count : 0;
  }

  private startAnimation() {
    if (this.animationFrame !== null) return;
    const animate = () => {
      this.analyzeFrame();
      this.animationFrame = requestAnimationFrame(animate);
    };
    this.animationFrame = requestAnimationFrame(animate);
  }

  private stopAnimation() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private stopCurrentSource() {
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch {}
      this.currentSource = null;
    }
  }

  stop() {
    this.stopCurrentSource();
    this.isPlaying = false;
    this.currentMouthState = "closed";
    this.currentAmplitude = 0;
    this.targetAmplitude = 0;
    this.vowelWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
    this.onStateChange("closed");
    this.stopAnimation();
  }

  dispose() {
    this.stop();
    this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.gainNode = null;
  }

  get playing(): boolean {
    return this.isPlaying;
  }
}
