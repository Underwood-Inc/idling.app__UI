import React, { Suspense, memo } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function delayForDemo(promise: Promise<any>, n = 2) {
  return new Promise((resolve) => {
    setTimeout(resolve, n * 1000);
  }).then(() => promise);
}

const Home = memo(React.lazy(() => delayForDemo(import("./Home"))));
const Sample = memo(
  React.lazy(() => delayForDemo(import("./pages/sample/Sample")))
);

const App = (): React.JSX.Element => (
  <Suspense fallback={<div>Loading...</div>}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sample" element={<Sample />} />
    </Routes>
  </Suspense>
);

export default App;
