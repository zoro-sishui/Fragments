// Use DynamoDB for fragment metadata and S3 for fragment data
const ddbDocClient = require('./ddbDocClient');
const s3Client = require('./s3Client');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { PutCommand, GetCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const logger = require('../../../logger'); 

const tableName = process.env.AWS_DYNAMODB_TABLE_NAME;

// Write a fragment's metadata to DynamoDB. Returns a Promise<void>
async function writeFragment(fragment) {
  const params = {
    TableName: tableName,
    Item: {
      ownerId: fragment.ownerId,
      id: fragment.id,
      type: fragment.type,
      created: fragment.created,
      updated: fragment.updated,
      size: fragment.size,
    },
  };

  const command = new PutCommand(params);
  try {
    await ddbDocClient.send(command);
  } catch (err) {
    logger.error({ err, fragment }, 'Error writing fragment metadata to DynamoDB');
    throw new Error('unable to write fragment metadata');
  }
}

// Read a fragment's metadata from DynamoDB. Returns a Promise<Object>
async function readFragment(ownerId, id) {
  const params = {
    TableName: tableName,
    Key: {
      ownerId: ownerId,
      id: id,
    },
  };

  const command = new GetCommand(params);
  try {
    const response = await ddbDocClient.send(command);
    if (!response.Item) {
      return undefined;
    }
    return response.Item;
  } catch (err) {
    logger.error({ err, ownerId, id }, 'Error reading fragment metadata from DynamoDB');
    throw new Error('unable to read fragment metadata');
  }
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
  const params = {
    TableName: tableName,
    KeyConditionExpression: 'ownerId = :ownerId',
    ExpressionAttributeValues: {
      ':ownerId': ownerId,
    },
  };

  const command = new QueryCommand(params);
  try {
    const response = await ddbDocClient.send(command);
    if (!response.Items || response.Items.length === 0) {
      return [];
    }

    return expand ? response.Items : response.Items.map((f) => f.id);
  } catch (err) {
    logger.error({ err, ownerId }, 'Error querying fragments from DynamoDB');
    throw new Error('unable to list fragments');
  }
}

// Delete fragment metadata and S3 object
async function deleteFragment(ownerId, id) {
  // 1. Delete from S3 first
  const s3Params = { 
    Bucket: process.env.AWS_S3_BUCKET_NAME, 
    Key: `${ownerId}/${id}` 
  };
  const s3Command = new DeleteObjectCommand(s3Params);
  
  try {
    await s3Client.send(s3Command);
  } catch (err) {
    logger.error({ err, ...s3Params }, 'Error deleting fragment data from S3');
    throw new Error('unable to delete fragment data');
  }

  // 2. Delete metadata from DynamoDB
  const ddbParams = {
    TableName: tableName,
    Key: {
      ownerId: ownerId,
      id: id,
    },
  };
  const ddbCommand = new DeleteCommand(ddbParams);

  try {
    await ddbDocClient.send(ddbCommand);
  } catch (err) {
    logger.error({ err, ownerId, id }, 'Error deleting fragment metadata from DynamoDB');
    throw new Error('unable to delete fragment metadata');
  }
}

module.exports = {
  listFragments,
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
};