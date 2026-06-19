import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://matin-realestate.vercel.app"),
  title: {
    default: "Matin Real Estate — Portland & SW Washington's most advanced brokerage",
    template: "%s · Matin Real Estate",
  },
  description:
    "Buy and sell across Portland, Lake Oswego, West Linn and SW Washington with Matin Real Estate — $130M+ in annual sales, 100+ active listings, and an AI-powered concierge that never sleeps.",
  keywords: [
    "Portland real estate",
    "West Linn homes for sale",
    "Lake Oswego realtor",
    "Matin Real Estate",
    "Oregon homes for sale",
  ],
  openGraph: {
    title: "Matin Real Estate",
    description:
      "Portland & SW Washington's most technologically advanced real estate brokerage.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bone text-ink">{children}</body>
    </html>
  );
}
