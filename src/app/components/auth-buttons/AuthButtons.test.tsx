import { act, fireEvent, render, screen } from '@testing-library/react';
import { AUTH_BUTTON_SELECTORS } from 'src/lib/test-selectors/components/auth-buttons.selectors';
import { SignIn, SignInProviders, SignOut } from './AuthButtons';
import { signInAction, signOutAction } from './actions';

jest.mock('./actions', () => ({
  signInAction: jest.fn(),
  signOutAction: jest.fn()
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn()
  }))
}));

describe('AuthButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SignIn component', () => {
    it.each([
      ['twitch' as SignInProviders, 'Login with twitch'],
      ['google' as SignInProviders, 'Login with google']
    ])(
      'renders button with correct text for %s provider',
      (provider, expectedText) => {
        render(<SignIn provider={provider} />);
        expect(
          screen.getByTestId(AUTH_BUTTON_SELECTORS.SIGN_IN)
        ).toHaveTextContent(expectedText);
      }
    );

    it.each(['twitch', 'google'] as SignInProviders[])(
      'calls signInAction with %s provider when clicked',
      async (provider) => {
        render(<SignIn provider={provider} />);

        await act(async () => {
          fireEvent.click(screen.getByTestId(AUTH_BUTTON_SELECTORS.SIGN_IN));
        });

        expect(signInAction).toHaveBeenCalled();
        expect((signInAction as jest.Mock).mock.calls[0][0]).toBe(provider);
      }
    );
  });

  describe('SignOut component', () => {
    it('renders the sign out button and calls signOutAction when clicked', async () => {
      render(<SignOut />);
      const signOutButton = screen.getByTestId(AUTH_BUTTON_SELECTORS.SIGN_OUT);
      expect(signOutButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(signOutButton);
      });
      expect(signOutAction).toHaveBeenCalled();
    });
  });
});
