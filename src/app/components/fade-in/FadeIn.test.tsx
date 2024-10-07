import { render, screen } from '@testing-library/react';
import { FADE_IN_SELECTORS } from 'src/lib/test-selectors/components/fade-in.selectors';
import FadeIn, { DisplayType } from './FadeIn';

describe('FadeIn Component', () => {
  it('renders children correctly', () => {
    render(<FadeIn>Test Content</FadeIn>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies the fade-in class', () => {
    render(<FadeIn>Test Content</FadeIn>);
    const element = screen.getByText('Test Content');
    expect(element).toHaveClass('fade-in');
  });

  it('applies the visible class after mount', () => {
    jest.useFakeTimers();
    render(<FadeIn>Test Content</FadeIn>);
    const element = screen.getByText('Test Content');
    jest.runAllTimers();
    expect(element).toHaveClass('visible');
  });

  it('applies additional class names', () => {
    render(<FadeIn className="additional-class">Test Content</FadeIn>);
    const element = screen.getByText('Test Content');
    expect(element).toHaveClass('additional-class');
  });

  it('renders as a div by default', () => {
    render(<FadeIn>Test Content</FadeIn>);
    const element = screen.getByText('Test Content');
    expect(element.tagName).toBe('DIV');
    expect(element).toHaveAttribute('data-testid', FADE_IN_SELECTORS.DIV);
  });

  it('renders as a span when display is span', () => {
    render(<FadeIn display={DisplayType.SPAN}>Test Content</FadeIn>);
    const element = screen.getByText('Test Content');
    expect(element.tagName).toBe('SPAN');
    expect(element).toHaveAttribute('data-testid', FADE_IN_SELECTORS.SPAN);
  });

  it('renders as a p when display is p', () => {
    render(<FadeIn display={DisplayType.P}>Test Content</FadeIn>);
    const element = screen.getByText('Test Content');
    expect(element.tagName).toBe('P');
    expect(element).toHaveAttribute('data-testid', FADE_IN_SELECTORS.P);
  });

  it('renders as a code when display is code', () => {
    render(<FadeIn display={DisplayType.CODE}>Test Content</FadeIn>);
    const element = screen.getByText('Test Content');
    expect(element.tagName).toBe('CODE');
    expect(element).toHaveAttribute('data-testid', FADE_IN_SELECTORS.CODE);
  });

  it('renders as a li when display is li', () => {
    render(<FadeIn display={DisplayType.LI}>Test Content</FadeIn>);
    const element = screen.getByText('Test Content');
    expect(element.tagName).toBe('LI');
    expect(element).toHaveAttribute('data-testid', FADE_IN_SELECTORS.LI);
  });
});
