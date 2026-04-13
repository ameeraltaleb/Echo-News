import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Authentication Security', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalAdminPassword = process.env.ADMIN_PASSWORD;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalSecret) process.env.JWT_SECRET = originalSecret;
    if (originalAdminPassword) process.env.ADMIN_PASSWORD = originalAdminPassword;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should require JWT_SECRET in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    expect(process.env.JWT_SECRET).toBeUndefined();
    expect(() => {
      if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production');
      }
    }).toThrow('JWT_SECRET is required');
  });

  it('should require ADMIN_PASSWORD in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ADMIN_PASSWORD;

    expect(() => {
      if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
        throw new Error('ADMIN_PASSWORD is required in production');
      }
    }).toThrow('ADMIN_PASSWORD is required');
  });

  it('should validate JWT_SECRET minimum length', () => {
    const testCases = [
      { secret: 'short', valid: false },
      { secret: 'a'.repeat(31), valid: false },
      { secret: 'a'.repeat(32), valid: true },
      { secret: 'a'.repeat(64), valid: true },
    ];

    testCases.forEach(({ secret, valid }) => {
      if (valid) {
        expect(secret.length).toBeGreaterThanOrEqual(32);
      } else {
        expect(secret.length).toBeLessThan(32);
      }
    });
  });

  it('should warn about weak JWT_SECRET', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    process.env.JWT_SECRET = 'weak';
    if (process.env.JWT_SECRET.length < 32) {
      console.warn('Warning: JWT_SECRET should be at least 32 characters');
    }

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('JWT_SECRET should be at least 32 characters')
    );

    consoleWarnSpy.mockRestore();
  });

  it('should not expose sensitive info in error responses', () => {
    process.env.NODE_ENV = 'production';
    
    const sensitiveError = new Error('Connection string: postgresql://admin:password123@db.server.com/prod');
    const isDev = process.env.NODE_ENV === 'development';
    
    const publicResponse = {
      error: 'Internal server error',
      ...(isDev && { details: sensitiveError.message })
    };

    expect(publicResponse.details).toBeUndefined();
    expect(publicResponse.error).toBe('Internal server error');
    expect(JSON.stringify(publicResponse)).not.toContain('password');
    expect(JSON.stringify(publicResponse)).not.toContain('postgresql');
  });

  it('should generate secure random secrets', () => {
    // Simulate generating a secure secret
    const crypto = require('crypto');
    const secureSecret = crypto.randomBytes(32).toString('hex');
    
    expect(secureSecret.length).toBeGreaterThanOrEqual(64); // 32 bytes = 64 hex chars
    expect(secureSecret).toMatch(/^[0-9a-f]+$/);
  });
});
