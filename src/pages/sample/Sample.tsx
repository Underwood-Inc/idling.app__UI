import React from "react";
import logo from "../../react.svg";
import "./Sample.css";

const Sample = (): React.JSX.Element => {
  return (
    <div className="Sample">
      <div className="Sample-header">
        <img src={logo} className="Sample-logo" alt="logo" />
        <h2>Welcome to yolo twist</h2>
      </div>
      <p className="Sample-intro">yolo twist</p>
    </div>
  );
};

export default Sample;
