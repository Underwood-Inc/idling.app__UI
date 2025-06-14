import React from 'react';
import { makeid } from '../../../lib/utils/string/make-id';
import Avatar from '../avatar/Avatar';
import './AvatarsBackground.css';

// Create stable avatar data outside the component
const AVATAR_DATA = Array.from({ length: 10 }, (_, i) => ({
  key: `avatar__${i}`,
  seed: makeid(15)
}));

export const AvatarsBackground = React.memo(function AvatarsBackground() {
  return (
    <section className="avatar__background-container">
      <div className="avatar__background">
        {AVATAR_DATA.map(({ key, seed }) => (
          <div key={key} className="avatar__background_avatar">
            <Avatar seed={seed} />
          </div>
        ))}
      </div>
    </section>
  );
});
