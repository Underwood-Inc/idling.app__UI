import { render, screen } from '@testing-library/react';
import { RADIO_EN } from '$i18n-source/radio.en';
import { RadioPlayerViewSavedSongsButton } from './RadioPlayerViewSavedSongsButton';

describe('RadioPlayerViewSavedSongsButton', () => {
  test('the saved songs view button stays, without a favorites count badge', () => {
    render(<RadioPlayerViewSavedSongsButton expanded={false} onClick={() => undefined} />);

    const button = screen.getByTestId('radio-view-saved-songs');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', RADIO_EN.aria.viewSavedSongs);
    expect(button.textContent?.replace(/\s/g, '')).toBe('');
    expect(screen.queryByTestId('radio-view-saved-songs-count')).not.toBeInTheDocument();
  });
});
