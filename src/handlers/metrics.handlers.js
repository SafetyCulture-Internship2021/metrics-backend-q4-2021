import qs from "qs";

export class MetricHandlers{
  constructor({
    db,
    metricsDao
  }) {
    this.db = db;
    this.metricsDao = metricsDao;

    this.routes = this.routes.bind(this);
    this.testData = this.testData.bind(this);
  }
  routes(svc){
    svc.route({
      method: "*",
      path: "/{p*}",
      handler: {
        proxy: {
          mapUri: (req) => {
            return {
              uri: `http://localhost:4000/${req.params.p}?${qs.stringify(req.query)}`
            };
          },
        }
      },
      options:{
        auth: false
      }
    });
    svc.route({
      method: "*",
      path: "/metrics/test",
      handler: this.testData,
      options:{
        auth: false
      }
    })
  }
  async testData(res, h){
    try{
      const req  =await this.metricsDao.databaseData();
      console.log(req)
      return req;

    }catch (error){
      console.log(error);
      throw error;
    }

  }
}
