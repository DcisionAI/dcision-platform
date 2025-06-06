# Setup Flow Testing Guide

This guide will help you test the new setup flow for database and LLM configuration.

## Prerequisites

1. Make sure you have a fresh Supabase project set up
2. Have your environment variables configured in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ENCRYPTION_KEY=your_encryption_key
   ```

## Testing Steps

### 1. Database Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. Sign up with a new account

4. You should be automatically redirected to `/setup/database`

5. Test the database configuration form:
   - Try submitting with empty fields (should show validation errors)
   - Try submitting with invalid database credentials (should show connection error)
   - Try submitting with valid database credentials:
     ```
     Host: localhost
     Port: 5432
     Database: your_database_name
     Username: your_username
     Password: your_password
     ```

6. Verify that:
   - The form submits successfully
   - You're redirected to the LLM setup page
   - The database configuration is stored in Supabase

### 2. LLM Setup

1. On the LLM setup page, test the provider selection:
   - Try both OpenAI and Anthropic options
   - Verify the radio buttons work correctly
   - Check that the API key placeholder updates based on selection

2. Test the API key input:
   - Try submitting with an empty API key (should show validation error)
   - Try submitting with an invalid API key (should show validation error)
   - Try submitting with a valid API key

3. Verify that:
   - The form submits successfully
   - You're redirected to the dashboard
   - The LLM configuration is stored in Supabase

### 3. Edge Cases

1. Test the back button:
   - Go back from LLM setup to database setup
   - Verify that your previous database configuration is still there
   - Submit the database form again
   - Verify you can proceed to LLM setup

2. Test session handling:
   - Log out and log back in
   - Verify you're redirected to the appropriate setup step
   - Complete the setup
   - Log out and log back in
   - Verify you're redirected to the dashboard

3. Test error handling:
   - Try accessing setup pages directly without authentication
   - Try accessing setup pages with invalid session
   - Verify appropriate error messages and redirects

## Verifying Data Storage

1. Check Supabase tables:
   ```sql
   -- Check database configuration
   SELECT * FROM database_config WHERE user_id = 'your_user_id';
   
   -- Check LLM settings
   SELECT * FROM user_settings WHERE user_id = 'your_user_id';
   ```

2. Verify that:
   - Database credentials are encrypted
   - LLM API keys are encrypted
   - All required fields are present
   - Timestamps are correct

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify Supabase connection is working
3. Check that all migrations have been applied
4. Verify environment variables are set correctly
5. Check that the encryption key is properly configured

## Common Issues

1. **Database Connection Fails**
   - Verify database is running and accessible
   - Check firewall settings
   - Verify credentials are correct

2. **LLM API Key Validation Fails**
   - Verify API key is valid
   - Check network connectivity to LLM providers
   - Verify API key format is correct

3. **Setup Flow Stuck**
   - Clear browser cache and cookies
   - Check for any pending migrations
   - Verify user session is valid 