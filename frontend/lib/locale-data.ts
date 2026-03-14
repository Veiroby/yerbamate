export const EU_COUNTRIES = [
  { value: "AT", label: "Austria" },
  { value: "BE", label: "Belgium" },
  { value: "BG", label: "Bulgaria" },
  { value: "HR", label: "Croatia" },
  { value: "CY", label: "Cyprus" },
  { value: "CZ", label: "Czech Republic" },
  { value: "DK", label: "Denmark" },
  { value: "EE", label: "Estonia" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "DE", label: "Germany" },
  { value: "GR", label: "Greece" },
  { value: "HU", label: "Hungary" },
  { value: "IE", label: "Ireland" },
  { value: "IT", label: "Italy" },
  { value: "LV", label: "Latvia" },
  { value: "LT", label: "Lithuania" },
  { value: "LU", label: "Luxembourg" },
  { value: "MT", label: "Malta" },
  { value: "NL", label: "Netherlands" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "RO", label: "Romania" },
  { value: "SK", label: "Slovakia" },
  { value: "SI", label: "Slovenia" },
  { value: "ES", label: "Spain" },
  { value: "SE", label: "Sweden" },
  { value: "GB", label: "United Kingdom" },
] as const;

export const CURRENCIES = [
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
] as const;

export type CountryCode = (typeof EU_COUNTRIES)[number]["value"];
export type CurrencyCode = (typeof CURRENCIES)[number]["value"];

export const DEFAULT_COUNTRY: CountryCode = "LV";
export const DEFAULT_CURRENCY: CurrencyCode = "EUR";
