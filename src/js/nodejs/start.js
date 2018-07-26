// load the moka module
const moka = require("./moka.js")
// load the make config
const config = require("./moka.json");
// load the log module
const Log = require("log");
// build a logger
const log = new Log(config.LOG_LEVEL);

// load the cluster module
const cluster = require("cluster");
// check if we are the main process
if (cluster.isMaster) {
  // get the number of CPUs
  const numberOfCPUs = require("os").cpus().length;

  // create a worker process for each CPU
  for (let i = 0; i < numberOfCPUs; i++) {
    // create a worker process
    cluster.fork();
  }

  // when a worker dies
  cluster.on("exit", function (worker) {
    // debug
    log.error(`Moka #${worker.id} died.`);
    // create a new worker process
    cluster.fork();
  });

  // start moka
  moka.createAppDirectoryIfNecessary();

  // debug
  log.info(`Preparing ${numberOfCPUs} mokas ...`);
} else {
  // start moka
  moka
      .createAppDirectoryIfNecessary()
      .compileApp()
      .watchAppDirectory();

  // load the express module
  const express = require("express");
  // init the express app
  const app = express();

  // load the durations module
  const durations = require("durations");

  // register a request handler
  app.get(/\/[^/]*/, function(request, response) {
    // time the duration of executing the request
    const duration = durations.time(function() {
      // load the Root class
      const Root = require(`${config.BUILD_DIRECTORY}/Root.js`);

      // get the query path
      const queryPath = request.path.substring(1);
      // define the method to be called
      const methodName = queryPath ? queryPath : config.DEFAULT_METHOD_NAME;

      // build a Root instance and call the method on it
      new Root()[methodName](request, response);
    });

    // debug
    log.debug(`Request ${request.path} handled in %s`, duration.format());
  });

  // listen on Moka's default web port
  app.listen(config.DEFAULT_WEB_PORT, function() {
    // debug
    log.info(`Moka #${cluster.worker.id} up and brewing.`);
  });
}
