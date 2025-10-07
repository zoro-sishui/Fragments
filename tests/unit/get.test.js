// tests/unit/get.test.js

const request = require('supertest');

const app = require('../../src/app');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  // Test that the fragments array contains created fragments
  test('authenticated users get their fragments in the array', async () => {
    // Create a fragment first
    const data = 'This is a test fragment for listing';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(data);
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;
    
    // Get fragments list
    const getRes = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1');
    
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.status).toBe('ok');
    expect(Array.isArray(getRes.body.fragments)).toBe(true);
    expect(getRes.body.fragments).toContain(fragmentId);
  });

  // Test the expand=1 query parameter
  test('authenticated users get expanded fragments with expand=1', async () => {
    // Create a fragment first
    const data = 'This is a test fragment for expanded listing';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user2@email.com', 'password2')
      .set('Content-Type', 'text/plain')
      .send(data);
    
    expect(postRes.statusCode).toBe(201);
    const fragment = postRes.body.fragment;
    
    // Get expanded fragments list
    const getRes = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user2@email.com', 'password2');
    
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.status).toBe('ok');
    expect(Array.isArray(getRes.body.fragments)).toBe(true);
    
    // Check that we get full fragment objects, not just IDs
    const foundFragment = getRes.body.fragments.find(f => f.id === fragment.id);
    expect(foundFragment).toBeDefined();
    expect(foundFragment.id).toBe(fragment.id);
    expect(foundFragment.type).toBe('text/plain');
    expect(foundFragment.size).toBe(data.length);
    expect(foundFragment.created).toBeDefined();
    expect(foundFragment.updated).toBeDefined();
  });

  // Test that users only see their own fragments
  test('authenticated users only see their own fragments', async () => {
    // Create fragments with different users
    const data1 = 'User1 fragment';
    const data2 = 'User2 fragment';
    
    const postRes1 = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(data1);
    
    const postRes2 = await request(app)
      .post('/v1/fragments')
      .auth('user2@email.com', 'password2')
      .set('Content-Type', 'text/plain')
      .send(data2);
    
    expect(postRes1.statusCode).toBe(201);
    expect(postRes2.statusCode).toBe(201);
    
    const fragment1Id = postRes1.body.fragment.id;
    const fragment2Id = postRes2.body.fragment.id;
    
    // Check user1 only sees their fragment
    const getRes1 = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1');
    
    expect(getRes1.statusCode).toBe(200);
    expect(getRes1.body.fragments).toContain(fragment1Id);
    expect(getRes1.body.fragments).not.toContain(fragment2Id);
    
    // Check user2 only sees their fragment
    const getRes2 = await request(app)
      .get('/v1/fragments')
      .auth('user2@email.com', 'password2');
    
    expect(getRes2.statusCode).toBe(200);
    expect(getRes2.body.fragments).toContain(fragment2Id);
    expect(getRes2.body.fragments).not.toContain(fragment1Id);
  });
});