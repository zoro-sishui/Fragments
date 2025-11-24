// src/model/data/index.js

// If AWS_REGION is set, use the AWS backend.
// Otherwise, default to the in-memory backend.
module.exports = process.env.AWS_REGION
  ? require('./aws')
  : require('./memory');
