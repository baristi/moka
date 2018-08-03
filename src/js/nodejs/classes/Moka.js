// load the fs module
const fs = require("fs");
// load the path module
const path = require("path");

/**
 * Returns the currently defined classes.
 *
 * @return {String[]}
 *  The names of the currently defined classes.
 */
function getClasses() {
  // return the currently defined classes
  return fs.readdirSync(Moka.config.APP_DIRECTORY).filter(file => {
    // check if the current file is a directory
    return fs.statSync(path.join(Moka.config.APP_DIRECTORY, file)).isDirectory();
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
  delete require.cache[`${Moka.config.BUILD_DIRECTORY}/${className}.js`];
}

// define the moka class
class Moka {

  static get config() {
    return Object.assign(
      {},
      require("@src/moka.json"),
      require.resolve("@app/app.json") ? require("@app/app.json") : {}
    );
  }

  /**
   * Creates the app directory, if it doesn't exist yet.
   *
   * @return {Moka}
   *  This, for method chaining.
   */
  static createAppDirectoryIfNecessary() {
    // check if the app directory doesn't exist yet
    if (!fs.existsSync(Moka.config.APP_DIRECTORY)) {
      // create the app directory
      fs.mkdirSync(Moka.config.APP_DIRECTORY);
    }

    // return this for method chaining
    return Moka;
  }

  /**
   * Start watching the app directory.
   * The whole app is re-compiled on whatever change in the app directory.
   *
   * @return {Moka}
   *  This, for method chaining.
   */
  static watchAppDirectory() {
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
      const info = path.parse(path.relative(Moka.config.APP_DIRECTORY, file));

      // check if the file is a JSON file
      if (info.ext == ".json") {
        // evict the JSON file from Node's require cache
        delete require.cache[file];
      }

      // check if the file is the app's database configuration file
      if (!info.dir && info.base == Moka.config.APP_DB_CONFIG) {
        // re-create the data store
        Moka.createDataStore();
      }

      // check if the file is inside a class directory
      if (info.dir) {
        // compile the file's class
        Moka.compileClass(info.dir.split("/")[0]);
      }
    }

    // build a file watcher, re-compiling the app on whatever change in the app directory
    const watcher = new FileWatcher(Moka.config.APP_DIRECTORY, changeHandler, changeHandler, changeHandler);

    // check if starting the file watcher succeeds
    if (watcher.start()) {
      // start processing file watcher events as soon and as often as possible
      // when there is nothing to process, processing shouldn't take any time at all, so processing unnecessaril often
      // shouldn't actually block the event loop
      const interval = require("timers").setInterval(watcher.process, 1);
    }

    // return this for method chaining
    return Moka;
  }

  /**
   * Compiles the app.
   * Compiling the app compiles all classes.
   *
   * @return {Moka}
   *  This, for method chaining.
   */
  static compileApp() {
    // loop all classes
    getClasses().forEach(className => {
      // compile the current directory
      Moka.compileClass(className);
    });

    // return this for method chaining
    return Moka;
  }

  /**
   * Compiles the given class.
   * Compiling means joining all methods in the classe's directory into one single class (file).
   *
   * @return {Moka}
   *  This, for method chaining.
   */
  static compileClass(className) {
    // the methods
    var methods = "";

    // read all directory's files
    fs.readdirSync(path.join(Moka.config.APP_DIRECTORY, className)).forEach(file => {
      // build the method name
      const methodName = path.basename(file, path.extname(file));
      // load the method's code
      const code = fs.readFileSync(path.join(Moka.config.APP_DIRECTORY, className, file));

      // add the current method to the methods
      methods += `${methodName}(request, response) {async function wrapper(resolve, reject) {try {${code}} catch(error) {reject(error)} ; resolve()} ; return new Promise(wrapper) } `;
    });

    // build the compiled classe's file name
    const fileName = `${Moka.config.BUILD_DIRECTORY}/${className}.js`;
    // write the compiled class file to the filesystem
    fs.writeFileSync(fileName, `const MokaObject = require("@src/classes/MokaObject.js") ; const ${className} = class ${className} extends MokaObject {constructor(data = {}) {super(data)} ${methods}} ; store.defineMapper("${className}", ${className}.getMapperConfig()) ; module.exports = ${className}`);

    // evict the class file from Node's require cache
    evictClassFromRequireCache(className);

    // FIXME re-creating the whole data store doesn't seem to be efficient
    // re-create the data store
    Moka.createDataStore();

    // TODO re-activate the below once the store doesn't need to be re-created (completely and from scratch) anymore
    // re-require the class and make it globally available
    // global[className] = require(`@classes/${className}.js`);

    // return this for method chaining
    return Moka;
  }

  /**
   * Creates or re-creates Moka's data store.
   *
   * @return {Moka}
   *  This, for method chaining.
   */
  static createDataStore() {
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

    // loop all classes
    getClasses().forEach(className => {
      // evict the current classe's file from Node's require cache
      evictClassFromRequireCache(className);
      // re-require the current class and make it globally available
      global[className] = require(`@classes/${className}.js`);
    });

    // return this for method chaining
    return Moka;
  }
}

// export the moka class
module.exports = Moka;
