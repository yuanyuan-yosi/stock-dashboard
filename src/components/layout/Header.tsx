import { useState, useEffect } from 'react';
import type { TabType } from '../../types';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: string }[] = [
  { id: 'overview', label: 'MI Market', icon: '◈' },
  { id: 'watchlist', label: 'MI Watchlist', icon: '★' },
  { id: 'portfolio', label: 'MI Portfolio', icon: '◉' },
  { id: 'finance', label: 'MI Finance', icon: '💰' },
  { id: 'chat', label: 'MI Chat', icon: '💬' },
  { id: 'economy', label: 'MI Economy', icon: '📊' },
];

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const marketStatus = getMarketStatus();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[var(--color-card)] border-b border-[var(--color-border)]">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold tracking-tight text-white">
          MI DASHBOARD<span className="text-emerald-400">.</span>
        </h1>
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              marketStatus.color
            }`}
          />
          <span className="text-gray-400 font-mono text-xs">
            {marketStatus.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
          <span className="text-gray-500">
            <span className="text-gray-600">NYC</span>{' '}
            {time.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false })}
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-500">
            <span className="text-gray-600">MAD</span>{' '}
            {time.toLocaleTimeString('en-US', { timeZone: 'Europe/Madrid', hour12: false })}
          </span>
        </div>
      </div>
    </header>
  );
}

function getMarketStatus(): { label: string; color: string } {
  const now = new Date();
  const et = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  const day = et.getDay();
  if (day === 0 || day === 6) return { label: 'MARKET CLOSED', color: 'bg-gray-500' };

  const hours = et.getHours();
  const minutes = et.getMinutes();
  const timeNum = hours * 60 + minutes;

  if (timeNum >= 240 && timeNum < 570) {
    return { label: 'PRE-MARKET', color: 'bg-amber-400 animate-pulse' };
  }
  if (timeNum >= 570 && timeNum < 960) {
    return { label: 'MARKET OPEN', color: 'bg-emerald-400 animate-pulse' };
  }
  if (timeNum >= 960 && timeNum < 1200) {
    return { label: 'AFTER-HOURS', color: 'bg-amber-400 animate-pulse' };
  }
  return { label: 'MARKET CLOSED', color: 'bg-gray-500' };
}
