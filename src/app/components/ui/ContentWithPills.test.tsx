import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { ContentWithPills } from './ContentWithPills';

// Mock the Jotai useAtom hook
const mockSetFiltersState = jest.fn();
const mockFiltersState = {
  filters: [],
  page: 1,
  pageSize: 10,
  initialized: true
};

jest.mock('jotai', () => ({
  useAtom: () => [mockFiltersState, mockSetFiltersState]
}));

// Mock the atoms module
jest.mock('../../../lib/state/atoms', () => ({
  getSubmissionsFiltersAtom: () => ({})
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/posts'),
  useSearchParams: jest.fn(() => new URLSearchParams())
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

describe('ContentWithPills', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic hashtag detection', () => {
    it('should detect single hashtag', () => {
      render(<ContentWithPills content="This is a post with #hashtag" />);

      // Check that the hashtag button exists
      const hashtagButton = screen.getByRole('button');
      expect(hashtagButton).toHaveTextContent('#hashtag');

      // Check that text content exists using partial matches
      expect(screen.getByText(/This is a post with/)).toBeInTheDocument();
    });

    it('should detect multiple hashtags', () => {
      render(
        <ContentWithPills content="Post with #first and #second hashtags" />
      );

      // Check text content exists
      expect(screen.getByText(/Post with/)).toBeInTheDocument();
      expect(screen.getByText(/and/)).toBeInTheDocument();
      expect(screen.getByText(/hashtags/)).toBeInTheDocument();

      const hashtagButtons = screen.getAllByRole('button');
      expect(hashtagButtons).toHaveLength(2);
      expect(hashtagButtons[0]).toHaveTextContent('#first');
      expect(hashtagButtons[1]).toHaveTextContent('#second');
    });

    it('should detect hashtag at beginning of text', () => {
      render(<ContentWithPills content="#start is at the beginning" />);

      const hashtagButton = screen.getByRole('button');
      expect(hashtagButton).toHaveTextContent('#start');
      expect(screen.getByText(/is at the beginning/)).toBeInTheDocument();
    });

    it('should detect hashtag at end of text', () => {
      render(<ContentWithPills content="This ends with #end" />);

      const hashtagButton = screen.getByRole('button');
      expect(hashtagButton).toHaveTextContent('#end');
      expect(screen.getByText(/This ends with/)).toBeInTheDocument();
    });
  });

  describe('Chained hashtag detection', () => {
    it('should detect chained hashtags without spaces', () => {
      render(<ContentWithPills content="#ademptio#testimonium" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('#ademptio');
      expect(buttons[1]).toHaveTextContent('#testimonium');
    });

    it('should detect multiple chained hashtags', () => {
      render(<ContentWithPills content="#first#second#third#fourth" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
      expect(buttons[0]).toHaveTextContent('#first');
      expect(buttons[1]).toHaveTextContent('#second');
      expect(buttons[2]).toHaveTextContent('#third');
      expect(buttons[3]).toHaveTextContent('#fourth');
    });

    it('should detect chained hashtags mixed with text', () => {
      render(
        <ContentWithPills content="Check out #react#javascript for web dev" />
      );

      expect(screen.getByText(/Check out/)).toBeInTheDocument();
      expect(screen.getByText(/for web dev/)).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('#react');
      expect(buttons[1]).toHaveTextContent('#javascript');
    });
  });

  describe('Basic mention detection', () => {
    it('should detect single mention', () => {
      render(<ContentWithPills content="Hello @username, how are you?" />);

      expect(screen.getByText(/Hello/)).toBeInTheDocument();
      expect(screen.getByText(/how are you/)).toBeInTheDocument();

      const mentionButton = screen.getByRole('button');
      expect(mentionButton).toHaveTextContent('@username');
    });

    it('should detect multiple mentions', () => {
      render(<ContentWithPills content="Hey @alice and @bob!" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('@alice');
      expect(buttons[1]).toHaveTextContent('@bob');
    });
  });

  describe('Chained mention detection', () => {
    it('should detect chained mentions without spaces', () => {
      render(<ContentWithPills content="@user1@user2" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('@user1');
      expect(buttons[1]).toHaveTextContent('@user2');
    });

    it('should detect chained mentions mixed with text', () => {
      render(
        <ContentWithPills content="Shoutout to @dev1@dev2 for the help!" />
      );

      expect(screen.getByText(/Shoutout to/)).toBeInTheDocument();
      expect(screen.getByText(/for the help/)).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('@dev1');
      expect(buttons[1]).toHaveTextContent('@dev2');
    });
  });

  describe('Mixed hashtags and mentions', () => {
    it('should detect both hashtags and mentions in same text', () => {
      render(<ContentWithPills content="Hey @user check out #react" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);

      const mentionButton = buttons.find((btn) =>
        btn.textContent?.includes('@')
      );
      const hashtagButton = buttons.find((btn) =>
        btn.textContent?.includes('#')
      );

      expect(mentionButton).toHaveTextContent('@user');
      expect(hashtagButton).toHaveTextContent('#react');
    });

    it('should detect chained mixed hashtags and mentions', () => {
      render(<ContentWithPills content="#react@developer#javascript@coder" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
      expect(buttons[0]).toHaveTextContent('#react');
      expect(buttons[1]).toHaveTextContent('@developer');
      expect(buttons[2]).toHaveTextContent('#javascript');
      expect(buttons[3]).toHaveTextContent('@coder');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty content', () => {
      render(<ContentWithPills content="" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle content with no hashtags or mentions', () => {
      render(<ContentWithPills content="Just regular text here" />);

      expect(screen.getByText('Just regular text here')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle hashtag with numbers and underscores', () => {
      render(<ContentWithPills content="#react_2024 #web-dev" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('#react_2024');
      expect(buttons[1]).toHaveTextContent('#web-dev');
    });

    it('should handle mention with numbers and underscores', () => {
      render(<ContentWithPills content="@user_123 @dev-team" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('@user_123');
      expect(buttons[1]).toHaveTextContent('@dev-team');
    });

    it('should ignore hashtag/mention that start with number', () => {
      render(<ContentWithPills content="#123abc @456def" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('#123abc');
      expect(buttons[1]).toHaveTextContent('@456def');
    });

    it('should handle special characters adjacent to hashtags/mentions', () => {
      render(<ContentWithPills content="Check (#react) and [@user]!" />);

      expect(screen.getByText('Check (')).toBeInTheDocument();
      expect(screen.getByText(') and [')).toBeInTheDocument();
      expect(screen.getByText(']!')).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('#react');
      expect(buttons[1]).toHaveTextContent('@user');
    });
  });

  describe('Click functionality', () => {
    it('should call onHashtagClick when hashtag is clicked', () => {
      const mockOnHashtagClick = jest.fn();

      render(
        <Provider>
          <ContentWithPills
            content="Check out #react"
            onHashtagClick={mockOnHashtagClick}
          />
        </Provider>
      );

      const hashtagLink = screen.getByRole('link', { name: /#react/ });
      fireEvent.click(hashtagLink);

      expect(mockOnHashtagClick).toHaveBeenCalledWith('#react');
    });

    it('should call onMentionClick when mention is clicked', () => {
      const mockOnMentionClick = jest.fn();

      render(
        <Provider>
          <ContentWithPills
            content="Hello @john"
            onMentionClick={mockOnMentionClick}
          />
        </Provider>
      );

      const mentionLink = screen.getByRole('link', { name: /@john/ });
      fireEvent.click(mentionLink);

      expect(mockOnMentionClick).toHaveBeenCalledWith('john');
    });

    it('should use global filter state when contextId is provided', () => {
      render(
        <Provider>
          <ContentWithPills
            content="Check out #react and @john"
            contextId="test-context"
          />
        </Provider>
      );

      const hashtagLink = screen.getByRole('link', { name: /#react/ });
      const mentionLink = screen.getByRole('link', { name: /@john/ });

      expect(hashtagLink).toBeInTheDocument();
      expect(mentionLink).toBeInTheDocument();
    });

    it('should prioritize custom callbacks over global filter state', () => {
      const mockOnHashtagClick = jest.fn();

      render(
        <Provider>
          <ContentWithPills
            content="Check out #react"
            onHashtagClick={mockOnHashtagClick}
            contextId="test-context"
          />
        </Provider>
      );

      const hashtagLink = screen.getByRole('link', { name: /#react/ });
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
            content="Check out #react and @john"
            onHashtagClick={mockOnHashtagClick}
          />
        </Provider>
      );

      const hashtagLink = screen.getByRole('link', { name: /#react/ });
      const mentionSpan = screen.getByText(/@john/);

      expect(hashtagLink).toHaveAttribute('title', 'Filter by hashtag: react');
      expect(mentionSpan).toHaveAttribute('title', 'Mention: john');
    });

    it('should have non-clickable spans when no callbacks or contextId', () => {
      render(
        <Provider>
          <ContentWithPills content="Check out #react and @john" />
        </Provider>
      );

      // Should be spans, not links
      const hashtagSpan = screen.getByText('#react');
      const mentionSpan = screen.getByText('@john');

      expect(hashtagSpan.tagName).toBe('SPAN');
      expect(mentionSpan.tagName).toBe('SPAN');
    });

    it('should have appropriate titles for hashtags and mentions', () => {
      render(
        <Provider>
          <ContentWithPills content="Check out #react and @john" />
        </Provider>
      );

      const hashtagSpan = screen.getByText('#react');
      const mentionSpan = screen.getByText('@john');

      expect(hashtagSpan).toHaveAttribute('title', 'Hashtag: react');
      expect(mentionSpan).toHaveAttribute('title', 'Mention: john');
    });
  });

  describe('Real-world examples', () => {
    it('should handle complex post content', () => {
      const mockOnHashtagClick = jest.fn();
      const mockOnMentionClick = jest.fn();

      render(
        <Provider>
          <ContentWithPills
            content="Amazing progress on #webdev! Thanks to @alice and @bob for the help. Looking forward to #react2024 conference. #javascript #typescript"
            onHashtagClick={mockOnHashtagClick}
            onMentionClick={mockOnMentionClick}
          />
        </Provider>
      );

      // Should find all hashtags and mentions
      const webdevLink = screen.getByRole('link', { name: '#webdev' });
      const aliceLink = screen.getByRole('link', { name: '@alice' });
      const bobLink = screen.getByRole('link', { name: '@bob' });
      const react2024Link = screen.getByRole('link', { name: '#react2024' });
      const javascriptLink = screen.getByRole('link', { name: '#javascript' });
      const typescriptLink = screen.getByRole('link', { name: '#typescript' });

      expect(webdevLink).toBeInTheDocument();
      expect(aliceLink).toBeInTheDocument();
      expect(bobLink).toBeInTheDocument();
      expect(react2024Link).toBeInTheDocument();
      expect(javascriptLink).toBeInTheDocument();
      expect(typescriptLink).toBeInTheDocument();

      // Test clicking on a hashtag
      fireEvent.click(webdevLink);
      expect(mockOnHashtagClick).toHaveBeenCalledWith('#webdev');

      // Test clicking on a mention
      fireEvent.click(aliceLink);
      expect(mockOnMentionClick).toHaveBeenCalledWith('alice');
    });

    it('should handle post with no pills', () => {
      render(
        <Provider>
          <ContentWithPills content="This is just regular text with no special tags." />
        </Provider>
      );

      const text = screen.getByText(
        'This is just regular text with no special tags.'
      );
      expect(text).toBeInTheDocument();

      // Should not have any links
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });

    it('should handle the original failing case', () => {
      render(
        <Provider>
          <ContentWithPills
            content="#ademptio#testimonium"
            contextId="test-context"
          />
        </Provider>
      );

      const ademptioLink = screen.getByRole('link', { name: '#ademptio' });
      const testimoniumLink = screen.getByRole('link', {
        name: '#testimonium'
      });

      expect(ademptioLink).toBeInTheDocument();
      expect(testimoniumLink).toBeInTheDocument();
    });
  });
});
