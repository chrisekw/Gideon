
"use client";

import './globals.css';
import { usePathname } from 'next/navigation';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import SidebarNav from '@/components/gideon/sidebar-nav';
import React from 'react';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isCameraPage = pathname === '/camera';

  const AppContent = (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
                className="h-6 w-6 text-primary"
              >
                <rect width="256" height="256" fill="none"></rect>
                <path
                  d="M88,134.9,176,192,152,96l-32.2,4.1,4.1-32.2L96,152Z"
                  opacity="0.2"
                  fill="currentColor"
                ></path>
                <path
                  d="M128,24a104,104,0,1,0,104,104A104.2,104.2,0,0,0,128,24Zm48,168-24-96,4.1-32.2a8,8,0,0,0-10.1-10.1L113.8,58,96,152,40,176,88,134.9,128,128Z"
                  fill="currentColor"
                ></path>
              </svg>
              <h1 className="text-xl font-semibold tracking-tight">Gideon</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:hidden">
            <h1 className="text-2xl font-bold tracking-tight">Gideon</h1>
            <SidebarTrigger />
          </header>
          <main className="flex flex-1 flex-col items-center">
              {children}
          </main>
        </div>
      </SidebarProvider>
  )

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Gideon</title>
        <meta name="description" content="Your intelligent image analysis assistant." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {isCameraPage ? children : AppContent}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
