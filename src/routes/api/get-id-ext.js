// src/routes/api/get-id-ext.js

const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
const contentType = require('content-type');
const sharp = require('sharp');
const yaml = require('yaml');

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
  txt: 'text/plain',
  md: 'text/markdown',
  html: 'text/html',
  csv: 'text/csv',
  json: 'application/json',
  yaml: 'application/yaml',
  yml: 'application/yaml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

/**
 * Get a fragment by id with extension-based conversion
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

    // Get original mime type
    const originalMime = contentType.parse(fragment.type).type; 

    // If same type requested, return as-is
    if (originalMime === targetMime) {
      res.setHeader('Content-Type', fragment.type);
      return res.status(200).send(data);
    }

    let convertedData;
    let convertedType = targetMime;

    // Text conversions
    if (originalMime.startsWith('text/') || originalMime === 'application/json' || originalMime === 'application/yaml') {
      const textData = data.toString('utf8');

      // text/markdown -> text/html
      if (originalMime === 'text/markdown' && targetMime === 'text/html') {
        convertedData = getMarkdownRenderer().render(textData);
      }
      // Any text/json/yaml -> text/plain
      else if (targetMime === 'text/plain') {
        convertedData = textData;
      }
      // application/json -> application/yaml
      else if (originalMime === 'application/json' && targetMime === 'application/yaml') {
        const jsonObj = JSON.parse(textData);
        convertedData = yaml.stringify(jsonObj);
      }
      // application/yaml -> application/json
      else if (originalMime === 'application/yaml' && targetMime === 'application/json') {
        const yamlObj = yaml.parse(textData);
        convertedData = JSON.stringify(yamlObj);
      }
      // text/csv -> application/json
      else if (originalMime === 'text/csv' && targetMime === 'application/json') {
        // Simple CSV to JSON conversion (assuming header row)
        const lines = textData.trim().split('\n');
        const headers = lines[0].split(',');
        const result = lines.slice(1).map(line => {
          const obj = {};
          const currentline = line.split(',');
          headers.forEach((header, i) => {
            obj[header] = currentline[i];
          });
          return obj;
        });
        convertedData = JSON.stringify(result);
      }
      else {
         // Fallback for unsupported text conversions
         logger.warn('Unsupported text conversion requested', { from: originalMime, to: targetMime });
         return res.status(415).json(
           createErrorResponse(415, `Conversion from ${originalMime} to ${targetMime} is not supported`)
         );
      }
    }
    // Image conversions
    else if (originalMime.startsWith('image/')) {
      // Use sharp for image conversions
      try {
        const image = sharp(data);
        
        if (targetMime === 'image/png') {
          convertedData = await image.png().toBuffer();
        } else if (targetMime === 'image/jpeg') {
          convertedData = await image.jpeg().toBuffer();
        } else if (targetMime === 'image/webp') {
          convertedData = await image.webp().toBuffer();
        } else if (targetMime === 'image/gif') {
          convertedData = await image.gif().toBuffer();
        } else if (targetMime === 'image/avif') {
          convertedData = await image.avif().toBuffer();
        } else {
           logger.warn('Unsupported image conversion requested', { from: originalMime, to: targetMime });
           return res.status(415).json(
             createErrorResponse(415, `Conversion from ${originalMime} to ${targetMime} is not supported`)
           );
        }
      } catch (err) {
        logger.error('Error converting image', { err });
        return res.status(500).json(createErrorResponse(500, 'Image conversion failed'));
      }
    } else {
      // Unsupported source type
      logger.warn('Unsupported source type for conversion', { from: originalMime });
      return res.status(415).json(
        createErrorResponse(415, `Conversion from ${originalMime} is not supported`)
      );
    }

    // Send converted data
    // If text, ensure we send as utf-8
    if (convertedType.startsWith('text/') || convertedType === 'application/json' || convertedType === 'application/yaml') {
        res.setHeader('Content-Type', contentType.format({ type: convertedType, parameters: { charset: 'utf-8' } }));
        return res.status(200).send(convertedData);
    } else {
        res.setHeader('Content-Type', convertedType);
        return res.status(200).send(convertedData);
    }

  } catch (err) {
    logger.error('Error getting fragment with extension', { id: req.params.id, ext: req.params.ext, err });
    return res.status(500).json(createErrorResponse(500, 'Unable to get fragment'));
  }
};
