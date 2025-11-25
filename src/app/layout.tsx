
'use client';
import { useState } from 'react';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "./globals.css";
import { LucideIcon } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// Metadata can be defined in a separate variable if the component needs to be a client component
// export const metadata: Metadata = {
//   title: "Dashboard de Administrador de Etiquetas",
//   description: "Package tracking and reporting application",
// };

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
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <html lang="en">
      <head>
          <title>Dashboard de Administrador de Etiquetas</title>
          <meta name="description" content="Package tracking and reporting application" />
      </head>
      <body className={`font-sans ${inter.variable} bg-background text-foreground overflow-x-hidden`}>
        <div className="flex flex-col min-h-screen">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
          <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="container mx-auto px-4 py-8 flex-grow">
            <div>{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
