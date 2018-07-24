const express = require("express");
const app = express();

app.get("/", function(request, response) {
  if (Math.random() >= 0.5) {
    Java.type("org.baristi.moka.Moka").getMoka().getFreeRequestEvaluator(function() {
      console.log("Evaluating request single-threaded, but with NodeJS support.");
    });
  } else {
    Java.type("org.baristi.moka.Moka").getMoka().getFreeRequestEvaluator(null).start();
  }


  response.send("HTTP/1.0 200 OK");
});

app.listen(8080, function() {
  console.log("Moka listening on port 8080.");
});
