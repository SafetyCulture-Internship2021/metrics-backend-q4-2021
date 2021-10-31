import {Request, ResponseToolkit, Server} from "@hapi/hapi";
import {Res} from "../../routes/common";
import Boom from "@hapi/boom";
import {decodeAccessToken} from "../../utils";

const SCHEME_NAME = 'jwt';

export function registerJWTAuthStrategy(svc: Server) {
  svc.auth.scheme(SCHEME_NAME, () => {
    return {
      authenticate: async (req: Request, h: ResponseToolkit): Promise<Res<unknown>> => {
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
