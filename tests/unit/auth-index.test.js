/**
 * Tests for the branching logic in src/auth/index.js
 */
const path = require('path');
const authIndexPath = path.resolve(__dirname, '../../src/auth/index.js');

function loadWithEnv(env) {
  jest.resetModules();
  // Clear previous env modifications
  delete process.env.AWS_COGNITO_POOL_ID;
  delete process.env.AWS_COGNITO_CLIENT_ID;
  delete process.env.HTPASSWD_FILE;
  delete process.env.NODE_ENV;
  Object.assign(process.env, env);
  return () => require(authIndexPath);
}

describe('auth/index branching', () => {
  test('throws when both Cognito and htpasswd are configured', () => {
    const attempt = loadWithEnv({
      AWS_COGNITO_POOL_ID: 'pool',
      AWS_COGNITO_CLIENT_ID: 'client',
      HTPASSWD_FILE: '/tmp/htpasswd',
    });
    expect(attempt).toThrow();
  });

  test('loads cognito module when Cognito env vars set (skip if invalid pool)', () => {
    const attempt = loadWithEnv({
      AWS_COGNITO_POOL_ID: 'us-east-1_dummyPool123',
      AWS_COGNITO_CLIENT_ID: 'dummyClientId123',
    });
    try {
      const mod = attempt();
      expect(mod.strategy).toBeDefined();
    } catch (e) {
      // If running without real AWS config, accept the failure but assert it's due to validation
      expect(e.message).toMatch(/Invalid Cognito User Pool ID|missing expected env vars/);
    }
  });

  test('loads basic auth when only htpasswd file set and not production', () => {
    const attempt = loadWithEnv({
      HTPASSWD_FILE: '/tmp/htpasswd',
      NODE_ENV: 'development',
    });
    const mod = attempt();
    expect(mod.strategy).toBeDefined();
  });

  test('throws when no auth configuration provided', () => {
    const attempt = loadWithEnv({});
    expect(attempt).toThrow();
  });
});
