import { render, screen } from '@testing-library/react';
import { Navbar } from './Navbar';

// Mock the NavbarBrand component
jest.mock('./NavbarBrand', () => ({
  NavbarBrand: () => <div data-testid="mocked-navbar-brand">Mocked Brand</div>
}));

// Mock the auth function
jest.mock('../../../lib/auth', () => ({
  auth: jest.fn(() => Promise.resolve({ user: { name: 'Test User' } }))
}));

describe('Navbar', () => {
  it('renders Navbar component with children', () => {
    render(
      <Navbar>
        <div data-testid="navbar-child">Navbar content</div>
      </Navbar>
    );
    expect(screen.getByTestId('navbar-child')).toBeInTheDocument();
  });

  it('renders Navbar with all subcomponents', async () => {
    render(
      <Navbar>
        <Navbar.Brand />
        <Navbar.Body>
          <Navbar.Content justify="flex-start">
            <Navbar.Item>Item 1</Navbar.Item>
            <Navbar.Item>Item 2</Navbar.Item>
          </Navbar.Content>
        </Navbar.Body>
      </Navbar>
    );

    expect(
      await screen.findByTestId('mocked-navbar-brand')
    ).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    render(<Navbar>Test</Navbar>);
    const navElement = screen.getByRole('navigation');
    expect(navElement).toHaveClass('navbar__container');
  });
});
