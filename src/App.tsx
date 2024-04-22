import React from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./Home";

const App = (): React.JSX.Element => (
  <Routes>
    <Route path="/" element={<Home />} />
  </Routes>
);

export default App;
