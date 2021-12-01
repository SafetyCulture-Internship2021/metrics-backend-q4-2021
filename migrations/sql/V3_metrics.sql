CREATE TABLE data(
pod_id varchar NOT NULL,
service_type varchar NOT NULL,
time_stamp int NOT NULL,
http_status JSON NOT NULL,
avg_latency INT NOT NULL,
percentile_99 INT NOT NULL,
min_latency INT NOT NULL,
max_latency INT NOT NULL,
PRIMARY KEY (pod_id, time_stamp, service_type)
);
