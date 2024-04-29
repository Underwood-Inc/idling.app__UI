"use client";
import Script from "next/script";
import React from "react";
import "./styles.css";

export const GameWrapper: React.FC = () => {
  return (
    <div>
      <div className="gm4html5_div_class" id="gm4html5_div_id">
        <canvas id="canvas" width="864" height="648">
          <p>Your browser doesn&apos;t support HTML5 canvas.</p>
        </canvas>
      </div>

      <Script src="idling.app.js?cachebust=968111397" />
    </div>
  );
};
