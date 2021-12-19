const mongoose = require('mongoose');
const config = require('./config.json');

let _db
module.exports = {
  connectToServer: async function (callback) {
    try {
      let url = process.env.url;
      if(url == NULL || url == ""){
        url = config.db.url;
      }
      console.log("Connecting to DataBase...");
      await mongoose.connect(url, {
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