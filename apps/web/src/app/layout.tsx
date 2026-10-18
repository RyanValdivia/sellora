import type { Metadata, Viewport } from "next";
import config from "@sellora/shared/config";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@sellora/ui/components/sonner";
import { TooltipProvider } from "@sellora/ui/components/tooltip";
import { env } from "@/lib/env";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: { default: `${config.brand.name} — ${config.brand.tagline}`, template: `%s · ${config.brand.name}` },
  description: config.brand.description,
  applicationName: config.brand.name,
  openGraph: {
    type: "website",
    siteName: config.brand.name,
    locale: config.locale.default.replace("-", "_"),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: config.palette.cream },
    { media: "(prefers-color-scheme: dark)", color: "#1c0f2b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={config.locale.default} className={fontVariables} suppressHydrationWarning>
      <body className="paper min-h-dvh">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
