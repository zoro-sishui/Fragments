/**
 * Additional branch tests for app.js (error middleware, dotenv load)
 */
// const request = require('supertest');

describe('app.js branch coverage', () => {
  test('loads dotenv when NODE_ENV != test', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalCognitoPool = process.env.AWS_COGNITO_POOL_ID;
    const originalCognitoClient = process.env.AWS_COGNITO_CLIENT_ID;
    const originalHtpasswd = process.env.HTPASSWD_FILE;

    process.env.NODE_ENV = 'development';
    // Ensure no conflicting auth config: prefer basic-auth only
    delete process.env.AWS_COGNITO_POOL_ID;
    delete process.env.AWS_COGNITO_CLIENT_ID;
    process.env.HTPASSWD_FILE = process.env.HTPASSWD_FILE || '/tmp/htpasswd';
    // Mock dotenv so it doesn't re-import conflicting .env values
    jest.resetModules();
    jest.doMock('dotenv', () => ({ config: jest.fn(() => ({ parsed: {} })) }));
    expect(() => require('../../src/app')).not.toThrow();

    // Restore
    process.env.NODE_ENV = originalEnv;
    if (originalCognitoPool) process.env.AWS_COGNITO_POOL_ID = originalCognitoPool; else delete process.env.AWS_COGNITO_POOL_ID;
    if (originalCognitoClient) process.env.AWS_COGNITO_CLIENT_ID = originalCognitoClient; else delete process.env.AWS_COGNITO_CLIENT_ID;
    if (originalHtpasswd) process.env.HTPASSWD_FILE = originalHtpasswd; else delete process.env.HTPASSWD_FILE;
  });
});
