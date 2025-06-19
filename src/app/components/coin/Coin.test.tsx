import { cleanup, render } from '@testing-library/react';
import { COIN_SELECTORS } from '../../../lib/test-selectors/components/coin.selectors';
import Coin, { CoinPropsSize } from './Coin';

jest.mock('../avatar/Avatar', () => ({
  Avatar: function MockedAvatar() {
    return <div>Mocked Avatar</div>;
  }
}));

describe('Coin Component', () => {
  const renderCoin = (seed: string, size?: CoinPropsSize) =>
    render(<Coin seed={seed} size={size} />);

  afterEach(cleanup);

  it.each`
    size      | expectedClass
    ${'lg'}   | ${'lg'}
    ${'full'} | ${'full'}
    ${'md'}   | ${'md'}
    ${'sm'}   | ${'sm'}
  `('should render with size $size', ({ size, expectedClass }) => {
    const { getByTestId } = renderCoin('John Doe', size);
    expect(getByTestId(COIN_SELECTORS.FRONT)).toHaveClass(expectedClass);
  });

  it.each`
    name          | expectedInitials
    ${'John Doe'} | ${'JD'}
    ${'John'}     | ${'JN'}
  `(
    'should display initials correctly for $name',
    ({ name, expectedInitials }) => {
      const { getByTestId } = renderCoin(name);
      expect(getByTestId(COIN_SELECTORS.HEADER)).toHaveTextContent(
        expectedInitials
      );
    }
  );

  it('should render Avatar component with correct props', () => {
    const { getByText } = renderCoin('John Doe', 'lg');
    expect(getByText('Mocked Avatar')).toBeInTheDocument();
  });
});
