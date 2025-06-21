import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'jotai';
import { AddSubmissionForm } from './AddSubmissionForm';

// Mock Jotai atoms instead of old context hooks
jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useAtom: jest.fn().mockReturnValue([false, jest.fn()])
}));

// Mock the add submission action
jest.mock('../actions', () => ({
  addSubmissionAction: jest.fn().mockResolvedValue({
    status: 1,
    message: 'Submission added successfully'
  }),
  createSubmissionAction: jest.fn().mockResolvedValue({
    status: 1,
    message: 'Submission added successfully'
  }),
  validateCreateSubmissionFormAction: jest.fn().mockResolvedValue({
    status: 0,
    message: '',
    error: ''
  })
}));

// Mock react-dom hooks
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormState: jest.fn(),
  useFormStatus: jest.fn(() => ({ pending: false }))
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: 'test-user' } },
    status: 'authenticated'
  }))
}));

// Mock SmartInput component
jest.mock('../../ui/SmartInput', () => ({
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
    jest.clearAllMocks();

    // Setup default form state mock
    const { useFormState } = require('react-dom');
    useFormState.mockReturnValue([{ status: 0, message: '' }, jest.fn()]);
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
    const mockSetShouldUpdate = jest.fn();
    const mockFormAction = jest.fn();

    const { useAtom } = require('jotai');
    const { useFormState } = require('react-dom');

    useAtom.mockReturnValue([false, mockSetShouldUpdate]);

    useFormState.mockReturnValue([
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
    const { useFormStatus } = require('react-dom');
    useFormStatus.mockReturnValue({ pending: true });

    render(
      <Provider>
        <AddSubmissionForm />
      </Provider>
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });

  it('displays error message on failed submission', () => {
    const { useFormState } = require('react-dom');
    useFormState.mockReturnValue([
      { status: -1, message: 'Submission failed' },
      jest.fn()
    ]);

    render(
      <Provider>
        <AddSubmissionForm />
      </Provider>
    );

    expect(screen.getByText('Submission failed')).toBeInTheDocument();
  });

  it('resets form after successful submission', async () => {
    const { useFormState } = require('react-dom');
    useFormState.mockReturnValue([
      { status: 1, message: 'Success' },
      jest.fn()
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
