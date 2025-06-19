import React, { useMemo } from 'react';
import { makeid } from '../../../lib/utils/string/make-id';
import { Avatar } from '../avatar/Avatar';
import './AvatarsBackground.css';

// Generate stable seeds outside of component to prevent regeneration
const STABLE_AVATAR_DATA = Array.from({ length: 10 }, (_, i) => ({
  key: `avatar__${i}`,
  seed: `background-${i}-${makeid(8)}`
}));

export const AvatarsBackground = React.memo(function AvatarsBackground() {
  // Use stable seeds that don't change on re-render
  const AVATAR_DATA = useMemo(() => STABLE_AVATAR_DATA, []);

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
