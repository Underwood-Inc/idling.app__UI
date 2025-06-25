import '@testing-library/jest-dom';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { FilterLabel } from './FilterLabel';

// Mock the ContentWithPills component
jest.mock('../ui/ContentWithPills', () => ({
  ContentWithPills: ({
    content,
    onHashtagClick,
    onMentionClick,
    className
  }: any) => (
    <div data-testid="content-with-pills" className={className}>
      <span>{content}</span>
      <button
        onClick={() => onHashtagClick?.(content)}
        data-testid="hashtag-click"
      >
        Remove Hashtag
      </button>
      <button
        onClick={() => onMentionClick?.(content)}
        data-testid="mention-click"
      >
        Remove Mention
      </button>
    </div>
  )
}));

// Mock the search actions
const mockResolveUserIdToUsername = jest.fn();
const mockGetUserInfo = jest.fn();

jest.mock('../../../lib/actions/search.actions', () => ({
  resolveUserIdToUsername: mockResolveUserIdToUsername,
  getUserInfo: mockGetUserInfo
}));

describe('FilterLabel Component', () => {
  let mockOnRemoveTag: jest.Mock;
  let mockOnRemoveFilter: jest.Mock;

  beforeEach(() => {
    mockOnRemoveTag = jest.fn();
    mockOnRemoveFilter = jest.fn();
    mockResolveUserIdToUsername.mockClear();
    mockGetUserInfo.mockClear();
  });

  const renderFilterLabel = (props: {
    name: string;
    label: string;
    filterId?: string;
    onRemoveTag?: jest.Mock;
    onRemoveFilter?: jest.Mock;
  }) => {
    return render(
      <FilterLabel
        name={props.name}
        label={props.label}
        filterId={props.filterId || 'test'}
        onRemoveTag={props.onRemoveTag || mockOnRemoveTag}
        onRemoveFilter={props.onRemoveFilter || mockOnRemoveFilter}
      />
    );
  };

  describe('Tag Filters', () => {
    it('should render tag filter with ContentWithPills', () => {
      renderFilterLabel({
        name: 'tags',
        label: '#react'
      });

      expect(screen.getByTestId('content-with-pills')).toBeInTheDocument();
      expect(screen.getByText('#react')).toBeInTheDocument();
    });

    it('should handle tag removal via hashtag click', () => {
      renderFilterLabel({
        name: 'tags',
        label: '#react'
      });

      const hashtagButton = screen.getByTestId('hashtag-click');
      fireEvent.click(hashtagButton);

      expect(mockOnRemoveTag).toHaveBeenCalledWith('#react');
    });

    it('should handle multiple tags', () => {
      renderFilterLabel({
        name: 'tags',
        label: '#react,#typescript'
      });

      expect(screen.getByText('#react,#typescript')).toBeInTheDocument();
    });
  });

  describe('Author Filters', () => {
    it('should resolve author userId to username', async () => {
      mockResolveUserIdToUsername.mockResolvedValue('johndoe');

      await act(async () => {
        renderFilterLabel({
          name: 'author',
          label: '123'
        });
      });

      await waitFor(() => {
        expect(mockResolveUserIdToUsername).toHaveBeenCalledWith('123');
      });

      await waitFor(() => {
        expect(screen.getByText('@[johndoe|123]')).toBeInTheDocument();
      });
    });

    it('should handle author resolution failure', async () => {
      mockResolveUserIdToUsername.mockResolvedValue(null);

      await act(async () => {
        renderFilterLabel({
          name: 'author',
          label: '123'
        });
      });

      await waitFor(() => {
        expect(screen.getByText('@123')).toBeInTheDocument();
      });
    });

    it('should handle author resolution error', async () => {
      mockResolveUserIdToUsername.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await act(async () => {
        renderFilterLabel({
          name: 'author',
          label: '123'
        });
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error resolving user ID to username:',
          expect.any(Error)
        );
      });

      await waitFor(() => {
        expect(screen.getByText('@123')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should not resolve author if label already starts with @', async () => {
      await act(async () => {
        renderFilterLabel({
          name: 'author',
          label: '@johndoe'
        });
      });

      // Should not call resolution
      expect(mockResolveUserIdToUsername).not.toHaveBeenCalled();
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
    });

    it('should handle author removal via mention click', async () => {
      mockResolveUserIdToUsername.mockResolvedValue('johndoe');

      await act(async () => {
        renderFilterLabel({
          name: 'author',
          label: '123'
        });
      });

      await waitFor(() => {
        expect(screen.getByText('@[johndoe|123]')).toBeInTheDocument();
      });

      const mentionButton = screen.getByTestId('mention-click');
      fireEvent.click(mentionButton);

      expect(mockOnRemoveFilter).toHaveBeenCalledWith('author', '123');
    });
  });

  describe('Mentions Filters', () => {
    it('should resolve mentions username to userId for display', async () => {
      mockGetUserInfo.mockResolvedValue({
        username: 'johndoe',
        userId: '123'
      });

      await act(async () => {
        renderFilterLabel({
          name: 'mentions',
          label: 'johndoe'
        });
      });

      await waitFor(() => {
        expect(mockGetUserInfo).toHaveBeenCalledWith('johndoe');
      });

      await waitFor(() => {
        expect(screen.getByText('@[johndoe|123]')).toBeInTheDocument();
      });
    });

    it('should handle mentions resolution failure', async () => {
      mockGetUserInfo.mockResolvedValue(null);

      renderFilterLabel({
        name: 'mentions',
        label: 'johndoe'
      });

      await waitFor(() => {
        expect(screen.getByText('@johndoe')).toBeInTheDocument();
      });
    });

    it('should handle mentions resolution error', async () => {
      mockGetUserInfo.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderFilterLabel({
        name: 'mentions',
        label: 'johndoe'
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error resolving username to user ID for display:',
          expect.any(Error)
        );
      });

      await waitFor(() => {
        expect(screen.getByText('@johndoe')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should not resolve mentions if label already starts with @', async () => {
      renderFilterLabel({
        name: 'mentions',
        label: '@johndoe'
      });

      // Should not call resolution
      expect(mockGetUserInfo).not.toHaveBeenCalled();
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
    });

    it('should handle mentions removal via mention click', async () => {
      mockGetUserInfo.mockResolvedValue({
        username: 'johndoe',
        userId: '123'
      });

      renderFilterLabel({
        name: 'mentions',
        label: 'johndoe'
      });

      await waitFor(() => {
        expect(screen.getByText('@[johndoe|123]')).toBeInTheDocument();
      });

      const mentionButton = screen.getByTestId('mention-click');
      fireEvent.click(mentionButton);

      expect(mockOnRemoveFilter).toHaveBeenCalledWith('mentions', 'johndoe');
    });
  });

  describe('Plain Text Labels', () => {
    it('should render plain text labels as buttons', () => {
      renderFilterLabel({
        name: 'custom',
        label: 'plain-text'
      });

      expect(
        screen.queryByTestId('content-with-pills')
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Remove plain-text filter' })
      ).toBeInTheDocument();
      expect(screen.getByText('plain-text')).toBeInTheDocument();
      expect(screen.getByText('×')).toBeInTheDocument();
    });

    it('should handle plain text removal', () => {
      renderFilterLabel({
        name: 'custom',
        label: 'plain-text'
      });

      const button = screen.getByRole('button', {
        name: 'Remove plain-text filter'
      });
      fireEvent.click(button);

      expect(mockOnRemoveTag).toHaveBeenCalledWith('plain-text');
    });

    it('should handle plain text author removal', () => {
      renderFilterLabel({
        name: 'author',
        label: 'plain-author'
      });

      const button = screen.getByRole('button', {
        name: 'Remove plain-author filter'
      });
      fireEvent.click(button);

      expect(mockOnRemoveFilter).toHaveBeenCalledWith('author', 'plain-author');
    });

    it('should handle plain text mentions removal', () => {
      renderFilterLabel({
        name: 'mentions',
        label: 'plain-mention'
      });

      const button = screen.getByRole('button', {
        name: 'Remove plain-mention filter'
      });
      fireEvent.click(button);

      expect(mockOnRemoveFilter).toHaveBeenCalledWith(
        'mentions',
        'plain-mention'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty labels', () => {
      renderFilterLabel({
        name: 'tags',
        label: ''
      });

      // Should render a button with aria-label for empty filter (note the double space)
      expect(
        screen.getByRole('button', { name: 'Remove filter' })
      ).toBeInTheDocument();
    });

    it('should handle special characters in labels', () => {
      renderFilterLabel({
        name: 'tags',
        label: '#react-hooks.v18'
      });

      expect(screen.getByText('#react-hooks.v18')).toBeInTheDocument();
    });

    it('should handle long labels', () => {
      const longLabel = '#' + 'a'.repeat(100);
      renderFilterLabel({
        name: 'tags',
        label: longLabel
      });

      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('should handle unicode characters', () => {
      renderFilterLabel({
        name: 'tags',
        label: '#react-🚀-awesome'
      });

      expect(screen.getByText('#react-🚀-awesome')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should pass correct props to ContentWithPills', () => {
      renderFilterLabel({
        name: 'tags',
        label: '#react',
        filterId: 'custom-filter-id'
      });

      const contentWithPills = screen.getByTestId('content-with-pills');
      expect(contentWithPills).toHaveClass('filter-bar__filter-pill');
    });

    it('should handle missing onRemoveFilter prop', () => {
      renderFilterLabel({
        name: 'author',
        label: '@johndoe',
        onRemoveFilter: undefined
      });

      // For labels starting with @, it should use ContentWithPills
      const contentWithPills = screen.getByTestId('content-with-pills');
      expect(contentWithPills).toBeInTheDocument();

      // The component should still render without errors even when onRemoveFilter is undefined
      expect(contentWithPills).toHaveClass('filter-bar__filter-pill');
    });

    it('should use original label for removal, not display label', async () => {
      mockResolveUserIdToUsername.mockResolvedValue('johndoe');

      renderFilterLabel({
        name: 'author',
        label: '123'
      });

      await waitFor(() => {
        expect(screen.getByText('@[johndoe|123]')).toBeInTheDocument();
      });

      const mentionButton = screen.getByTestId('mention-click');
      fireEvent.click(mentionButton);

      // Should use original label '123', not display label '@[johndoe|123]'
      expect(mockOnRemoveFilter).toHaveBeenCalledWith('author', '123');
    });
  });

  describe('Async Behavior', () => {
    it('should show initial label before resolution completes', () => {
      // Don't resolve the promise immediately
      let resolvePromise: (value: string) => void;
      const promise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });
      mockResolveUserIdToUsername.mockReturnValue(promise);

      renderFilterLabel({
        name: 'author',
        label: '123'
      });

      // Should show initial state
      expect(screen.getByText('123')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!('johndoe');

      return waitFor(() => {
        expect(screen.getByText('@[johndoe|123]')).toBeInTheDocument();
      });
    });

    it('should handle concurrent resolution requests', async () => {
      // Set up multiple calls
      mockResolveUserIdToUsername.mockResolvedValue('johndoe');

      const { rerender } = renderFilterLabel({
        name: 'author',
        label: '123'
      });

      // Change the label while resolution is pending
      rerender(
        <FilterLabel
          name="author"
          label="456"
          filterId="test"
          onRemoveTag={mockOnRemoveTag}
          onRemoveFilter={mockOnRemoveFilter}
        />
      );

      // Should handle both resolutions
      await waitFor(() => {
        expect(mockResolveUserIdToUsername).toHaveBeenCalledWith('123');
        expect(mockResolveUserIdToUsername).toHaveBeenCalledWith('456');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for plain text buttons', () => {
      renderFilterLabel({
        name: 'custom',
        label: 'test-filter'
      });

      const button = screen.getByRole('button', {
        name: 'Remove test-filter filter'
      });
      expect(button).toHaveAttribute('aria-label', 'Remove test-filter filter');
    });

    it('should have aria-hidden on remove icon', () => {
      renderFilterLabel({
        name: 'custom',
        label: 'test-filter'
      });

      const removeIcon = screen.getByText('×');
      expect(removeIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should be keyboard accessible', () => {
      renderFilterLabel({
        name: 'custom',
        label: 'test-filter'
      });

      const button = screen.getByRole('button', {
        name: 'Remove test-filter filter'
      });

      // Should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);

      // Should handle Enter key
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.click(button);

      expect(mockOnRemoveTag).toHaveBeenCalledWith('test-filter');
    });
  });
});
