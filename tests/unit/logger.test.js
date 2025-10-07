// tests/unit/logger.test.js

const originalEnv = process.env;

describe('Logger', () => {
  beforeEach(() => {
    // Clear the require cache to test different configurations
    delete require.cache[require.resolve('../../src/logger')];
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('should create logger with default info level', () => {
    delete process.env.LOG_LEVEL;
    const logger = require('../../src/logger');
    
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });

  test('should create logger with debug level and pretty transport', () => {
    process.env.LOG_LEVEL = 'debug';
    const logger = require('../../src/logger');
    
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
  });

  test('should create logger with custom log level', () => {
    process.env.LOG_LEVEL = 'warn';
    const logger = require('../../src/logger');
    
    expect(logger).toBeDefined();
    expect(typeof logger.warn).toBe('function');
  });

  test('should create logger with error level', () => {
    process.env.LOG_LEVEL = 'error';
    const logger = require('../../src/logger');
    
    expect(logger).toBeDefined();
    expect(typeof logger.error).toBe('function');
  });
});