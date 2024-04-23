import { NextFunction, Request, Response } from 'express';

import LocalCache from './local-cache';

export const checkCache = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { baseUrl, method } = req;
    const [, , , cacheKey] = baseUrl.split('/');

    if (method === 'GET' && LocalCache.hasKey(cacheKey)) {
      const data = LocalCache.get(cacheKey);

      return res.status(200).send(data);
    }

    return next();
  } catch (err) {
    // do some logging
    throw err;
  }
};
