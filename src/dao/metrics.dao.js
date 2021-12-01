import {ensureConn} from "./common";
import axios from "axios";
export class MetricsDao{
  constructor(database) {
    this.database = database;
    this.databaseData = this.databaseData.bind(this);
    this.getFromDataGen = this.getFromDataGen.bind(this);
  }
  async getFromDataGen({serviceType, testStart, testEnd, Refresh}){
    const path = `/metrics/${serviceType}?from=${testStart}&to=${testEnd}`;
    const rawData = await axios.get(path);
    return rawData;
  }
  async databaseData(){
    const {data} = await this.getFromDatGen({
      serviceType: "chart",
      testStart: 0,
      testEnd: 10000
    })
    return data;
  }

}
