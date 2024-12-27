import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { WrapperWithQuery } from "@/components/wrapper";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: {
    template: "%s | Next JS Ultimate SaaS Starter",
    default: "Next JS Ultimate SaaS Starter",
  },
  description: "The most comprehensive authentication library for typescript",
  metadataBase: new URL("https://demo.better-auth.com"),
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <WrapperWithQuery>{children}</WrapperWithQuery>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
