import { auth } from "../../../../auth";
import HomeAvatar from "../home-avatar/HomeAvatar";

export default async function NavHomeAvatar() {
  const session = await auth();
  let seed = "";

  if (session) {
    const { user } = session;
    seed = user?.name || seed;
  }

  return (
    <>
      <HomeAvatar seed={seed} />
      <h3>Idling.app</h3>
    </>
  );
}
