"use client";

import {usePathname} from "next/navigation";
import {useEffect} from "react";
import {ChevronDown, Wallet, AlertTriangle} from "lucide-react";
import {NavTab} from "@/lib/core/enums/NavTab";
import {useWeb3Modal} from "@web3modal/wagmi/react";
import { useWeb3ModalTheme } from "@web3modal/wagmi/react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { xrplEvmSidechain } from "@/../config";

import {useSwapViewModel} from "@/viewmodels/SwapViewModel";
import {Socials} from "@/components/commons/Socials";

export const NAV_ITEMS: { label: NavTab; href: string }[] = [
    {label: NavTab.SWAP, href: "/dashboard"},
    {label: NavTab.EXPLORE, href: "/"},
    // {label: NavTab.POOL, href: "/pool"},
    // {label: NavTab.LEND_BORROW, href: "/lend"},
    // {label: NavTab.STAKE, href: "/stake"},
];

function NavLink({
                     href,
                     label,
                 }: {
    href: string;
    label: string;
}) {
    const pathname = usePathname();
    const isActive = pathname === href;

    const baseClass =
      "text-m font-medium transition-colors px-4 py-1.5 rounded-full border border-transparent";
    const activeClass = `
    bg-primary/20 border-primary shadow-sm hover:shadow-md hover:bg-primary/30
    bg-gradient-to-r from-blue-500 to-teal-400 text-transparent bg-clip-text
  `;
    const inactiveClass =
      "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 hover:shadow";

    return (
      <a
        href={href}
        className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
      >
          {label}
      </a>
    );
}

export default function Header() {
    const { setThemeMode } = useWeb3ModalTheme();
    const {open} = useWeb3Modal();
    const viewModel = useSwapViewModel();
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    const isCorrectNetwork = chainId === xrplEvmSidechain.id;

    useEffect(() => {
        // Always use dark theme
        document.documentElement.classList.add("dark");
        setThemeMode("dark");
        localStorage.setItem("theme", "dark");
    }, [setThemeMode]);

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const handleNetworkSwitch = () => {
        if (switchChain) {
            switchChain({ chainId: xrplEvmSidechain.id });
        }
    };

    return (
      <>
          <header
            className="fixed top-0 left-0 right-0 z-50 glass-panel m-4 mx-6 rounded-xl border border-border shadow-lg">
              <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                  {/* Logo */}
                  <div className="flex items-center space-x-3">
					  {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                      <a href="/" className="text-2xl brand-logo-header transition-all duration-300 hover:scale-105">
                          swap.show
                      </a>
                  </div>
                  {/* Navigation (desktop only) */}
                  <nav className="hidden md:flex items-center space-x-2">
                      {NAV_ITEMS.map(({href, label}) => (
                        <div key={label} className="relative flex items-center">
                            <NavLink href={href} label={label}/>
                        {label === NavTab.EXPLORE && (
                              <>
                                  <ChevronDown
                                    onClick={() =>
                                      viewModel.setHeaderDropdownOpen(!viewModel.headerDropdownOpen)
                                    }
                                    className={`ml-2 cursor-pointer transition-transform duration-200 h-4 w-4 ${
                                      viewModel.headerDropdownOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                  {viewModel.headerDropdownOpen && (
                                    <div
                                      className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-md px-8 py-6">
                                        <Socials/>
                                    </div>
                                  )}
                              </>
                            )}
                        </div>
                      ))}
                  </nav>
                  {/* Desktop wallet */}
                  <div className="hidden md:flex items-center space-x-3">
                      {isConnected && !isCorrectNetwork && (
                          <button
                              onClick={handleNetworkSwitch}
                              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-full transition">
                              <AlertTriangle size={18} />
                              Switch to XRPL EVM
                          </button>
                      )}
                      {isConnected && isCorrectNetwork && address && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-green-100 font-medium">{formatAddress(address)}</span>
                          </div>
                      )}
                      <button
                          onClick={() => open({ view: isConnected ? "Account" : "Connect" })}
                          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-full transition">
                          {isConnected ? "Account" : "Connect Wallet"}
                      </button>
                  </div>
                  {/* Mobile wallet */}
                  <div className="flex md:hidden items-center gap-2">
                      {isConnected && !isCorrectNetwork && (
                          <button
                              onClick={handleNetworkSwitch}
                              className="p-2 rounded-full bg-yellow-600 text-white hover:bg-yellow-700 transition"
                              aria-label="Switch Network">
                              <AlertTriangle size={18} />
                          </button>
                      )}
                      <button
                        onClick={() => open({ view: isConnected ? "Account" : "Connect" })}
                        className={`p-2 rounded-full ${isConnected && isCorrectNetwork ? 'bg-green-600' : 'bg-blue-600'} text-white hover:bg-blue-700 transition`}
                        aria-label="Connect Wallet">
                          <Wallet size={20}/>
                      </button>
                  </div>
              </div>
          </header>
          {/* Footer nav (mobile only) */}
          {/*<footer*/}
          {/*  className="sm:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-inner z-50 px-4 py-2">*/}
          {/*    <nav className="flex justify-around">*/}
          {/*        {NAV_ITEMS.map(({ href, label }) => (*/}
          {/*          <div key={label} className="relative flex items-center">*/}
          {/*              <div className="flex items-center gap-1">*/}
          {/*                  <NavLink href={href} label={label} />*/}
          {/*                  {label === NavTab.POOL && (*/}
          {/*                    <ChevronUp*/}
          {/*                      onClick={() =>*/}
          {/*                        viewModel.setHeaderDropdownOpen(!viewModel.headerDropdownOpen)*/}
          {/*                      }*/}
          {/*                      className={`cursor-pointer transition-transform duration-200 ml-10  h-4 w-4 text-gray-500 dark:text-gray-400 ${*/}
          {/*                        viewModel.headerDropdownOpen ? "rotate-180" : ""*/}
          {/*                      }`}*/}
          {/*                    />*/}
          {/*                  )}*/}
          {/*              </div>*/}
          {/*              {label === NavTab.POOL && viewModel.headerDropdownOpen && (*/}
          {/*                <div className="absolute bottom-full mb-2 right-0 z-50 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-md px-6 py-4">*/}
          {/*                    <Socials />*/}
          {/*                </div>*/}
          {/*              )}*/}
          {/*          </div>*/}
          {/*        ))}*/}
          {/*    </nav>*/}
          {/*</footer>*/}
      </>
    );
}
