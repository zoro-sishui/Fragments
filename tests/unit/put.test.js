const request = require('supertest');
const app = require('../../src/app');

describe('PUT /v1/fragments/:id', () => {
  test('unauthenticated requests are denied', () =>
    request(app).put('/v1/fragments/1234').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .put('/v1/fragments/1234')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  test('authenticated users get 404 for non-existent fragment', async () => {
    const res = await request(app)
      .put('/v1/fragments/non-existent-id')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('new data');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });

  test('authenticated users get 400 for Content-Type mismatch', async () => {
    // Create a fragment first
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('original data');
    const id = postRes.body.fragment.id;

    // Try to update with different type
    const res = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send('{"foo": "bar"}');
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });

  test('authenticated users can update their fragment', async () => {
    // Create a fragment first
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('original data');
    const id = postRes.body.fragment.id;

    // Update it
    const newData = 'updated data';
    const res = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(newData);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.id).toBe(id);
    expect(res.body.fragment.size).toBe(newData.length);
    expect(res.body.fragment.formats).toEqual(['text/plain']);

    // Verify data is updated
    const getRes = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(getRes.text).toBe(newData);
  });
});
