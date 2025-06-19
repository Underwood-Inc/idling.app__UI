import { render, screen } from '@testing-library/react';
import { NavbarBrand } from './NavbarBrand';

// Mock the auth module
jest.mock('../../../lib/auth', () => ({
  auth: jest.fn()
}));

// Mock the AuthAvatar component (correct component name)
jest.mock('../auth-avatar', () => ({
  AuthAvatar: jest.fn(({ size }) => (
    <div data-testid="auth-avatar">Mock AuthAvatar: {size}</div>
  ))
}));

describe('NavbarBrand', () => {
  it('renders AuthAvatar with correct size', () => {
    render(<NavbarBrand />);

    const avatarElement = screen.getByTestId('auth-avatar');
    expect(avatarElement).toBeInTheDocument();
    expect(avatarElement).toHaveTextContent('Mock AuthAvatar: sm');
  });
});
