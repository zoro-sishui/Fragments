// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');

// Create a router on which to mount our API endpoints
const router = express.Router();

// Support sending various Content-Types on the body up to 5M in size
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      // See if we can parse this content type. If we can, `req.body` will be
      // a Buffer (e.g., `Buffer.isBuffer(req.body) === true`). If not, `req.body`
      // will be equal to an empty Object `{}` and `Buffer.isBuffer(req.body) === false`
      try {
        const { type } = contentType.parse(req.get('Content-Type') || 'text/plain');
        return Fragment.isSupportedType(type);
      } catch {
        return false;
      }
    },
  });

// Define our routes
router.get('/fragments', require('./get'));
router.post('/fragments', rawBody(), require('./post'));
// Return fragment possibly converted by extension (must be before :id)
router.get('/fragments/:id.:ext', require('./get-id-ext'));
// Return only fragment metadata
router.get('/fragments/:id/info', require('./get-id-info'));
router.get('/fragments/:id', require('./get-id'));
router.delete('/fragments/:id', require('./delete-id'));

module.exports = router;