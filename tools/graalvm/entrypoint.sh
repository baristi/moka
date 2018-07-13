#!/bin/bash

# add GraalVM's bin directories to the path
export PATH=$PATH:/opt/graalvm-ce-$GRAALVM_VERSION/bin:/opt/graalvm-ce-$GRAALVM_VERSION/jre/bin

# execute the given command
$@
