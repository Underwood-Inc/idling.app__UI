export type HumanFriendlySearchTermKind = 'text' | 'hashtag';

export interface HumanFriendlySearchTerm {
  kind: HumanFriendlySearchTermKind;
  raw: string;
  value: string;
}

export interface HumanFriendlySearchQuery {
  raw: string;
  terms: HumanFriendlySearchTerm[];
}

export type HumanFriendlySearchLogic = 'OR' | 'AND';

export interface HumanFriendlySearchMatchOptions {
  minTermLength?: number;
  logic?: HumanFriendlySearchLogic;
}

export interface HumanFriendlySearchHighlightSegment {
  text: string;
  matched: boolean;
}

export interface ParseHumanFriendlySearchQueryOptions {
  minTermLength?: number;
}
