export type PostFilters =
  | 'tags'
  | 'tagLogic'
  | 'author'
  | 'mentions'
  | 'authorLogic'
  | 'mentionsLogic'
  | 'globalLogic';

export type FilterLogic = 'AND' | 'OR';

export interface FilterGroup {
  type: 'tags' | 'author' | 'mentions';
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
