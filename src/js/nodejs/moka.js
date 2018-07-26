// load the fs module
const fs = require("fs");
// load the path module
const path = require("path");
// load the make config
const config = require("./moka.json");

// define the moka object
const moka = {

  /**
   * Creates the app directory, if it doesn't exist yet.
   *
   * @return {moka}
   *  This, for method chaining.
   */
  createAppDirectoryIfNecessary: function() {
    // check if the app directory doesn't exist yet
    if (!fs.existsSync(config.APP_DIRECTORY)) {
      // create the app directory
      fs.mkdirSync(config.APP_DIRECTORY);
    }

    // return this for method chaining
    return this;
  },

  /**
   * Start watching the app directory.
   * The whole app is re-compiled on whatever change in the app directory.
   *
   * @return {moka}
   *  This, for method chaining.
   */
  watchAppDirectory: function() {
    // load the file watcher class
    const FileWatcher = Java.type("org.baristi.moka.utils.FileWatcher");

    /**
     * Handles a file watcher's change event.
     *
     * @return {Undefined}
     *  No return value.
     */
    function changeHandler(path) {
      // compile the file's class
      moka.compileClass(path.substring(config.APP_DIRECTORY.length + 1).split("/")[0]);
    }

    // build a file watcher, re-compiling the app on whatever change in the app directory
    const watcher = new FileWatcher(config.APP_DIRECTORY, changeHandler, changeHandler, changeHandler);

    // check if starting the file watcher succeeds
    if (watcher.start()) {
      // start processing file watcher events as soon and as often as possible
      // when there is nothing to process, processing shouldn't take any time at all, so processing unnecessaril often
      // shouldn't actually block the event loop
      const interval = require("timers").setInterval(watcher.process, 1);
    }

    // return this for method chaining
    return this;
  },

  /**
   * Compiles the app.
   * Compiling the app compiles all classes.
   *
   * @return {moka}
   *  This, for method chaining.
   */
  compileApp: function() {
    // read all app's sub-directories
    fs.readdir(config.APP_DIRECTORY, function(error, directories) {
      // loop all app's sub-directories
      directories.forEach(directory => {
        // stat the current directory (might not be a directory, could also be a file)
        fs.stat(path.join(config.APP_DIRECTORY, directory), function(error, stats) {
          // check if the current directory actually is a directory
          if (!error && stats.isDirectory()) {
            // compile the current directory
            moka.compileClass(directory);
          }
        });
      });
    });

    // return this for method chaining
    return this;
  },

  /**
   * Compiles the given class.
   * Compiling means joining all methods in the classe's directory into one single class (file).
   *
   * @return {moka}
   *  This, for method chaining.
   */
  compileClass: function(className) {
    // read all directory's files
    fs.readdir(path.join(config.APP_DIRECTORY, className), function(error, files) {
      // check if reading the directry failed
      if (error) {
        // ignore
        return;
      }

      // the methods
      var methods = "";

      // loop all directory's files
      files.forEach(file => {
        // build the method name
        const methodName = path.basename(file, path.extname(file));
        // load the method's code
        const code = fs.readFileSync(path.join(config.APP_DIRECTORY, className, file));

        // add the current method to the methods
        methods += `${methodName}(request, response) {${code}} `;
      });

      // build the compiled classe's file name
      const fileName = `${config.BUILD_DIRECTORY}/${className}.js`;
      // write the compiled class file to the filesystem
      fs.writeFileSync(fileName, `module.exports = class ${className} {${methods}}`);

      // evict the class file from Node's require cache
      delete require.cache[`${fileName}`];
    });

    // return this for method chaining
    return this;
  }
};

// export the moka object
module.exports = moka;
