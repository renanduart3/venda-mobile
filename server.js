const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/validate-receipt', (req, res) => {
  const { receipt, platform } = req.body;

  console.log('Received receipt for validation:');
  console.log('Platform:', platform);
  console.log('Receipt:', receipt);

  // Simulate a successful validation
  res.json({
    success: true,
    isPremium: true,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});