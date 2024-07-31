import Link from 'next/link';
import { auth } from '../../../lib/auth';
import { NAV_PATHS } from '../../../lib/routes';
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
      <Link href={NAV_PATHS.ROOT}>
        <h3>Idling.app</h3>
      </Link>
    </>
  );
}
