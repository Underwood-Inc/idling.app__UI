import React from "react";
import "./Home.css";
import Footer from "./components/footer/Footer";
import Header from "./components/header/Header";

const Home = (): React.JSX.Element => {
  return (
    <div className="Home">
      <Header />

      <p className="Home-intro" />

      <Footer />
    </div>
  );
};

export default Home;
