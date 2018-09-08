# use Ubuntu as base image
FROM ubuntu as build

# define the GraalVM version to download
ENV GRAALVM_VERSION=1.0.0-rc6

# update the pckages database and install wget
RUN apt-get update && \
    apt-get install -y wget bsdtar
# go to the opt directory, download the latest GraalVM and extract it
RUN cd /opt && \
    wget https://github.com/oracle/graal/releases/download/vm-$GRAALVM_VERSION/graalvm-ce-$GRAALVM_VERSION-linux-amd64.tar.gz && \
    bsdtar xzf graalvm-ce-$GRAALVM_VERSION-linux-amd64.tar.gz && \
    mv graalvm-ce-$GRAALVM_VERSION graalvm-ce

# use Ubuntu as base image
FROM ubuntu
# copy GraalVM over from the build stage
COPY --from=build /opt/graalvm-ce /opt/graalvm-ce

# copy the entrypoint script
COPY entrypoint.sh /usr/local/bin
# use the entrypoint script as entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
