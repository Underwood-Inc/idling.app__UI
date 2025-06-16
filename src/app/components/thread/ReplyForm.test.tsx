import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'jotai';
import { ReplyForm } from './ReplyForm';

// Mock Next.js router
const mockReplace = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh
  })
}));

// Mock the createSubmissionAction
const mockCreateSubmissionAction = jest.fn();
jest.mock('../submission-forms/actions', () => ({
  createSubmissionAction: (...args: any[]) =>
    mockCreateSubmissionAction(...args)
}));

// Mock jotai atoms
jest.mock('../../../lib/state/atoms', () => ({
  shouldUpdateAtom: jest.fn()
}));

describe('ReplyForm', () => {
  const defaultProps = {
    parentId: 123
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSubmissionAction.mockResolvedValue({ status: 1 });
  });

  const renderReplyForm = (props = defaultProps) => {
    return render(
      <Provider>
        <ReplyForm {...props} />
      </Provider>
    );
  };

  it('renders form with title and content fields', () => {
    renderReplyForm();

    expect(screen.getByLabelText(/Reply Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reply Content/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Submit Reply/ })
    ).toBeInTheDocument();
  });

  it('shows character count for title and content', () => {
    renderReplyForm();

    expect(screen.getByText('255 characters remaining')).toBeInTheDocument();
    expect(screen.getByText('1000 characters remaining')).toBeInTheDocument();
  });

  it('updates character count as user types', () => {
    renderReplyForm();

    const titleInput = screen.getByLabelText(/Reply Title/);
    fireEvent.change(titleInput, { target: { value: 'Test title' } });

    expect(screen.getByText('245 characters remaining')).toBeInTheDocument();
  });

  it('disables submit button when fields are empty', () => {
    renderReplyForm();

    const submitButton = screen.getByRole('button', { name: /Submit Reply/ });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when both fields have content', () => {
    renderReplyForm();

    const titleInput = screen.getByLabelText(/Reply Title/);
    const contentInput = screen.getByLabelText(/Reply Content/);
    const submitButton = screen.getByRole('button', { name: /Submit Reply/ });

    fireEvent.change(titleInput, { target: { value: 'Test title' } });
    fireEvent.change(contentInput, { target: { value: 'Test content' } });

    expect(submitButton).toBeEnabled();
  });

  it('submits form with correct data', async () => {
    renderReplyForm();

    const titleInput = screen.getByLabelText(/Reply Title/);
    const contentInput = screen.getByLabelText(/Reply Content/);
    const submitButton = screen.getByRole('button', { name: /Submit Reply/ });

    fireEvent.change(titleInput, { target: { value: 'Test Reply Title' } });
    fireEvent.change(contentInput, { target: { value: 'Test reply content' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateSubmissionAction).toHaveBeenCalledWith(
        { status: 0 },
        expect.any(FormData)
      );
    });

    // Verify the FormData contains correct values
    const [, formData] = mockCreateSubmissionAction.mock.calls[0];
    expect(formData.get('submission_title')).toBe('Test Reply Title');
    expect(formData.get('submission_name')).toBe('Test reply content');
    expect(formData.get('thread_parent_id')).toBe('123');
  });
});
