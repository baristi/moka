#!/bin/bash

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

# build the Docker Image
if ! docker build -t moka-tools-graalvm -q . 2>/dev/null >&2
then
  echo "Failed to build the GraalVM Docker image."
  exit 2
fi

# run the Docker Image, forwarding the given command
if ! docker run --rm -ti moka-tools-graalvm $@
then
  echo "Failed to run the given command within a GraalVM Docker container."
  exit 3
fi

# end
echo ""
exit 0
