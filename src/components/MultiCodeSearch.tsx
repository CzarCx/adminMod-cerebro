
'use client';

import { useState } from 'react';
import { X, Search } from 'lucide-react';

interface MultiCodeSearchProps {
  codes: string[];
  onCodesChange: (codes: string[]) => void;
  placeholder?: string;
}

export default function MultiCodeSearch({ codes, onCodesChange, placeholder }: MultiCodeSearchProps) {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      e.preventDefault();
      const newCode = inputValue.trim();
      if (!codes.includes(newCode)) {
        onCodesChange([...codes, newCode]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue === '' && codes.length > 0) {
      onCodesChange(codes.slice(0, -1));
    }
  };

  const removeCode = (codeToRemove: string) => {
    onCodesChange(codes.filter(code => code !== codeToRemove));
  };

  return (
    <div className="flex flex-wrap items-center w-full p-2 text-sm border rounded-md bg-background border-border focus-within:outline-none focus-within:ring-2 focus-within:ring-ring">
      <Search className="w-4 h-4 text-muted-foreground ml-1 mr-2 flex-shrink-0" />
      {codes.map(code => (
        <span key={code} className="flex items-center gap-1.5 bg-primary/10 text-primary font-medium px-2 py-1 rounded-md mr-1.5 mb-1 mt-1 text-xs">
          {code}
          <button
            onClick={() => removeCode(code)}
            className="rounded-full hover:bg-primary/20"
            aria-label={`Remove ${code}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder={codes.length === 0 ? placeholder : ''}
        className="flex-grow bg-transparent focus:outline-none p-1 min-w-[100px]"
      />
    </div>
  );
}
