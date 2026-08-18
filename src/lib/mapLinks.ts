/** Deep links into the phone's maps app — no API keys, no embedded map. */

function isApple() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
}

const enc = (s: string) => encodeURIComponent(s.trim());

/** Directions to a single address. */
export function directionsUrl(address: string): string {
  if (isApple()) return `https://maps.apple.com/?daddr=${enc(address)}&dirflg=d`;
  return `https://www.google.com/maps/dir/?api=1&destination=${enc(address)}&travelmode=driving`;
}

/** One route through every stop of the day, in order. */
export function routeUrl(addresses: string[]): string {
  const stops = addresses.map((a) => a.trim()).filter(Boolean);
  if (stops.length === 0) return "https://www.google.com/maps";
  if (stops.length === 1) return directionsUrl(stops[0]);

  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(0, -1);

  if (isApple()) {
    // Apple Maps has no multi-stop URL — route to the first stop, then the rest.
    return `https://maps.apple.com/?daddr=${enc(stops[0])}&dirflg=d`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${enc(destination)}&waypoints=${waypoints
    .map(enc)
    .join("%7C")}&travelmode=driving`;
}

export function openMaps(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`;
}
