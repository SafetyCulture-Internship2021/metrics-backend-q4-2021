/**
 * Service routes and handlers
 */
export class ServiceHandlers {
  constructor({db}) {
    this.db = db;

    this.routes = this.routes.bind(this);
    this.index = this.index.bind(this);
    this.health = this.health.bind(this);
  }

  routes(svc) {
    svc.route({
      method: "GET",
      path: "/service",
      handler: this.index,
      options: {
        auth: false
      }
    });

    svc.route({
      method: "GET",
      path: "/service/health",
      handler: this.health,
      options: {
        auth: false
      }
    });
  }

  /**
   * Index returns basic information about the service
   * @param req {Request} a hapi request object
   * @param h {Object} a hapi response toolkit
   * @return {Object} response payload
   */
  index(req, h) {
    return {
      service: 'metrics-backend',
      description: 'core application for resolving metrics data',
      version: '0.0.1'
    };
  }

  /**
   * Health validates there is an available connection to the DB and returns true
   * @param req {Request} a hapi request object
   * @param h {Object} a hapi response toolkit
   * @return {Promise<Object>} response payload
   */
  async health(req, h) {
    await this.db.ping();
    return {
      ok: true
    };
  }
}
