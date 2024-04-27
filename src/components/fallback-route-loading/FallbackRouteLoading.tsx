import React from "react";
import loading from "../../assets/images/215699.gif";
import Footer from "../footer/Footer";
import Header from "../header/Header";
import "./FallbackRouteLoading.css";

const FallbackRouteLoading = (): React.JSX.Element => {
  return (
    <div className="fallback-route-loading__container">
      <Header />

      <div className="fallback-route-loading__loader">
        <div className="fallback-route-loading__loader-content">
          <img src={loading} alt="loading" />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FallbackRouteLoading;
