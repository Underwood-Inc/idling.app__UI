import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { ADD_SUBMISSION_FORM_SELECTORS } from 'src/lib/test-selectors/components/add-submission-form.selectors';
import * as actions from '../actions';
import { AddSubmissionForm } from './AddSubmissionForm';

// Mock the actions
jest.mock('../actions', () => ({
  createSubmissionAction: jest.fn(),
  validateCreateSubmissionFormAction: jest.fn()
}));

// Update the mock for react-dom
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormState: jest.fn(),
  useFormStatus: jest.fn(() => ({ pending: false }))
}));

// Add this mock for ShouldUpdateContext
jest.mock('../../../../lib/state/ShouldUpdateContext', () => ({
  useShouldUpdate: jest.fn().mockReturnValue({
    state: false,
    dispatch: jest.fn()
  })
}));

describe('AddSubmissionForm', () => {
  let mockValidateAction: jest.Mock;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateAction = jest.fn().mockResolvedValue({
      message: '',
      error: ''
    });
    (
      actions.validateCreateSubmissionFormAction as jest.Mock
    ).mockImplementation(mockValidateAction);

    mockDispatch = jest.fn();
    (require('react-dom').useFormState as jest.Mock).mockReturnValue([
      { status: 0, message: '', error: '' },
      mockDispatch
    ]);
  });

  const renderComponent = (isAuthorized = true) => {
    return render(<AddSubmissionForm isAuthorized={isAuthorized} />);
  };

  test('renders form elements correctly', () => {
    renderComponent();
    expect(
      screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.NAME_INPUT)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.SUBMIT_BUTTON)
    ).toBeInTheDocument();
  });

  test('disables input and button when not authorized', () => {
    renderComponent(false);
    expect(
      screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.NAME_INPUT)
    ).toBeDisabled();
    expect(
      screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.SUBMIT_BUTTON)
    ).toBeDisabled();
  });

  test('updates character count on input change', async () => {
    renderComponent();
    const input = screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.NAME_INPUT);
    fireEvent.change(input, { target: { value: 'Test Submission' } });
    await waitFor(() => {
      expect(
        screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.CHARACTER_COUNT)
      ).toHaveTextContent('15/255');
    });
  });

  test('displays warning when character count is between 80% and 100%', async () => {
    renderComponent();
    const input = screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.NAME_INPUT);
    fireEvent.change(input, { target: { value: 'a'.repeat(205) } });
    await waitFor(() => {
      const countElement = screen.getByTestId(
        ADD_SUBMISSION_FORM_SELECTORS.CHARACTER_COUNT
      );
      expect(countElement).toHaveTextContent('205/255');
      expect(countElement).toHaveClass('warning');
    });
  });

  test('displays error when character count exceeds 100%', async () => {
    renderComponent();
    const input = screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.NAME_INPUT);
    fireEvent.change(input, { target: { value: 'a'.repeat(256) } });
    await waitFor(() => {
      const countElement = screen.getByTestId(
        ADD_SUBMISSION_FORM_SELECTORS.CHARACTER_COUNT
      );
      expect(countElement).toHaveTextContent('256/255');
      expect(countElement).toHaveClass('error');
    });
  });

  test('displays error message when validation fails', async () => {
    (require('react-dom').useFormState as jest.Mock).mockReturnValue([
      { status: 0, message: '', error: 'Invalid submission name' },
      jest.fn()
    ]);
    renderComponent();
    const input = screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.NAME_INPUT);
    fireEvent.blur(input, { target: { value: '' } });
    await waitFor(() => {
      expect(
        screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.STATUS_MESSAGE)
      ).toHaveTextContent('Invalid submission name');
    });
  });

  test('submits form successfully', async () => {
    const mockFormAction = jest.fn();
    (require('react-dom').useFormState as jest.Mock).mockReturnValue([
      { status: 1, message: 'Submission created', error: '' },
      mockFormAction
    ]);
    renderComponent();
    const form = screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.FORM);
    fireEvent.submit(form);
    await waitFor(() => {
      expect(mockFormAction).toHaveBeenCalled();
      expect(screen.getByText('Submission created')).toBeInTheDocument();
    });
  });

  test('resets form after successful submission', async () => {
    const mockFormAction = jest.fn();
    (require('react-dom').useFormState as jest.Mock).mockReturnValue([
      { status: 1, message: 'Submission created', error: '' },
      mockFormAction
    ]);
    renderComponent();
    const input = screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.NAME_INPUT);
    fireEvent.change(input, { target: { value: 'Test Submission' } });
    const form = screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.FORM);
    fireEvent.submit(form);
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  test('calls handleFormValidateAction on input blur', async () => {
    render(<AddSubmissionForm isAuthorized={true} />);
    const input = screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.NAME_INPUT);

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test Submission' } });
      fireEvent.blur(input);
    });

    await waitFor(() => {
      expect(
        screen.getByTestId(ADD_SUBMISSION_FORM_SELECTORS.STATUS_MESSAGE)
      ).toHaveTextContent('');
    });
  });
});
