import { render, screen } from '@testing-library/react';
import { NAV_PATHS_SELECTORS } from 'src/lib/test-selectors/components/nav-paths.selectors';
import { NavbarItem } from './NavbarItem';

describe('NavbarItem', () => {
  it('renders children correctly', () => {
    render(<NavbarItem>Test Content</NavbarItem>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default class and test ID', () => {
    render(<NavbarItem>Test</NavbarItem>);
    const item = screen.getByTestId(NAV_PATHS_SELECTORS.ITEM);
    expect(item).toHaveClass('navbar__item');
  });

  it('applies custom class when provided', () => {
    render(<NavbarItem className="custom-class">Test</NavbarItem>);
    const item = screen.getByTestId(NAV_PATHS_SELECTORS.ITEM);
    expect(item).toHaveClass('navbar__item');
    expect(item).toHaveClass('custom-class');
  });

  it('sets aria-disabled attribute when isDisabled is true', () => {
    render(<NavbarItem isDisabled>Test</NavbarItem>);
    const item = screen.getByTestId(NAV_PATHS_SELECTORS.ITEM);
    expect(item).toHaveAttribute('aria-disabled', 'true');
  });

  it('uses custom testId when provided', () => {
    render(<NavbarItem testId="custom-test-id">Test</NavbarItem>);
    expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
  });
});
