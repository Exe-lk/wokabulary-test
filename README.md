# Wokabulary POS System

A modern point-of-sale system built with Next.js, Prisma, and PostgreSQL.

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Yarn or npm

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
DIRECT_URL="postgresql://username:password@localhost:5432/your_database_name"

# Next.js Configuration
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Supabase Configuration (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Email Configuration (for nodemailer)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Text.lk SMS Configuration
# Get your API token from: https://text.lk/
TEXTLK_API_TOKEN="your_textlk_api_token_here"
TEXTLK_SENDER_ID="YourRestaurant"

# Base URL for bill links
BASE_URL="http://localhost:3000"
```

## SMS Setup with Text.lk

This application uses [Text.lk](https://text.lk/) for sending SMS notifications to customers when bills are sent. To set up SMS functionality:

1. **Get Text.lk API Token**:
   - Visit [Text.lk](https://text.lk/)
   - Sign up for an account
   - Get your API token from the dashboard

2. **Configure Environment Variables**:
   - Add your `TEXTLK_API_TOKEN` to `.env.local`
   - Set your `TEXTLK_SENDER_ID` (this will appear as the sender name in SMS)

3. **Phone Number Format**:
   - The system automatically formats phone numbers for Sri Lanka
   - Supported formats: `0712345678`, `+94712345678`, `94712345678`

4. **SMS Features**:
   - SMS is sent automatically when a phone number is provided
   - Includes order details, bill number, and bill link
   - Works alongside email notifications

## Getting Started

1. Install dependencies:
```bash
yarn install
```

2. Set up the database:
```bash
# Generate Prisma client
yarn prisma generate

# Run database migrations
yarn prisma migrate dev

# Seed the database (optional)
yarn seed
```

3. Run the development server:
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

4. Test your database connection:
```bash
# Visit the health check endpoint
curl /api/health
# or open in browser: http://localhost:3000/api/health
```

## Deployment to Netlify

### Prerequisites
- A cloud PostgreSQL database (Supabase, PlanetScale, Railway, etc.)
- Netlify account

### Steps

1. **Prepare Environment Variables**:
   - Create a `.env` file with your production environment variables
   - Ensure `DATABASE_URL` points to your cloud database
   - Set `BASE_URL` to your Netlify domain

2. **Configure Netlify**:
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `.next`
   - Add all environment variables in Netlify dashboard

3. **Required Environment Variables for Netlify**:
   ```env
   DATABASE_URL="postgresql://username:password@host:port/database"
   DIRECT_URL="postgresql://username:password@host:port/database"
   BASE_URL="https://your-site.netlify.app"
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASS="your-app-password"
   TEXTLK_API_TOKEN="your_textlk_api_token"
   TEXTLK_SENDER_ID="YourRestaurant"
   ```

4. **Deploy**:
   - Push your changes to GitHub
   - Netlify will automatically build and deploy
   - Check build logs for any errors

### Troubleshooting Netlify Deployment

- **Prisma CLI not found**: Ensure `prisma` is in `devDependencies`
- **Database connection errors**: Verify `DATABASE_URL` is correct and accessible
- **API route errors**: Check that all environment variables are set in Netlify
- **Build failures**: Ensure Node.js version is 18+ (specified in `.nvmrc`)

### Common API Errors (400/404)

If you're getting 400 or 404 errors on API routes:

1. **Check Environment Variables in Netlify**:
   - Go to Site settings > Environment variables
   - Ensure all required variables are set:
     - `DATABASE_URL`
     - `DIRECT_URL`
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `BASE_URL`

2. **Test API Routes**:
   - Visit `/api/test` to check if API routes are working
   - Visit `/api/health` to check database connectivity

3. **Check Netlify Function Logs**:
   - Go to Functions tab in Netlify dashboard
   - Look for any error messages in the function logs

4. **Verify Database Connection**:
   - Ensure your database is accessible from Netlify's servers
   - Check if your database allows external connections

5. **Supabase Configuration**:
   - Verify Supabase project is active
   - Check if Supabase authentication is properly configured
   - Ensure staff users exist in both Supabase and your database

## Database Schema

The application uses the following main models:
- **Admin**: System administrators
- **Staff**: Restaurant staff (waiters, cashiers, etc.)
- **Customer**: Customer information
- **Category**: Food categories
- **FoodItem**: Menu items
- **Portion**: Food portions (small, medium, large)
- **Order**: Customer orders
- **OrderItem**: Individual items in orders
- **Payment**: Payment records

## Features

- **Admin Panel**: Manage staff, menu items, categories, and view reports
- **Waiter Interface**: Take orders, manage tables, and process payments
- **Kitchen Interface**: View and update order status
- **Manager Dashboard**: Overview of restaurant operations
- **Customer Management**: Track customer information and order history
- **Payment Processing**: Multiple payment modes with receipt generation
- **SMS Notifications**: Send bill notifications via Text.lk SMS gateway
- **Email Notifications**: Send detailed bill emails with download links

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Text.lk SMS API](https://text.lk/)

## Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Make sure to set up your environment variables in your deployment platform.

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. **Check your DATABASE_URL**: Ensure your `.env.local` file has the correct database URL
2. **Verify database is running**: Make sure your PostgreSQL server is running
3. **Test connection**: Visit `/api/health` to check database connectivity
4. **Check credentials**: Verify your database username and password are correct

### Common Error Messages

- **"Cannot read properties of undefined (reading 'findUnique')"**: Database connection not configured
- **"ECONNREFUSED"**: Database server not running or wrong port
- **"authentication failed"**: Incorrect database credentials

### Quick Setup

Run the setup script for automatic configuration:
```bash
yarn setup
```

This will:
- Create a `.env.local` file with template values
- Install dependencies
- Generate Prisma client
- Provide next steps for database setup
