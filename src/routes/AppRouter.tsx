import React, { Suspense, memo } from "react";
import { Route, Routes } from "react-router-dom";
import FallbackRouteLoading from "../components/fallback-route-loading/FallbackRouteLoading";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function delayForDemo(promise: Promise<any>, n = 2) {
  return new Promise((resolve) => {
    setTimeout(resolve, n * 1000);
  }).then(() => promise);
}

const Home = memo(React.lazy(() => delayForDemo(import("../Home"))));
const Sample = memo(
  React.lazy(() => delayForDemo(import("../pages/sample/Sample")))
);

const AppRouter = (): React.JSX.Element => (
  <Suspense fallback={<FallbackRouteLoading />}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sample" element={<Sample />} />
    </Routes>
  </Suspense>
);

export default AppRouter;
