import qs from "qs";

export class MetricHandlers{
  constructor({
    db,
    metricsDao
              }) {
    this.db = db;
    this.metricsDao = metricsDao;

    this.routes = this.routes.bind(this);
    this.inputData = this.inputData.bind(this);
  }
  routes(svc){
    svc.route({
      method: "*",
      path: "/{p*}",
      handler: {
        proxy: {
          mapUri: (req) => {
            return {
              uri:
                `http://localhost:4000/${req.params.p}?${qs.stringify(req.query)}`
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
      path: "/metrics/input",
      handler: this.inputData,
      options:{
        auth: false
      }
    })
  }
  async inputData(req, h){
    let data;
    try{
      req.data  =await this.metricsDao.dummyData();
    }catch (error){
      console.log(error);
      throw error;
    }
    console.log(req.data);
    return req.data;
  }
}
