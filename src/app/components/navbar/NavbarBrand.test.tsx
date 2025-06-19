import { render, screen } from '@testing-library/react';
import { AVATAR_SELECTORS } from '../../../lib/test-selectors/components/avatar.selectors';
import { NavbarBrand } from './NavbarBrand';

// Mock the auth module
jest.mock('../../../lib/auth', () => ({
  auth: jest.fn()
}));

// Mock the AuthAvatarServer component
jest.mock('../auth-avatar', () => {
  return {
    __esModule: true,
    AuthAvatarServer: jest.fn(({ size }) => (
      <div data-testid={AVATAR_SELECTORS.CONTAINER}>
        Mock AuthAvatarServer: {size}
      </div>
    ))
  };
});

describe('NavbarBrand', () => {
  it('renders AuthAvatarServer with correct size', async () => {
    render(await NavbarBrand());

    const avatarElement = await screen.findByTestId(AVATAR_SELECTORS.CONTAINER);
    expect(avatarElement).toBeInTheDocument();
    expect(avatarElement).toHaveTextContent('Mock AuthAvatarServer: sm');
  });
});
