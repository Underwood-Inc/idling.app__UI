// AppVersion.test.tsx
import { render } from '@testing-library/react';
import { APP_VERSION_SELECTORS } from 'src/lib/test-selectors/components/app-version.selectors';
import AppVersion from './AppVersion';

// Make sure getConfig is automatically mocked
jest.mock('next/config');

describe('AppVersion component', () => {
  it('renders without errors', () => {
    render(<AppVersion />);
  });

  it('displays the correct version', () => {
    const { getByTestId } = render(<AppVersion />);
    const versionElement = getByTestId(APP_VERSION_SELECTORS.ANCHOR);
    // auto-mock from <root_dir>/__mocks__/next/config.js
    expect(versionElement).toBeInTheDocument().toHaveTextContent('1.2.3');
  });

  it('links to the GitHub repository', () => {
    const { getByTestId } = render(<AppVersion />);
    const linkElement = getByTestId(APP_VERSION_SELECTORS.ANCHOR);
    expect(linkElement).toHaveAttribute(
      'href',
      'https://github.com/Underwood-Inc/idling.app__UI'
    );
  });
});
