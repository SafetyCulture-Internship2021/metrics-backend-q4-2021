module.exports = {
  server: {
    port: 6000
  },
  db: {
    host: 'localhost',
    name: 'metrics-backend',
    port: 5432,
    user: 'metrics-backend',
    pass: 'metrics-backend',
    pool: {
      min: 0,
      max: 10
    }
  },
  jwt: {
    signingKey: 'testsigningkeytestsigningkeytestsigningkey',
    expiration: '5m',
    audience: 'test',
    subject: 'test',
    issuer: 'test'
  }
};
