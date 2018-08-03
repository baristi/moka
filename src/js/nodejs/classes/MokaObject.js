// load the Moka class
const Moka = require("@src/classes/Moka.js");
// load js-data's Record class
const Record = require("js-data").Record;

// export the MokaObject class
module.exports = class MokaObject extends Record {

  /**
   * Does, whatever the parent constructor does.
   */
  constructor(data = {}) {
    // call the parent constructor
    super(data);

    // closure caching
    const instance = this;

    /**
     * Define a lazy loading property for accessing the given relation.
     *
     * @param {Object} relation
     *  A relation from the mapper config relations.
     * @return {Undefined}
     *  No return value.
     */
    function defineLazyLoader(relation) {
      // define the lazy loading property
      Object.defineProperty(instance, relation.localField.substring(1), {
        get: function() {
          // return a promise
          return new Promise(resolve => {
            // once the relation is loaded
            this.loadRelations([relation.localField]).then(() => {
              // resolve the promise with what was loaded for the relation
              resolve(this[relation.localField])
            })
          });
        }
      });
    }

    // get the mapper config
    const mapperConfig = this.constructor.getMapperConfig();
    // loop all has many relations and define lazy loader properties
    Object.values(mapperConfig.relations.hasMany).forEach(defineLazyLoader);
    // loop all has many relations and define lazy loader properties
    Object.values(mapperConfig.relations.belongsTo).forEach(defineLazyLoader);
  }

  /**
   * Loads and returns an object from the data store.
   *
   * @param {String|Number} id
   *  The object's identifier.
   * @return {MokaObject}
   *  The corresponding object.
   */
  static async getById(id) {
    // load, wait and return the corresponding object from the data store
    return await store.find(this.name, id);
  }

  /**
   * The empty mapper default config.
   *
   * @var {Object}
   */
  static get DEFAULT_MAPPER_CONFIG() {
    // return the empty mapper default config
    return {
      recordClass: this,
      relations: {
        hasMany: {},
        belongsTo: {}
      }
    };
  }

  /**
   * Returns the js-data mapper config for this class.
   *
   * @return {Object}
   *  The js-data mapper config for this class.
   */
  static getMapperConfig() {
    // get the empty default config
    var mapper = this.DEFAULT_MAPPER_CONFIG;

    try {
      // load the properties module
      const properties = require("properties");
      // load the fs module
      const fs = require("fs");

      // load the classe's data mapping file
      const values = properties.parse(fs.readFileSync(require.resolve(`@app/${this.name}/${Moka.config.MAPPING_CONFIG}`), {
        encoding: Moka.config.DEFAULT_FILE_ENCODING
      }));

      // loop all defined properties
      for (let key in values) {
        // get the current propertie's type and class name
        let [type, className] = values[key].split(/[()]/);

        // switch the type
        switch (type) {
          case "collection":
            // define an 1:n relation
            mapper.relations.hasMany[className] = {
              foreignKey: `${this.name.toLowerCase()}_id`,
              localField: `_${key}`
            };
          break;
          case "object":
            // define an n:1 relation
            mapper.relations.belongsTo[className] = {
              foreignKey: `${className.toLowerCase()}_id`,
              localField: `_${key}`
            }
          break;
        }
      }
    } catch (error) {
      // return the empty mapper default config
      return this.DEFAULT_MAPPER_CONFIG;
    }

    // return the mapper config
    return mapper;
  }

}
