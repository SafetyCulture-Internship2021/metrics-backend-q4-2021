import {Server} from "@hapi/hapi";

export abstract class Controller {
  /**
   * register the routes from this controller with hapi
   * @param svc {Server} hapi service reference
   */
  public abstract registerController(svc: Server): void;
}
