import { extractUserIdsFromAuthorFilters } from '../helpers/user-utils';
import { FilterGroup, QueryContext } from '../types';

export class FilterBuilder {
  private context: QueryContext;

  constructor() {
    this.context = {
      whereClause: 'WHERE 1=1',
      queryParams: [],
      paramIndex: 1,
      filterGroups: []
    };
  }

  /**
   * Build complete WHERE clause from filters
   */
  public buildFilters(
    filters: FilterGroup[] = [],
    onlyMine: boolean = false,
    userIdNum: number | null = null,
    includeThreadReplies: boolean = false
  ): QueryContext {
    // Reset context
    this.context = {
      whereClause: 'WHERE 1=1',
      queryParams: [],
      paramIndex: 1,
      filterGroups: []
    };

    // Handle onlyReplies filter first to determine thread behavior
    const onlyRepliesFilter = filters.find((f) => f.name === 'onlyReplies');
    const isOnlyReplies = onlyRepliesFilter?.value === 'true';

    // Handle thread replies filter - skip if onlyReplies is active
    if (!includeThreadReplies && !isOnlyReplies) {
      this.context.whereClause += ` AND s.thread_parent_id IS NULL`;
    }

    // Handle user filter (only mine)
    if (onlyMine && userIdNum) {
      this.context.whereClause += ` AND s.user_id = $${this.context.paramIndex}`;
      this.context.queryParams.push(userIdNum);
      this.context.paramIndex++;
    }

    // Process filters by type to avoid duplicates
    this.processTagFilters(filters);
    this.processAuthorFilters(filters);
    this.processMentionFilters(filters);
    this.processSearchFilters(filters);
    this.processOtherFilters(filters);

    // Apply global logic to combine filter groups
    if (this.context.filterGroups.length > 0) {
      const globalLogicFilter = filters.find((f) => f.name === 'globalLogic');
      const globalLogic = globalLogicFilter?.value || 'AND';
      const globalOperator = globalLogic === 'OR' ? ' OR ' : ' AND ';
      this.context.whereClause += ` AND (${this.context.filterGroups.join(globalOperator)})`;
    }

    return this.context;
  }

  private processTagFilters(filters: FilterGroup[]): void {
    const tagFilters = filters.filter((f) => f.name === 'tags');
    if (tagFilters.length === 0) return;

    const tagLogicFilter = filters.find((f) => f.name === 'tagLogic');
    const tagLogic = tagLogicFilter?.value || 'OR';
    const allTags = tagFilters.map((f) => f.value.trim()).filter(Boolean);

    if (allTags.length > 0) {
      let tagGroupCondition = '';

      if (tagLogic === 'AND') {
        // All tags must be present
        const tagConditions: string[] = [];
        for (const tag of allTags) {
          tagConditions.push(`$${this.context.paramIndex} = ANY(s.tags)`);
          this.context.queryParams.push(
            tag.startsWith('#') ? tag.slice(1) : tag
          );
          this.context.paramIndex++;
        }
        tagGroupCondition = tagConditions.join(' AND ');
      } else {
        // Any tag can be present (OR logic)
        const tagPlaceholders = allTags
          .map(() => `$${this.context.paramIndex++}`)
          .join(',');
        tagGroupCondition = `s.tags && ARRAY[${tagPlaceholders}]`;
        this.context.queryParams.push(
          ...allTags.map((tag) => (tag.startsWith('#') ? tag.slice(1) : tag))
        );
      }

      if (tagGroupCondition) {
        this.context.filterGroups.push(`(${tagGroupCondition})`);
      }
    }
  }

  private processAuthorFilters(filters: FilterGroup[]): void {
    const authorFilters = filters.filter((f) => f.name === 'author');
    if (authorFilters.length === 0) return;

    const authors = authorFilters.map((f) => f.value.trim()).filter(Boolean);
    if (authors.length > 0) {
      const authorLogicFilter = filters.find((f) => f.name === 'authorLogic');
      const authorLogic = authorLogicFilter?.value || 'OR';

      // Use centralized user ID extraction function
      const userIds = extractUserIdsFromAuthorFilters(authors);

      if (userIds.length > 0) {
        let authorGroupCondition = '';

        if (authorLogic === 'AND') {
          // All authors must be present - doesn't make sense for single posts, but support it
          const authorConditions: string[] = [];
          for (const userId of userIds) {
            authorConditions.push(`s.user_id = $${this.context.paramIndex}`);
            this.context.queryParams.push(userId);
            this.context.paramIndex++;
          }
          authorGroupCondition = authorConditions.join(' AND ');
        } else {
          // Any author can be present (OR logic)
          const authorPlaceholders = userIds
            .map(() => `$${this.context.paramIndex++}`)
            .join(',');
          authorGroupCondition = `s.user_id IN (${authorPlaceholders})`;
          this.context.queryParams.push(...userIds);
        }

        if (authorGroupCondition) {
          this.context.filterGroups.push(`(${authorGroupCondition})`);
        }
      }
    }
  }

  private processMentionFilters(filters: FilterGroup[]): void {
    const mentionFilters = filters.filter((f) => f.name === 'mentions');
    if (mentionFilters.length === 0) return;

    const mentions = mentionFilters.map((f) => f.value.trim()).filter(Boolean);
    if (mentions.length > 0) {
      const mentionsLogicFilter = filters.find(
        (f) => f.name === 'mentionsLogic'
      );
      const mentionsLogic = mentionsLogicFilter?.value || 'OR';

      const allMentionConditions: string[] = [];

      if (mentionsLogic === 'AND') {
        // All mentions must be present
        for (const mention of mentions) {
          const username = mention.includes('|')
            ? mention.split('|')[0]
            : mention;
          allMentionConditions.push(
            `(s.submission_name ILIKE $${this.context.paramIndex} OR s.submission_title ILIKE $${this.context.paramIndex})`
          );
          this.context.queryParams.push(`%${username}%`);
          this.context.paramIndex++;
        }

        if (allMentionConditions.length > 0) {
          this.context.filterGroups.push(
            `(${allMentionConditions.join(' AND ')})`
          );
        }
      } else {
        // Any mention can be present (OR logic)
        const mentionConditions = mentions.map((mention) => {
          const username = mention.includes('|')
            ? mention.split('|')[0]
            : mention;
          const condition = `(s.submission_name ILIKE $${this.context.paramIndex} OR s.submission_title ILIKE $${this.context.paramIndex})`;
          this.context.queryParams.push(`%${username}%`);
          this.context.paramIndex++;
          return condition;
        });

        if (mentionConditions.length > 0) {
          this.context.filterGroups.push(`(${mentionConditions.join(' OR ')})`);
        }
      }
    }
  }

  private processSearchFilters(filters: FilterGroup[]): void {
    const searchFilters = filters.filter((f) => f.name === 'search');
    if (searchFilters.length === 0) return;

    const searchValues = searchFilters
      .map((f) => f.value.trim())
      .filter((v) => v.length >= 2);

    if (searchValues.length > 0) {
      const searchLogicFilter = filters.find((f) => f.name === 'searchLogic');
      const searchLogic = searchLogicFilter?.value || 'OR';

      const allSearchConditions: string[] = [];

      for (const searchValue of searchValues) {
        // Parse search with quote support
        const terms: string[] = [];
        const regex = /"([^"]+)"|(\S+)/g;
        let match;

        while ((match = regex.exec(searchValue)) !== null) {
          const quotedTerm = match[1];
          const unquotedTerm = match[2];
          const term = quotedTerm || unquotedTerm;
          if (term && term.length >= 2) {
            terms.push(term.toLowerCase());
          }
        }

        if (terms.length > 0) {
          const searchConditions = terms.map((term) => {
            const condition = `(
              LOWER(s.submission_name) LIKE $${this.context.paramIndex} OR 
              LOWER(s.submission_title) LIKE $${this.context.paramIndex}
            )`;
            this.context.queryParams.push(`%${term}%`);
            this.context.paramIndex++;
            return condition;
          });

          const termOperator = searchLogic === 'AND' ? ' AND ' : ' OR ';
          allSearchConditions.push(`(${searchConditions.join(termOperator)})`);
        }
      }

      if (allSearchConditions.length > 0) {
        const searchOperator = searchLogic === 'AND' ? ' AND ' : ' OR ';
        const groupCondition = allSearchConditions.join(searchOperator);
        this.context.filterGroups.push(`(${groupCondition})`);
      }
    }
  }

  private processOtherFilters(filters: FilterGroup[]): void {
    // Process remaining single-value filters
    for (const filter of filters) {
      let groupCondition = '';

      switch (filter.name) {
        // Skip already processed filters
        case 'tags':
        case 'author':
        case 'mentions':
        case 'search':
        case 'tagLogic':
        case 'authorLogic':
        case 'mentionsLogic':
        case 'searchLogic':
        case 'globalLogic':
          break;

        case 'content': {
          groupCondition = `(s.submission_title ILIKE $${this.context.paramIndex} OR s.submission_name ILIKE $${this.context.paramIndex})`;
          this.context.queryParams.push(`%${filter.value}%`);
          this.context.paramIndex++;
          break;
        }

        case 'title': {
          groupCondition = `s.submission_title ILIKE $${this.context.paramIndex}`;
          this.context.queryParams.push(`%${filter.value}%`);
          this.context.paramIndex++;
          break;
        }

        case 'url': {
          groupCondition = `s.submission_url ILIKE $${this.context.paramIndex}`;
          this.context.queryParams.push(`%${filter.value}%`);
          this.context.paramIndex++;
          break;
        }

        case 'dateFrom': {
          groupCondition = `s.submission_datetime >= $${this.context.paramIndex}`;
          this.context.queryParams.push(filter.value);
          this.context.paramIndex++;
          break;
        }

        case 'dateTo': {
          groupCondition = `s.submission_datetime <= $${this.context.paramIndex}`;
          this.context.queryParams.push(filter.value);
          this.context.paramIndex++;
          break;
        }

        case 'onlyReplies': {
          // Filter to show only replies (posts with thread_parent_id)
          if (filter.value === 'true') {
            groupCondition = `s.thread_parent_id IS NOT NULL`;
          }
          break;
        }
      }

      if (groupCondition) {
        this.context.filterGroups.push(`(${groupCondition})`);
      }
    }
  }
}

export const createFilterBuilder = () => new FilterBuilder();
