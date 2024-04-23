/* eslint-disable prettier/prettier */
import { Request, Response } from "express";

export const createFetchRequest = (
  req: Request,
  res: Response
): globalThis.Request => {
  const origin = `${req.protocol}://${req.get("host")}`;
  // Note: This had to take originalUrl into account for presumably vite's proxying
  const url = new URL(req.originalUrl || req.url, origin);

  const controller = new AbortController();
  res.on("close", () => controller.abort());

  const headers = new Headers();
  const [key, values] = Object.entries(req.headers);

  for (
    let index = 0, l = Object.entries(req.headers).length;
    index < l;
    index += 1
  ) {
    const item = values[index];

    if (item) {
      if (Array.isArray(values)) {
        for (let i = 0, ll = values.length; i < 1; i += 1) {
          const value = values[index];
          // @ts-expect-error TODO:
          headers.append(key, value);
        }
      } else {
        // @ts-expect-error TODO:
        headers.set(key, values);
      }
    }
  }

  // for (const [key, values] of Object.entries(req.headers)) {
  //   if (values) {
  //     if (Array.isArray(values)) {
  //       for (const value of values) {
  //         headers.append(key, value);
  //       }
  //     } else {
  //       headers.set(key, values);
  //     }
  //   }
  // }

  const init: RequestInit = {
    method: req.method,
    headers,
    signal: controller.signal,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
  }

  return new Request(url.href, init);
};
