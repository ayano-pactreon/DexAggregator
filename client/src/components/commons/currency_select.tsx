import React from "react";
import {cn} from "@/lib/utils";
import {currencies as AllCurrencies} from "country-data-list";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {SelectProps} from "@radix-ui/react-select";
import {customCurrencies, allCurrencies} from "@/constants/currencies";

export interface Currency {
    code: string;
    decimals: number;
    name: string;
    number: string;
    symbol?: string;
}

interface CurrencySelectProps extends Omit<SelectProps, "onValueChange"> {
    onValueChange?: (value: string) => void;
    onCurrencySelect?: (currency: Currency) => void;
    name: string;
    placeholder?: string;
    currencies?: "custom" | "all";
    variant?: "default" | "small";
    valid?: boolean;
}

const CurrencySelect = React.forwardRef<HTMLButtonElement, CurrencySelectProps>(
    (
        {
            value,
            onValueChange,
            onCurrencySelect,
            name,
            placeholder = "Select currency",
            currencies = "withdrawal",
            variant = "default",
            valid = true,
            ...props
        },
        ref
    ) => {
        const [selectedCurrency, setSelectedCurrency] =
            React.useState<Currency | null>(null);

        const uniqueCurrencies = React.useMemo<Currency[]>(() => {
            const currencyMap = new Map<string, Currency>();

            AllCurrencies.all.forEach((currency: Currency) => {
                if (currency.code && currency.name && currency.symbol) {
                    let shouldInclude = false;

                    switch (currencies) {
                        case "custom":
                            shouldInclude = customCurrencies.includes(currency.code);
                            break;
                        case "all":
                            shouldInclude = !allCurrencies.includes(currency.code);
                            break;
                        default:
                            shouldInclude = !allCurrencies.includes(currency.code);
                    }

                    if (shouldInclude) {
                        // Special handling for Euro
                        if (currency.code === "EUR") {
                            currencyMap.set(currency.code, {
                                code: currency.code,
                                name: "Euro",
                                symbol: currency.symbol,
                                decimals: currency.decimals,
                                number: currency.number,
                            });
                        } else {
                            currencyMap.set(currency.code, {
                                code: currency.code,
                                name: currency.name,
                                symbol: currency.symbol,
                                decimals: currency.decimals,
                                number: currency.number,
                            });
                        }
                    }
                }
            });

            // Convert the map to an array and sort by currency name
            return Array.from(currencyMap.values()).sort((a, b) =>
                a.name.localeCompare(b.name)
            );
        }, [currencies]);

        const handleValueChange = (newValue: string) => {
            const fullCurrencyData = uniqueCurrencies.find(
                (curr) => curr.code === newValue
            );
            if (fullCurrencyData) {
                setSelectedCurrency(fullCurrencyData);
                if (onValueChange) {
                    onValueChange(newValue);
                }
                if (onCurrencySelect) {
                    onCurrencySelect(fullCurrencyData);
                }
            }
        };

        void selectedCurrency;

        return (
            <Select
                value={value}
                onValueChange={handleValueChange}
                {...props}
                name={name}
                data-valid={valid}
            >
                <SelectTrigger
                    className={cn(
                        "w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-medium text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring focus:ring-blue-500 shadow-md hover:shadow-lg transition-all duration-300",
                        variant === "small" && "w-fit gap-2 px-3 py-1"
                    )}
                    data-valid={valid}
                    ref={ref}
                >
                    <SelectValue placeholder={placeholder}>
        <span className="truncate text-base font-semibold tracking-tight">
          {variant === "small"
              ? value
              : selectedCurrency?.symbol ?? value}
        </span>
                    </SelectValue>
                </SelectTrigger>

                <SelectContent className="w-64 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-900 transition-all duration-300">
                    <SelectGroup>
                        {uniqueCurrencies.map((currency) => (
                            <SelectItem
                                key={currency?.code}
                                value={currency?.code || ""}
                                className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all rounded-lg"
                            >
                                <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground w-6 text-left font-medium text-gray-600 dark:text-gray-400">
                {currency?.symbol}
              </span>
                                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                {currency?.name}
              </span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        );
    }
);

CurrencySelect.displayName = "CurrencySelect";

export {CurrencySelect};
