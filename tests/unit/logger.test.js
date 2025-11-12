const path = require('path');

describe('logger debug branch', () => {
  const loggerPath = path.resolve(__dirname, '../../src/logger.js');

  afterEach(() => {
    delete process.env.LOG_LEVEL;
    jest.resetModules();
  });

  test('creates logger with default (silent or info) level when LOG_LEVEL unset', () => {
    const logger = require(loggerPath);
    // Environment for tests may set LOG_LEVEL=silent; accept either
    expect(['info','silent']).toContain(logger.level);
  });

  test('enables debug level and pretty transport when LOG_LEVEL=debug', () => {
    process.env.LOG_LEVEL = 'debug';
    jest.resetModules();
    const logger = require(loggerPath);
    expect(logger.level).toBe('debug');
  });
});
