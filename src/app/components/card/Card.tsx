import React from "react";
import "./Card.css";

export const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="card">{children}</div>;
};
