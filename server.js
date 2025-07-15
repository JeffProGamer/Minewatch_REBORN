const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for any route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'minewatch.html'));
});

app.listen(PORT, () => {
  console.log(`MineWatch site running at http://localhost:${PORT}`);
});
