import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'jotai';
import { ReplyForm } from './ReplyForm';

// Mock jotai
jest.mock('jotai', () => ({
  useAtom: jest.fn(),
  atom: jest.fn()
}));

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  })
}));

// Mock SmartInput component
jest.mock('../ui/SmartInput', () => ({
  SmartInput: ({
    value,
    onChange,
    disabled,
    placeholder,
    className,
    as
  }: any) => {
    const Component = as || 'input';
    return (
      <Component
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
      />
    );
  }
}));

// Mock the createSubmissionAction
const mockCreateSubmissionAction = jest.fn();
jest.mock('../submission-forms/actions', () => ({
  createSubmissionAction: (...args: any[]) =>
    mockCreateSubmissionAction(...args)
}));

describe('ReplyForm', () => {
  const mockOnSuccess = jest.fn();
  const defaultProps = {
    parentId: 123,
    onSuccess: mockOnSuccess
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

    expect(
      screen.getByText(/Enter a reply title.*Use #hashtags/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Write your reply content.*Use #hashtags/)
    ).toBeInTheDocument();
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

    const titleInput = screen.getAllByTestId('rich-input')[0];
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

    const titleInput = screen.getAllByTestId('rich-input')[0];
    const contentInput = screen.getAllByTestId('rich-input')[1];
    const submitButton = screen.getByRole('button', { name: /Submit Reply/ });

    fireEvent.change(titleInput, { target: { value: 'Test title' } });
    fireEvent.change(contentInput, { target: { value: 'Test content' } });

    expect(submitButton).toBeEnabled();
  });

  it('submits form with correct data', async () => {
    renderReplyForm();

    const titleInput = screen.getAllByTestId('rich-input')[0];
    const contentInput = screen.getAllByTestId('rich-input')[1];
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
    expect(formData.get('submission_content')).toBe('Test reply content');
    expect(formData.get('thread_parent_id')).toBe('123');
  });

  it('calls onSuccess callback after successful submission', async () => {
    renderReplyForm();

    const titleInput = screen.getAllByTestId('rich-input')[0];
    const contentInput = screen.getAllByTestId('rich-input')[1];
    const submitButton = screen.getByRole('button', { name: /Submit Reply/ });

    fireEvent.change(titleInput, { target: { value: 'Test Reply Title' } });
    fireEvent.change(contentInput, { target: { value: 'Test reply content' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onSuccess callback when submission fails', async () => {
    mockCreateSubmissionAction.mockResolvedValue({
      status: 0,
      error: 'Failed to submit'
    });
    renderReplyForm();

    const titleInput = screen.getAllByTestId('rich-input')[0];
    const contentInput = screen.getAllByTestId('rich-input')[1];
    const submitButton = screen.getByRole('button', { name: /Submit Reply/ });

    fireEvent.change(titleInput, { target: { value: 'Test Reply Title' } });
    fireEvent.change(contentInput, { target: { value: 'Test reply content' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to submit')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('works without onSuccess callback', async () => {
    const propsWithoutCallback = { parentId: 123 };

    render(
      <Provider>
        <ReplyForm {...propsWithoutCallback} />
      </Provider>
    );

    const titleInput = screen.getAllByTestId('rich-input')[0];
    const contentInput = screen.getAllByTestId('rich-input')[1];
    const submitButton = screen.getByRole('button', { name: /Submit Reply/ });

    fireEvent.change(titleInput, { target: { value: 'Test Reply Title' } });
    fireEvent.change(contentInput, { target: { value: 'Test reply content' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateSubmissionAction).toHaveBeenCalled();
    });

    // Should not throw any errors
  });
});
