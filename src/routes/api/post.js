// src/routes/api/post.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const contentType = require('content-type');
const logger = require('../../logger');

/**
 * Create a new fragment for the current user
 */
module.exports = async (req, res) => {
  try {
    logger.debug('Creating new fragment', { ownerId: req.user, contentType: req.get('Content-Type') });

    // Check if we have a supported content type
    if (!req.get('Content-Type')) {
      logger.warn('Missing Content-Type header');
      return res.status(400).json(
        createErrorResponse(400, 'Content-Type header is required')
      );
    }

    // Parse content type
    let parsedType;
    try {
      parsedType = contentType.parse(req.get('Content-Type'));
    } catch (err) {
      logger.warn('Invalid Content-Type header', { contentType: req.get('Content-Type'), err });
      return res.status(400).json(
        createErrorResponse(400, 'Invalid Content-Type header')
      );
    }

    // Check if the content type is supported
    if (!Fragment.isSupportedType(parsedType.type)) {
      logger.warn('Unsupported Content-Type', { type: parsedType.type });
      return res.status(415).json(
        createErrorResponse(415, `Unsupported Content-Type: ${parsedType.type}`)
      );
    }

    // Check if we have body data
    if (!Buffer.isBuffer(req.body)) {
      logger.warn('Invalid body data - expected Buffer');
      return res.status(400).json(
        createErrorResponse(400, 'Invalid body data')
      );
    }

    // Validate JSON if content type is application/json
    if (parsedType.type === 'application/json') {
      try {
        JSON.parse(req.body.toString());
      } catch (err) {
        logger.warn('Invalid JSON body', { err });
        return res.status(400).json(
          createErrorResponse(400, 'Invalid JSON body')
        );
      }
    }

    // Create the fragment
    const fragment = new Fragment({
      ownerId: req.user,
      type: req.get('Content-Type'),
      size: req.body.length
    });

    // Save the fragment metadata and data
    await fragment.save();
    await fragment.setData(req.body);

    logger.info('Fragment created successfully', { 
      id: fragment.id, 
      ownerId: fragment.ownerId, 
      type: fragment.type,
      size: fragment.size 
    });

    // Create the Location header URL
    const apiUrl = process.env.API_URL || `http://${req.headers.host}`;
    const location = `${apiUrl}/v1/fragments/${fragment.id}`;

    // Return success response with Location header
    res.setHeader('Location', location);
    res.status(201).json(createSuccessResponse({
      fragment: {
        id: fragment.id,
        ownerId: fragment.ownerId,
        created: fragment.created,
        updated: fragment.updated,
        type: fragment.type,
        size: fragment.size
      }
    }));

  } catch (err) {
    logger.error('Error creating fragment', { err });
    res.status(500).json(
      createErrorResponse(500, 'Unable to create fragment')
    );
  }
};