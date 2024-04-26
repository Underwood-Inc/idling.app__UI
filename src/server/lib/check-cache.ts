import { NextFunction, Request, Response } from "express";

import LocalCache from "./local-cache";

export const checkCache = (
  req: Request,
  res: Response,
  next: NextFunction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): void | Response<any, Record<string, any>> => {
  const { baseUrl, method } = req;
  const [, , , cacheKey] = baseUrl.split("/");

  if (method === "GET" && LocalCache.hasKey(cacheKey)) {
    const data = LocalCache.get(cacheKey);

    return res.status(200).send(data);
  }

  return next();
};
