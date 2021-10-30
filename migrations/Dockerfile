FROM openjdk:8-jre-alpine

ENV FLYWAY_VERSION=4.2.0

# SSL is required (at least) for downloading Flyway
# Bash is used in the flyway scripts
RUN apk --no-cache add openssl bash

WORKDIR /opt/flyway

RUN wget https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/${FLYWAY_VERSION}/flyway-commandline-${FLYWAY_VERSION}.tar.gz \
  && wget https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/${FLYWAY_VERSION}/flyway-commandline-${FLYWAY_VERSION}.tar.gz.sha1 \
  && echo "$(cat flyway-commandline-${FLYWAY_VERSION}.tar.gz.sha1)  flyway-commandline-${FLYWAY_VERSION}.tar.gz" | sha1sum -c \
  && tar -x --strip-components=1 -f flyway-commandline-${FLYWAY_VERSION}.tar.gz \
  && rm flyway-commandline-${FLYWAY_VERSION}.tar.gz flyway-commandline-${FLYWAY_VERSION}.tar.gz.sha1 \
  && ln -s /opt/flyway/flyway /usr/local/bin/flyway

COPY . migration

ENTRYPOINT ["/bin/sh"]
CMD ["migration/bin/migrate.sh", "docker"]