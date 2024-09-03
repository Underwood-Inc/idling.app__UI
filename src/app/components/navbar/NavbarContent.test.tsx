import { render, screen } from '@testing-library/react';
import { NavbarContent } from './NavbarContent';

describe('NavbarContent', () => {
  it('renders children correctly', () => {
    render(
      <NavbarContent justify="center">
        <span>Test Content</span>
      </NavbarContent>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies correct className based on justify prop', () => {
    const { container } = render(
      <NavbarContent justify="space-between">
        <span>Test Content</span>
      </NavbarContent>
    );
    expect(container.firstChild).toHaveClass(
      'navbar__content--jc-space-between'
    );
  });

  it('applies additional className when provided', () => {
    const { container } = render(
      <NavbarContent justify="center" className="custom-class">
        <span>Test Content</span>
      </NavbarContent>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders without justify prop', () => {
    const { container } = render(
      <NavbarContent justify="inherit">
        <span>Test Content</span>
      </NavbarContent>
    );
    expect(container.firstChild).toHaveClass('navbar__content--jc-inherit');
  });

  it('renders without additional class when justify is an empty string', () => {
    const { container } = render(
      // @ts-expect-error
      <NavbarContent justify="">
        <span>Test Content</span>
      </NavbarContent>
    );
    expect(container.firstChild).toHaveClass('navbar__content');
    expect(container.firstChild).not.toHaveClass('navbar__content--jc-');
  });
});
