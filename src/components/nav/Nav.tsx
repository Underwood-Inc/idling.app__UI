import React from "react";
import { Link } from "react-router-dom";
import "./Nav.css";

const Nav = (): React.JSX.Element => {
  return (
    <div className="container">
      <ul className="nav">
        <p>UI Routes</p>
        <li>
          <Link to="/sample">Sample</Link>
        </li>
      </ul>

      <ul className="nav">
        <p>API Routes</p>
        <li>
          <Link to="/test" target="__blank">
            Test (an API endpoint)
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Nav;
