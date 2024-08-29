import React, { memo } from 'react';
import { PageSize } from 'src/lib/state/PaginationContext';

type PageSizeSelectorProps = {
  pageSize: PageSize;
  // eslint-disable-next-line no-unused-vars
  onPageSizeChange: (newPageSize: PageSize) => void;
};

const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  pageSize,
  onPageSizeChange
}) => {
  const handlePageSizeSelect = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newPageSize = Number(event.target.value);
    onPageSizeChange(newPageSize);
  };

  return (
    <select
      aria-label="Page size selector"
      value={pageSize}
      onChange={handlePageSizeSelect}
      className="pagination__page-size-selector"
      data-testid="page-size-selector"
    >
      {Object.values(PageSize)
        .filter((value) => typeof value === 'number')
        .map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
    </select>
  );
};

export default memo(PageSizeSelector);
