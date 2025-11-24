// XXX: temporary use of memory-db until we add DynamoDB
const MemoryDB = require('../memory/memory-db');
const s3Client = require('./s3Client');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../../../logger'); 

// Metadata stays in memory until DynamoDB is added
const metadata = new MemoryDB();

// Write a fragment's metadata to memory db. Returns a Promise<void>
function writeFragment(fragment) {
  const serialized = JSON.stringify(fragment);
  return metadata.put(fragment.ownerId, fragment.id, serialized);
}

// Read a fragment's metadata from memory db. Returns a Promise<Object>
async function readFragment(ownerId, id) {
  const serialized = await metadata.get(ownerId, id);
  return typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
}

// Writes a fragment's data to an S3 Object in a Bucket
async function writeFragmentData(ownerId, id, data) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
    Body: data,
  };
  const command = new PutObjectCommand(params);
  try {
    await s3Client.send(command);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error uploading fragment data to S3');
    throw new Error('unable to upload fragment data');
  }
}

// Convert a stream into a Buffer
const streamToBuffer = (stream) => new Promise((resolve, reject) => {
  const chunks = [];
  stream.on('data', (chunk) => chunks.push(chunk));
  stream.on('error', reject);
  stream.on('end', () => resolve(Buffer.concat(chunks)));
});

// Read a fragment's data from S3. Returns a Promise<Buffer>
async function readFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };
  const command = new GetObjectCommand(params);
  try {
    const response = await s3Client.send(command);
    return streamToBuffer(response.Body);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

// Get a list of fragment ids/objects for the given user. Returns a Promise
async function listFragments(ownerId, expand = false) {
  const fragments = await metadata.query(ownerId);

  if (!fragments || fragments.length === 0) {
    return [];
  }

  const parsed = fragments
    .filter(Boolean)
    .map((fragment) => JSON.parse(fragment));

  return expand ? parsed : parsed.map((f) => f.id);
}

// Delete fragment metadata and S3 object
async function deleteFragment(ownerId, id) {
  const params = { 
    Bucket: process.env.AWS_S3_BUCKET_NAME, 
    Key: `${ownerId}/${id}` 
  };

  const command = new DeleteObjectCommand(params);

  // 1. Delete from S3 first
  
  await s3Client.send(command);

  // 2. Delete Metadata
  return metadata.del(ownerId, id);
}

module.exports = {
  listFragments,
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
};