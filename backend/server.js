const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const routes = require("./routes/Flowtime.routes");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors())

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log(`connected to mongodb `))
  .catch((err) => console.error(`error connecting to mongodb: ${err}`));

app.use(routes);

app.listen(PORT, () => console.log(`listening on port ${PORT}`));
