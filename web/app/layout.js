import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: '#c19a6b',
};

export const metadata = {
  title: "Quick Memo Dashboard",
  description: "Capture and organize ideas instantly.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuickMemo",
  },
  icons: {
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
