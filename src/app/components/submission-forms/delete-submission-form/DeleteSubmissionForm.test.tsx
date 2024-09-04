import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useShouldUpdate } from '../../../../lib/state/ShouldUpdateContext';
import * as actions from '../actions';
import { DeleteSubmissionForm } from './DeleteSubmissionForm';

// Mock the necessary dependencies
jest.mock('../../../../lib/state/ShouldUpdateContext');
jest.mock('../actions', () => ({
  deleteSubmissionAction: jest.fn()
}));
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormState: jest.fn(),
  useFormStatus: jest.fn(() => ({ pending: false }))
}));

describe('DeleteSubmissionForm', () => {
  let mockDispatch: jest.Mock;
  let mockFormAction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    mockFormAction = jest.fn();

    (useShouldUpdate as jest.Mock).mockReturnValue({ dispatch: mockDispatch });
    (actions.deleteSubmissionAction as jest.Mock).mockResolvedValue({
      status: 0,
      message: ''
    });
    (require('react-dom').useFormState as jest.Mock).mockReturnValue([
      { status: 0, message: '' },
      mockFormAction
    ]);
  });

  it('renders the delete button', () => {
    render(
      <DeleteSubmissionForm id={1} name="Test Submission" isAuthorized={true} />
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('disables the delete button when not authorized', () => {
    render(
      <DeleteSubmissionForm
        id={1}
        name="Test Submission"
        isAuthorized={false}
      />
    );
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    expect(deleteButton).toBeDisabled();
    expect(deleteButton).toHaveAttribute('title', 'Login to manage posts.');
  });

  it('submits the form and resets on successful deletion', async () => {
    (actions.deleteSubmissionAction as jest.Mock).mockResolvedValue({
      status: 1,
      message: 'Deleted post Test Submission.'
    });
    (require('react-dom').useFormState as jest.Mock).mockReturnValue([
      { status: 1, message: '' },
      mockFormAction
    ]);

    render(
      <DeleteSubmissionForm id={1} name="Test Submission" isAuthorized={true} />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockFormAction).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SHOULD_UPDATE',
        payload: true
      });
    });
  });

  it('displays an error message on failed deletion', async () => {
    (actions.deleteSubmissionAction as jest.Mock).mockResolvedValue({
      status: -1,
      message: 'Failed to delete post.',
      error: 'Failed to delete post.'
    });
    (require('react-dom').useFormState as jest.Mock).mockReturnValue([
      { status: -1, message: 'Failed to delete post.' },
      mockFormAction
    ]);

    render(
      <DeleteSubmissionForm id={1} name="Test Submission" isAuthorized={true} />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockFormAction).toHaveBeenCalled();
      expect(screen.getByText('Failed to delete post.')).toBeInTheDocument();
    });
  });
});
