import { redirect } from 'next/navigation';
import { auth } from '../../../lib/auth';
import { NAV_PATHS } from '../../../lib/routes';
import {
  SignIn,
  SignInProviders
} from '../../components/auth-buttons/AuthButtons';
import './page.css';

export default async function Page({
  searchParams
}: {
  searchParams: Record<string, string>;
}) {
  const session = await auth();
  let providers: SignInProviders[] = ['twitch', 'google'];

  if (session && searchParams.redirect) {
    redirect(searchParams.redirect);
  } else if (session && !searchParams.redirect) {
    redirect(NAV_PATHS.ROOT);
  }

  return (
    <article className="signin__container">
      {providers.map((provider) => (
        <SignIn key={provider} provider={provider} />
      ))}
    </article>
  );
}
