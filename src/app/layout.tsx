
"use client";

import './globals.css';
import Link from 'next/link';
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
  SidebarFooter,
} from '@/components/ui/sidebar';
import SidebarNav from '@/components/gideon/sidebar-nav';
import React from 'react';
import Head from 'next/head';

const pageMetadata = {
  '/home': {
    title: 'GiDEON - AI Visual Search',
    description: 'Your intelligent visual assistant for understanding the world. Upload an image or use your camera to identify plants, animals, landmarks, and more.',
  },
  '/camera': {
    title: 'Camera | GiDEON',
    description: 'Use your camera for real-time identification. Snap a photo of any object, plant, or landmark to get instant analysis and information.',
  },
  '/history': {
    title: 'History | GiDEON',
    description: 'Review your past analyses and identifications. Your visual discovery history is saved here.',
  },
  '/settings': {
    title: 'Settings | GiDEON',
    description: 'Customize your GiDEON app experience, manage your theme, and control your data and privacy settings.',
  },
  '/about': {
    title: 'About GiDEON',
    description: 'Learn about GiDEON, the powerful multimodal AI visual assistant designed to help you identify, understand, and explore the world around you.',
  },
};

const defaultMetadata = {
  title: 'GiDEON - Snap. Ask. Discover.',
  description: 'GiDEON is a powerful multimodal AI visual assistant. Identify plants, animals, landmarks, and objects simply by taking a photo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isCameraPage = pathname === '/camera';
  
  const metadata = pageMetadata[pathname as keyof typeof pageMetadata] || defaultMetadata;

  const AppContent = (
      <SidebarProvider defaultOpen={false}>
        <Sidebar variant="floating" collapsible="icon">
          <SidebarHeader>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tighter text-primary">GiDEON</h1>
                <p className="text-xs text-muted-foreground mt-0.5 group-data-[state=collapsed]:hidden">Snap. Ask. Discover</p>
              </div>
              <SidebarTrigger className="hidden md:flex" />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter>
             <SidebarNav isFooter />
          </SidebarFooter>
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "GiDEON",
    "operatingSystem": "WEB",
    "applicationCategory": "Utilities",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "8864"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "GiDEON is a multimodal visual intelligence agent that helps users identify plants, animals, landmarks, and objects from images. Using AI, it provides detailed information and context about the world around you.",
    "keywords": "visual search, image recognition, plant identification, object identifier, landmark recognition, homework solver, photo analysis, AI visual assistant"
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content="visual search, image recognition, plant identification, object identifier, landmark recognition, homework solver, photo analysis, AI visual assistant" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gideon-eye.com/" />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:image" content="https://gideon-eye.com/og-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://gideon-eye.com/" />
        <meta property="twitter:title" content={metadata.title} />
        <meta property="twitter:description" content={metadata.description} />
        <meta property="twitter:image" content="https://gideon-eye.com/og-image.png" />
        
        <link rel="canonical" href={`https://gideon-eye.com${pathname}`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
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
