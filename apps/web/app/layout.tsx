import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { StyleProvider } from "./style-provider";

// 1. Load the Corporate Font (Variable weight)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// 2. Load the Retro Font (Explicit weights)
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Kanban Board",
  description: "A multi-dimensional theme engine demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${spaceMono.variable} antialiased`}
      >
        <Providers>
          <StyleProvider>{children}</StyleProvider>
        </Providers>
      </body>
    </html>
  );
}
