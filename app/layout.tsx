import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zero to One — Startup Simulator",
  description: "From Meta layoff to unicorn. A YC startup simulation powered by Gemini.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
