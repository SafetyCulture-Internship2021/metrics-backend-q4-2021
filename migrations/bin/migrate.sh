#!/bin/sh
set -e

if [ "$1" == "docker" ]; then
    flyway -user="${PG_DB_USER}" -password="${PG_DB_PASSWORD}" -url="jdbc:postgresql://${PG_DB_HOST}:${PG_DB_PORT}/${PG_DB_NAME}" -locations=filesystem:migration/sql/ -table=flyway_schema_history migrate info
else
    # Used to facilitate local development, details should match dev_init
    flyway -user="metrics-backend" -password="metrics-backend" -url="jdbc:postgresql://localhost:5432/metrics-backend" -locations=filesystem:migration/sql/ -table=flyway_schema_history migrate info || true
fi