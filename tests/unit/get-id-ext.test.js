// tests/unit/get-id-ext.test.js

const request = require('supertest');
const app = require('../../src/app');
const sharp = require('sharp');

describe('GET /v1/fragments/:id.:ext (conversion)', () => {
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/any.html').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/any.html')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  test('returns 404 for non-existent fragment', async () => {
    const res = await request(app)
      .get('/v1/fragments/does-not-exist.html')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment not found');
  });

  test('unsupported extension returns 415', async () => {
    const data = 'Hello **world**';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(data);
    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${id}.exe`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });

  test('markdown fragment can be retrieved as html', async () => {
    const data = '# Title\n\nHello **world**';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(data);
    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.fragment.id;

    const htmlRes = await request(app)
      .get(`/v1/fragments/${id}.html`)
      .auth('user1@email.com', 'password1');
    expect(htmlRes.statusCode).toBe(200);
    expect(htmlRes.headers['content-type']).toMatch(/text\/html/);
    expect(htmlRes.text).toContain('<h1>Title</h1>');
    expect(htmlRes.text).toContain('<strong>world</strong>');
  });

  test('markdown fragment retrieved as md returns original content', async () => {
    const data = 'Hello **world**';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(data);
    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.fragment.id;

    const mdRes = await request(app)
      .get(`/v1/fragments/${id}.md`)
      .auth('user1@email.com', 'password1');
    expect(mdRes.statusCode).toBe(200);
    expect(mdRes.text).toBe(data);
    expect(mdRes.headers['content-type']).toMatch(/text\/markdown/);
  });

  test('unsupported conversion from text/plain to html returns 415', async () => {
    const data = 'Just plain text';
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(data);
    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.fragment.id;

    const convRes = await request(app)
      .get(`/v1/fragments/${id}.html`)
      .auth('user1@email.com', 'password1');
    expect(convRes.statusCode).toBe(415);
    expect(convRes.body.status).toBe('error');
  });

  test('can convert png to jpeg', async () => {
    const pngBuffer = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 0.5 }
      }
    }).png().toBuffer();

    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(pngBuffer);
    
    const id = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${id}.jpg`)
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/jpeg');
  });

  test('json fragment can be retrieved as yaml', async () => {
    const data = { hello: "world", foo: ["bar", "baz"] };
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(data);
    
    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${id}.yaml`)
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/yaml/);
    expect(res.text).toContain('hello: world');
  });

  test('yaml fragment can be retrieved as json', async () => {
    const yamlData = "hello: world\nfoo:\n  - bar\n  - baz\n";
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/yaml')
      .send(yamlData);
    
    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${id}.json`)
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    const json = JSON.parse(res.text);
    expect(json).toEqual({ hello: "world", foo: ["bar", "baz"] });
  });
});
