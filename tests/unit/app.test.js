const request = require('supertest');
const app = require('../../src/app');


test('should return 404 for non-existent routes', async () => {
  const response = await request(app).get('/non-existent-route');
  expect(response.status).toBe(404);
  expect(response.body).toEqual({
    status: 'error',
    error: {
      message: 'not found',
      code: 404,
    },
  });
});

test('should return 200 for root route', async () => {
  const response = await request(app).get('/');
  expect(response.status).toBe(200);
  expect(response.body.status).toBe('ok');
});