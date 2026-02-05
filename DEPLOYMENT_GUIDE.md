# Mentorship Platform Deployment Guide

This guide explains how to set up a new instance of this mentorship platform for a different program.

## Step 1: Create Your Copy

1. Fork or remix this project in Replit
2. Give it a new name that reflects your program

## Step 2: Database Setup

After creating your copy:

1. **Create a new PostgreSQL database** using Replit's database tool
2. The database will be empty - this is expected
3. When you first run the app, it will automatically create the necessary tables and a default super admin account

### Default Super Admin Credentials
- Email: `superadmin@yourprogram.org` (update in `server/seed.ts`)
- Password: `SuperAdmin123!`

**Important:** Change these credentials immediately after first login.

## Step 3: Environment Secrets

Set up the following secrets in your new project:

| Secret Name | Description | How to Get It |
|-------------|-------------|---------------|
| `SESSION_SECRET` | Random string for session security | Generate a random 32+ character string |
| `RESEND_API_KEY` | Email service API key | Sign up at resend.com |

### Optional Secrets (if using object storage)
| Secret Name | Description |
|-------------|-------------|
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Auto-generated when you set up object storage |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Auto-generated |
| `PRIVATE_OBJECT_DIR` | Auto-generated |

## Step 4: Branding Customization

Update these files to match your new program:

### Program Name & Branding
- `client/src/components/layouts/dashboard-layout.tsx` - Update "SONSIEL" references
- `client/src/components/layouts/admin-layout.tsx` - Update admin panel branding
- `client/src/pages/login.tsx` - Update login page branding
- `client/src/pages/register.tsx` - Update registration page branding

### Email Templates
- `server/routes.ts` - Search for "SONSIEL" and update email content

### PDF Exports
- `client/src/lib/pdf-generator.ts` - Update headers and branding in exports

## Step 5: Customize Program-Specific Options

Edit `shared/schema.ts` for:
- Fields of expertise options
- Education level options
- Any program-specific dropdown values

Edit these frontend files for displayed options:
- `client/src/pages/my-profile.tsx`
- `client/src/pages/admin/user-profile.tsx`

## Step 6: Email Configuration

1. Set up a Resend account at resend.com
2. Add your domain and verify it
3. Add the `RESEND_API_KEY` secret
4. Update the "from" email addresses in `server/routes.ts`

## Step 7: Object Storage (for file uploads)

1. Use Replit's Object Storage feature
2. Configure it through the Replit tools panel
3. The necessary secrets will be auto-generated

## Step 8: First Run Checklist

After completing setup:

- [ ] Run the application
- [ ] Verify database tables are created
- [ ] Log in with default super admin credentials
- [ ] Change the super admin password immediately
- [ ] Create additional admin accounts as needed
- [ ] Test email notifications
- [ ] Test file uploads (if using object storage)
- [ ] Publish to production

## Step 9: Publish to Production

1. Click the "Publish" button in Replit
2. Configure your custom domain (optional)
3. Enable autoscaling if needed for your user base

## Data Migration (Optional)

If you need to migrate users from an existing system:

1. Export user data from your source system
2. Create a migration script in `server/migrations/`
3. Map fields to the platform's user schema
4. Import data before going live

## Support & Maintenance

### Regular Tasks
- Monitor error logs
- Review user registrations
- Backup database regularly (Replit provides automatic snapshots)

### Common Issues
- **Email not sending**: Check RESEND_API_KEY and domain verification
- **File uploads failing**: Verify object storage is set up correctly
- **Login issues**: Check SESSION_SECRET is set

## Platform Features Reference

This platform includes:
- User roles: Super Admin, Admin, Mentor, Mentee
- Profile management with mentee/mentor-specific fields
- Messaging system with real-time updates
- Document management with sharing
- Calendar and meeting scheduling
- Goal tracking (SMART goals)
- Mentorship journaling
- Reminders system
- Impact report PDF exports
- Multi-language support (English, Spanish, Portuguese)
- Email notifications
- Admin dashboard with analytics
