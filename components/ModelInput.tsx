import React, { useState, useEffect, useRef } from 'react';
import { Search, Database, Box } from 'lucide-react';
import { CustomProductDatabase, CustomProductModel } from '../types';

interface ModelInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onSelect: (model: CustomProductModel | null) => void;
  databases: CustomProductDatabase[];
  placeholder?: string;
}

export const ModelInput: React.FC<ModelInputProps> = ({ 
  label, 
  value, 
  onChange, 
  onSelect, 
  databases,
  placeholder 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ model: CustomProductModel, dbName: string }[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const lowerVal = value.toLowerCase();
    const results: { model: CustomProductModel, dbName: string }[] = [];

    databases.forEach(db => {
      db.series.forEach(series => {
        series.models.forEach(model => {
          if (model.name.toLowerCase().includes(lowerVal)) {
            results.push({ model, dbName: db.name });
          }
        });
      });
    });

    setSuggestions(results.slice(0, 5)); // Limit to 5 suggestions
  }, [value, databases]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
    // If user types manually, clear the "selected object" until they click a suggestion
    // OR strictly match what they typed. For now, we clear explicit selection.
    onSelect(null); 
  };

  const handleSelect = (item: { model: CustomProductModel, dbName: string }) => {
    onChange(item.model.name);
    onSelect(item.model);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2 relative" ref={wrapperRef}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input 
          type="text" 
          value={value} 
          onChange={handleChange} 
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder} 
          className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-10 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400" 
          required 
          autoComplete="off"
        />
        <div className="absolute right-3 top-3 text-gray-400">
          <Search className="w-5 h-5" />
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden animate-fade-in">
          <div className="bg-gray-50 px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Local Database Matches
          </div>
          {suggestions.map((item) => (
            <button
              key={item.model.id}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Box className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">{item.model.name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                   <Database className="w-3 h-3" /> {item.dbName}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
