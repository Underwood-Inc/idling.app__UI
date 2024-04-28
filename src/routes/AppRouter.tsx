import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import FallbackRouteLoading from "../components/fallback-route-loading/FallbackRouteLoading";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function delayForDemo(promise: Promise<any>, n = 2) {
  await new Promise((resolve) => {
    setTimeout(resolve, n * 1000);
  });
  return await promise;
}

// const Home = memo(React.lazy(() => delayForDemo(import("../pages/home/Home"))));
const Home = React.lazy(() => delayForDemo(import("../pages/home/Home")));
// const Sample = memo(
//   React.lazy(() => delayForDemo(import("../pages/sample/Sample")))
// );
const Sample = React.lazy(() => delayForDemo(import("../pages/sample/Sample")));
const Header = React.lazy(() =>
  delayForDemo(import("../components/header/Header"))
);

const AppRouter = (): React.JSX.Element => (
  <div>
    {/* <Header /> */}

    <Suspense fallback={<FallbackRouteLoading />}>
      <Routes>
        <Route index element={<Home />} />
        <Route path="/sample" element={<Sample />} />
      </Routes>
    </Suspense>

    {/* <Footer /> */}
  </div>
);

export default AppRouter;
