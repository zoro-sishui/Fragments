// tests/unit/post.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('POST /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => 
    request(app).post('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .post('/v1/fragments')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  // Authenticated users with empty Content-Type should get 400
  test('authenticated users get 400 for empty Content-Type', async () => {
    // Use a raw request with empty Content-Type
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .type('') // This sets an empty Content-Type
      .send(Buffer.from('test fragment data'));
    
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Invalid Content-Type header');
  });

  // Test what happens when supertest sets a default Content-Type
  test('authenticated users get 415 for default supertest Content-Type', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .send('test fragment data');
    
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toMatch(/Unsupported Content-Type/);
  });

  // Authenticated users with invalid Content-Type header should get 400
  test('authenticated users get 400 for invalid Content-Type', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'invalid-content-type')
      .send('test fragment data');
    
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Invalid Content-Type header');
  });

  // Authenticated users with unsupported Content-Type should get 415
  test('authenticated users get 415 for unsupported Content-Type', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/exe')
      .send('test fragment data');
    
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Unsupported Content-Type: application/exe');
  });

  // Authenticated users can create a text/plain fragment
  test('authenticated users can create a text/plain fragment', async () => {
    const data = 'This is a test fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(data);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
    expect(res.body.fragment.id).toBeDefined();
    expect(res.body.fragment.ownerId).toBeDefined();
    expect(res.body.fragment.type).toBe('text/plain');
    expect(res.body.fragment.size).toBe(data.length);
    expect(res.body.fragment.created).toBeDefined();
    expect(res.body.fragment.updated).toBeDefined();
    expect(res.headers.location).toMatch(/\/v1\/fragments\/[0-9a-f-]+$/);
  });

  // Authenticated users can create a text/markdown fragment
  test('authenticated users can create a text/markdown fragment', async () => {
    const data = '# This is a markdown fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(data);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('text/markdown');
    expect(res.body.fragment.size).toBe(data.length);
  });

  // Authenticated users can create a text/html fragment
  test('authenticated users can create a text/html fragment', async () => {
    const data = '<h1>This is an HTML fragment</h1>';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send(data);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('text/html');
    expect(res.body.fragment.size).toBe(data.length);
  });

  // Authenticated users can create an application/json fragment
  test('authenticated users can create an application/json fragment', async () => {
    const data = JSON.stringify({ message: 'This is a JSON fragment' });
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(data);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('application/json');
    expect(res.body.fragment.size).toBe(data.length);
  });

  // Test with charset in Content-Type
  test('authenticated users can create fragments with charset in Content-Type', async () => {
    const data = 'This is a test fragment with charset';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain; charset=utf-8')
      .send(data);
    
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('text/plain; charset=utf-8');
    expect(res.body.fragment.size).toBe(data.length);
  });

  // Test empty body
  test('authenticated users can create fragments with empty body', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('');
    
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.size).toBe(0);
  });

  // Test server error handling by mocking Fragment.save
  test('should handle server errors during fragment creation', async () => {
    // Mock Fragment save method to throw an error
    const { Fragment } = require('../../src/model/fragment');
    const originalSave = Fragment.prototype.save;
    
    Fragment.prototype.save = jest.fn().mockRejectedValue(
      new Error('Database connection failed')
    );

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('test data');

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Unable to create fragment');

    // Restore original
    Fragment.prototype.save = originalSave;
  });

  // Test invalid body data (non-Buffer)
  test('should return 400 for invalid body data when rawBody middleware fails', async () => {
    // This is harder to test directly since rawBody middleware converts to Buffer
    // But we can test by sending a request that would result in non-Buffer body
    
    // Create a minimal express app to test the route handler directly
    const express = require('express');
    const testApp = express();
    const postHandler = require('../../src/routes/api/post');
    
    // Mock authentication middleware
    testApp.use((req, res, next) => {
      req.user = 'test-user';
      next();
    });
    
    // Add our post handler without rawBody middleware
    testApp.post('/test', postHandler);
    
    const res = await request(testApp)
      .post('/test')
      .set('Content-Type', 'text/plain')
      .send('test data');
    
    // Should get 400 for invalid body data
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Invalid body data');
  });
});