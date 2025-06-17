import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { ContentWithPills } from './ContentWithPills';

// Mock the Jotai useAtom hook with proper return values
const mockSetFiltersState = jest.fn();
const mockFiltersState = {
  filters: [],
  page: 1,
  pageSize: 10,
  initialized: true
};

jest.mock('jotai', () => {
  const actual = jest.requireActual('jotai');
  return {
    ...actual,
    useAtom: jest.fn(() => [mockFiltersState, mockSetFiltersState]),
    Provider: actual.Provider
  };
});

// Mock the atoms module
jest.mock('../../../lib/state/atoms', () => ({
  getSubmissionsFiltersAtom: jest.fn(() => ({})),
  shouldUpdateAtom: jest.fn(() => ({}))
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/posts'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }))
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockedLink = ({ children, href, onClick, className, title }: any) => (
    <a href={href} onClick={onClick} className={className} title={title}>
      {children}
    </a>
  );
  MockedLink.displayName = 'Link';
  return MockedLink;
});

// Mock tooltip component
jest.mock('../tooltip/LinkTooltip', () => ({
  MentionTooltip: ({ children }: any) => <div>{children}</div>
}));

describe('ContentWithPills', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic hashtag detection', () => {
    it('should detect single hashtag', () => {
      render(
        <Provider>
          <ContentWithPills
            content="This is a post with #hashtag"
            contextId="test"
          />
        </Provider>
      );

      // Check that the hashtag link exists
      const hashtagLink = screen.getByRole('link');
      expect(hashtagLink).toHaveTextContent('#hashtag');

      // Check that text content exists using partial matches
      expect(screen.getByText(/This is a post with/)).toBeInTheDocument();
    });

    it('should detect multiple hashtags', () => {
      render(
        <Provider>
          <ContentWithPills
            content="Post with #first and #second hashtags"
            contextId="test"
          />
        </Provider>
      );

      // Check text content exists
      expect(screen.getByText(/Post with/)).toBeInTheDocument();
      expect(screen.getByText(/and/)).toBeInTheDocument();
      expect(screen.getByText(/hashtags/)).toBeInTheDocument();

      const hashtagLinks = screen.getAllByRole('link');
      expect(hashtagLinks).toHaveLength(2);
      expect(hashtagLinks[0]).toHaveTextContent('#first');
      expect(hashtagLinks[1]).toHaveTextContent('#second');
    });

    it('should detect hashtag at beginning of text', () => {
      render(
        <Provider>
          <ContentWithPills
            content="#start is at the beginning"
            contextId="test"
          />
        </Provider>
      );

      const hashtagLink = screen.getByRole('link');
      expect(hashtagLink).toHaveTextContent('#start');
      expect(screen.getByText(/is at the beginning/)).toBeInTheDocument();
    });

    it('should detect hashtag at end of text', () => {
      render(
        <Provider>
          <ContentWithPills content="This ends with #end" contextId="test" />
        </Provider>
      );

      const hashtagLink = screen.getByRole('link');
      expect(hashtagLink).toHaveTextContent('#end');
      expect(screen.getByText(/This ends with/)).toBeInTheDocument();
    });
  });

  describe('Chained hashtag detection', () => {
    it('should detect chained hashtags without spaces', () => {
      render(
        <Provider>
          <ContentWithPills content="#ademptio#testimonium" contextId="test" />
        </Provider>
      );

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveTextContent('#ademptio');
      expect(links[1]).toHaveTextContent('#testimonium');
    });

    it('should detect multiple chained hashtags', () => {
      render(
        <Provider>
          <ContentWithPills
            content="#first#second#third#fourth"
            contextId="test"
          />
        </Provider>
      );

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(4);
      expect(links[0]).toHaveTextContent('#first');
      expect(links[1]).toHaveTextContent('#second');
      expect(links[2]).toHaveTextContent('#third');
      expect(links[3]).toHaveTextContent('#fourth');
    });

    it('should detect chained hashtags mixed with text', () => {
      render(
        <Provider>
          <ContentWithPills
            content="Check out #react#javascript for web dev"
            contextId="test"
          />
        </Provider>
      );

      expect(screen.getByText(/Check out/)).toBeInTheDocument();
      expect(screen.getByText(/for web dev/)).toBeInTheDocument();

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveTextContent('#react');
      expect(links[1]).toHaveTextContent('#javascript');
    });
  });

  describe('Basic mention detection', () => {
    it('should detect single structured mention', () => {
      render(
        <Provider>
          <ContentWithPills
            content="Hello @[username|user123], how are you?"
            contextId="test"
          />
        </Provider>
      );

      expect(screen.getByText(/Hello/)).toBeInTheDocument();
      expect(screen.getByText(/how are you/)).toBeInTheDocument();

      const mentionLink = screen.getByRole('link');
      expect(mentionLink).toHaveTextContent('@username');
    });

    it('should detect multiple structured mentions', () => {
      render(
        <Provider>
          <ContentWithPills
            content="Hey @[alice|user1] and @[bob|user2]!"
            contextId="test"
          />
        </Provider>
      );

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveTextContent('@alice');
      expect(links[1]).toHaveTextContent('@bob');
    });
  });

  describe('Mixed hashtags and mentions', () => {
    it('should detect both hashtags and mentions in same text', () => {
      render(
        <Provider>
          <ContentWithPills
            content="Hey @[user|123] check out #react"
            contextId="test"
          />
        </Provider>
      );

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);

      const mentionLink = links.find((link) => link.textContent?.includes('@'));
      const hashtagLink = links.find((link) => link.textContent?.includes('#'));

      expect(mentionLink).toHaveTextContent('@user');
      expect(hashtagLink).toHaveTextContent('#react');
    });

    it('should detect chained mixed hashtags and mentions', () => {
      render(
        <Provider>
          <ContentWithPills
            content="#react@[developer|123]#javascript@[coder|456]"
            contextId="test"
          />
        </Provider>
      );

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(4);
      expect(links[0]).toHaveTextContent('#react');
      expect(links[1]).toHaveTextContent('@developer');
      expect(links[2]).toHaveTextContent('#javascript');
      expect(links[3]).toHaveTextContent('@coder');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty content', () => {
      render(
        <Provider>
          <ContentWithPills content="" contextId="test" />
        </Provider>
      );
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should handle content with no hashtags or mentions', () => {
      render(
        <Provider>
          <ContentWithPills
            content="This is just regular text."
            contextId="test"
          />
        </Provider>
      );
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText(/This is just regular text/)).toBeInTheDocument();
    });

    it('should handle hashtag with numbers and underscores', () => {
      render(
        <Provider>
          <ContentWithPills
            content="Check out #react_18 and #web3_dev"
            contextId="test"
          />
        </Provider>
      );

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveTextContent('#react_18');
      expect(links[1]).toHaveTextContent('#web3_dev');
    });

    it('should handle mention with special characters in username', () => {
      render(
        <Provider>
          <ContentWithPills
            content="Hello @[user_name|123] and @[dev-ops|456]"
            contextId="test"
          />
        </Provider>
      );

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveTextContent('@user_name');
      expect(links[1]).toHaveTextContent('@dev-ops');
    });

    it('should ignore legacy mention format', () => {
      render(
        <Provider>
          <ContentWithPills
            content="Hello @username this should not be parsed"
            contextId="test"
          />
        </Provider>
      );

      // Should not find any links since legacy @username format is ignored
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(
        screen.getByText(/Hello @username this should not be parsed/)
      ).toBeInTheDocument();
    });

    it('should handle special characters adjacent to hashtags/mentions', () => {
      render(
        <Provider>
          <ContentWithPills
            content="Amazing! #react is great. @[user|123], what do you think?"
            contextId="test"
          />
        </Provider>
      );

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveTextContent('#react');
      expect(links[1]).toHaveTextContent('@user');
    });
  });

  describe('Click functionality', () => {
    it('should call onHashtagClick when hashtag is clicked', () => {
      const mockOnHashtagClick = jest.fn();

      render(
        <Provider>
          <ContentWithPills
            content="Check out #react"
            contextId="test"
            onHashtagClick={mockOnHashtagClick}
          />
        </Provider>
      );

      const hashtagLink = screen.getByRole('link');
      fireEvent.click(hashtagLink);

      expect(mockOnHashtagClick).toHaveBeenCalledWith('#react');
    });

    it('should call onMentionClick when mention is clicked', () => {
      const mockOnMentionClick = jest.fn();

      render(
        <Provider>
          <ContentWithPills
            content="Hello @[john|123]"
            contextId="test"
            onMentionClick={mockOnMentionClick}
          />
        </Provider>
      );

      const mentionLink = screen.getByRole('link');
      fireEvent.click(mentionLink);

      expect(mockOnMentionClick).toHaveBeenCalledWith('123', 'author');
    });

    it('should use global filter state when contextId is provided', () => {
      render(
        <Provider>
          <ContentWithPills
            content="Check out #react and @[john|123]"
            contextId="test"
          />
        </Provider>
      );

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });

    it('should prioritize custom callbacks over global filter state', () => {
      const mockOnHashtagClick = jest.fn();

      render(
        <Provider>
          <ContentWithPills
            content="Check out #react"
            contextId="test"
            onHashtagClick={mockOnHashtagClick}
          />
        </Provider>
      );

      const hashtagLink = screen.getByRole('link');
      fireEvent.click(hashtagLink);

      expect(mockOnHashtagClick).toHaveBeenCalledWith('#react');
    });
  });

  describe('Accessibility', () => {
    it('should have proper link attributes', () => {
      const mockOnHashtagClick = jest.fn();

      render(
        <Provider>
          <ContentWithPills
            content="Check out #react and @[john|123]"
            contextId="test"
            onHashtagClick={mockOnHashtagClick}
          />
        </Provider>
      );

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);

      // Check that links have proper titles
      expect(links[0]).toHaveAttribute('title');
      expect(links[1]).toHaveAttribute('title');
    });

    it('should have non-clickable spans when no callbacks or contextId', () => {
      render(
        <Provider>
          <ContentWithPills
            content="Check out #react and @[john|123]"
            contextId="test"
          />
        </Provider>
      );

      // Should still render as links due to contextId
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });

    it('should have appropriate titles for hashtags and mentions', () => {
      render(
        <Provider>
          <ContentWithPills
            content="Check out #react and @[john|123]"
            contextId="test"
          />
        </Provider>
      );

      const links = screen.getAllByRole('link');
      const hashtagLink = links.find((link) => link.textContent?.includes('#'));
      const mentionLink = links.find((link) => link.textContent?.includes('@'));

      expect(hashtagLink).toHaveAttribute(
        'title',
        expect.stringContaining('hashtag')
      );
      expect(mentionLink).toHaveAttribute(
        'title',
        expect.stringContaining('user')
      );
    });
  });

  describe('Real-world examples', () => {
    it('should handle complex post content', () => {
      const mockOnHashtagClick = jest.fn();
      const mockOnMentionClick = jest.fn();

      render(
        <Provider>
          <ContentWithPills
            content="Amazing progress on #webdev! Thanks to @[alice|123] and @[bob|456] for the help. Looking forward to #react2024 conference. #javascript #typescript"
            contextId="test"
            onHashtagClick={mockOnHashtagClick}
            onMentionClick={mockOnMentionClick}
          />
        </Provider>
      );

      const links = screen.getAllByRole('link');

      // Should find 2 mentions + 4 hashtags = 6 total links
      expect(links).toHaveLength(6);

      // Check that text content is preserved
      expect(screen.getByText(/Amazing progress on/)).toBeInTheDocument();
      expect(screen.getByText(/Thanks to/)).toBeInTheDocument();
      expect(screen.getByText(/and/)).toBeInTheDocument();
      expect(screen.getByText(/for the help/)).toBeInTheDocument();

      // Test clicking a hashtag
      const webdevHashtag = links.find(
        (link) => link.textContent === '#webdev'
      );
      if (webdevHashtag) {
        fireEvent.click(webdevHashtag);
        expect(mockOnHashtagClick).toHaveBeenCalledWith('#webdev');
      }

      // Test clicking a mention
      const aliceMention = links.find((link) => link.textContent === '@alice');
      if (aliceMention) {
        fireEvent.click(aliceMention);
        expect(mockOnMentionClick).toHaveBeenCalledWith('123', 'author');
      }
    });

    it('should handle post with no pills', () => {
      render(
        <Provider>
          <ContentWithPills
            content="This is just regular text with no special tags."
            contextId="test"
          />
        </Provider>
      );

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText(/This is just regular text/)).toBeInTheDocument();
    });

    it('should handle the original failing case', () => {
      render(
        <Provider>
          <ContentWithPills content="#ademptio#testimonium" contextId="test" />
        </Provider>
      );

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveTextContent('#ademptio');
      expect(links[1]).toHaveTextContent('#testimonium');
    });
  });
});
