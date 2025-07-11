import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { useAtom } from 'jotai';
import { Avatar } from './Avatar';

// Mock the avatar cache atom
const mockAvatarCache = {};
const mockSetAvatarCache = jest.fn();

jest.mock('jotai', () => ({
  useAtom: jest.fn(),
  atom: jest.fn()
}));

// @dicebear/core and @dicebear/collection are automatically mocked by Jest from __mocks__/ directory

describe('Avatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAtom as jest.Mock).mockReturnValue([
      mockAvatarCache,
      mockSetAvatarCache
    ]);
  });

  it('renders loading state when avatar is not ready', () => {
    // Mock createAvatar to return null to simulate loading state
    const { createAvatar } = require('@dicebear/core');
    (createAvatar as jest.Mock).mockReturnValueOnce({
      toDataUri: jest.fn().mockReturnValue(null)
    });

    render(<Avatar />);
    expect(screen.getByTestId('avatar-loading')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-loading')).toHaveClass('avatar--loading');
  });

  it('renders avatar image when ready', () => {
    render(<Avatar seed="test-seed" />);
    const avatarDiv = screen.getByTestId('avatar');
    const img = avatarDiv.querySelector('img');
    expect(img).toHaveClass('avatar__img', 'md');
    expect(avatarDiv).toHaveClass('avatar', 'md');
  });

  it('applies correct size class', () => {
    render(<Avatar seed="test-seed" size="lg" />);
    const avatarDiv = screen.getByTestId('avatar');
    const img = avatarDiv.querySelector('img');
    expect(img).toHaveClass('avatar__img', 'lg');
    expect(avatarDiv).toHaveClass('avatar', 'lg');
  });
});
