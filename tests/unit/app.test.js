const request = require('supertest');
const app = require('../../src/app');

//test if there are any routes which doesn't exist
test('should return 404 s', async () => {
  const response = await request(app).get('/some-nonexistent-route');
  expect(response.status).toBe(404);
  expect(response.body).toEqual({
    status: 'error',
    error: {
      message: 'not found',
      code: 404,
    },
  });
});

//test 200 for the root route
test('should return 200 for root route', async () => {
  const response = await request(app).get('/');
  expect(response.status).toBe(200);
  expect(response.body.status).toBe('ok');
  expect(response.body.author).toBeDefined();
  expect(response.body.githubUrl).toBe('https://github.com/zoro-sishui/fragements');
  expect(response.body.version).toBeDefined();
  expect(response.headers['cache-control']).toBe('no-cache');
});

// Testing error handling middleware
test('should handle server errors with error middleware', async () => {
  const express = require('express');
  const errorApp = express();
  errorApp.use(require('../../src/routes'));
  errorApp.get('/test-error', (req, res, next) => {
    const error = new Error('Test server error');
    error.status = 500;
    next(error);
  });
  
  const { createErrorResponse } = require('../../src/response');
  const logger = require('../../src/logger');
  
  // eslint-disable-next-line no-unused-vars
  errorApp.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'unable to process request';
    
    if (status > 499) {
      logger.error({ err }, `Error processing request`);
    }
    
    res.status(status).json(createErrorResponse(status, message));
  });
  
  const response = await request(errorApp).get('/test-error');
  expect(response.status).toBe(500);
  expect(response.body.status).toBe('error');
  expect(response.body.error.message).toBe('Test server error');
});