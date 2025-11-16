import type {Metadata} from "next";
import {Geist, Geist_Mono, Space_Grotesk} from "next/font/google";
import "./globals.css";
import {cookieToInitialState} from "wagmi";
import {config} from "../../config";
import Web3ModalProvider from "../../context";
import {headers} from "next/headers";
import Header from "@/components/commons/header";
import Hero from "@/components/commons/hero";
import Footer from "@/components/commons/footer";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
    variable: "--font-space-grotesk",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "swap.show - Cross-Chain Swap",
    description: "Trade across multiple blockchains with the best rates",
};

export default async function RootLayout({children}: { children: React.ReactNode }) {
    const headersList = await headers();
    const initialState = cookieToInitialState(config, headersList.get("cookie"));
    return (
      <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}>
      <Web3ModalProvider initialState={initialState}>
          <div className="bg-app-gradient text-foreground min-h-screen flex flex-col">
              <Header/>
              <Hero/>
              <main className="flex-grow">
                  {children}
              </main>
              <Footer/>
          </div>
      </Web3ModalProvider>
      </body>
      </html>
    );
}
