import { adventurer } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HydrationContext from "../../contexts/Hydrator";
import useSSRMismatchGuard from "../../utils/ssr";
import "./HomeAvatar.css";

const HomeAvatar = (): React.JSX.Element => {
  const hydrated = useContext(HydrationContext);

  const { isClient } = useSSRMismatchGuard();
  const [isLoading, setIsLoading] = useState(true);
  const [avatar, setAvatar] = useState("");
  const navigate = useNavigate();
  const date = new Date().getTime().toString();

  const handleNav = () => {
    navigate("/");
  };

  useEffect(() => {
    createAvatar(adventurer, {
      seed: new Date().getTime().toString(),
    })
      .toDataUri()
      .then((generatedAvatar) => {
        setAvatar(generatedAvatar);
        setIsLoading(false);
      });
  }, []);

  return (
    <div>
      {hydrated && !isLoading && (
        <button
          type="button"
          className="home-avatar__button"
          onClick={handleNav}
        >
          <img src={avatar} className="Home-logo" alt="logo" />
        </button>
      )}

      {hydrated && isLoading && (
        <div>
          <p>Loading...</p>
        </div>
      )}

      {!hydrated && (
        <div>
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
};

export default HomeAvatar;
