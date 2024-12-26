# Next.js Ultimate SaaS Template

A modern, full-featured SaaS template built with Next.js 15, featuring authentication, database integration, and a beautiful UI out of the box.

## 🚀 Features

- **Authentication** - Secure authentication system using Better Auth
  - Email/Password authentication
  - Two-factor authentication
  - Passkey support
  - Session management
  - Role-based access control
- **Database** - Prisma ORM with PostgreSQL
  - Type-safe database queries
  - Automatic migrations
  - Database schema with user management, subscriptions, and feature usage tracking
- **Modern Stack**
  - Next.js 15 with App Router
  - TypeScript for type safety
  - Tailwind CSS for styling
  - Shadcn UI components
  - Form handling with React Hook Form
- **SaaS Features**
  - Multi-tenant architecture
  - Subscription management
  - Feature usage tracking
  - Team/organization support
  - Invitation system

## 🛠 Getting Started

### Prerequisites

- Node.js 18+ 
- PNPM package manager
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd nextjs-ultimate-saas
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up your environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your credentials:
- `DATABASE_URL`: Your PostgreSQL database URL
- `DIRECT_URL`: Direct connection URL for Prisma
- Other authentication and service-related variables

5. Initialize the database:
```bash
pnpm prisma generate
pnpm prisma db push
```

6. Start the development server:
```bash
pnpm dev
```

For HTTPS development:
```bash
pnpm dev:secure
```

## 📁 Project Structure

```
├── app/                  # Next.js 15 app directory
│   ├── (auth)           # Authentication routes
│   ├── (dashboard)      # Protected dashboard routes
│   └── (home)           # Public pages
├── components/          # Reusable UI components
│   └── ui/             # Shadcn UI components
├── lib/                 # Utility functions and configurations
│   ├── auth.ts         # Authentication utilities
│   ├── db.ts           # Database utilities
│   └── utils/          # Helper functions
├── prisma/             # Database schema and migrations
└── public/             # Static assets
```

## 🔐 Authentication

The template uses Better Auth for secure authentication:

- **Email Authentication**: Traditional email/password login
- **Two-Factor Authentication**: Optional 2FA support
- **Passkeys**: WebAuthn/Passkey support for passwordless authentication
- **Session Management**: Secure session handling with IP and user agent tracking
- **Role-Based Access**: Built-in role system for authorization

## 💾 Database Schema

The Prisma schema includes models for:

- Users and authentication
- Teams/Organizations
- Subscriptions
- Feature usage tracking
- Invitations
- Sessions and security

## 🎨 UI Components

The template includes a comprehensive set of UI components built with:

- Shadcn UI for beautiful, accessible components
  - Pre-built components like buttons, forms, and modals
  - Customizable with Tailwind CSS
  - Built on Radix UI primitives for accessibility
- Custom hooks for common functionality
- Form components with validation
- Dark mode support out of the box

## 📝 Environment Variables

Key environment variables needed:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Check `.env.example` for a complete list of required variables.

## 🚀 Deployment

The template is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Create a new project on Vercel
3. Connect your repository
4. Set up your environment variables
5. Deploy!

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
