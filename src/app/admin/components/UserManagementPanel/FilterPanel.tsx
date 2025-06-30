/**
 * Filter Panel Component
 *
 * Handles the column filtering interface, allowing users to add, modify,
 * and remove filters. This component is focused solely on filter management.
 */

import React from 'react';
import {
  FILTERABLE_COLUMNS,
  getOperatorLabel,
  getValidOperators
} from './constants';
import type { ColumnFilter } from './types';

interface FilterPanelProps {
  showFilterPanel: boolean;
  activeFiltersCount: number;
  columnFilters: ColumnFilter[];
  onTogglePanel: () => void;
  onClearAllFilters: () => void;
  onAddFilter: (column: string) => void;
  onUpdateFilter: (index: number, updates: Partial<ColumnFilter>) => void;
  onRemoveFilter: (index: number) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  showFilterPanel,
  activeFiltersCount,
  columnFilters,
  onTogglePanel,
  onClearAllFilters,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter
}) => {
  if (!showFilterPanel) return null;

  return (
    <div className="filter-panel">
      <div className="filter-panel-header">
        <h3>Column Filters</h3>
        <div className="filter-panel-actions">
          {activeFiltersCount > 0 && (
            <button
              className="clear-filters-btn"
              onClick={onClearAllFilters}
              title="Clear all filters"
            >
              Clear All ({activeFiltersCount})
            </button>
          )}
          <button
            className="close-filter-panel-btn"
            onClick={onTogglePanel}
            title="Close filter panel"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="filter-panel-content">
        {/* Add Filter Dropdown */}
        <div className="add-filter-section">
          <label>Add Filter:</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                onAddFilter(e.target.value);
                e.target.value = '';
              }
            }}
            className="add-filter-select"
          >
            <option value="">Select column to filter...</option>
            {FILTERABLE_COLUMNS.map((column) => (
              <option key={column.key} value={column.key}>
                {column.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters */}
        <div className="active-filters-section">
          {columnFilters.map((filter, index) => (
            <div key={index} className="filter-row">
              <div className="filter-column">
                <select
                  value={filter.column}
                  onChange={(e) =>
                    onUpdateFilter(index, { column: e.target.value })
                  }
                  className="filter-column-select"
                >
                  {FILTERABLE_COLUMNS.map((column) => (
                    <option key={column.key} value={column.key}>
                      {column.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-operator">
                <select
                  value={filter.operator}
                  onChange={(e) =>
                    onUpdateFilter(index, {
                      operator: e.target.value as any
                    })
                  }
                  className="filter-operator-select"
                >
                  {(() => {
                    const column = FILTERABLE_COLUMNS.find(
                      (col) => col.key === filter.column
                    );
                    const validOperators = column
                      ? getValidOperators(column.type)
                      : (['contains', 'equals'] as any[]);

                    return validOperators.map((operator) => (
                      <option key={operator} value={operator}>
                        {getOperatorLabel(operator)}
                      </option>
                    ));
                  })()}
                </select>
              </div>

              {!['is_empty', 'is_not_empty'].includes(filter.operator) && (
                <div className="filter-value">
                  {(() => {
                    const column = FILTERABLE_COLUMNS.find(
                      (col) => col.key === filter.column
                    );

                    if (column?.type === 'select' && column.options) {
                      return (
                        <select
                          value={filter.value}
                          onChange={(e) =>
                            onUpdateFilter(index, {
                              value: e.target.value
                            })
                          }
                          className="filter-value-select"
                        >
                          <option value="">Select value...</option>
                          {column.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      );
                    } else if (column?.type === 'boolean') {
                      return (
                        <select
                          value={filter.value}
                          onChange={(e) =>
                            onUpdateFilter(index, {
                              value: e.target.value
                            })
                          }
                          className="filter-value-select"
                        >
                          <option value="">Select status...</option>
                          <option value="true">Timed Out</option>
                          <option value="false">Active</option>
                        </select>
                      );
                    } else if (column?.type === 'date') {
                      return (
                        <input
                          type="date"
                          value={filter.value}
                          onChange={(e) =>
                            onUpdateFilter(index, {
                              value: e.target.value
                            })
                          }
                          className="filter-value-input"
                        />
                      );
                    } else {
                      return (
                        <input
                          type="text"
                          value={filter.value}
                          onChange={(e) =>
                            onUpdateFilter(index, {
                              value: e.target.value
                            })
                          }
                          placeholder="Enter filter value..."
                          className="filter-value-input"
                        />
                      );
                    }
                  })()}
                </div>
              )}

              <div className="filter-actions">
                <label className="filter-active-checkbox">
                  <input
                    type="checkbox"
                    checked={filter.active}
                    onChange={(e) =>
                      onUpdateFilter(index, {
                        active: e.target.checked
                      })
                    }
                  />
                  <span className="checkbox-label">Active</span>
                </label>

                <button
                  className="remove-filter-btn"
                  onClick={() => onRemoveFilter(index)}
                  title="Remove filter"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}

          {columnFilters.length === 0 && (
            <div className="no-filters-message">
              No filters added yet. Select a column above to add your first
              filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
