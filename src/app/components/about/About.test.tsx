import { render } from '@testing-library/react';
import { About } from './About';

describe('Page', () => {
  it('renders the about page', () => {
    render(<About />);
  });
});
