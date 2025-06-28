
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
            <div className="p-3 text-center">
              <h1 className="text-xl font-bold tracking-tighter text-primary">GiDEON</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Snap. Ask. Discover</p>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:hidden">
            <h1 className="text-2xl font-bold tracking-tight text-primary">GiDEON</h1>
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
        <title>GiDEON</title>
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
