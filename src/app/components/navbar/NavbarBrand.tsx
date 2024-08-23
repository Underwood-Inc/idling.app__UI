import { auth } from '../../../lib/auth';
import Avatar from '../avatar/Avatar';

export async function NavbarBrand() {
  const session = await auth();

  return <Avatar seed={session?.user?.name || undefined} size="sm" />;
}
