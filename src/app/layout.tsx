import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { THEME_STORAGE_KEY } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: "Abonten Technologies HR",
  description: "HR operations platform — performance, people ops, and attendance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${GeistSans.className} flex min-h-full flex-col`}>
        <ThemeProvider>
          <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
