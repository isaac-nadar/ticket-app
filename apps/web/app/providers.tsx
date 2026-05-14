"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
// import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={["light", "dark", "retro"]} // Explicitly register our 3 themes
    >
      {/* <SessionProvider>{children}</SessionProvider> */}
      {children}
    </NextThemesProvider>
  );
}
