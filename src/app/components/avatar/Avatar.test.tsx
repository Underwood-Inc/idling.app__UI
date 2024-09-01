import '@testing-library/jest-dom';
import { act, cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { AVATAR_SELECTORS } from 'src/lib/test-selectors/components/avatar.selectors';
import Avatar, { AvatarPropSizes } from './Avatar';

jest.mock('@dicebear/core', () => ({
  createAvatar: jest.fn(() => ({ toDataUriSync: () => 'mocked-avatar-url' }))
}));
jest.mock('@dicebear/collection', () => ({ adventurer: {} }));

describe('Avatar', () => {
  beforeEach(jest.clearAllMocks);

  it('renders loader when image is not ready', () => {
    jest
      .spyOn(React, 'useState')
      .mockImplementationOnce(() => [null, jest.fn()]);
    render(<Avatar />);
    expect(screen.getByTestId(AVATAR_SELECTORS.LOADER)).toBeInTheDocument();
  });

  it('renders avatar image when ready', async () => {
    await act(async () => {
      render(<Avatar seed="test-seed" />);
    });
    const img = screen.getByAltText('avatar');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'mocked-avatar-url');
    expect(img).toHaveClass('avatar__img md');
  });

  it('uses provided seed or generates random seed', async () => {
    const { createAvatar } = require('@dicebear/core');
    const dateSpy = jest
      .spyOn(Date.prototype, 'getTime')
      .mockReturnValue(123456);

    await act(async () => {
      render(<Avatar seed="custom-seed" />);
    });
    expect(createAvatar.mock.calls[0][1].seed).toBe('custom-seed');

    await act(async () => {
      render(<Avatar />);
    });
    expect(createAvatar.mock.calls[1][1].seed).toBe('123456');

    dateSpy.mockRestore();
  });

  it('applies correct size class for all available sizes', async () => {
    const sizes: AvatarPropSizes[] = ['full', 'lg', 'md', 'sm'];

    for (const size of sizes) {
      await act(async () => {
        render(<Avatar size={size} />);
      });

      const img = screen.getByAltText('avatar');
      expect(img).toHaveClass(`avatar__img ${size}`);

      // Clean up after each render
      cleanup();
    }
  });
});
