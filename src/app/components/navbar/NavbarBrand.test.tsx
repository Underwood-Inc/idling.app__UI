import { render, screen } from '@testing-library/react';
import { NavbarBrand } from './NavbarBrand';

// Mock the AuthAvatar component
jest.mock('../auth-avatar', () => ({
  AuthAvatar: jest.fn(({ size }) => (
    <div data-testid="auth-avatar">Mock AuthAvatar: {size}</div>
  ))
}));

describe('NavbarBrand', () => {
  it('renders default avatar when unauthenticated', () => {
    render(<NavbarBrand />);

    const avatarElement = screen.getByLabelText('Default user avatar');
    expect(avatarElement).toBeInTheDocument();
    expect(avatarElement).toHaveClass('navbar-brand__avatar--default');
  });
});
