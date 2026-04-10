export const DEFAULT_CURRENCY_ISO = "USD";

export function normalizeCurrencyIso(currencyIso) {
  if (!currencyIso || typeof currencyIso !== "string") {
    return DEFAULT_CURRENCY_ISO;
  }
  return currencyIso.trim().toUpperCase();
}

export function roundCurrencyAmount(amount) {
  const value = Number(amount || 0);
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getCurrencySymbol(currencyIso) {
  const code = normalizeCurrencyIso(currencyIso);

  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(1);

    const currencyPart = parts.find((part) => part.type === "currency");
    return currencyPart?.value || code;
  } catch (_) {
    return code;
  }
}

export function formatMoney(amount, currencyIso) {
  const code = normalizeCurrencyIso(currencyIso);
  const safeAmount = Number(amount || 0);

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch (_) {
    const rounded = roundCurrencyAmount(safeAmount).toFixed(2);
    return `${getCurrencySymbol(code)}${rounded}`;
  }
}
