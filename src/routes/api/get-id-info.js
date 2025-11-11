// src/routes/api/get-id-info.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get metadata for a fragment by id for the current user
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug('Getting fragment metadata', { id, ownerId: req.user });

    const fragment = await Fragment.byId(req.user, id);
    if (!fragment) {
      logger.warn('Fragment not found (info)', { id, ownerId: req.user });
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    logger.info('Fragment metadata retrieved', {
      id: fragment.id,
      ownerId: fragment.ownerId,
      type: fragment.type,
      size: fragment.size,
    });

    return res.status(200).json(
      createSuccessResponse({
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size,
        },
      })
    );
  } catch (err) {
    logger.error('Error getting fragment metadata', { id: req.params.id, err });
    return res.status(500).json(createErrorResponse(500, 'Unable to get fragment metadata'));
  }
};
