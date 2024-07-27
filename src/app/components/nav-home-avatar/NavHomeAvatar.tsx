import { auth } from '../../../../auth';
import Avatar from '../avatar/Avatar';

export default async function NavHomeAvatar() {
  const session = await auth();
  let seed = '';

  if (session) {
    const { user } = session;
    seed = user?.name || seed;
  }

  return (
    <>
      <Avatar seed={seed} />
      <h3>Idling.app</h3>
    </>
  );
}
