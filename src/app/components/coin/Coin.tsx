'use client';
import { COIN_SELECTORS } from '@lib/test-selectors/components/coin.selectors';
import { Avatar } from '../avatar/Avatar';
import './Coin.css';

export type CoinPropsSize = 'full' | 'lg' | 'md' | 'sm';

export default function Coin({
  seed,
  size = 'lg'
}: {
  seed: string;
  size?: CoinPropsSize;
}) {
  const getInitials = () => {
    const hasSpaces = seed.includes(' ');

    if (hasSpaces) {
      const [first, second] = seed.split(' ');
      return first[0] + second[0];
    }

    return `${seed[0]}${seed[seed.length - 1]}`.toUpperCase();
  };

  const initials = getInitials();

  return (
    <div className="coin">
      <div
        className={`coin__front zoomed ${size}`}
        data-testid={COIN_SELECTORS.FRONT}
      >
        <p className="coin__header" data-testid={COIN_SELECTORS.HEADER}>
          {initials}
        </p>
        <div className="coin__body" data-testid={COIN_SELECTORS.BODY}>
          <Avatar seed={seed} size={size} />
        </div>
        <p className="coin__footer" data-testid={COIN_SELECTORS.FOOTER}>
          {initials}
        </p>
      </div>
      <div
        className={`coin__back shrunk ${size}`}
        data-testid={COIN_SELECTORS.BACK}
      >
        BACK
      </div>
    </div>
  );
}
