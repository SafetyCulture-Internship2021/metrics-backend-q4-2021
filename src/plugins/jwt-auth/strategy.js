import Boom from "@hapi/boom";


const SCHEME_NAME = 'jwt';

export function registerJWTAuthStrategy(svc) {
   svc.auth.scheme(SCHEME_NAME, () => {
    return {
      authenticate: async (req, h) => {
      const {authorization} = req.headers;
      if (!authorization) {
        return Boom.unauthorized(null, SCHEME_NAME);
      }
      const claims = await decodeAccessToken(authorization);

      return h.authenticated({ credentials: claims });
    }
  }
  });
  svc.auth.strategy(SCHEME_NAME, SCHEME_NAME);
  svc.auth.default(SCHEME_NAME);
}
