// load the cluster module
const cluster = require("cluster");

// check if we are the main process
if (cluster.isMaster) {
  // get the number of CPUs
  const numberOfCPUs = require("os").cpus().length;

  // create a worker process for each CPU
  for (var i = 0; i < numberOfCPUs; i++) {
    // create a worker process
    cluster.fork();
  }

  // when a worker dies
  cluster.on("exit", function (worker) {
    // debug
    console.log("Moka #%d died.", worker.id);
    // create a new worker process
    cluster.fork();
  });

  // debug
  console.log("Moka up and brewing.");
} else {
  // load the express module
  const express = require("express");
  // init the express app
  const app = express();

  // register a request handler
  app.get("/", function(request, response) {
    response.send("I am brewing some ☕.");
  });

  // listen on Moka's default web port
  app.listen(8080, function() {
    // debug
    console.log("Moka #%d up and brewing.", cluster.worker.id);
  });
}
