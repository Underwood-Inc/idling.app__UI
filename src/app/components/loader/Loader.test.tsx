import { render, screen } from '@testing-library/react';
import { LOADER_SELECTORS } from 'src/lib/test-selectors/components/loader.selectors';
import Loader from './Loader';

describe('Loader', () => {
  it('renders with default props', () => {
    render(<Loader />);
    expect(screen.getByText('Loading Data...')).toBeInTheDocument();
    expect(screen.getByTestId(LOADER_SELECTORS.LOADER)).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<Loader label="Custom Loading..." />);
    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    expect(screen.getByTestId(LOADER_SELECTORS.LOADER)).toBeInTheDocument();
  });

  it('renders without label when label prop is empty', () => {
    render(<Loader label="" />);
    expect(screen.queryByText('Loading Data...')).not.toBeInTheDocument();
    expect(screen.getByTestId(LOADER_SELECTORS.LOADER)).toBeInTheDocument();
  });
});
