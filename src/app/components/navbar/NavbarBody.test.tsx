import { render } from '@testing-library/react';
import { NavbarBody } from './NavbarBody';

describe('NavbarBody', () => {
  it('renders children and applies default class', () => {
    const { container } = render(
      <NavbarBody>
        <span>Test content</span>
      </NavbarBody>
    );

    const bodyElement = container.firstChild as HTMLElement;
    expect(bodyElement).toHaveClass('navbar__body');
    expect(bodyElement).toHaveTextContent('Test content');
  });

  it('applies additional className when provided', () => {
    const { container } = render(
      <NavbarBody className="custom-class">
        <span>Test content</span>
      </NavbarBody>
    );

    const bodyElement = container.firstChild as HTMLElement;
    expect(bodyElement).toHaveClass('navbar__body');
    expect(bodyElement).toHaveClass('custom-class');
  });
});
