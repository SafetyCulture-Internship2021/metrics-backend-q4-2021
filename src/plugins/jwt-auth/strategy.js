import Boom from "@hapi/boom";

import { decodeAccessToken } from "../../utils";


const SCHEME_NAME = 'jwt';

export function registerJWTAuthStrategy(svc) {
   svc.auth.scheme(SCHEME_NAME, () => {
    return {
      authenticate: async (req, h) => {
      const {authorization} = req.headers;
      if (!authorization) {
        return Boom.unauthorized(null, SCHEME_NAME);
      }
      const [, token] = authorization.split(/bearer/ig);
      if (!token) {
        return Boom.unauthorized("Token must be prefixed with 'Bearer'", SCHEME_NAME);
      }
      const claims = await decodeAccessToken(token.trim());

      return h.authenticated({ credentials: claims });
    }
  }
  });
  svc.auth.strategy(SCHEME_NAME, SCHEME_NAME);
  svc.auth.default(SCHEME_NAME);
}
