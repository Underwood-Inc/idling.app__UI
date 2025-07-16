export interface SubmissionWithReplies {
  submission_id: number;
  submission_name: string;
  submission_title: string;
  submission_datetime: Date | null;
  user_id: number;
  author: string;
  author_bio?: string;
  tags: string[];
  thread_parent_id: number | null;
  replies?: SubmissionWithReplies[];
}

export type GetSubmissionsActionArguments = {
  onlyMine: boolean;
  userId?: string; // Internal database user ID only
  filters?: { name: string; value: string }[];
  page?: number;
  pageSize?: number;
  includeThreadReplies?: boolean;
};

export type GetSubmissionsActionResponse = {
  data?: {
    data: SubmissionWithReplies[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalRecords: number;
    };
  };
  error?: string;
};

export interface GetSubmissionsPaginationCountResponse {
  data?: {
    totalRecords: number;
    expectedItems: number; // Items expected for current page size
  };
  error?: string;
}

export interface FilterGroup {
  name: string;
  value: string;
}

export interface QueryContext {
  whereClause: string;
  queryParams: any[];
  paramIndex: number;
  filterGroups: string[];
}

export interface FilterProcessingResult {
  whereClause: string;
  queryParams: any[];
  totalRecords: number;
}
