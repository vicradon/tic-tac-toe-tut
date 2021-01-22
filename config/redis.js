"use strict";

/*
|--------------------------------------------------------------------------
| Redis Configuaration
|--------------------------------------------------------------------------
|
| Here we define the configuration for redis server. A single application
| can make use of multiple redis connections using the redis provider.
|
*/

const Env = use("Env");

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | connection
  |--------------------------------------------------------------------------
  |
  | Redis connection to be used by default.
  |
  */
  connection: Env.get("REDIS_CONNECTION", "local"),

  /*
  |--------------------------------------------------------------------------
  | local connection config
  |--------------------------------------------------------------------------
  |
  | Configuration for a named connection.
  |
  */
  local: {
    host: "127.0.0.1",
    port: 6379,
    password: null,
    db: 0,
    keyPrefix: "",
  },
  prod: {
    host: Env.get("REDIS_HOST"),
    port: Env.get("REDIS_PORT"),
    password: Env.get("REDIS_PASSWORD"),
    db: 0,
    keyPrefix: "",
    tls: {
      host: Env.get("REDIS_HOST"),
    },
  },

  /*
  |--------------------------------------------------------------------------
  | cluster config
  |--------------------------------------------------------------------------
  |
  | Below is the configuration for the redis cluster.
  |
  */
  cluster: {
    clusters: [
      {
        host: "127.0.0.1",
        port: 6379,
        password: null,
        db: 0,
      },
      {
        host: "127.0.0.1",
        port: 6380,
        password: null,
        db: 0,
      },
    ],
  },
};
