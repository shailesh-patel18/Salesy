import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "SalesCo-Pilot | AI Sales Assistant",
  description: "Accelerate your B2B sales with AI-powered lead sourcing, proposal generation, and batch personalization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-slate-950 text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
