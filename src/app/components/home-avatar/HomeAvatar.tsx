import { adventurer } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { Suspense } from "react";
import "./HomeAvatar.css";
import Loading from "./loader";

async function getAvatar() {
  return await createAvatar(adventurer, {
    seed: new Date().getTime().toString(),
  }).toDataUri();
}

const Avatar = async () => {
  const avatar = await getAvatar();

  return <img src={avatar} className="create-avatar" alt="avatar" />;
};

const HomeAvatar = () => {
  return (
    <div>
      <Suspense fallback={<Loading />}>
        <Avatar />
      </Suspense>
    </div>
  );
};

export default HomeAvatar;
