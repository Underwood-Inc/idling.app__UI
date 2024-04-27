import express, { NextFunction } from "express";
import jwt from "jsonwebtoken";
import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { IUser } from "./interfaces/user.interface";
import { User } from "./server/models/user";
import router from "./server/routers";

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
  req: express.Request
): Promise<string | void> => {
  const markup = renderToString(
    <React.StrictMode>
      <StaticRouter location={req.url} />
    </React.StrictMode>
  );

  const html =
    // prettier-ignore
    `<!doctype html>
    <html lang="">
    <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta charSet='utf-8' />
        <title>Idling.app coming soon</title>
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
const jwtToken = process.env.JWT_TOKEN || "secret";

async function authentication(
  req: express.Request,
  res: express.Response,
  next: NextFunction
) {
  try {
    if (!req.headers.authorization) throw new Error("Invalid token");
    const [type, token] = req.headers.authorization.split(" ");

    if (type !== "Bearer") throw new Error("Invalid token");
    const payload = jwt.verify(token, jwtToken) as IUser | undefined;

    if (!payload) throw new Error("Invalid token");
    const user = await User.findByPk(payload.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) throw new Error("Data not found");

    // @ts-expect-error undefined type
    req.user = {
      id: payload.id,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

const server = express()
  .disable("x-powered-by")
  .use(express.static(process.env.RAZZLE_PUBLIC_DIR || "RAZZLE_PUBLIC_DIR"))
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use("/api/v1/", router)
  .get("/test", async (req, res) => {
    return res.status(200).send("Well done! This is the test endpoint.");
  })
  .get("/protected-test", authentication, async (req, res, next) => {
    try {
      // console.log(req);
      // const token = req.headers.authorization?.split(" ")[1] || "";

      // // console.log("token", token);
      // if (!token) {
      //   return res.status(403).send("A token is required for authentication");
      // }

      // const decodedToken = verify(token, jwtToken || "dumb_secret");

      // // @ts-expect-error type sig mismatch on req
      // req.user = decodedToken;

      const user = await User.findOne({
        where: {
          // @ts-expect-error type sig mismatch on req
          id: req.user.id,
        },
        attributes: { exclude: ["password"] },
      });

      if (user === null) {
        return res.status(404).json({ msg: "User not found" });
      }

      return res.status(200).json(user);
    } catch (err) {
      // console.error(err);
      return res.status(401).json({ msg: "Couldn't Authenticate" });
    }
  })
  .get("/*", async (req: express.Request, res: express.Response) => {
    const html = await renderApp(req);

    res.send(html);
  });

export default server;
