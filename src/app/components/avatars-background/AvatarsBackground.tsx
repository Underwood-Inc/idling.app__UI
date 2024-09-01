import React from 'react';
import { makeid } from '../../../lib/utils/string/make-id';
import Avatar from '../avatar/Avatar';
import './AvatarsBackground.css';

export function AvatarsBackground() {
  const avatars = React.useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      key: `avatar__${i}`,
      seed: makeid(15)
    }));
  }, []);

  return (
    <section className="avatar__background-container">
      <div className="avatar__background">
        {avatars.map(({ key, seed }) => (
          <div key={key} className="avatar__background_avatar">
            <Avatar seed={seed} />
          </div>
        ))}
      </div>
    </section>
  );
}
