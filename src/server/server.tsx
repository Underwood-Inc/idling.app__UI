import express from "express";
import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";

let assets: Record<string, { js: string[]; css: string[] }>;

const syncLoadAssets = () => {
  // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-non-null-assertion, global-require
  assets = require(process.env.RAZZLE_ASSETS_MANIFEST!);
};
syncLoadAssets();

const cssLinksFromAssets = (
  _assets: { [x: string]: { css: string[] } },
  entrypoint: string
) => {
  // eslint-disable-next-line no-nested-ternary
  return _assets[entrypoint]
    ? _assets[entrypoint].css
      ? assets[entrypoint].css
          .map((asset: string) => `<link rel="stylesheet" href="${asset}">`)
          .join("")
      : ""
    : "";
};

const jsScriptTagsFromAssets = (
  _assets: { [x: string]: { js: string[] } },
  entrypoint: string,
  extra = ""
) => {
  // eslint-disable-next-line no-nested-ternary
  return _assets[entrypoint]
    ? _assets[entrypoint].js
      ? assets[entrypoint].js
          .map((asset: string) => `<script src="${asset}"${extra}></script>`)
          .join("")
      : ""
    : "";
};

export const renderApp = async (
  req: express.Request,
  res: express.Response
): Promise<string | void> => {
  const context = {};
  // If we got a redirect response, short circuit and let our Express server
  // handle that directly
  if (context instanceof Response) {
    throw context;
  }

  const markup = renderToString(
    <React.StrictMode>
      <StaticRouter location={req.url} />
    </React.StrictMode>
  );
  // <StaticRouter context={context} location={req.url}>
  //   <App />
  // </StaticRouter>

  // TODO: debug if this does anything
  // if (context.url) {
  //   return { redirect: context.url };
  // }

  const html =
    // prettier-ignore
    `<!doctype html>
    <html lang="">
    <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta charSet='utf-8' />
        <title>Welcome to Razzle</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${cssLinksFromAssets(assets, 'client')}
    </head>
    <body>
        <div id="root">${markup}</div>
        ${jsScriptTagsFromAssets(assets, 'client', ' defer crossorigin')}
    </body>
  </html>`;

  return html;
};

const server = express()
  .disable("x-powered-by")
  .use(express.static(process.env.RAZZLE_PUBLIC_DIR || "RAZZLE_PUBLIC_DIR"))
  .get("/*", async (req: express.Request, res: express.Response) => {
    const html = await renderApp(req, res);

    res.send(html);
  });

export default server;
