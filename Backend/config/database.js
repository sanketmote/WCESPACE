const mongoose = require('mongoose');
const config = require('./config.json');

let _db
module.exports = {
  connectToServer: async function (callback) {
    try {
      console.log("Connecting to DataBase...");
      await mongoose.connect(config.db.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }, (err, client) => {
        console.log("Almost Connected to DataBase");
        // _db = client.db("organmanagement")
        return callback(err)
      })
    } catch (e) {
      throw e
    }
  },
  getDB: function () {
    return _db;
  }
}