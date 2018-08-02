// load the fs module
const fs = require("fs");
// load the path module
const path = require("path");
// load the make config
const config = require("./moka.json");

/**
 * Returns the currently defined classes.
 *
 * @return {String[]}
 *  The names of the currently defined classes.
 */
function getClasses() {
  // return the currently defined classes
  return fs.readdirSync(config.APP_DIRECTORY).filter(file => {
    // check if the current file is a directory
    return fs.statSync(path.join(config.APP_DIRECTORY, file)).isDirectory();
  });
}

/**
 * Evicts the compiled class files from Node's require cache.
 *
 * @return {Undefined}
 *  No return value.
 */
function evictClassesFromRequireCache() {
  // loop all classes
  getClasses().forEach(className => {
    // evict the current classe's file from Node's require cache
    evictClassFromRequireCache(className);
  });
}

/**
 * Evicts a class file from Node's require cache.
 *
 * @param {String} className
 *  The name of the class which's class file to remove from Node's require cache.
 * @return {Undefined}
 *  No return value.
 */
function evictClassFromRequireCache(className) {
  // evict the class file from Node's require cache
  delete require.cache[`${config.BUILD_DIRECTORY}/${className}.js`];
}

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
    function changeHandler(file) {
      // parse the file's path
      const info = path.parse(path.relative(config.APP_DIRECTORY, file));

      // check if the file is a JSON file
      if (info.ext == ".json") {
        // evict the JSON file from Node's require cache
        delete require.cache[file];
      }

      // check if the file is the app's database configuration file
      if (!info.dir && info.base == config.APP_DB_CONFIG) {
        // re-create the data store
        moka.createDataStore();
      }

      // check if the file is inside a class directory
      if (info.dir) {
        // compile the file's class
        moka.compileClass(info.dir.split("/")[0]);
      }
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
    // loop all classes
    getClasses().forEach(className => {
      // compile the current directory
      moka.compileClass(className);
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
    // the methods
    var methods = "";

    // read all directory's files
    fs.readdirSync(path.join(config.APP_DIRECTORY, className)).forEach(file => {
      // build the method name
      const methodName = path.basename(file, path.extname(file));
      // load the method's code
      const code = fs.readFileSync(path.join(config.APP_DIRECTORY, className, file));

      // add the current method to the methods
      methods += `${methodName}(request, response) {async function wrapper(resolve, reject) {try {${code}} catch(error) {reject(error)} ; resolve()} ; return new Promise(wrapper) } `;
    });

    // build the compiled classe's file name
    const fileName = `${config.BUILD_DIRECTORY}/${className}.js`;
    // write the compiled class file to the filesystem
    fs.writeFileSync(fileName, `const MokaObject = require("${config.APP_DIRECTORY}/../src/js/nodejs/classes/MokaObject.js"); module.exports = class ${className} extends MokaObject {constructor(data = {}) {super(data);} ${methods}}`);

    // evict the class file from Node's require cache
    evictClassFromRequireCache(className);

    // FIXME re-creating the whole data store doesn't seem to be efficient
    // re-create the data store
    this.createDataStore();

    // return this for method chaining
    return this;
  },

  /**
   * Creates or re-creates Moka's data store.
   *
   * @return {moka}
   *  This, for method chaining.
   */
  createDataStore: function() {
    // load the SQL adapter module
    const SqlAdapter = require("js-data-sql").SqlAdapter;
    // re-create the SQL adapter using the app's db settings
    const sqlAdapter = new SqlAdapter({
      knexOpts: require("@app/db.json")
    });

    // load the data store module
    const DataStore = require("js-data").DataStore;
    // create the data store
    const store = new DataStore();

    // register the SQL adapater with the data store
    store.registerAdapter("sql", sqlAdapter, {
      default: true
    });

    // make the data store globally available
    global.store = store;

    // evict classes from Node's rquire cache
    evictClassesFromRequireCache();

    // return this for method chaining
    return this;
  }
};

// export the moka object
module.exports = moka;
