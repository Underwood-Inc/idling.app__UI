import { redirect } from 'next/navigation';
import { auth } from '../../../../auth';
import { SignIn } from '../../components/auth-buttons/AuthButtons';

export default async function Page() {
  const session = await auth();

  if (session) {
    redirect('/');
  }

  return <SignIn />;
}
