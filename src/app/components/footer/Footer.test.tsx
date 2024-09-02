import { render } from '@testing-library/react';
import Footer from './Footer';

jest.mock('../app-version/AppVersion', () => {
  const MockedAppVersion = () => <div>Mocked AppVersion</div>;
  MockedAppVersion.displayName = 'MockedAppVersion';
  return MockedAppVersion;
});

jest.mock('../footer-nav/FooterNav', () => {
  const MockedFooterNav = () => <div>Mocked FooterNav</div>;
  MockedFooterNav.displayName = 'MockedFooterNav';
  return MockedFooterNav;
});

describe('Footer', () => {
  it('should render the footer component', () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('.footer')).toBeInTheDocument();
  });

  it('should render the AppVersion component', () => {
    const { getByText } = render(<Footer />);
    expect(getByText('Mocked AppVersion')).toBeInTheDocument();
  });

  it('should render the FooterNav component', () => {
    const { getByText } = render(<Footer />);
    expect(getByText('Mocked FooterNav')).toBeInTheDocument();
  });
});
