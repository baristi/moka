#!/usr/bin/env node

// load the module alias module
const moduleAlias = require("module-alias");
// load the path module
const path = require("path");

// get the base directory (used as base directory for the app and build directory only)
// the base directory will either be the current working directory or the first argument, if present
const baseDirectory = process.argv.length == 3 ? path.resolve(process.argv[2]) : process.cwd();

// add module aliases
moduleAlias.addAlias("@src", __dirname);
moduleAlias.addAlias("@app", `${baseDirectory}`);
moduleAlias.addAlias("@classes", `${baseDirectory}/build/js`);
// add a node_modules directory
moduleAlias.addPath(`${baseDirectory}/node_modules`);

// load the moka class
const Moka = require("@src/classes/Moka.js")
// load the chalk module
const chalk = require("chalk");

// build a logger
const log =  require("log-driver")({
  level: Moka.config.LOG_LEVEL,
  format: function(level, message) {
    // define the log level and the text color
    let levelColor, textColor;
    // switch the log level
    switch (level) {
      case "error": levelColor = "red";    textColor = "red";    break;
      case "warn":  levelColor = "yellow"; textColor = "yellow"; break;
      case "info":  levelColor = "blue";   textColor = "black";  break;
      case "debug": levelColor = "black";  textColor = "gray";   break;
      case "trace": levelColor = "black";  textColor = "gray";   break;
      // "log-driver" doesn't have any other log levels than the ones above, but you never know
      default:      levelColor = "blue";   textColor = "black";
    }

    // format and return the log message
    return `${chalk.gray(new Date().toLocaleString("lookup", {
      hourCycle: "h24"
    }))} ${chalk[levelColor](level.toUpperCase())} ${chalk[textColor](message)}`;
  }
});

// when an uncaughtException event is emitted
process.on("uncaughtException", error => {
  // format and write the error to the console
  console.log(`${chalk.gray(new Date().toLocaleString("lookup", {
    hourCycle: "h24"
  }))} ${chalk.red("ERROR")} ${chalk.red(error.stack ? error.stack : error)}`);
});

// load the cluster module
const cluster = require("cluster");
// check if we are the main process
if (cluster.isMaster) {
  // get the number of workers
  const numberOfWorkers = Moka.config.WORKERS ? Moka.config.WORKERS : require("os").cpus().length + 1;

  // debug
  log.info(`Preparing ${numberOfWorkers} mokas ...`);

  // create workers
  for (let i = 0; i < numberOfWorkers; i++) {
    // create a worker process
    cluster.fork();
  }

  // when a worker dies
  cluster.on("exit", function (worker) {
    // debug
    log.error(`Moka #${worker.worker.id} died.`);
    // create a new worker process
    cluster.fork();
  });
} else {
  // start moka
  Moka
      .createAppDirectoryIfNecessary()
      .compileApp()
      .createDataStore();

  // check if we are running in a JVM enabled GraalVM
  if (typeof Graal != 'undefined' && typeof Java != 'undefined') {
    // watch app directory
    Moka.watchAppDirectory();
  } else {
    log.warn("Not running in a JVM enabled GraalVM, watching and re-compiling app files is not supported.");
  }

  // load the express module
  const express = require("express");
  // init the express app
  const app = express();

  // load the durations module
  const durations = require("durations");

  // register a request handler
  app.get(/\/[^/]*/, function(request, response) {
    // create and start a new stopwatch
    const stopwatch = durations.stopwatch().start();

    // load the Root class
    const Root = require(`@classes/Root.js`);

    // get the query path
    const queryPath = request.path.substring(1);
    // define the method to be called
    const methodName = queryPath ? queryPath : Moka.config.DEFAULT_METHOD_NAME;

    try {
      // build a Root instance and call the method on it
      (new Root()[methodName])(request, response).then(function() {
        // debug
        log.info(`Request ${request.path} handled in ${stopwatch.stop().duration().format()}`);
      }).catch(error => {
        // debug
        log.error(`Request ${request.path} failed after ${stopwatch.stop().duration().format()}`);
        response.status(500).set("Content-Type", "text/plain").send(error.stack ? error.stack : error);
      });
    } catch (error) {
      // debug
      log.error(`Request ${request.path} failed after ${stopwatch.stop().duration().format()}`);
      response.status(500).set("Content-Type", "text/plain").send(error.stack ? error.stack : error);
    }
  });

  // listen on Moka's default web port
  app.listen(Moka.config.WEB_PORT, function() {
    // debug
    log.info(`Moka #${cluster.worker.id} up and brewing.`);
  });
}
