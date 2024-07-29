import { redirect } from 'next/navigation';
import { auth } from '../../../lib/auth';
import { SignIn } from '../../components/auth-buttons/AuthButtons';

export default async function Page({
  searchParams
}: {
  searchParams: Record<string, string>;
}) {
  const session = await auth();

  if (session && searchParams.redirect) {
    redirect(searchParams.redirect);
  } else if (session && !searchParams.redirect) {
    redirect('/');
  }

  return <SignIn />;
}
