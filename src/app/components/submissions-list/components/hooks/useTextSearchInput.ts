import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseTextSearchInputProps {
  initialValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch: (searchText: string) => void;
  minLength?: number;
}

export const useTextSearchInput = ({
  initialValue = '',
  value,
  onChange,
  onSearch,
  minLength = 2
}: UseTextSearchInputProps) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle controlled vs uncontrolled mode
  const currentValue = value !== undefined ? value : inputValue;
  
  const handleValueChange = useCallback(
    (newValue: string) => {
      if (onChange) {
        onChange(newValue);
      } else {
        setInputValue(newValue);
      }
    },
    [onChange]
  );

  // Sync initial value changes
  useEffect(() => {
    if (value === undefined && initialValue !== inputValue) {
      setInputValue(initialValue);
    }
  }, [initialValue, inputValue, value]);

  // Parse search terms from input with quote support
  const parseSearchTerms = useCallback(
    (text: string): string[] => {
      const trimmedText = text.trim();
      if (!trimmedText) return [];

      const terms: string[] = [];
      const regex = /"([^"]+)"|(\S+)/g;
      let match;

      while ((match = regex.exec(trimmedText)) !== null) {
        const quotedTerm = match[1];
        const unquotedTerm = match[2];
        const term = quotedTerm || unquotedTerm;
        
        if (term && term.length >= minLength) {
          terms.push(term.toLowerCase());
        }
      }

      return terms;
    },
    [minLength]
  );

  // Handle input change (for regular input mode)
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      handleValueChange(newValue);

      if (newValue.trim().length === 0) {
        setSearchTerms([]);
        onSearch('');
        return;
      }

      const terms = parseSearchTerms(newValue);
      setSearchTerms(terms);
      onSearch(newValue);
    },
    [handleValueChange, parseSearchTerms, onSearch]
  );

  // Handle smart input change (from SmartPillInput)
  const handleSmartInputChange = useCallback(
    (newValue: string) => {
      handleValueChange(newValue);

      // Extract text-only content for search (remove pills)
      const textOnly = newValue
        .replace(/@\[[^\]]+\]/g, '') // Remove structured mentions @[user|id|type]
        .replace(/#\w+/g, '') // Remove hashtags
        .trim();

      if (textOnly.length === 0) {
        setSearchTerms([]);
        onSearch('');
        return;
      }

      const terms = parseSearchTerms(textOnly);
      setSearchTerms(terms);
      onSearch(textOnly);
    },
    [handleValueChange, parseSearchTerms, onSearch]
  );

  // Handle clear button
  const handleClear = useCallback(() => {
    handleValueChange('');
    setSearchTerms([]);
    onSearch('');
    inputRef.current?.focus();
  }, [handleValueChange, onSearch]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
      }
    },
    [handleClear]
  );

  return {
    currentValue,
    searchTerms,
    inputRef,
    hasValue: currentValue.length > 0,
    hasValidSearch: searchTerms.length > 0,
    handleInputChange,
    handleSmartInputChange,
    handleClear,
    handleKeyDown
  };
}; 