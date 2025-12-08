const request = require('supertest');
const app = require('../../src/app');

describe('DELETE /v1/fragments/:id', () => {
  test('unauthenticated requests are denied', () =>
    request(app).delete('/v1/fragments/1234').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .delete('/v1/fragments/1234')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  test('authenticated users get 404 for non-existent fragment', async () => {
    const res = await request(app)
      .delete('/v1/fragments/does-not-exist')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });

  test('authenticated users can delete their own fragments', async () => {
    // Create a fragment first
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('To be deleted');
    const id = postRes.body.fragment.id;

    // Delete it
    const deleteRes = await request(app)
      .delete(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.status).toBe('ok');

    // Verify it's gone
    const getRes = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(getRes.statusCode).toBe(404);
  });
});
