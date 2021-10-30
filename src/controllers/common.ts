import {ResponseObject} from "@hapi/hapi";

/**
 * Server response type
 */
export type Res<TBody> = TBody | ResponseObject;
