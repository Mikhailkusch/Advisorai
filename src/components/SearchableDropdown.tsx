import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Plus } from 'lucide-react';

interface Option {
  id: string;
  label: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onCreateNew?: () => void;
  createNewLabel?: string;
  tabIndex?: number;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  onCreateNew,
  createNewLabel = "Add New Client",
  tabIndex = 0
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.id === value);

  const handleCreateNew = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCreateNew) {
      setIsOpen(false);
      setSearchTerm("");
      setSelectedIndex(0);
      onCreateNew();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[selectedIndex]) {
          onChange(filteredOptions[selectedIndex].id);
          setIsOpen(false);
          setSearchTerm("");
          setSelectedIndex(0);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(0);
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {isOpen ? (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            className="w-full px-3 py-2 pl-9 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0);
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-between w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md cursor-pointer text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key !== 'Tab' && e.key !== 'Shift' && e.key !== 'Enter' && e.key !== 'Escape') {
              setIsOpen(true);
              setSearchTerm(e.key);
            }
          }}
          tabIndex={tabIndex}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="dropdown-options"
          aria-label={placeholder}
        >
          <span className={selectedOption ? 'text-gray-100' : 'text-gray-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg">
          <div className="max-h-60 overflow-auto">
            {onCreateNew && (
              <div
                className={`px-4 py-2 cursor-pointer text-sm hover:bg-gray-600 text-primary-400 flex items-center gap-2 ${
                  selectedIndex === -1 ? 'bg-gray-600' : ''
                }`}
                onClick={handleCreateNew}
                onMouseEnter={() => setSelectedIndex(-1)}
              >
                <Plus className="w-4 h-4" />
                <span>{createNewLabel}</span>
              </div>
            )}
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-400">No results found</div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.id}
                  className={`px-4 py-2 cursor-pointer text-sm hover:bg-gray-600 ${
                    index === selectedIndex ? 'bg-gray-600 text-white' : 
                    option.id === value ? 'bg-gray-600/50 text-white' : 'text-gray-100'
                  }`}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                    setSearchTerm("");
                    setSelectedIndex(0);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}