"use client";
import { adventurer } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { useEffect, useState } from "react";
import { GridLoader } from "react-spinners";
import "./HomeAvatar.css";

const HomeAvatar = ({ seed }: { seed: string }) => {
  const [img, setImg] = useState("");

  useEffect(() => {
    setImg(
      createAvatar(adventurer, {
        seed: seed || new Date().getTime().toString(),
      }).toDataUriSync()
    );
  }, [seed]);

  return (
    <div>
      {img ? (
        <img src={img} className="home-avatar__img" alt="avatar" />
      ) : (
        <div className="home-avatar__loader">
          <GridLoader color="#36d7b7" />
        </div>
      )}
    </div>
  );
};

export default HomeAvatar;
