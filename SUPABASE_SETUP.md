# Supabase Setup

## Run the database migration

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Open **SQL Editor**
4. Copy the contents of `supabase/migrations/001_create_profiles.sql`
5. Paste and run the SQL

## Email confirmation (optional)

By default, Supabase may require users to confirm their email before logging in. For development:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **Confirm email** OFF to allow immediate login after signup

## Test the flow

1. **Sign up** with a new email (e.g. your email) and password
2. **Log in** with the same credentials
3. Your session will persist across page refreshes
