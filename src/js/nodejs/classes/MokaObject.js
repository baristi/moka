// load the make config
const config = require("@src/moka.json");
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
      const values = properties.parse(fs.readFileSync(require.resolve(`@app/${this.name}/${config.MAAPING_CONFIG}`), {
        encoding: config.DEFAULT_FILE_ENCODING
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
              localField: key
            };
          break;
          case "object":
            // define an n:1 relation
            mapper.relations.belongsTo[className] = {
              foreignKey: `${className.toLowerCase()}_id`,
              localField: key
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
