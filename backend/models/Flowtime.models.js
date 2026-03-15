const mongoose = require("mongoose");

const FlowtimeSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Flowtime", FlowtimeSchema);
