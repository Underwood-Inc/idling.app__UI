import { render, screen } from '@testing-library/react';
import React from 'react';
import { auth } from '../../../lib/auth';
import { AVATAR_SELECTORS } from '../../../lib/test-selectors/components/avatar.selectors';
import { NavbarBrand } from './NavbarBrand';

// Mock the auth module
jest.mock('../../../lib/auth', () => ({
  auth: jest.fn()
}));

// Mock the Avatar component
jest.mock('../avatar/Avatar', () => {
  return {
    __esModule: true,
    default: jest.fn(({ seed, size }) => (
      <div data-testid={AVATAR_SELECTORS.CONTAINER}>
        Mock Avatar: {seed}, {size}
      </div>
    ))
  };
});

describe('NavbarBrand', () => {
  it('renders Avatar with user name when session exists', async () => {
    const mockSession = { user: { name: 'Test User' } };
    (auth as jest.Mock).mockResolvedValue(mockSession);

    render(await NavbarBrand());

    const avatarElement = await screen.findByTestId(AVATAR_SELECTORS.CONTAINER);
    expect(avatarElement).toBeInTheDocument();
    expect(avatarElement).toHaveTextContent('Mock Avatar: Test User, sm');
  });

  it('renders Avatar with undefined seed when no session exists', async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    render(await NavbarBrand());

    const avatarElement = await screen.findByTestId(AVATAR_SELECTORS.CONTAINER);
    expect(avatarElement).toBeInTheDocument();
    expect(avatarElement).toHaveTextContent('Mock Avatar: , sm');
  });
});
