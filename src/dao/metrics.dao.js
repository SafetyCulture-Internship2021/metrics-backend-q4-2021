import axios from "axios";

axios.defaults.baseURL = "http://localhost:4000";
export class MetricsDao{
  constructor(database) {
    this.database = database;
    this.databaseData = this.databaseData.bind(this);
    this.getFromDataGen = this.getFromDataGen.bind(this);
  }
  async getFromDataGen({serviceType, ts_Start, ts_End, refresh}){
    const path = '/services';
    /*const path = `/metrics/${serviceType}?from=${ts_Start}&to=${ts_End}`;*/
    return await axios.get(path);
  }
  async databaseData(){
    const {data} = await this.getFromDataGen({
      serviceType: "chart",
      ts_Start: 0,
      ts_End: 10000
    })
    return data;
  }

}
