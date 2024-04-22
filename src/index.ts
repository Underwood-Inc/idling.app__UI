/* eslint-disable no-console */
/* eslint-disable global-require */
import express from "express";

// this require is necessary for server HMR to recover from error
// eslint-disable-next-line @typescript-eslint/no-var-requires
let app = require("./server").default;

if (module.hot) {
  module.hot.accept("./server", () => {
    console.log("🔁  HMR Reloading `./server`...");
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      app = require("./server").default;
    } catch (error) {
      console.error(error);
    }
  });
  console.info("✅  Server-side HMR Enabled!");
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export default express()
  .use((req, res) => app.handle(req, res))
  // @ts-expect-error make types happy
  .listen(port, (err: Error) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`> Started on port ${port}`);
  });
