import {Button} from "@/components/ui/button"

import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {Text} from "@/components/ui/typography"
import {ethereumWallets} from "@/lib/core/enums/EthereumWallet";
import {useSwapViewModel} from "@/viewmodels/SwapViewModel";


export function Connectwallet({
                                  open,
                                  setOpen,
                              }: { open?: boolean; setOpen?: (open: boolean) => void; }) {
  const viewModel = useSwapViewModel();

  return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    className="w-full text-sm font-semibold text-white bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-500 ease-in-out shadow-sm hover:shadow-md rounded-lg py-3 cursor-pointer">
                    Connect Wallet
                </Button>
            </SheetTrigger>
            <SheetContent
                className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-l border-gray-200/60 dark:border-gray-700/60 transition-all duration-500">
                <SheetHeader className="mb-6">
                    <SheetTitle
                        className="text-3xl font-extrabold leading-tight bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent animate-fade-in-up">
                        Connect Wallet
                    </SheetTitle>
                    <SheetDescription
                        className="text-base text-gray-600 dark:text-gray-400 animate-fade-in-up delay-100">
                        Select the wallet you want to connect to the Moksa Portal
                    </SheetDescription>
                </SheetHeader>

                <div className="grid flex-1 auto-rows-min gap-8 px-4 pb-8">
                    {/* Substrate Wallets */}
                    <div className="animate-fade-in-up delay-150">
                        <Text className="text-2xl font-semibold tracking-tight text-blue-700 dark:text-blue-300 mb-2">
                            Substrate wallets
                        </Text>
                        <div className="space-y-3">
                            <div
                                className="flex items-center justify-between p-4 bg-muted/50 dark:bg-muted/30 rounded-xl shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                                <div className="flex items-center space-x-3">
                                    <Text className="text-lg font-semibold">Talisman</Text>
                                </div>
                                <Button size="sm" variant="outline" className="text-blue-600 dark:text-blue-400 cursor-pointer">
                                    Install Wallet
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Ethereum Wallets */}
                    <div className="animate-fade-in-up delay-200">
                        <Text
                          className="text-2xl font-semibold tracking-tight text-blue-700 dark:text-blue-300 mb-2">
                            Ethereum wallets
                        </Text>
                        <div className="space-y-2">
                            {ethereumWallets.map((wallet, index) => {
                                const connected = viewModel.isWalletConnected(wallet); // Pass wallet name string
                              return (
                                  <div
                                    key={wallet}
                                    className="group flex items-center justify-between p-4 bg-muted/50 dark:bg-muted/30 rounded-xl shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                    style={{ animationDelay: `${index * 100 + 300}ms` }}
                                    onClick={() => viewModel.toggleWalletConnection(wallet)}>

                                      <div className="flex items-center space-x-3">
                                          <Text className="text-lg font-semibold">{wallet}</Text>
                                      </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className={
                                            connected
                                              ? "text-green-600 dark:text-green-400"
                                              : "text-blue-600 dark:text-blue-400"
                                        }
                                      >
                                        <span>
                                      {connected ? (
                                               <>
                                         <span className="group-hover:hidden">Connected</span>
                                         <span className="hidden group-hover:inline text-red-500">Disconnect</span>
                                               </>
                                             ) : (
                                            "Connect"
                                            )}
                                         </span>
                                      </Button>
                                  </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <SheetFooter className="mt-4 space-x-2">
                    <SheetClose asChild>
                        <Button type="submit"
                                className="w-full text-sm font-semibold text-white
             bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600
             hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700
             transition-all duration-300 ease-in-out
             shadow-md hover:shadow-lg
             rounded-lg py-3 cursor-pointer"
                    >
                        Save Changes
                    </Button>
                        </SheetClose>
                    <SheetClose asChild>
                        <Button variant="outline"
                                className="w-full text-sm font-semibold border border-blue-300 text-blue-600 dark:text-blue-400 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 transition-all duration-300 ease-in-out rounded-lg py-3 cursor-pointer">
                            Close
                        </Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>

    )
}
