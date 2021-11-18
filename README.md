# Metrics Backend

Core backend service for the metrics application

## Getting Started

- Install [nvm](https://github.com/nvm-sh/nvm)
- Run `nvm install 16`
- Run `npm install`
- Start the local docker resources `docker-compose up -d --build`
- Start live-developing the application by running `npm run watch`

## Commands

Each command can be run be executing `npm run {command}` in the console

| Command | Description |
| :--- | :--- |
| `compile` | Transpiles the source code into the /dist folder |
| `start` | Starts the application with the PRODUCTION node environment set |
| `start:dev` | Starts the application with the DEVELOPMENT node environment set |
| `dev` | Executes the `compile` command, followed by the `start:dev` command |
| `watch` | Starts a file watcher for any modifications to src files. On changes, executes the `dev` command |
| `test:unit` | Runs all unit tests |
| `test:integration` | Runs all integration tests (caution: this *may* wipe out any existing data in the database when run locally) |
| `test:all` | Runs all test suites |

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
Each DAO file should be responsible for a single entity within the DB

#### Handlers
Path: `/src/handlers`

THe handlers directory contains a number of handlers files, each of which is responsible for defining HTTP endpoints, and registering them with the hapi instance.

#### Application
Path: `/src/application.js`

`application.js` is the application entrypoint. When adding new DAOs or Handlers, they will need to be added to the application constructor.

## Routes

---

### Get service info
| Method | Path | Authenticated |
| :--- | :--- | :---: |
| GET | /service | no |

Returns basic service information

##### Request
N/A

##### Response
| Property | Type | Description |
| :--- | :--- | :--- |
| service | string | The name of the service that is serving requests |
| description | string | A description for this service |
| version | string | The current deployed version of the service, in a SemVer format |

---

#### Get service health
| Method | Path | Authenticated |
| :--- | :--- | :---: |
| GET | /service/health | no |

Verifies the application is active and can serve requests

##### Request
N/A

##### Response
| Property | Type | Description |
| :--- | :--- | :--- |
| ok | bool (true) | A true value to indicate the service is healthy |

---

#### Login
| Method | Path | Authenticated |
| :--- | :--- | :---: |
| POST | /auth/login | no |

Attempt to log into a user account using the credentials provided

##### Request
| Property | Type | Description |
| :--- | :--- | :--- |
| email | string | The email address of the account to log into |
| password | string | The password in plaintext to log in with |

##### Response
| Property | Type | Description |
| :--- | :--- | :--- |
| access_token | string | A short-lived access token to be included in the 'Authorization' header for future requests |
| refresh_token | string | An opaque token to be used when the access_token expires to generate a new access token |

---

#### Logout
| Method | Path | Authenticated |
| :--- | :--- | :---: |
| POST | /auth/logout | yes |

Revokes the current refresh token, disallowing further use

##### Request
N/A

##### Response
N/A

---

#### Register
| Method | Path | Authenticated |
| :--- | :--- | :---: |
| POST | /auth/register | no |

Create a new account within the system

##### Request
| Property | Type | Description |
| :--- | :--- | :--- |
| name | string | The name of the user to register |
| email | string | The email address of the account to log into |
| password | string | The password in plaintext to log in with |

##### Response
| Property | Type | Description |
| :--- | :--- | :--- |
| access_token | string | A short-lived access token to be included in the 'Authorization' header for future requests |
| refresh_token | string | An opaque token to be used when the access_token expires to generate a new access token |

---

#### Refresh
| Method | Path | Authenticated |
| :--- | :--- | :---: |
| POST | /auth/refresh | no |

Generate a new access token using the provided refresh token

##### Request
| Property | Type | Description |
| :--- | :--- | :--- |
| token | string | The opaque refresh token previously provided for this user |

##### Response
| Property | Type | Description |
| :--- | :--- | :--- |
| access_token | string | A short-lived access token to be included in the 'Authorization' header for future requests |

---

#### Context
| Method | Path | Authenticated |
| :--- | :--- | :---: |
| GET | /auth/context | yes |

Returns the context of the authenticated user

##### Request
N/A

##### Response
| Property | Type | Description |
| :--- | :--- | :--- |
| account_id | string | The ID of the account of the authenticated user |
| account_name | string | The full name of the authenticated user |
| account_email | string | The email address of the authenticated user |
| token_id | string | The ID of the refresh token used to generate the current access token |

---
