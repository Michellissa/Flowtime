const FlowtimeModels = require("../models/Flowtime.models");
const Flowtime = require("../models/Flowtime.models");

module.exports.getFlowtime = async (req, res) => {
  const Flowtime = await FlowtimeModels.find();
  res.send(Flowtime);
};

module.exports.saveFlowtime = async (req, res) => {
  const { text } = req.body;

  FlowtimeModels.create({ text }).then((data) => {
    console.log("added Successfully...");
    console.log(data);
    res.send(data);
  });
};
