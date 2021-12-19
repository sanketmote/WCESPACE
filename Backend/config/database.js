config = require("./config.json");
const mongoose = require('mongoose');

let url = process.env.url;
if(url == null || url == ""){
    url = config.db.url;
}
let _db
module.exports = {
  connectToServer: async function (callback) {
    try {
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