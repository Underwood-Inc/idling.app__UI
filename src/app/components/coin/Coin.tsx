'use client';
import Avatar from '../avatar/Avatar';
import './Coin.css';

export default function Coin({
  seed,
  size = 'lg'
}: {
  seed: string;
  size?: 'full' | 'lg' | 'md' | 'sm';
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
      <div className={`coin__front zoomed ${size}`}>
        <p className="coin__header">{initials}</p>
        <div className="coin__body">
          <Avatar seed={seed} size={size} />
        </div>
        <p className="coin__footer">{initials}</p>
      </div>
      <div className={`coin__back shrunk ${size}`}>BACK</div>
    </div>
  );
}
