const express = require("express");
const mongoose = require("mongoose");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log(`connected to mongodb `))
  .catch((err) => console.error(`error connecting to mongodb: ${err}`));

app.listen(PORT, () => console.log(`listening on port ${PORT}`));
