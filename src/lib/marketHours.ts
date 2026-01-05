export function isNSEMarketOpen(now: Date = new Date()): boolean {
  // Use the user's local system time. For LearnStocks we assume
  // users are primarily in India with their device timezone set to IST.
  const day = now.getDay(); // 0=Sun ... 6=Sat in local time
  const hours = now.getHours();
  const minutes = now.getMinutes();
  // Monday=1 ... Friday=5 (UTC Sunday=0)
  if (day === 0 || day === 6) return false; // Sunday(0) or Saturday(6)
  // Market window 09:15 to 15:30 inclusive start, exclusive end after 15:30
  const openMinutes = 9 * 60 + 15;
  const closeMinutes = 15 * 60 + 30;
  const currentMinutes = hours * 60 + minutes;
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

export function nextMarketSession(now: Date = new Date()): {
  opensAt: Date;
  isOpen: boolean;
} {
  // Compute next session using local (assumed IST) time.
  let day = now.getDay();
  let y = now.getFullYear();
  let m = now.getMonth();
  let d = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const openMinutes = 9 * 60 + 15;
  const currentMinutes = hours * 60 + minutes;
  if (isNSEMarketOpen(now)) return { opensAt: now, isOpen: true };
  if (day === 6) {
    // Saturday -> next Monday
    d += 2;
  } else if (day === 0) {
    // Sunday -> next Monday
    d += 1;
  } else if (currentMinutes > openMinutes) {
    // past today's close -> next day
    d += 1;
    // if next day is weekend, roll forward
    const temp = new Date(y, m, d);
    let w = temp.getDay();
    if (w === 6) d += 2;
    else if (w === 0) d += 1;
  }
  const opensAt = new Date(y, m, d, 9, 15);
  return { opensAt, isOpen: false };
}

export function marketStatusMessage(): string {
  return isNSEMarketOpen() ? "Market Open" : "Market Closed";
}

export default isNSEMarketOpen;
