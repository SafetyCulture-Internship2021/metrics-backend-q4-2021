import config from "config";

import {Server, ServerInjectOptions} from "@hapi/hapi";
import {compose} from "@hapi/glue";

import {Database, initPool} from "./db";
import {AuthService} from "./services";
import {AuthController} from "./controllers";
import {registerJWTAuthStrategy} from "./plugins";
import {Routes} from "./routes/common";
import {AuthRoutes} from "./routes/auth.routes";

/**
 * Application initialises the API service and all of its dependencies
 */
export class Application {
  public svc?: Server;

  private readonly routes: Routes[] = [];

  constructor() {
    // MARK: initialise all dependencies for the application here
    const pool = initPool()
    const database = new Database(pool);

    // Service initialisation
    const authService = new AuthService(database);

    const authControllers = new AuthController(database, authService);

    // Controller initialisation
    this.routes.push(new AuthRoutes(authControllers));
  }

  /**
   * Starts the application server
   * @return Promise<void> - Promise to await for application termination
   */
  async start() {
    try {
      this.svc = await compose({
        server: {
          port: config.get('server.port') || 8080,
          routes: {
            validate: {
              failAction: async (request, h, err) => {
                throw err;
              }
            }
          }
        },
        register: {
          plugins: [
            {
              plugin: require('hapi-pino'),
              options: {
                prettyPrint: process.env.NODE_ENV !== 'production',
                redact: ['req.headers.authorization']
              }
            }
          ]
        }
      }, {
        relativeTo: __dirname
      });

      registerJWTAuthStrategy(this.svc);
      for (const route of this.routes) {
        route.register(this.svc);
      }

      await this.svc.start();
    } catch (err) {
      throw new Error(`unable to start application server: ${err}`)
    }
  }

  async stop() {
    if (!this.svc) {
      return;
    }
    return this.svc.stop();
  }
}
