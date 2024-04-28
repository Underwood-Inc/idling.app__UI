import React from "react";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
import HydrationContext from "./contexts/Hydrator";
import AppRouter from "./routes/AppRouter";

const HydrationProvider = ({ children }: { children?: React.ReactNode }) => {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);
  return (
    <HydrationContext.Provider value={hydrated}>
      {children}
    </HydrationContext.Provider>
  );
};

const App = (): React.JSX.Element => {
  // const { isClient } = useSSRMismatchGuard();

  return (
    // <HydrationProvider>
    <React.StrictMode>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </React.StrictMode>
    // </HydrationProvider>
  );
};

export default App;
