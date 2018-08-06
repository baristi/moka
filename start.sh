#!/bin/bash

# switch first argument
case "$1" in
  nodejs)
    # start a NodeJS Docker container running Moka
    docker run --rm -ti -v "$(pwd)":/context -p 8080:8080 node bash -c "cd /context && node src/js/nodejs/start.js"
    ;;
  *)
    # start a GraalVM Docker container running Moka
    tools/graalvm/graalvm.sh node \
        --polyglot \
        --jvm \
        --jvm.classpath=build/java:$(for file in $(ls lib/java/target/dependency); do echo -n lib/java/target/dependency/$file:; done) \
        src/js/nodejs/start.js
esac

# return Docker's exit code
exit $?
