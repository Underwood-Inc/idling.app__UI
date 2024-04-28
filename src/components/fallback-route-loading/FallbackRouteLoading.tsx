import React from "react";
import WizardLoader from "../wizard-loader/WizardLoader";
import "./FallbackRouteLoading.css";

const FallbackRouteLoading = (): React.JSX.Element => {
  return (
    <div className="fallback-route-loading__container">
      <div className="fallback-route-loading__loader">
        <div className="fallback-route-loading__loader-content">
          {/* <img src={loading} alt="loading" /> */}
          <WizardLoader />
        </div>
      </div>
    </div>
  );
};

export default FallbackRouteLoading;
