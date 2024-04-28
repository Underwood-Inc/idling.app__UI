import React from "react";
import { hydrateRoot } from "react-dom/client";

const domNode = document.getElementById("root");

if (domNode) {
  // const root = hydrateRoot(domNode, <App />, {
  const root = hydrateRoot(domNode, <div />, {
    onRecoverableError(error, errorInfo) {
      // eslint-disable-next-line no-console
      console.error(
        "onRecoverableError: Uncaught error",
        error,
        errorInfo.componentStack
      );
    },
  });

  root.render(<div />);
}

if (module.hot) {
  module.hot.accept();
}
