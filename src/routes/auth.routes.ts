import {Request, ResponseToolkit, Server} from "@hapi/hapi";
import {IAuthController, LoginRequest, RefreshRequest, RegisterRequest} from "../controllers";
import {getLogger, Routes} from "./common";

/**
 * Auth routes bindings
 */
export class AuthRoutes implements Routes {
  constructor(private authController: IAuthController) {
  }

  /**
   * Register this instance with hapi
   * @param svc {Server} hapi server instance
   */
  register(svc: Server) {
    svc.route({
      method: "POST",
      path: "/login",
      handler: (req: Request, h: ResponseToolkit) => {
        const logger = getLogger(req);
        return this.authController.login(logger, req.payload as LoginRequest);
      },
      options: {
        auth: false,
        validate: this.authController.loginValidate
      }
    });

    svc.route({
      method: "POST",
      path: "/register",
      handler: (req: Request, h: ResponseToolkit) => {
        const logger = getLogger(req);
        return this.authController.register(logger, req.payload as RegisterRequest);
      },
      options: {
        auth: false,
        validate: this.authController.registerValidate
      }
    });

    svc.route({
      method: "POST",
      path: "/refresh",
      handler: (req: Request, h: ResponseToolkit) => {
        const logger = getLogger(req);
        return this.authController.refresh(logger, req.payload as RefreshRequest);
      },
      options: {
        auth: false,
        validate: this.authController.refreshValidate
      }
    });
  }
}
