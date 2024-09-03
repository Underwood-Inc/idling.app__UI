import { render, screen } from '@testing-library/react';
import { EMPTY_SELECTORS } from 'src/lib/test-selectors/components/empty.selectors';
import Empty from './Empty';

describe('Empty component', () => {
  test('renders with default label', () => {
    render(<Empty label="" />);
    expect(screen.getByTestId(EMPTY_SELECTORS.CONTAINER)).toBeInTheDocument();
  });

  test('renders with provided label', () => {
    const label = 'No Data';
    render(<Empty label={label} />);
    const labelElement = screen.getByTestId(EMPTY_SELECTORS.LABEL);
    expect(labelElement).toBeInTheDocument();
    expect(labelElement).toHaveTextContent('＞︿＜');
  });

  test('renders label with line break', () => {
    const label = 'No Data';
    render(<Empty label={label} />);
    const lineBreak = screen.getByText(
      (content, element) => element?.tagName.toLowerCase() === 'br'
    );
    expect(lineBreak).toBeInTheDocument();
  });

  test('renders with default empty label', () => {
    // @ts-expect-error
    render(<Empty />);
    const labelElement = screen.getByTestId(EMPTY_SELECTORS.LABEL);
    expect(labelElement).toHaveTextContent('＞︿＜');
  });
});
