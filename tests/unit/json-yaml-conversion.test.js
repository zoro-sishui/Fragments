const request = require('supertest');
const app = require('../../src/app');

describe('JSON to YAML Conversion', () => {
  test('can convert json fragment to yaml', async () => {
    const data = { hello: "world", foo: ["bar", "baz"] };
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(data);
    
    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.fragment.id;

    // Request as .yaml
    const yamlRes = await request(app)
      .get(`/v1/fragments/${id}.yaml`)
      .auth('user1@email.com', 'password1');
    
    expect(yamlRes.statusCode).toBe(200);
    expect(yamlRes.headers['content-type']).toMatch(/application\/yaml/);
    expect(yamlRes.text).toContain('hello: world');
    expect(yamlRes.text).toContain('foo:');
    expect(yamlRes.text).toContain('- bar');
    expect(yamlRes.text).toContain('- baz');
  });

  test('can convert json fragment to yml', async () => {
    const data = { hello: "world" };
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(data);
    
    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.fragment.id;

    // Request as .yml
    const ymlRes = await request(app)
      .get(`/v1/fragments/${id}.yml`)
      .auth('user1@email.com', 'password1');
    
    expect(ymlRes.statusCode).toBe(200);
    expect(ymlRes.headers['content-type']).toMatch(/application\/yaml/);
    expect(ymlRes.text).toContain('hello: world');
  });
});
