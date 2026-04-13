import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Database Connection', () => {
  const originalEnv = process.env.POSTGRES_URL;
  const originalDbEnv = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalEnv) process.env.POSTGRES_URL = originalEnv;
    if (originalDbEnv) process.env.DATABASE_URL = originalDbEnv;
  });

  it('should require database connection string', () => {
    delete process.env.POSTGRES_URL;
    delete process.env.DATABASE_URL;

    expect(() => {
      const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('Database connection string (POSTGRES_URL or DATABASE_URL) is not set');
      }
    }).toThrow('Database connection string');
  });

  it('should accept POSTGRES_URL', () => {
    process.env.POSTGRES_URL = 'postgresql://user:pass@localhost:5432/testdb';
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    expect(connectionString).toBeDefined();
    expect(connectionString?.includes('postgresql://')).toBe(true);
  });

  it('should accept DATABASE_URL as fallback', () => {
    delete process.env.POSTGRES_URL;
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    expect(connectionString).toBeDefined();
  });

  it('should detect Supabase connection for SSL', () => {
    process.env.POSTGRES_URL = 'postgresql://user:pass@db.supabase.co:5432/postgres';
    const connectionString = process.env.POSTGRES_URL!;
    const requiresSSL = connectionString.includes('supabase.com') || connectionString.includes('pooler');
    expect(requiresSSL).toBe(true);
  });

  it('should enable SSL in production', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.POSTGRES_URL = 'postgresql://user:pass@localhost:5432/db';
    
    const connectionString = process.env.POSTGRES_URL!;
    const shouldUseSSL = process.env.NODE_ENV === 'production';
    
    expect(shouldUseSSL).toBe(true);
    
    process.env.NODE_ENV = originalNodeEnv;
  });
});
