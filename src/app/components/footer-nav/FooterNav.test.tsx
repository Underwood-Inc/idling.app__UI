import { render, screen } from '@testing-library/react';
import FooterNav from './FooterNav';

// Mock the GitLabLink component
jest.mock('../gitlab-link/GitLabLink', () => ({
  GitLabLink: () => <div data-testid="mock-gitlab-link">GitLab Link</div>
}));

describe('FooterNav', () => {
  beforeEach(() => {
    render(<FooterNav />);
  });

  it('renders the component with correct structure and classes', () => {
    const container = screen.getByRole('list').parentElement;
    const listItems = screen.getAllByRole('listitem');

    expect(screen.getByRole('list')).toHaveClass('footer-nav__list');
    expect(container).toHaveClass('footer-nav__container');
    expect(listItems).toHaveLength(1);
  });

  it('renders the GitLabLink component', () => {
    expect(screen.getByTestId('mock-gitlab-link')).toBeInTheDocument();
  });
});
