import axios from "axios";
import config from "config";
import {statSync} from "fs"
import {raw} from "config/raw";
import {ensureConn} from "./common"

axios.defaults.baseURL = "http://localhost:4000" || config.get("data.url");

export class MetricsDao {

  constructor(database) {
    this.database = database;
    this.databaseData = this.databaseData.bind(this);
    this.getFromDataGen = this.getFromDataGen.bind(this);
    this.initialiseData = this.initialiseData.bind(this);
    this.viewData = this.viewData.bind(this);

  }
//Gets the data from the data generator
  async getFromDataGen({service_type, ts_Start, ts_End}) {
    const path = `/metrics/${service_type}?from=${ts_Start}&to=${ts_End}`;
    const {data: response} = await axios.get(path);
    return response;
  }
//inserts the data into the database
  async databaseData(rawData, opts) {
    const conn = ensureConn(this.database, opts);
    const results = [];

    for (let time_stamp in rawData) {
      const tsObject = rawData[time_stamp];
      for (let podId in tsObject) {
        const podItem = tsObject[podId];


        const latencyArray = podItem.http.latency
        latencyArray.sort(function (a, b) {return a - b})

        let sum = 0;
        for (let parse of latencyArray) {
          sum += parse;
        }
        let avg = Math.round(sum / latencyArray.length)
        let min = Math.round(latencyArray[0]);
        let max = Math.round(latencyArray[latencyArray.length - 1]);

        let percentile99 = (array => {
          let p = ((array.length) - 1) * 0.99;
          let b = Math.floor(p);
          if (array[b + 1] !== undefined) {
            return Math.round(array[array.length - 1])
          } else {
            return Math.round(array[b]);
          }
        })(latencyArray);


        const statusArray = podItem.http.status
        let status_200, status_400, status_401, status_403, status_404, status_499, status_500, status_502;
        status_200 = status_400 = status_401 = status_403 = status_404 = status_499 = status_500 = status_502 = 0;

        for (let [key, num] of Object.entries(statusArray)) {
          switch (key) {
            case '200':
              status_200 = num;
              break;
            case '400':
              status_400 = num;
              break;
            case '401':
              status_401 = num;
              break;
            case '403':
              status_403 = num;
              break;
            case '404':
              status_404 = num;
              break;
            case '499':
              status_499 = num;
              break;
            case '500':
              status_500 = num;
              break;
            case '502':
              status_502 = num;
              break;
          }

        }
        const array = [podId, podItem.meta.service, time_stamp, avg, percentile99, min, max, status_200, status_400, status_401, status_403, status_404, status_499, status_500, status_502]
       //inserting the data into the table called metrics data
        const {rows} = await conn.query(`
    INSERT INTO metrics_data(
      pod_id,
      service_type,
      time_stamp,
      avg_latency,
      percentile_99,
      min_latency,
      max_latency,
      status_200,
      status_400,
      status_401,
      status_403,
      status_404,
      status_499,
      status_500,
      status_502) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`, array);

        console.log('Insert Successful ' + podItem.time_stamp)

        if (rows.length === 0) {
          return [];
        }
        results.push(...rows);
      }
    }
    return results;
  }

  async initialiseData(ts_start, ts_end, options) {
    const data = await this.getFromDataGen({
      service_type: 'cart',
      ts_Start: ts_start,
      ts_End: ts_end
    });
    await this.databaseData(data, options);
    return data;
  }


  async viewData(options) {
    const conn = ensureConn(this.database, options);
    const {rows} = await conn.query(`
    SELECT
      time_stamp,
      service_type,
      ROUND(AVG(avg_latency)) as avg_latency,
      ROUND(AVG(percentile_99)) as avg_percent99,
      ROUND(AVG(min_latency)) as avg_min,
      ROUND)AVG(max)latency)) as avg_max,
      SUM(status_200) as status_200,
      SUM(status_400) as status_400,
      SUM(status_401) as status_401,
      SUM(status_403) as status_403,
      SUM(status_404) as status_404,
      SUM(status_499) as status_499,
      SUM(status_500) as status_500,
      SUM(status_502) as status_502
    FROM metrics_data
    GROUP BY time_stamp, service_type
    ORDER BY time_stamp
    `);
    console.log('data :');
    return rows;
  }


}
