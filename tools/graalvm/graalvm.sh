#!/bin/bash

# define colors
RED="\033[0;31m"
YELLOW="\033[1;33m"
NC="\033[0m"

# check if no command was given
if [ -z "$@" ]
then
  # print usage
  echo "Usage: $0 <command>"
  echo "  <command> A GraalVM command, starting with a GraalVM program, e.g. js."
  exit 1
fi

# go to the GraalVM directory
cd $(dirname "$0")

# pull or build the Docker Image
if [ "$(docker images -q baristi/graalvm | wc -l)" -eq 0 ] && ! docker pull baristi/graalvm && \
    ! docker build -t baristi/graalvm .
then
  # print error message
  echo -en $RED
  echo "Failed to build the GraalVM Docker image."
  echo -en $NC
  exit 2
elif [ "$(docker images -q baristi/graalvm | wc -l)" -ne 0 ]
then
  # print warning message
  echo -en $YELLOW
  echo -n "In order to speedup start time, Docker image baristi/graalvm is not updated automatically. " > /dev/stderr
  echo "Execute 'docker pull baristi/graalvm', if you want to check and update it yourself." > /dev/stderr
  echo -e $NC
fi

# run the Docker Image, forwarding the given command
if ! docker run --rm -ti baristi/graalvm $@
then
  # print error message
  echo -en $RED
  echo "Failed to run the given command within a GraalVM Docker container."
  echo -en $NC
  exit 3
fi

# end
echo ""
exit 0
