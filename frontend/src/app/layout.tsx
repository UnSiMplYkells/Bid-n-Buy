import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import Header from "../components/Header";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Bid 'N Buy | Live Auction Platform",
  description: "Secure, real-time online auctions, live bidding battles, and automated lifecycle closures.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans pb-20 md:pb-0">
        <Providers>
          <Header />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
