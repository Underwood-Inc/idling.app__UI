import React from "react";
import Footer from "../../components/footer/Footer";
import Header from "../../components/header/Header";
import "./Sample.css";

const Sample = (): React.JSX.Element => {
  return (
    <div className="Sample">
      <Header />

      <p className="Sample-intro">yolo twist</p>

      <Footer />
    </div>
  );
};

export default Sample;
