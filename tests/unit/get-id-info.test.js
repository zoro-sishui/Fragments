// tests/unit/get-id-info.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/:id/info', () => {
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/any/info').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/any/info')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  test('returns 404 for non-existent fragment', async () => {
    const res = await request(app)
      .get('/v1/fragments/does-not-exist/info')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment not found');
  });

  test('returns metadata for existing fragment', async () => {
    const data = 'Metadata check';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(data);

    expect(postRes.statusCode).toBe(201);
    const fragment = postRes.body.fragment;

    const infoRes = await request(app)
      .get(`/v1/fragments/${fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(infoRes.statusCode).toBe(200);
    expect(infoRes.body.status).toBe('ok');
    expect(infoRes.body.fragment).toBeDefined();

    const meta = infoRes.body.fragment;
    expect(meta.id).toBe(fragment.id);
    expect(meta.ownerId).toBeDefined();
    expect(meta.type).toBe('text/plain');
    expect(meta.size).toBe(data.length);
    expect(meta.created).toBeDefined();
    expect(meta.updated).toBeDefined();
  });
});
