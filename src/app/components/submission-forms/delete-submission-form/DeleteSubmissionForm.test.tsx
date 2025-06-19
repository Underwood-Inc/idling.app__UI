import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'jotai';
import { DeleteSubmissionForm } from './DeleteSubmissionForm';

// Mock Jotai atoms instead of old context hooks
jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useAtom: jest.fn().mockReturnValue([false, jest.fn()])
}));

// Mock the delete submission action
jest.mock('../actions', () => ({
  deleteSubmissionAction: jest.fn().mockResolvedValue({
    status: 1,
    message: 'Submission deleted successfully'
  })
}));

// Mock react-dom hooks
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormState: jest.fn(),
  useFormStatus: jest.fn(() => ({ pending: false }))
}));

describe('DeleteSubmissionForm', () => {
  const defaultProps = {
    id: 1,
    name: 'Test Submission',
    isAuthorized: true
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default form state mock
    const { useFormState } = require('react-dom');
    useFormState.mockReturnValue([{ status: 0, message: '' }, jest.fn()]);
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
    const mockSetShouldUpdate = jest.fn();
    const mockFormAction = jest.fn();

    const { useAtom } = require('jotai');
    const { useFormState } = require('react-dom');

    useAtom.mockReturnValue([false, mockSetShouldUpdate]);

    useFormState.mockReturnValue([
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
    const { useFormStatus } = require('react-dom');
    useFormStatus.mockReturnValue({ pending: true });

    render(
      <Provider>
        <DeleteSubmissionForm {...defaultProps} />
      </Provider>
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeDisabled();
  });

  it('displays success message after deletion', () => {
    const { useFormState } = require('react-dom');
    useFormState.mockReturnValue([
      { status: 1, message: 'Deleted successfully' },
      jest.fn()
    ]);

    render(
      <Provider>
        <DeleteSubmissionForm {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Deleted successfully')).toBeInTheDocument();
  });

  it('displays error message on failed deletion', () => {
    const { useFormState } = require('react-dom');
    useFormState.mockReturnValue([
      { status: -1, error: 'Deletion failed' },
      jest.fn()
    ]);

    render(
      <Provider>
        <DeleteSubmissionForm {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Deletion failed')).toBeInTheDocument();
  });
});
