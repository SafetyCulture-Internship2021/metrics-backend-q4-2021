import {Request, ResponseObject} from "@hapi/hapi";
import P from "pino";
import Logger = P.Logger;
import {Boom} from "@hapi/boom";

/**
 * Server response type
 */
export type Res<TBody> = TBody | ResponseObject | Boom;



/**
 * Fetches a reference to the pino logger from a request object
 * @param req {Request} request object to fetch the logger from
 * @return {Logger} logger instance fetched
 */
export function getLogger(req: Request): Logger {
  // This is monkey-patched by the 'hapi-pino' library
  // @ts-ignore
  return req.logger as Logger
}
