import { useState, useRef, useEffect } from 'react';
import { useSearch } from '../../hooks/useSearch';
import { useWatchlistStore } from '../../stores/watchlistStore';
import type { SearchResult } from '../../types';

interface StockSearchProps {
  onSelect?: (symbol: string) => void;
}

export function StockSearch({ onSelect }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const { data: results } = useSearch(query);
  const addSymbol = useWatchlistStore((s) => s.addSymbol);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(result: SearchResult) {
    addSymbol(result.symbol);
    onSelect?.(result.symbol);
    setQuery('');
    setIsOpen(false);
  }

  return (
    <div ref={inputRef} className="relative">
      <div className="flex items-center gap-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-3 py-2 focus-within:border-gray-500 transition-colors">
        <span className="text-gray-500 text-sm">+</span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search stocks..."
          className="bg-transparent text-sm text-white outline-none w-full placeholder:text-gray-600"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="text-gray-500 hover:text-gray-300 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && results && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden">
          {results.map((result) => (
            <button
              key={result.symbol}
              onClick={() => handleSelect(result)}
              className="w-full px-3 py-2 text-left hover:bg-white/10 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="text-sm text-white font-semibold">{result.symbol}</span>
                <span className="ml-2 text-xs text-gray-400">{result.name}</span>
              </div>
              <span className="text-xs text-gray-500 font-mono">{result.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
