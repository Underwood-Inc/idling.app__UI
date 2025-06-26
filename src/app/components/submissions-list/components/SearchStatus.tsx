import React from 'react';

interface SearchStatusProps {
  children: React.ReactNode;
}

export const SearchStatus: React.FC<SearchStatusProps> = ({ children }) => {
  return (
    <div className="text-search-input__status">
      <span className="text-search-input__status-text">{children}</span>
    </div>
  );
};
