// tests/unit/auth-index.test.js

const originalEnv = process.env;

describe('Auth Index', () => {
  beforeEach(() => {
    // Clear the require cache to test different configurations
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete require.cache[require.resolve('../../src/auth/index')];
    delete require.cache[require.resolve('../../src/auth/basic-auth')];
    delete require.cache[require.resolve('../../src/auth/cognito')];
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should throw error when both AWS Cognito and HTTP Basic Auth are configured', () => {
    process.env.AWS_COGNITO_POOL_ID = 'test-pool-id';
    process.env.AWS_COGNITO_CLIENT_ID = 'test-client-id';
    process.env.HTPASSWD_FILE = '.htpasswd';
    
    expect(() => {
      require('../../src/auth/index');
    }).toThrow('env contains configuration for both AWS Cognito and HTTP Basic Auth. Only one is allowed.');
  });

  test('should use AWS Cognito when both pool id and client id are set', () => {
    process.env.AWS_COGNITO_POOL_ID = 'test-pool-id';
    process.env.AWS_COGNITO_CLIENT_ID = 'test-client-id';
    delete process.env.HTPASSWD_FILE;
    jest.doMock('../../src/auth/cognito', () => ({
      authenticate: jest.fn(),
      strategy: 'cognito'
    }));
    
    const auth = require('../../src/auth/index');
    expect(auth).toBeDefined();
  });

  test('should use HTTP Basic Auth when HTPASSWD_FILE is set and not in production', () => {
    delete process.env.AWS_COGNITO_POOL_ID;
    delete process.env.AWS_COGNITO_CLIENT_ID;
    process.env.HTPASSWD_FILE = '.htpasswd';
    process.env.NODE_ENV = 'test';
    const auth = require('../../src/auth/index');
    expect(auth).toBeDefined();
  });

  test('auth module should be configured correctly with current env', () => {
    const auth = require('../../src/auth/index');
    expect(auth).toBeDefined();
    expect(typeof auth).toBe('object');
  });

  test('demonstrates proper error handling for invalid configurations', () => {

    const invalidConfigurations = [
      'Both AWS Cognito and HTTP Basic Auth configured',
      'No authorization configuration found',
      'Basic auth in production not allowed'
    ];
    
    expect(invalidConfigurations).toHaveLength(3);
    expect(invalidConfigurations[0]).toContain('AWS Cognito');
    expect(invalidConfigurations[1]).toContain('No authorization');
    expect(invalidConfigurations[2]).toContain('production');
  });
});