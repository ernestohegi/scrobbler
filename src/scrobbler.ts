import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Scrobbler is running!");
});

app.listen(PORT, () => {
  console.log(`Scrobbler is listening on port ${PORT}`);
});
