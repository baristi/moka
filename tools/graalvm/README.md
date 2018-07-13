# GraalVM

## Helper Script

The easiest way to use GraalVM is to execute the provided helper script `graalvm.sh` with any GraalVM command.

```
./graalvm.sh js
```

The above command will start an interactive JS shell, but of course any other GraalVM binary can be executed the same way, simply replace `js` with whatever other binary you want to execute.

The necessary Docker Image (see below) will automatically be built and started in order to execute the GraalVM command.

### Requirements

* Docker has to be installed and `docker` has to be in `PATH`
* `graalvm.sh` needs to be executed with a user having Docker-privileges

### Docker Image

The provided Dockerfile can be used to build an Ubuntu-based GraalVM Docker Image.

```
docker build -t moka-tools-graalvm .
```

Once built, GraalVM binaries can be executed like this:

```
docker run --rm -ti moka-tools-graalvm js
```

The above command will start an interactive JS shell, but of course any other GraalVM binary can be executed the same way, simply replace `js` with whatever other binary you want to execute.
