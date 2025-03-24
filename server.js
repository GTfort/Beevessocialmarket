const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

// Serve static files from Frontend directory
app.use(express.static(path.join(__dirname, "Frontend")));

// Route all requests to index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "Frontend", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
