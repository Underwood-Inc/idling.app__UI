import { fireEvent, render, screen } from '@testing-library/react';
import { RADIO_EN } from '$i18n-source/radio.en';
import { RadioPlayerSongSaveButton } from './RadioPlayerSongSaveButton';

describe('RadioPlayerSongSaveButton', () => {
  test('when the visitor is signed out, the song bookmark is faded and the hover tip asks them to sign in', () => {
    render(<RadioPlayerSongSaveButton signedIn={false} saved={false} onToggle={() => undefined} />);

    const button = screen.getByTestId('radio-save-song');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-label', RADIO_EN.aria.signInToFavoriteSongs);
    expect(screen.getByTestId('radio-save-song-tip')).toHaveAttribute(
      'title',
      RADIO_EN.aria.signInToFavoriteSongs
    );
  });

  test('when the visitor is signed in, the bookmark can save the song', () => {
    const onToggle = vi.fn();
    render(<RadioPlayerSongSaveButton signedIn saved={false} onToggle={onToggle} />);

    fireEvent.click(screen.getByTestId('radio-save-song'));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(screen.getByTestId('radio-save-song')).toHaveAttribute('aria-label', RADIO_EN.aria.saveSong);
  });
});
