import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { StyleProvider } from "./style-provider";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ProfileSettings } from "@/components/profile-settings";
import { NotificationBell } from "@/components/notification-bell";
import { PushNotificationToggle } from "@/components/push-notification-toggle";
import { cookies } from "next/headers";
import { LogoutButton } from "@/components/logout-button";
import { verifyJwt } from "@/lib/jwt";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const cookieStore = await cookies();
  const token = cookieStore.get("kanban_token")?.value;
  let userId: string | undefined;
  if (token) {
    try {
      userId = verifyJwt(token).userId;
    } catch {
      userId = undefined;
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${spaceMono.variable} antialiased`}
      >
        <Providers>
          <StyleProvider>
            {/* 👇 Wrap your app in a relative container */}
            <div className="relative min-h-screen flex flex-col">
              {/* 👇 Float the switcher globally in the top right corner! */}
              <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                {/* Note: In a real app, you would fetch the user's name on the server
                  and pass it down as `initialName`. For now, it will start empty
                  and fill in when they type!
                */}
                <ThemeSwitcher />
                {token && userId && <>
                  <PushNotificationToggle />
                  <NotificationBell userId={userId} />
                  <ProfileSettings />
                  <LogoutButton />
                </>}

              </div>

              {/* Your page content */}
              <main className="flex-1 flex flex-col">{children}</main>
            </div>
          </StyleProvider>
        </Providers>
      </body>
    </html>
  );
}
