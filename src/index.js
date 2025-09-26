require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const licenseRoutes = require('./routes/license');
const { PORT, MONGO_URL } = require('./config');

const app = express();
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60 * 1000, max: 60 }));
app.use('/api', licenseRoutes);

mongoose.connect(MONGO_URL)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`License API on :${PORT}`));
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
