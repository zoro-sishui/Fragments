// src/routes/api/delete-id.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Delete a fragment by id for the current user
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug('Deleting fragment by id', { id, ownerId: req.user });

    // Get the fragment to verify it exists
    const fragment = await Fragment.byId(req.user, id);
    
    if (!fragment) {
      logger.warn('Fragment not found for deletion', { id, ownerId: req.user });
      return res.status(404).json(
        createErrorResponse(404, 'Fragment not found')
      );
    }

    // Delete the fragment
    await fragment.delete();

    logger.info('Fragment deleted successfully', { 
      id: fragment.id, 
      ownerId: fragment.ownerId
    });

    // Return success response
    res.status(200).json(createSuccessResponse());

  } catch (err) {
    logger.error('Error deleting fragment', { id: req.params.id, err });
    res.status(500).json(
      createErrorResponse(500, 'Unable to delete fragment')
    );
  }
};
