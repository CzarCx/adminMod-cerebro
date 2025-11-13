import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "QR Scanner App",
  description: "Package tracking and reporting application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${inter.variable} bg-background text-foreground`}>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div>{children}</div>
        </main>
      </body>
    </html>
  );
}
