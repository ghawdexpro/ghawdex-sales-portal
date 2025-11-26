import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import FacebookPixel from "@/components/FacebookPixel";
import ZohoSalesIQ from "@/components/ZohoSalesIQ";
import TimeTracker from "@/components/TimeTracker";
// import WhatsAppButton from "@/components/WhatsAppButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GhawdeX Solar | Get Your Free Quote | Malta's #1 Solar Installer",
  description: "Get your personalized solar quote in minutes. AI-powered analysis, instant pricing, and financing options. Professional installation in 14 days. Malta & Gozo.",
  keywords: [
    "solar panels Malta",
    "solar quote Malta",
    "solar installation",
    "solar energy Malta",
    "photovoltaic Malta",
    "GhawdeX solar",
    "free solar analysis",
    "solar financing Malta",
    "BOV solar loan",
  ],
  authors: [{ name: "GhawdeX Engineering" }],
  openGraph: {
    title: "GhawdeX Solar | Get Your Free Quote",
    description: "Get your personalized solar quote in minutes. AI-powered analysis, instant pricing, and financing options.",
    url: "https://get.ghawdex.pro",
    siteName: "GhawdeX Solar Portal",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GhawdeX Solar - Get Your Quote",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GhawdeX Solar | Get Your Free Quote",
    description: "Get your personalized solar quote in minutes. Professional installation in 14 days.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <FacebookPixel />
        </Suspense>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-white`}
      >
        {children}
        {/* WhatsApp button disabled - covers wizard navigation buttons */}
        {/* <WhatsAppButton /> */}
        <TimeTracker />
        <ZohoSalesIQ />
      </body>
    </html>
  );
}
