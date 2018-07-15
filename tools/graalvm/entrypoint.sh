#!/bin/bash

# add GraalVM's bin directories to the path
export PATH=$PATH:/opt/graalvm-ce/bin:/opt/graalvm-ce/jre/bin

# execute the given command
$*
