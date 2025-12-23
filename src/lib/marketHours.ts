// NSE Market hours: Monday - Friday, 09:15 to 15:30 IST (India Standard Time, UTC+5:30)
// We compute using the user's local time by converting current UTC to IST offset.
// NOTE: This is a simple approximation and does not yet account for trading holidays.

const IST_OFFSET_MINUTES = 5 * 60 + 30; // +330 minutes

function getNowInIST(date: Date = new Date()): Date {
  // date.getTimezoneOffset() is minutes behind UTC (e.g., IST user in UTC+5:30 will see -330?)
  // We'll convert: IST time = UTC time + 330 minutes
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60_000; // normalize to UTC by adding offset
  const istMs = utcMs + IST_OFFSET_MINUTES * 60_000;
  return new Date(istMs);
}

export function isNSEMarketOpen(now: Date = new Date()): boolean {
  const ist = getNowInIST(now);
  const day = ist.getUTCDay(); // still UTC day on the shifted date object; we'll derive local components via getHours
  // Because we constructed ist as a shifted Date in UTC timeline, we should use getUTCHours/minutes for consistency
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  // Monday=1 ... Friday=5 (UTC Sunday=0)
  if (day === 0 || day === 6) return false; // Sunday(0) or Saturday(6)
  // Market window 09:15 to 15:30 inclusive start, exclusive end after 15:30
  const openMinutes = 9 * 60 + 15;
  const closeMinutes = 15 * 60 + 30;
  const currentMinutes = hours * 60 + minutes;
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

export function nextMarketSession(now: Date = new Date()): { opensAt: Date; isOpen: boolean } {
  const ist = getNowInIST(now);
  let day = ist.getUTCDay();
  let y = ist.getUTCFullYear();
  let m = ist.getUTCMonth();
  let d = ist.getUTCDate();
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const openMinutes = 9 * 60 + 15;
  const currentMinutes = hours * 60 + minutes;
  if (isNSEMarketOpen(now)) return { opensAt: ist, isOpen: true };
  if (day === 6) { // Saturday -> next Monday
    d += 2;
  } else if (day === 0) { // Sunday -> next Monday
    d += 1;
  } else if (currentMinutes > openMinutes) { // past today's close -> next day
    d += 1;
    // if next day is weekend, roll forward
    const temp = new Date(Date.UTC(y, m, d));
    let w = temp.getUTCDay();
    if (w === 6) d += 2; else if (w === 0) d += 1;
  }
  const opensAtUTC = Date.UTC(y, m, d, 9, 15) - IST_OFFSET_MINUTES * 60_000; // reverse transform to UTC epoch
  return { opensAt: new Date(opensAtUTC), isOpen: false };
}

export function marketStatusMessage(): string {
  return isNSEMarketOpen() ? "Market Open" : "Market Closed";
}

export default isNSEMarketOpen;
