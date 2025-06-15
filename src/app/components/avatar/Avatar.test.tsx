import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { useAtom } from 'jotai';
import { AVATAR_SELECTORS } from '../../../lib/test-selectors/components/avatar.selectors';
import Avatar from './Avatar';

// Mock the avatar cache atom
const mockAvatarCache = {};
jest.mock('jotai', () => ({
  useAtom: jest.fn(),
  atom: jest.fn()
}));

// Mock @dicebear/core
jest.mock('@dicebear/core', () => ({
  createAvatar: jest.fn().mockReturnValue({
    toDataUri: jest.fn().mockResolvedValue('data:image/svg+xml;base64,mock')
  })
}));

// Mock @dicebear/collection
jest.mock('@dicebear/collection', () => ({
  adventurer: {
    create: jest.fn().mockReturnValue({
      toDataUriSync: jest.fn().mockReturnValue('data:image/svg+xml;base64,mock')
    })
  }
}));

describe('Avatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAtom as jest.Mock).mockReturnValue([mockAvatarCache, jest.fn()]);
  });

  it('renders loader when avatar is not ready', () => {
    render(<Avatar />);
    expect(screen.getByTestId(AVATAR_SELECTORS.CONTAINER)).toBeInTheDocument();
  });

  it('renders avatar image when ready', async () => {
    render(<Avatar seed="test-seed" />);
    const img = await screen.findByTestId(AVATAR_SELECTORS.IMAGE);
    expect(img).toHaveClass('avatar__img', 'md');
  });

  it('applies correct size class', async () => {
    render(<Avatar seed="test-seed" size="full" />);
    const img = await screen.findByTestId(AVATAR_SELECTORS.IMAGE);
    expect(img).toHaveClass('avatar__img', 'full');
  });
});
