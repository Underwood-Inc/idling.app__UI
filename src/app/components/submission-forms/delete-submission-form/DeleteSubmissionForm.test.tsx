import { Provider, useAtom } from 'jotai';
import { useFormState, useFormStatus } from 'react-dom';
import { fireEvent, render, screen, waitFor } from '../../../../test-utils';
import { DeleteSubmissionForm } from './DeleteSubmissionForm';

// Mock Jotai atoms instead of old context hooks
vi.mock('jotai', async () => {
  const actual = await vi.importActual<typeof import('jotai')>('jotai');
  return {
    ...actual,
    useAtom: vi.fn().mockReturnValue([false, vi.fn()])
  };
});

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    useFormState: vi.fn(),
    useFormStatus: vi.fn(() => ({ pending: false }))
  };
});

vi.mock('../actions', () => ({
  deleteSubmissionAction: vi.fn().mockResolvedValue({
    status: 1,
    message: 'Submission deleted successfully'
  })
}));

describe('DeleteSubmissionForm', () => {
  const defaultProps = {
    id: 1,
    name: 'Test Submission',
    isAuthorized: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAtom).mockReturnValue([false, vi.fn()]);
    vi.mocked(useFormState).mockReturnValue([{ status: 0, message: '' }, vi.fn()]);
    vi.mocked(useFormStatus).mockReturnValue({ pending: false });
  });

  it('renders delete button when authorized', () => {
    render(
      <Provider>
        <DeleteSubmissionForm {...defaultProps} />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('handles form submission correctly', async () => {
    const mockSetShouldUpdate = vi.fn();
    const mockFormAction = vi.fn();

    vi.mocked(useAtom).mockReturnValue([false, mockSetShouldUpdate]);

    vi.mocked(useFormState).mockReturnValue([
      { status: 1, message: 'Deleted successfully' },
      mockFormAction
    ]);

    render(
      <Provider>
        <DeleteSubmissionForm {...defaultProps} />
      </Provider>
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockSetShouldUpdate).toHaveBeenCalledWith(true);
    });
  });

  it('shows loading state during submission', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: true });

    render(
      <Provider>
        <DeleteSubmissionForm {...defaultProps} />
      </Provider>
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeDisabled();
  });

  it('displays success message after deletion', () => {
    vi.mocked(useFormState).mockReturnValue([
      { status: 1, message: 'Deleted successfully' },
      vi.fn()
    ]);

    render(
      <Provider>
        <DeleteSubmissionForm {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Deleted successfully')).toBeInTheDocument();
  });

  it('displays error message on failed deletion', () => {
    vi.mocked(useFormState).mockReturnValue([
      { status: -1, error: 'Deletion failed' },
      vi.fn()
    ]);

    render(
      <Provider>
        <DeleteSubmissionForm {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Deletion failed')).toBeInTheDocument();
  });
});
