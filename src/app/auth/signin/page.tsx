import { getServerSession } from "next-auth";
import { getProviders } from "next-auth/react";
import { redirect } from "next/navigation";
import { SignIn } from "../../components/auth-buttons/AuthButtons";

export default async function Page() {
  const session = await getServerSession();
  const providers = await getProviders();

  if (session) {
    redirect("/");
  }

  if (!providers) {
    return <div>Sign in is not available</div>;
  }

  return <SignIn providers={providers} />;
}
