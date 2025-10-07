// src/routes/api/get.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get a list of fragments for the current user
 */
module.exports = async (req, res) => {
  try {
    logger.debug('Getting fragments for user', { ownerId: req.user });

    // Check if we should expand fragments to full objects
    const expand = req.query.expand === '1' || req.query.expand === 'true';
    
    // Get fragments for the user
    const fragments = await Fragment.byUser(req.user, expand);
    
    logger.info('Retrieved fragments for user', { 
      ownerId: req.user, 
      count: fragments.length,
      expand 
    });

    res.status(200).json(createSuccessResponse({
      fragments
    }));

  } catch (err) {
    logger.error('Error getting fragments', { ownerId: req.user, err });
    res.status(500).json(
      createErrorResponse(500, 'Unable to get fragments')
    );
  }
};