const Record = require("js-data").Record;

module.exports = class MokaObject extends Record {

  constructor(data = {}) {
    super(data);
  }

  static async getById(id) {
    return await store.find(this.name, id);
  }

}
