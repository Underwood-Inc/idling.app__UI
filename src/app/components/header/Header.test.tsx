import { render, screen } from '@testing-library/react';
import Header from './Header';

// Mock the Nav component
jest.mock('../nav/Nav', () => {
  return function MockNav() {
    return <div data-testid="mock-nav">Mock Nav</div>;
  };
});

describe('Header', () => {
  it('renders without crashing', async () => {
    render(await Header());
  });

  it('has the correct CSS class', async () => {
    const { container } = render(await Header());
    expect(container.firstChild).toHaveClass('header');
  });

  it('renders the Nav component', async () => {
    render(await Header());
    const navElement = screen.getByTestId('mock-nav');
    expect(navElement).toBeInTheDocument();
  });

  it('is wrapped in a header tag', async () => {
    const { container } = render(await Header());
    expect(container.firstChild?.nodeName).toBe('HEADER');
  });
});
