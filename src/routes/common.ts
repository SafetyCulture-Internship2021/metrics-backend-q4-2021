import {Request, ResponseObject, Server} from "@hapi/hapi";
import {P} from "pino";
import {Boom} from "@hapi/boom";

/**
 * Routes defines an interface for registering an instance with hapi
 */
export interface Routes {
  /**
   * Register this instance with hapi
   * @param svc {Server} hapi server instance
   */
  register(svc: Server): void
}

/**
 * Server response type
 */
export type Res<TBody> = TBody | ResponseObject | Boom;

/**
 * Fetches a reference to the pino logger from a request object
 * @param req {Request} request object to fetch the logger from
 * @return {Logger} logger instance fetched
 */
export function getLogger(req: Request): P.Logger {
  // This is monkey-patched by the 'hapi-pino' library
  // We are making the assumption the logger will always be set
  // @ts-ignore
  return req.logger as P.Logger
}
