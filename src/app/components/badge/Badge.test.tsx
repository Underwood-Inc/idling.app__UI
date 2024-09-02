import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { BADGE_SELECTORS } from 'src/lib/test-selectors/components/badge';
import BadgeWrapper from './Badge';

describe('BadgeWrapper', () => {
  it('renders children and badge content', () => {
    render(
      <BadgeWrapper badgeContent="3" showOnHover={false}>
        <div>Child content</div>
      </BadgeWrapper>
    );

    expect(screen.getByTestId(BADGE_SELECTORS.CONTENT)).toBeInTheDocument();
    expect(screen.getByTestId(BADGE_SELECTORS.CONTENT)).toHaveTextContent('3');
  });

  it('applies correct classes when showOnHover is true', () => {
    render(
      <BadgeWrapper badgeContent="4" showOnHover={true}>
        <div>Child content</div>
      </BadgeWrapper>
    );

    expect(screen.getByTestId(BADGE_SELECTORS.CONTAINER)).toHaveClass(
      'badge__container--hover'
    );
  });

  it('applies correct classes when showOnHover is false', () => {
    render(
      <BadgeWrapper badgeContent="5" showOnHover={false}>
        <div>Child content</div>
      </BadgeWrapper>
    );

    expect(screen.getByTestId(BADGE_SELECTORS.CONTAINER)).toHaveClass(
      'badge__container'
    );
    expect(screen.getByTestId(BADGE_SELECTORS.CONTAINER)).not.toHaveClass(
      'badge__container--hover'
    );
  });

  it('applies cursor--pointer class when onClick is provided', () => {
    const onClick = jest.fn();
    render(
      <BadgeWrapper badgeContent="6" showOnHover={false} onClick={onClick}>
        <div>Child content</div>
      </BadgeWrapper>
    );

    expect(screen.getByTestId(BADGE_SELECTORS.CONTENT)).toHaveClass(
      'cursor--pointer'
    );
  });

  it('does not apply cursor--pointer class when onClick is not provided', () => {
    render(
      <BadgeWrapper badgeContent="7" showOnHover={false}>
        <div>Child content</div>
      </BadgeWrapper>
    );

    expect(screen.getByTestId(BADGE_SELECTORS.CONTENT)).not.toHaveClass(
      'cursor--pointer'
    );
  });

  it('calls onClick when badge content is clicked', () => {
    const onClick = jest.fn();
    render(
      <BadgeWrapper badgeContent="8" showOnHover={false} onClick={onClick}>
        <div>Child content</div>
      </BadgeWrapper>
    );

    fireEvent.click(screen.getByTestId(BADGE_SELECTORS.CONTENT));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('prevents default event when badge content is clicked', () => {
    const onClick = jest.fn();
    render(
      <BadgeWrapper badgeContent="9" showOnHover={false} onClick={onClick}>
        <div>Child content</div>
      </BadgeWrapper>
    );

    const badgeElement = screen.getByTestId(BADGE_SELECTORS.CONTENT);
    const preventDefaultSpy = jest.spyOn(Event.prototype, 'preventDefault');

    fireEvent.click(badgeElement);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);

    preventDefaultSpy.mockRestore();
  });
});
