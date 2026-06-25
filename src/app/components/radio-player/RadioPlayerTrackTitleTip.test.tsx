import { fireEvent, render, screen } from '@testing-library/react';
import { RadioPlayerTrackTitleTip } from './RadioPlayerTrackTitleTip';

describe('RadioPlayerTrackTitleTip', () => {
  test('when the track title is clicked, a full-title dialog opens without using the native title attribute', () => {
    const trackDisplay =
      'Solas — Am I Born to Die? (Live at Red Rocks, extended edition with very long subtitle)';

    render(<RadioPlayerTrackTitleTip trackDisplay={trackDisplay} className="subtitle" />);

    const trigger = screen.getByTestId('radio-track-title-trigger');
    expect(trigger).not.toHaveAttribute('title');
    expect(screen.queryByTestId('radio-track-title-tip')).not.toBeInTheDocument();

    fireEvent.click(trigger);

    const tip = screen.getByTestId('radio-track-title-tip');
    expect(tip).toHaveTextContent(trackDisplay);
    expect(tip).toHaveAttribute('role', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('when Escape is pressed, the full-title dialog closes', () => {
    render(<RadioPlayerTrackTitleTip trackDisplay="Artist — Song" />);

    fireEvent.click(screen.getByTestId('radio-track-title-trigger'));
    expect(screen.getByTestId('radio-track-title-tip')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('radio-track-title-tip')).not.toBeInTheDocument();
  });
});
