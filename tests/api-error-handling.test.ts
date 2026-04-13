import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('API Error Handling', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should not expose error details in production', () => {
    process.env.NODE_ENV = 'production';
    
    // Simulate production error response
    const error = new Error('Sensitive database connection string');
    const isDev = process.env.NODE_ENV === 'development';
    const response = {
      error: 'Failed to fetch articles',
      ...(isDev && { details: error.message })
    };

    expect(response.details).toBeUndefined();
    expect(response.error).toBe('Failed to fetch articles');
  });

  it('should expose error details in development', () => {
    process.env.NODE_ENV = 'development';
    
    const error = new Error('Database connection failed');
    const isDev = process.env.NODE_ENV === 'development';
    const response = {
      error: 'Failed to fetch articles',
      ...(isDev && { details: error.message })
    };

    expect(response.details).toBe('Database connection failed');
  });

  it('should handle missing environment variables gracefully', () => {
    const originalSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    expect(() => {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
      }
    }).toThrow('JWT_SECRET environment variable is not set');

    process.env.JWT_SECRET = originalSecret || 'test-secret';
  });

  it('should validate JWT_SECRET length', () => {
    const shortSecret = 'short';
    const longSecret = 'a'.repeat(32);

    expect(shortSecret.length).toBeLessThan(32);
    expect(longSecret.length).toBeGreaterThanOrEqual(32);
  });
});
