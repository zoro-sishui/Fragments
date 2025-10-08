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

  
  
  test('should handle server errors during fragment creation', async () => {
   
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
    Fragment.prototype.save = originalSave;
  });

  // Test invalid body data (non-Buffer)
  test('should return 400 for invalid body data when rawBody middleware fails', async () => {
    const express = require('express');
    const testApp = express();
    const postHandler = require('../../src/routes/api/post');
    testApp.use((req, res, next) => {
      req.user = 'test-user';
      next();
    });
    testApp.post('/test', postHandler);
    
    const res = await request(testApp)
      .post('/test')
      .set('Content-Type', 'text/plain')
      .send('test data');
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Invalid body data');
  });
});