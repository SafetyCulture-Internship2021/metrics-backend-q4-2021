import config from "config";

import {Server} from "@hapi/hapi";
import {compose} from "@hapi/glue";

import {Database, initPool} from "./db";
import {AuthService} from "./services";
import {AuthController} from "./controllers";
import {Controller} from "./controllers/controller";

/**
 * Application initialises the API service and all of its dependencies
 */
export class Application {
  private svc?: Server;

  private readonly controllers: Controller[] = [];

  constructor() {
    // MARK: initialise all dependencies for the application here
    const pool = initPool()
    const database = new Database(pool);

    // Service initialisation
    const authService = new AuthService(database);

    // Controller initialisation
    this.controllers.push(new AuthController(database, authService));
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

      for (const controller of this.controllers) {
        controller.registerController(this.svc);
      }

      await this.svc.start();
    } catch (err) {
      throw new Error(`unable to start application server: ${err}`)
    }
  }
}
