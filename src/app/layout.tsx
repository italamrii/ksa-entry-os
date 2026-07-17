import type { Metadata } from "next";
import { Manrope, Fraunces, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { LocaleDocumentSync } from "@/components/locale-document-sync";
import { APP_NAME, APP_TAGLINE_EN } from "@/lib/constants";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Saudi Market Entry Platform`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_TAGLINE_EN,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${fraunces.variable} ${geistMono.variable} ${notoArabic.variable} h-full dark`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <LocaleDocumentSync />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
