import Link from "next/link";
import React from "react";
import { GitHubLink } from "../github-link/GitHubLink";

export const About: React.FC = () => {
  return (
    <div className="about__container">
      <p>
        <Link href="/">idling.app</Link> is a a new game being developed in
        the&nbsp;
        <a href="https://godotengine.org/" target="_blank">
          Godot v4 game engine
        </a>
        .
      </p>
      <p>
        This game will have idle elements to take over tasks that become tedious
        as game progression advances.
      </p>

      <p>
        See the public <GitHubLink /> page for releases.
      </p>
      <sup>
        Development is in private code. The public <GitHubLink /> page is for
        release management.
      </sup>
    </div>
  );
};
