// src/routes/api/get-id.js

const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get a fragment by id for the current user
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug('Getting fragment by id', { id, ownerId: req.user });

    // Get the fragment
    const fragment = await Fragment.byId(req.user, id);
    
    if (!fragment) {
      logger.warn('Fragment not found', { id, ownerId: req.user });
      return res.status(404).json(
        createErrorResponse(404, 'Fragment not found')
      );
    }

    // Get the fragment data
    const data = await fragment.getData();
    
    if (!data) {
      logger.warn('Fragment data not found', { id, ownerId: req.user });
      return res.status(404).json(
        createErrorResponse(404, 'Fragment data not found')
      );
    }

    logger.info('Fragment retrieved successfully', { 
      id: fragment.id, 
      ownerId: fragment.ownerId, 
      type: fragment.type,
      size: fragment.size 
    });

    // Set the appropriate content type and return the data
    res.setHeader('Content-Type', fragment.type);
    res.status(200).send(data);

  } catch (err) {
    logger.error('Error getting fragment', { id: req.params.id, err });
    res.status(500).json(
      createErrorResponse(500, 'Unable to get fragment')
    );
  }
};