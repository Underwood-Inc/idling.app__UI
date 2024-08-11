import { makeid } from '../../../lib/utils/string/make-id';
import Avatar from '../avatar/Avatar';
import './AvatarsBackground.css';

export function AvatarsBackground() {
  const renderAvatars = () => {
    const avatars = [];

    for (let i = 0; i < 10; i++) {
      avatars.push(
        <div key={`avatar__${i}`} className="avatar__background_avatar">
          <Avatar seed={makeid(15)} />
        </div>
      );
    }

    return avatars.map((avatar) => avatar);
  };

  return (
    <section className="avatar__background-container">
      <div className="avatar__background">{renderAvatars()}</div>
    </section>
  );
}
