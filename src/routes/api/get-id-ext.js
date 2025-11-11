// src/routes/api/get-id-ext.js

const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
const contentType = require('content-type');

// Lazy init markdown-it to avoid cost unless needed
let mdRenderer;
function getMarkdownRenderer() {
  if (!mdRenderer) {
  const MarkdownIt = require('markdown-it');
    mdRenderer = new MarkdownIt({ html: false, linkify: true, typographer: true });
  }
  return mdRenderer;
}

// Map extension to mime type we support
const extToMime = {
  md: 'text/markdown',
  markdown: 'text/markdown',
  html: 'text/html',
  htm: 'text/html',
};

/**
 * Get a fragment by id with extension-based conversion
 * Currently supports: Markdown (.md) -> HTML (.html)
 */
module.exports = async (req, res) => {
  try {
    const { id, ext } = req.params;
    logger.debug('Getting fragment by id with extension', { id, ext, ownerId: req.user });

    const fragment = await Fragment.byId(req.user, id);
    if (!fragment) {
      logger.warn('Fragment not found (ext)', { id, ownerId: req.user });
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // Determine target mime based on extension
    const targetMime = extToMime[(ext || '').toLowerCase()];
    if (!targetMime) {
      logger.warn('Unsupported extension requested', { id, ext });
      return res.status(415).json(createErrorResponse(415, `Unsupported extension: .${ext}`));
    }

    // Get original data
    const data = await fragment.getData();
    if (!data) {
      logger.warn('Fragment data not found (ext)', { id, ownerId: req.user });
      return res.status(404).json(createErrorResponse(404, 'Fragment data not found'));
    }

    // If same type requested, return as-is
    const originalMime = contentType.parse(fragment.type).type; // without charset
    if (originalMime === targetMime) {
      // Preserve original Content-Type with charset if present
      res.setHeader('Content-Type', fragment.type);
      return res.status(200).send(data);
    }

    // Handle markdown -> html conversion only
    if (originalMime === 'text/markdown' && targetMime === 'text/html') {
      const markdown = data.toString('utf8');
      const html = getMarkdownRenderer().render(markdown);
      res.setHeader('Content-Type', contentType.format({ type: 'text/html', parameters: { charset: 'utf-8' } }));
      return res.status(200).send(html);
    }

    logger.warn('Unsupported conversion requested', { from: originalMime, to: targetMime });
    return res.status(415).json(
      createErrorResponse(415, `Conversion from ${originalMime} to ${targetMime} is not supported`)
    );
  } catch (err) {
    logger.error('Error getting fragment with extension', { id: req.params.id, ext: req.params.ext, err });
    return res.status(500).json(createErrorResponse(500, 'Unable to get fragment'));
  }
};
