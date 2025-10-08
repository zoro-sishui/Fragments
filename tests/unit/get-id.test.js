// tests/unit/get-id.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/:id', () => {
  test('unauthenticated requests are denied', () => 
    request(app).get('/v1/fragments/123').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments/123').auth('invalid@email.com', 'incorrect_password').expect(401));

  test('authenticated users get 404 for non-existent fragment', async () => {
    const res = await request(app).get('/v1/fragments/nonexistent').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment not found');
  });

  
  test('authenticated users can retrieve their own fragments', async () => {
    const data = 'This is a test fragment for retrieval';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(data);
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    
    expect(getRes.statusCode).toBe(200);
    expect(getRes.text).toBe(data);
    expect(getRes.headers['content-type']).toBe('text/plain');
  });

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

  test('authenticated users cannot retrieve other users fragments', async () => 
  {
    const data = 'This is user1 fragment';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(data);
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user2@email.com', 'password2');
    
    expect(getRes.statusCode).toBe(404);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.message).toBe('Fragment not found');
  });

  
  test('should return 404 when fragment data is missing', async () => {
    const data = 'Test fragment data';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(data);
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;
    
   
    const { Fragment } = require('../../src/model/fragment');
    const originalGetData = Fragment.prototype.getData;
    Fragment.prototype.getData = jest.fn().mockResolvedValue(null);
    
    const getRes = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    
    expect(getRes.statusCode).toBe(404);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.message).toBe('Fragment data not found');
    
    
    Fragment.prototype.getData = originalGetData;
  });

  
  test('should handle server errors during fragment retrieval', async () => {
    
    const { Fragment } = require('../../src/model/fragment');
    const originalById = Fragment.byId;
    Fragment.byId = jest.fn().mockRejectedValue(new Error('Database connection failed'));
    
    const getRes = await request(app)
      .get('/v1/fragments/test-id')
      .auth('user1@email.com', 'password1');
    
    expect(getRes.statusCode).toBe(500);
    expect(getRes.body.status).toBe('error');
    expect(getRes.body.error.message).toBe('Unable to get fragment');
    
    Fragment.byId = originalById;
  });
});
