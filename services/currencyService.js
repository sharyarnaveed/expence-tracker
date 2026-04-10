import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_CURRENCY_ISO, normalizeCurrencyIso, roundCurrencyAmount } from "./currencyUtils";

const CACHE_PREFIX = "rates_cache_";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

async function readRatesFromCache(baseCurrencyIso) {
  const key = `${CACHE_PREFIX}${normalizeCurrencyIso(baseCurrencyIso)}`;
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.rates || !parsed?.cachedAt) return null;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

async function writeRatesToCache(baseCurrencyIso, rates) {
  const key = `${CACHE_PREFIX}${normalizeCurrencyIso(baseCurrencyIso)}`;
  await AsyncStorage.setItem(
    key,
    JSON.stringify({
      base: normalizeCurrencyIso(baseCurrencyIso),
      rates,
      cachedAt: Date.now(),
    })
  );
}

async function fetchLatestRates(baseCurrencyIso) {
  const base = normalizeCurrencyIso(baseCurrencyIso);
  const endpoints = [
    `https://open.er-api.com/v6/latest/${base}`,
    `https://api.frankfurter.app/latest?from=${base}`,
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const payload = await response.json();

      // open.er-api.com shape
      if (payload?.rates && payload?.result !== "error") {
        return { base, rates: payload.rates };
      }

      // frankfurter shape
      if (payload?.rates && payload?.base) {
        return { base: normalizeCurrencyIso(payload.base), rates: payload.rates };
      }
    } catch (_) {
      // Continue to fallback endpoint.
    }
  }

  throw new Error("Unable to fetch exchange rates");
}

export async function getLatestRates(baseCurrencyIso = DEFAULT_CURRENCY_ISO) {
  const base = normalizeCurrencyIso(baseCurrencyIso);
  const cached = await readRatesFromCache(base);
  if (cached) return cached;

  const fresh = await fetchLatestRates(base);
  await writeRatesToCache(base, fresh.rates);
  return {
    base: fresh.base,
    rates: fresh.rates,
    cachedAt: Date.now(),
  };
}

export async function convertAmount(amount, fromCurrency, toCurrency) {
  const fromIso = normalizeCurrencyIso(fromCurrency);
  const toIso = normalizeCurrencyIso(toCurrency);

  if (fromIso === toIso) {
    return roundCurrencyAmount(amount);
  }

  const { rates } = await getLatestRates(fromIso);
  const rate = Number(rates?.[toIso]);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Exchange rate not available: ${fromIso} -> ${toIso}`);
  }

  return roundCurrencyAmount(Number(amount || 0) * rate);
}

export async function getConversionRate(fromCurrency, toCurrency) {
  const fromIso = normalizeCurrencyIso(fromCurrency);
  const toIso = normalizeCurrencyIso(toCurrency);

  if (fromIso === toIso) {
    return 1;
  }

  const { rates } = await getLatestRates(fromIso);
  const rate = Number(rates?.[toIso]);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Exchange rate not available: ${fromIso} -> ${toIso}`);
  }

  return rate;
}

export async function getSupportedCurrencyCodes() {
  const { rates } = await getLatestRates(DEFAULT_CURRENCY_ISO);
  return Object.keys(rates || {})
    .map((item) => normalizeCurrencyIso(item))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}
