import { render, screen } from '@testing-library/react';
import { GAME_WRAPPER_SELECTORS } from 'src/lib/test-selectors/components/game-wrapper.selectors';
import { GameWrapper } from './GameWrapper';

// Mock the next/script component
jest.mock('next/script', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-sync-scripts
  default: jest.fn().mockImplementation(({ src }) => <script src={src} />)
}));

describe('GameWrapper', () => {
  it('renders the game canvas', () => {
    render(<GameWrapper />);
    const canvas = screen.getByTestId(GAME_WRAPPER_SELECTORS.CANVAS);
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '864');
    expect(canvas).toHaveAttribute('height', '648');
  });

  it('renders the fallback message for unsupported browsers', () => {
    render(<GameWrapper />);
    const fallbackMessage = screen.getByText(
      "Your browser doesn't support HTML5 canvas."
    );
    expect(fallbackMessage).toBeInTheDocument();
  });
});
