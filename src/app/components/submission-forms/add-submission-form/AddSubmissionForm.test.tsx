import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider, useAtom } from 'jotai';
import { useFormState, useFormStatus } from 'react-dom';
import { AddSubmissionForm } from './AddSubmissionForm';

// Mock Jotai atoms instead of old context hooks
vi.mock('jotai', async () => {
  const actual = await vi.importActual<typeof import('jotai')>('jotai');
  return {
    ...actual,
    useAtom: vi.fn().mockReturnValue([false, vi.fn()])
  };
});

// Mock the add submission action
vi.mock('../actions', () => ({
  addSubmissionAction: vi.fn().mockResolvedValue({
    status: 1,
    message: 'Submission added successfully'
  }),
  createSubmissionAction: vi.fn().mockResolvedValue({
    status: 1,
    message: 'Submission added successfully'
  }),
  validateCreateSubmissionFormAction: vi.fn().mockResolvedValue({
    status: 0,
    message: '',
    error: ''
  })
}));

// Mock react-dom hooks
vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    useFormState: vi.fn(),
    useFormStatus: vi.fn(() => ({ pending: false }))
  };
});

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: 'test-user' } },
    status: 'authenticated'
  }))
}));

// Mock SmartInput component
vi.mock('../../ui/SmartInput', () => ({
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
        data-testid={`smart-input-${className}`}
      />
    );
  }
}));

describe('AddSubmissionForm', () => {
  const defaultProps = {
    isAuthorized: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAtom).mockReturnValue([false, vi.fn()]);
    vi.mocked(useFormState).mockReturnValue([{ status: 0, message: '' }, vi.fn()]);
    vi.mocked(useFormStatus).mockReturnValue({ pending: false });
  });

  it('renders form correctly', () => {
    render(
      <Provider>
        <AddSubmissionForm />
      </Provider>
    );

    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(
      screen.getByTestId('smart-input-submission__title-input')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('smart-input-submission__tags-input')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('handles form submission correctly', async () => {
    const mockSetShouldUpdate = vi.fn();
    const mockFormAction = vi.fn();

    vi.mocked(useAtom).mockReturnValue([false, mockSetShouldUpdate]);

    vi.mocked(useFormState).mockReturnValue([
      { status: 1, message: 'Success' },
      mockFormAction
    ]);

    render(
      <Provider>
        <AddSubmissionForm />
      </Provider>
    );

    const titleInput = screen.getByTestId(
      'smart-input-submission__title-input'
    );
    const tagsInput = screen.getByTestId('smart-input-submission__tags-input');
    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(tagsInput, { target: { value: 'test, example' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSetShouldUpdate).toHaveBeenCalledWith(true);
    });
  });

  it('shows loading state during submission', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: true });

    render(
      <Provider>
        <AddSubmissionForm />
      </Provider>
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });

  it('displays error message on failed submission', () => {
    vi.mocked(useFormState).mockReturnValue([
      { status: -1, message: 'Submission failed' },
      vi.fn()
    ]);

    render(
      <Provider>
        <AddSubmissionForm />
      </Provider>
    );

    expect(screen.getByText('Submission failed')).toBeInTheDocument();
  });

  it('resets form after successful submission', async () => {
    vi.mocked(useFormState).mockReturnValue([
      { status: 1, message: 'Success' },
      vi.fn()
    ]);

    render(
      <Provider>
        <AddSubmissionForm />
      </Provider>
    );

    // Form should be reset after successful submission
    const titleInput = screen.getByTestId(
      'smart-input-submission__title-input'
    ) as HTMLInputElement;
    expect(titleInput.value).toBe('');
  });
});
