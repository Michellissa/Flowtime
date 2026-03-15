const FlowtimeModels = require("../models/Flowtime.models");

module.exports.getFlowtime = async (req, res) => {
  const Flowtime = await FlowtimeModels.find();
  res.send(Flowtime);
};

module.exports.saveFlowtime = async (req, res) => {
  console.log(req.body);

  const { text } = req.body;

  FlowtimeModels.create({ text }).then((data) => {
    console.log("added Successfully...");
    console.log(data);
    res.send(data);
  });
};

module.exports.updateFlowtime = async (req, res) => {
  const { _id, text } = req.body;

  FlowtimeModels.findByIdAndUpdate(_id, { text })
    .then(() => res.send("updated successfully..."))
    .catch((err) => console.log(err));
};

module.exports.deleteFlowtime = async (req, res) => {
  const { _id, text } = req.body;

  FlowtimeModels.findByIdAndDelete(_id)
    .then(() => res.send("deleted successfully..."))
    .catch((err) => console.log(err));
};