# use Ubuntu as base image
FROM ubuntu

# define the GraalVM version to download
ENV GRAALVM_VERSION=1.0.0-rc3

    # update the pckages database
RUN apt-get update && \
    # install wegt, wget better supports redirects
    apt-get install -y wget && \
    # go to the opt directory
    cd /opt && \
    # download the latest GraalVM
    wget https://github.com/oracle/graal/releases/download/vm-$GRAALVM_VERSION/graalvm-ce-$GRAALVM_VERSION-linux-amd64.tar.gz && \
    # extract the GraalVM
    tar xzf graalvm-ce-$GRAALVM_VERSION-linux-amd64.tar.gz

# copy the entrypoint script
COPY entrypoint.sh /usr/local/bin
# use the entrypoint script as entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
