import { useEffect, useState } from "react";

export interface BusinessSettings {
  name: string;
  phone: string;
  address: string;
  logo: string;
  brandColour: string;
  bookingLink: string;
  locale?: string;
  timezone?: string;
  currency?: string;
  email?: string;
  website?: string;
  orgNumber?: string;
  senderName?: string;
}
const KEY = "business.settings.v1";
const defaults: BusinessSettings = { name: "", phone: "", address: "", logo: "", brandColour: "#347ba8", bookingLink: "", locale: "en-GB", timezone: "Europe/London", currency: "GBP" };
export function readBusinessSettings(): BusinessSettings {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return defaults; }
}
export function saveBusinessSettings(settings: BusinessSettings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event("business-settings-changed"));
}
export function useBusinessSettings() {
  const [settings, setSettings] = useState(readBusinessSettings);
  useEffect(() => {
    const refresh = () => setSettings(readBusinessSettings());
    window.addEventListener("business-settings-changed", refresh);
    return () => window.removeEventListener("business-settings-changed", refresh);
  }, []);
  return settings;
}