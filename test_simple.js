import express from "express";
const app = express();
app.get("/", (req, res) => res.send("Simple Server OK"));
app.listen(9001, () => console.log("Test Server started on 9001"));
