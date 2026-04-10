import * as Location from "expo-location";
import { supabase } from "../lib/SupabaseClient";
import { DEFAULT_CURRENCY_ISO, normalizeCurrencyIso } from "./currencyUtils";
import { getConversionRate } from "./currencyService";

const COUNTRY_TO_CURRENCY = {
  PK: "PKR",
  US: "USD",
  GB: "GBP",
  CA: "CAD",
  AU: "AUD",
  IN: "INR",
  AE: "AED",
  SA: "SAR",
  EU: "EUR",
};

function safeCountryIso(value) {
  if (!value || typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return code.length === 2 ? code : null;
}

async function detectCountryFromDevice() {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      return null;
    }

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    if (!position?.coords) return null;

    const places = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    return safeCountryIso(places?.[0]?.isoCountryCode || places?.[0]?.countryCode);
  } catch (_) {
    return null;
  }
}

async function detectCountryFromIp() {
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) return null;
    const payload = await response.json();
    return safeCountryIso(payload?.country_code);
  } catch (_) {
    return null;
  }
}

async function mapCountryToCurrency(countryIso) {
  const normalizedCountry = safeCountryIso(countryIso);
  if (!normalizedCountry) return DEFAULT_CURRENCY_ISO;

  if (COUNTRY_TO_CURRENCY[normalizedCountry]) {
    return COUNTRY_TO_CURRENCY[normalizedCountry];
  }

  try {
    const response = await fetch(`https://restcountries.com/v3.1/alpha/${normalizedCountry}`);
    if (!response.ok) return DEFAULT_CURRENCY_ISO;
    const payload = await response.json();
    const first = Array.isArray(payload) ? payload[0] : null;
    const currencies = first?.currencies ? Object.keys(first.currencies) : [];
    if (!currencies.length) return DEFAULT_CURRENCY_ISO;
    return normalizeCurrencyIso(currencies[0]);
  } catch (_) {
    return DEFAULT_CURRENCY_ISO;
  }
}

async function getDetectedCountryAndCurrency() {
  const countryIso = (await detectCountryFromDevice()) || (await detectCountryFromIp()) || null;
  const currencyIso = await mapCountryToCurrency(countryIso);

  return {
    countryIso,
    currencyIso: normalizeCurrencyIso(currencyIso || DEFAULT_CURRENCY_ISO),
  };
}

export async function getOrCreateUserCurrencyProfile(userId) {
  const { data: amountRow, error: rowError } = await supabase
    .from("useramount")
    .select("userid, country_iso, currency_iso, is_default_currency")
    .eq("userid", userId)
    .maybeSingle();

  if (rowError) {
    throw new Error(rowError.message);
  }

  const hasCurrency = Boolean(amountRow?.currency_iso);
  const hasCountry = Boolean(amountRow?.country_iso);
  const isDefaultCurrency = Boolean(amountRow?.is_default_currency);

  // First dashboard entry path:
  // signup may prefill USD with null country; we still need to ask location permission once.
  if (hasCurrency && (hasCountry || !isDefaultCurrency)) {
    return {
      countryIso: amountRow.country_iso,
      currencyIso: normalizeCurrencyIso(amountRow.currency_iso),
      isDefaultCurrency: Boolean(amountRow.is_default_currency),
    };
  }

  const detected = await getDetectedCountryAndCurrency();

  if (!amountRow) {
    const { error: insertError } = await supabase.from("useramount").insert({
      userid: userId,
      addedamount: 0,
      country_iso: detected.countryIso,
      currency_iso: detected.currencyIso,
      is_default_currency: true,
    });
    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  const { error: upsertError } = await supabase
    .from("useramount")
    .update({
      country_iso: detected.countryIso,
      currency_iso: detected.currencyIso,
      is_default_currency: true,
    })
    .eq("userid", userId);

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return {
    countryIso: detected.countryIso,
    currencyIso: detected.currencyIso,
    isDefaultCurrency: true,
  };
}

export async function ensureUserCurrencyOnDashboardEntry(userId) {
  try {
    return await getOrCreateUserCurrencyProfile(userId);
  } catch (_) {
    const fallback = {
      countryIso: null,
      currencyIso: DEFAULT_CURRENCY_ISO,
      isDefaultCurrency: true,
    };

    const { data: amountRow } = await supabase
      .from("useramount")
      .select("id")
      .eq("userid", userId)
      .maybeSingle();

    if (amountRow) {
      await supabase
        .from("useramount")
        .update({
          country_iso: null,
          currency_iso: DEFAULT_CURRENCY_ISO,
          is_default_currency: true,
        })
        .eq("userid", userId);
    } else {
      await supabase.from("useramount").insert({
        userid: userId,
        addedamount: 0,
        country_iso: null,
        currency_iso: DEFAULT_CURRENCY_ISO,
        is_default_currency: true,
      });
    }

    return fallback;
  }
}

export async function convertAndPersistUserCurrency(userId, newCurrencyIso) {
  const profile = await getOrCreateUserCurrencyProfile(userId);
  const oldCurrencyIso = normalizeCurrencyIso(profile.currencyIso);
  const targetCurrencyIso = normalizeCurrencyIso(newCurrencyIso);

  if (oldCurrencyIso === targetCurrencyIso) {
    return {
      changed: false,
      currencyIso: targetCurrencyIso,
    };
  }

  const rate = await getConversionRate(oldCurrencyIso, targetCurrencyIso);

  const { error: rpcError } = await supabase.rpc("convert_user_currency", {
    p_userid: userId,
    p_from_currency_iso: oldCurrencyIso,
    p_to_currency_iso: targetCurrencyIso,
    p_rate: rate,
  });

  if (rpcError) {
    throw new Error(rpcError.message || "Failed to convert user currency");
  }

  return {
    changed: true,
    rate,
    from: oldCurrencyIso,
    to: targetCurrencyIso,
    currencyIso: targetCurrencyIso,
  };
}
