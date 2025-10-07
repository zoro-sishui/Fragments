// tests/unit/get-id.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/:id', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => 
    request(app).get('/v1/fragments/123').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments/123').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair with invalid fragment id should return 404
  test('authenticated users get 404 for non-existent fragment', async () => {
    const res = await request(app).get('/v1/fragments/nonexistent').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment not found');
  });

  // Test successful fragment retrieval
  test('authenticated users can retrieve their own fragments', async () => {
    // First create a fragment
    const data = 'This is a test fragment for retrieval';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(data);
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;
    
    // Now retrieve it
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    
    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe(data);
    expect(getRes.headers['content-type']).toBe('text/plain');
  });

  // Test retrieving different content types
  test('authenticated users can retrieve JSON fragments', async () => {
    const data = JSON.stringify({ message: 'test json fragment' });
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(data);
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;
    
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    
    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe(data);
    expect(getRes.headers['content-type']).toBe('application/json');
  });

  // Test that users cannot retrieve other users' fragments
  test('authenticated users cannot retrieve other users fragments', async () => {
    // Create fragment with user1
    const data = 'This is user1 fragment';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(data);
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;
    
    // Try to retrieve with user2
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user2@email.com', 'password2');
    
    expect(getRes.statusCode).toBe(404);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.message).toBe('Fragment not found');
  });

  // Test fragment data not found scenario
  test('should return 404 when fragment data is missing', async () => {
    // Create a fragment
    const data = 'Test fragment data';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(data);
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;
    
    // Mock Fragment.getData to return null (simulate missing data)
    const { Fragment } = require('../../src/model/fragment');
    const originalGetData = Fragment.prototype.getData;
    Fragment.prototype.getData = jest.fn().mockResolvedValue(null);
    
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    
    expect(getRes.statusCode).toBe(404);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.message).toBe('Fragment data not found');
    
    // Restore original method
    Fragment.prototype.getData = originalGetData;
  });

  // Test server error handling
  test('should handle server errors during fragment retrieval', async () => {
    // Mock Fragment.byId to throw an error
    const { Fragment } = require('../../src/model/fragment');
    const originalById = Fragment.byId;
    Fragment.byId = jest.fn().mockRejectedValue(new Error('Database connection failed'));
    
    const getRes = await request(app)
      .get('/v1/fragments/test-id')
      .auth('user1@email.com', 'password1');
    
    expect(getRes.statusCode).toBe(500);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.message).toBe('Unable to get fragment');
    
    // Restore original method
    Fragment.byId = originalById;
  });
});
