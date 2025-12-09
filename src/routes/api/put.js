const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const contentType = require('content-type');
const logger = require('../../logger');

/**
 * Update an existing fragment for the current user
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug('Updating fragment', { id, ownerId: req.user, contentType: req.get('Content-Type') });

    // Check if it has a supported content type
    if (!req.get('Content-Type')) {
      logger.warn('Missing Content-Type header');
      return res.status(400).json(
        createErrorResponse(400, 'Content-Type header is required')
      );
    }

    // Get the fragment to check if  it exists
    const fragment = await Fragment.byId(req.user, id);
    
    if (!fragment) {
      logger.warn('Fragment not found for update', { id, ownerId: req.user });
      return res.status(404).json(
        createErrorResponse(404, 'Fragment not found')
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

    // Check if the content type matches the existing fragment's type
    if (parsedType.type !== fragment.type) {
      logger.warn('Content-Type mismatch', { expected: fragment.type, actual: parsedType.type });
      return res.status(400).json(
        createErrorResponse(400, `Content-Type mismatch: expected ${fragment.type}`)
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

    // Update the fragment data
    await fragment.setData(req.body);

    logger.info('Fragment updated successfully', { 
      id: fragment.id, 
      ownerId: fragment.ownerId, 
      type: fragment.type,
      size: fragment.size 
    });

    // Return success response
    res.status(200).json(createSuccessResponse({
      fragment: {
        id: fragment.id,
        ownerId: fragment.ownerId,
        created: fragment.created,
        updated: fragment.updated,
        type: fragment.type,
        size: fragment.size,
        formats: fragment.formats
      }
    }));

  } catch (err) {
    logger.error('Error updating fragment', { id: req.params.id, err });
    res.status(500).json(
      createErrorResponse(500, 'Unable to update fragment')
    );
  }
};
