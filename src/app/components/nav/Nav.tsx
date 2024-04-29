import React from "react";
import "./Nav.css";

const Nav = (): React.JSX.Element => {
  return (
    <div className="container">
      <ul className="nav">
        <li>
          <a href="https://github.com/Underwood-Inc/idling-app" target="_blank">
            GitHub
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Nav;
