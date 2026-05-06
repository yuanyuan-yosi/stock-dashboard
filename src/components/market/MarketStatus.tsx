export function MarketStatus() {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const day = et.getDay();
  const timeNum = hours * 60 + minutes;

  let status = 'Closed';
  let color = 'text-gray-400';

  if (day >= 1 && day <= 5) {
    if (timeNum >= 570 && timeNum < 960) {
      status = 'Regular Hours';
      color = 'text-emerald-400';
    } else if (timeNum >= 240 && timeNum < 570) {
      status = 'Pre-Market';
      color = 'text-yellow-400';
    } else if (timeNum >= 960 && timeNum < 1200) {
      status = 'After Hours';
      color = 'text-orange-400';
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-mono ${color}`}>{status}</span>
    </div>
  );
}
