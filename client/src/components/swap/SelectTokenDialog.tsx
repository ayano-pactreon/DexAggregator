"use client";

import * as React from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent, TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import {Globe, Search, X} from "lucide-react";
import {Token} from "@/viewmodels/SwapViewModel";

interface SelectTokenDialogProps {
    tokens: Token[];
    selected?: { symbol: string; network: string };
    onSelect: (symbol: string, network: string) => void;
    triggerLabel?: string;

    children?: React.ReactNode;
}

export default function SelectTokenDialog({
                                              tokens,
                                              selected,
                                              onSelect,
                                              triggerLabel = "Select Token",
                                          }: SelectTokenDialogProps) {
    const [open, setOpen] = React.useState(false);
    const allNetworks = Array.from(new Set(tokens.map((t) => t.network)));
    const [network, setNetwork] = React.useState("All Networks");
    const [search, setSearch] = React.useState("");

    const filtered = tokens
        .filter((t) =>
            (t.name + t.symbol).toLowerCase().includes(search.toLowerCase())
        )
        .filter((t) => network === "All Networks" || t.network === network);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full text-left py-5 cursor-pointer flex justify-between items-center relative">
                    {selected ? (
                        <>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={
                                        tokens.find(
                                            (t) =>
                                                t.symbol === selected.symbol && t.network === selected.network
                                        )?.image || ""
                                    }
                                    alt={selected.symbol}
                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                    className="w-6 h-6 rounded-full object-contain shrink-0"
                                />
                                <div className="flex flex-col leading-tight min-w-0">
                                    <span className="font-medium text-sm truncate">{selected.symbol}</span>
                                    <span className="text-xs text-muted-foreground ">{selected.network}</span>
                                </div>
                            </div>
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect("", "");
                                }}
                                className="absolute top-0 right-0 px-1.5 py-1 text-gray-500 hover:text-red-500 transition"
                            >
                              <X style={{width: "13px", height: "13px"}}/>
                          </span>
                        </>
                    ) : (
                        <span className="text-muted-foreground">{triggerLabel}</span>
                    )}
                </Button>
            </DialogTrigger>

            <DialogContent
                className="sm:max-w-lg bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border border-gray-200/60 dark:border-gray-700/60 shadow-xl rounded-2xl p-4 animate-fade-in-up transition-all duration-500">
                <DialogHeader>
                    <DialogTitle
                        className="text-2xl font-extrabold leading-tight bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Choose an asset
                    </DialogTitle>
                    <DialogDescription
                        className="text-base text-gray-600 dark:text-gray-400 animate-fade-in-up delay-100">
                        Pick a token and network to proceed.
                    </DialogDescription>
                </DialogHeader>

                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row sm:space-x-3 mt-1 animate-fade-in-up delay-150">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input
                            placeholder="Search token name or symbol"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 py-2 text-sm bg-muted border border-border focus:ring focus:ring-primary rounded-lg transition-all"
                        />
                    </div>

                    <Select value={network} onValueChange={setNetwork}>
                        <SelectTrigger
                            className="w-full sm:w-48 mt-2 sm:mt-0 text-sm bg-muted border border-border hover:border-blue-500 focus:border-blue-600 dark:hover:border-blue-400 dark:bg-gray-800 dark:border-gray-700 rounded-md transition cursor-pointer px-3 py-2 ">
                            <div className="flex items-center gap-1 truncate">
                                {network === "All Networks" ? (
                                    <>
                                        <Globe className="h-4 w-4 text-blue-500 shrink-0" />
                                        <span className="truncate">All Networks</span>
                                    </>
                                ) : (
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={tokens.find((t) => t.network === network)?.image || ""}
                                            alt={network}
                                            onError={(e) => (e.currentTarget.style.display = "none")}
                                            className="h-4 w-4 rounded-full object-contain shrink-0"
                                        />
                                        <span className="truncate">{network}</span>
                                    </>
                                )}
                            </div>
                        </SelectTrigger>

                        <SelectContent
                            className="rounded-md border border-border bg-white dark:bg-gray-900 shadow-xl text-sm text-gray-800 dark:text-gray-100 focus:outline-none">
                            <SelectItem
                                value="All Networks"
                                className="px-4 py-1 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors rounded-md cursor-pointer">
                                <div className="flex items-center gap-1">
                                    <Globe className="h-4 w-4 text-blue-500 shrink-0" />
                                    <span>All Networks</span>
                                </div>
                            </SelectItem>
                            {allNetworks.map((n) => {
                                const tokenWithThisNetwork = tokens.find((t) => t.network === n);
                                const image = tokenWithThisNetwork?.image;
                                return (
                                    <SelectItem
                                        key={n}
                                        value={n}
                                        className="px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors rounded-md cursor-pointer"
                                    >
                                        <div className="flex items-center gap-1">
                                            {image && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={image}
                                                    alt={n}
                                                    className="w-5 h-5 rounded-full object-contain shrink-0"
                                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                                />
                                            )}
                                            <span>{n}</span>
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>

                </div>

                {/* Token List */}
                <div className="mt-6 max-h-80 overflow-auto animate-fade-in-up delay-200 space-y-0">
                    {/* Headers */}
                    <div
                        className="grid grid-cols-3 sm:grid-cols-12 gap-4 px-5 pb-2 text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <span className="text-left sm:col-span-4">Token</span>
                        <span className="text-left sm:col-span-4">Network</span>
                        <span className="text-right sm:col-span-4">Balance</span>
                    </div>

                    {filtered.length > 0 ? (
                        filtered.map((t, i) => (
                            <div
                                key={`${t.symbol}-${i}`}
                                className="group relative rounded-xl p-1.5 sm:p-2 cursor-pointer transition-all duration-200 ease-in-out"
                                style={{animationDelay: `${i * 50 + 300}ms`}}
                                onClick={() => {
                                    onSelect(t.symbol, t.network);
                                    setOpen(false);
                                }}
                            >
                                {/* Content Container */}
                                <div
                                    className="relative z-10 bg-transparent border-none rounded-xl transition-all duration-200 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:shadow-lg"
                                    style={{willChange: "transform, box-shadow, background-color"}}>
                                    <div
                                        className="grid grid-cols-12 gap-2 items-center text-sm text-foreground dark:text-white px-4 py-3">
                                        {/* Symbol & Price */}
                                        <span
                                          className="col-span-4 font-semibold truncate flex items-center gap-2 cursor-default">
                                              <img
                                                src={t.image}
                                                alt={t.symbol}
                                                className="h-8 w-8 rounded-full"
                                              />
                                              <span>
                                                {t.symbol}
                                                  <span className="block text-xs text-gray-500 dark:text-gray-400 leading-tight">
                                                  ${t.tokenPrice}
                                                </span>
                                              </span>
                                            </span>
                                        {/* Network */}
                                        <span
                                            className="col-span-4 text-sm text-gray-600 dark:text-gray-300 truncate">{t.network}</span>

                                        {/* Balance */}
                                        <span
                                            className="col-span-4 text-right font-mono text-gray-800 dark:text-gray-100 truncate">{t.balance}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-sm text-muted-foreground pt-6">No tokens found.</p>
                    )}

                </div>

                {/* Footer */}
                <DialogFooter className="mt-6 space-x-2 animate-fade-in-up delay-300">
                    <DialogClose asChild>
                        <Button variant="outline"
                                className="w-full sm:w-auto text-sm font-semibold border border-blue-300 text-blue-600 dark:text-blue-400 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 transition-all duration-300 ease-in-out rounded-lg py-3 cursor-pointer">
                            Cancel
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
