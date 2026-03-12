"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { CountryCode, CurrencyCode, DEFAULT_COUNTRY, DEFAULT_CURRENCY } from "./locale-data";

const STORAGE_KEY_COUNTRY = "yerbatea-country";
const STORAGE_KEY_CURRENCY = "yerbatea-currency";

type LocaleContextType = {
  country: CountryCode;
  currency: CurrencyCode;
  setCountry: (country: CountryCode) => void;
  setCurrency: (currency: CurrencyCode) => void;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedCountry = localStorage.getItem(STORAGE_KEY_COUNTRY) as CountryCode | null;
    const storedCurrency = localStorage.getItem(STORAGE_KEY_CURRENCY) as CurrencyCode | null;
    
    if (storedCountry) {
      setCountryState(storedCountry);
    }
    if (storedCurrency) {
      setCurrencyState(storedCurrency);
    }
    setMounted(true);
  }, []);

  const setCountry = useCallback((newCountry: CountryCode) => {
    setCountryState(newCountry);
    localStorage.setItem(STORAGE_KEY_COUNTRY, newCountry);
  }, []);

  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(STORAGE_KEY_CURRENCY, newCurrency);
  }, []);

  if (!mounted) {
    return (
      <LocaleContext.Provider
        value={{
          country: DEFAULT_COUNTRY,
          currency: DEFAULT_CURRENCY,
          setCountry: () => {},
          setCurrency: () => {},
        }}
      >
        {children}
      </LocaleContext.Provider>
    );
  }

  return (
    <LocaleContext.Provider value={{ country, currency, setCountry, setCurrency }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
