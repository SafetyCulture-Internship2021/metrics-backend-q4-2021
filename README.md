# Metrics Backend

Core backend service for the metrics application

## Getting Started

## Commands

## Project Structure
### Config
Path: `/config`

The config directory houses a `.js` file for each application environment that runs.
Each of these `.js` files consists of a `module.exports` statement that will export a configuration object for the environment.
Each environment will load up the `default.js` config, then merge the environment specific config over the top, and finally
any environment variables referenced in `custom-environment-variables.js` will be set.

The config values are referenced throughout the application through importing the `config` package, an example is below.

```js
import config from "config";

// Fetch the port for the server to run on
const port = config.get("server.port");
```

### Migrations
Path: `/migrations/sql`

The set of database migrations that should be run. Each migration file is of the form `V{version_number}__{name}.sql` where version_number will be an integer starting at 1, and name will be an underscore separated name for the migration.

Migration version number MUST be sequential and unique. Migration files MUST NOT be edited after they have been applied against a database.

Each migration file will consist of a set of SQL statements that are to be executed in applying the migration.

### Source
Path: `/src`
#### DAOs
Path: `/src/dao`

The DAO directory contains a number of `.js` files responsible for generating and executing queries against the database.
Each DAO file should be responsible for a single

#### Handlers
Path: `/src/handlers`

#### Application
Path: `/src/application.js`

## Routes
