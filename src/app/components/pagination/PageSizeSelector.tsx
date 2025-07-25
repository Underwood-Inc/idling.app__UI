import React, { memo } from 'react';
import { PageSize } from 'src/lib/state/atoms';
import { PAGINATION_SELECTORS } from 'src/lib/test-selectors/components/pagination.selectors';

type PageSizeSelectorProps = {
  pageSize: PageSize;
  onPageSizeChange: (_newPageSize: PageSize) => void;
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
      className="pagination__page-size-select"
      data-testid={PAGINATION_SELECTORS.PAGE_SIZE_SELECTOR}
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
