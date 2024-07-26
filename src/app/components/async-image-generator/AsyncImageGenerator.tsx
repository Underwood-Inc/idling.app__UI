import { adventurer } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";

export const AsyncImageGenerator = async () => {
  const img = await createAvatar(adventurer, {
    seed: new Date().getTime().toString(),
  }).toDataUriSync();

  return <img src={img} className="home-avatar__img" alt="avatar" />;
};
