# Security Guidelines for Echo News

## ⚠️ Critical Security Requirements

### Environment Variables (REQUIRED)

The following environment variables **MUST** be set before deploying to production:

1. **JWT_SECRET**: Must be at least 32 characters long
   - Generate using: `openssl rand -hex 32`
   - Never use default or weak values

2. **ADMIN_PASSWORD**: Required for admin authentication
   - Use a strong, unique password
   - Minimum 12 characters recommended
   - Never commit to version control

3. **POSTGRES_URL** or **DATABASE_URL**: Database connection string
   - Use SSL in production
   - Never expose credentials in code

### API Keys (Optional - Feature Dependent)

- **GEMINI_API_KEY**: Required for AI article generation
- **UNSPLASH_ACCESS_KEY**: Required for Unsplash image search
- **SUPABASE_URL** and **SUPABASE_ANON_KEY**: Required for Supabase storage

## Security Best Practices

### What We Fixed

1. ✅ Removed hardcoded fallback secrets
2. ✅ Added validation for required environment variables
3. ✅ Removed error details from production responses
4. ✅ Implemented proper error handling

### Ongoing Responsibilities

1. **Never commit `.env` files** to version control
2. **Rotate secrets regularly** (especially JWT_SECRET)
3. **Use environment-specific values** for development vs production
4. **Monitor logs** for suspicious activity
5. **Keep dependencies updated** for security patches

## Deployment Checklist

Before deploying to production:

- [ ] Set all required environment variables
- [ ] Verify JWT_SECRET is at least 32 characters
- [ ] Change default admin password
- [ ] Enable SSL for database connection
- [ ] Review and restrict CORS settings
- [ ] Set up monitoring and alerting
- [ ] Test authentication flows
- [ ] Verify error messages don't leak sensitive information

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly by contacting the maintainers directly. Do not open public issues for security vulnerabilities.
