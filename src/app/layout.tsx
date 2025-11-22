import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar";
import "./globals.css";
import { LucideIcon } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "QR Scanner App",
  description: "Package tracking and reporting application",
};

declare global {
  interface Window {
    LucideIcon: LucideIcon;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable} bg-background text-foreground`}>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div>{children}</div>
        </main>
      </body>
    </html>
  );
}
