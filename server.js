const express = require("express");
const app = express();
app.use(express.static("."));
app.listen(7777);
console.log("Listening at http://localhost:7777");
