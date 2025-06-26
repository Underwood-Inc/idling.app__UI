export type PostFilters =
  | 'tags'
  | 'tagLogic'
  | 'author'
  | 'mentions'
  | 'authorLogic'
  | 'mentionsLogic'
  | 'globalLogic'
  | 'search'
  | 'searchLogic';

export type FilterLogic = 'AND' | 'OR';

export interface FilterGroup {
  type: 'tags' | 'author' | 'mentions' | 'search';
  values: string[];
  logic: FilterLogic; // How to combine values within this group
}

export interface ComplexFilterSet {
  groups: FilterGroup[];
  globalLogic: FilterLogic; // How to combine different groups
}

// For backward compatibility with simple filters
export type SimpleFilter = {
  name: PostFilters;
  value: string;
};

export type Filter = SimpleFilter | ComplexFilterSet;
