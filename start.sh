#!/bin/bash

# define colors
RED="\033[0;31m"
YELLOW="\033[1;33m"
NC="\033[0m"

# switch first argument
case "$1" in
  nodejs)
    if [ -x $(which node) ]
    then
      echo -en $YELLOW
      echo "Starting Moka with local NodeJS."
      echo -en $NC

      # start Moka without a Docker container with local NodeJS
      node src/js/nodejs/start.js
    else
      # print error message
      echo ""
      echo -en $RED
      echo "Failed to start Moka with local NodesJS."
      echo "Please check that NodeJS is installed and your path is configured correctly."
      echo ""
      echo -en $NC
      echo "Alternatively there are two more options to run Moka, either with a NodeJS Docker container (--nodejsvm) or with a GraalVM Docker container (--graalvm)."
      echo ""
      exit 1
    fi

    ;;
  nodejsvm)
    if [ -x $(which docker) ]
    then
      echo -en $YELLOW
      echo "Starting Moka with a NodeJS Docker container."
      echo -en $NC

      # start a NodeJS Docker container running Moka
      docker run --rm -ti -v "$(pwd)":/context -p 8080:8080 node bash -c "cd /context && node src/js/nodejs/start.js"
    else
      # print error message
      echo ""
      echo -en $RED
      echo "Failed to start Moka with a NodesJS Docker container."
      echo "Please check that Docker is installed and your path is configured correctly."
      echo ""
      echo -en $NC
      echo "Alternatively there is one more option to run Moka, with local NodeJS (--nodejs)."
      echo ""
      exit 2
    fi

    ;;
  *)
    if [ -x $(which docker) ]
    then
      echo -en $YELLOW
      echo "Starting Moka with a GraalVM Docker container."
      echo -en $NC

      # start a GraalVM Docker container running Moka
      tools/graalvm/graalvm.sh node \
          --polyglot \
          --jvm \
          --jvm.classpath=build/java:$(for file in $(ls lib/java/target/dependency); do echo -n lib/java/target/dependency/$file:; done) \
          src/js/nodejs/start.js
    else
      # print error message
      echo ""
      echo -en $RED
      echo "Failed to start Moka with a GraalVM Docker container."
      echo "Please check that Docker is installed and your path is configured correctly."
      echo ""
      echo -en $NC
      echo "Alternatively there is one more option to run Moka, with local NodeJS (--nodejs)."
      echo ""
      exit 2
    fi
esac

# return NodeJS's or Docker's exit code
exit $?
