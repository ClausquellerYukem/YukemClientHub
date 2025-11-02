# Yukem White Label Client Management Platform

## Overview

Yukem is a white label client management platform designed for representatives managing ERP clients. The application provides comprehensive tools for managing clients, licenses, invoices, and financial tracking through a modern SaaS dashboard interface.

The platform is built as a full-stack TypeScript application with a React frontend and Express backend, utilizing PostgreSQL for data persistence through Drizzle ORM. It follows modern design patterns inspired by Linear, Stripe Dashboard, and Vercel's data-centric interfaces.

The application features complete authentication using Replit Auth (OpenID Connect), supporting multiple login methods including Google, GitHub, X, Apple, and email/password. All routes are protected and require authentication, with session management handled via PostgreSQL.

## Recent Changes

### Authentication System (Completed - Nov 2025)
- **Complete Replit Auth integration** with OIDC support for Google, GitHub, X, Apple, and email/password
- **Three-state AuthLayout**: Properly handles loading, unauthenticated (landing page), and authenticated (dashboard with sidebar) states
- **Critical bug fix**: Custom `queryFn` in `useAuth` hook returns `null` on 401 instead of throwing error, preventing infinite loading state after logout
- **Landing page** for unauthenticated users with feature showcase and login buttons
- **Profile page** displaying user information with logout functionality
- **Protected routes**: All API endpoints except login/logout/callback require authentication
- **Session management**: PostgreSQL-backed sessions with connect-pg-simple (7-day TTL)
- **E2E tested**: Full authentication flow verified from landing → login → dashboard → profile → logout → landing

### Key Technical Solutions
- `useAuth` hook uses custom `queryFn` that treats 401 as valid "not authenticated" state
- `AuthLayout` component renders distinctly for three states to prevent UI flicker
- Backend `isAuthenticated` middleware protects all routes except auth endpoints
- User data automatically synced to PostgreSQL on login via `passport.js`

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing instead of React Router

**UI Component System**
- Shadcn/ui component library with Radix UI primitives for accessible, headless components
- Tailwind CSS for utility-first styling with custom design tokens
- Design system follows "new-york" style variant from Shadcn
- Custom CSS variables for theming with light/dark mode support
- Inter font family for clean, readable typography

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management, caching, and synchronization
- Custom query client configuration with disabled refetch behaviors for stable data
- React Hook Form with Zod validation for form state and validation

**Key Design Patterns**
- Component-based architecture with reusable UI primitives
- Form validation using Zod schemas derived from database schema
- Toast notifications for user feedback
- Responsive design with mobile-first approach using Tailwind breakpoints
- Theme toggle functionality with localStorage persistence

### Backend Architecture

**Server Framework**
- Express.js for HTTP server and API routing
- TypeScript for type safety across the entire backend
- ESM (ES Modules) for modern JavaScript module support

**API Design**
- RESTful API endpoints organized by resource (clients, licenses, invoices)
- Request/response logging middleware for debugging
- Zod schema validation for request payloads
- Centralized error handling with appropriate HTTP status codes

**Data Layer**
- Drizzle ORM for type-safe database queries and migrations
- Schema-first approach with shared types between frontend and backend
- In-memory storage implementation (MemStorage) for development/testing
- Interface-based storage abstraction (IStorage) allowing easy swapping of implementations

**Database Schema**
- Three main entities: Clients, Licenses, and Invoices
- UUID primary keys generated via PostgreSQL `gen_random_uuid()`
- Foreign key relationships: Licenses and Invoices reference Clients
- Timestamps for auditing (createdAt, activatedAt, expiresAt, paidAt)
- Decimal types for monetary values with precision control

### Data Storage Solution

**PostgreSQL Database**
- Neon serverless PostgreSQL for cloud-hosted database
- Connection pooling through `@neondatabase/serverless` adapter
- Schema migrations managed through Drizzle Kit
- Database URL configuration via environment variables

**Schema Structure**
- **Clients Table**: Company information, contact details, subscription plan, billing amount, and status
- **Licenses Table**: License keys linked to clients with activation dates and expiration tracking
- **Invoices Table**: Billing records with amounts, due dates, payment tracking, and status

**Data Validation**
- Drizzle-Zod integration for automatic schema-to-validation generation
- Shared validation schemas between client and server prevent drift
- Type inference from database schema ensures consistency

### External Dependencies

**Database & ORM**
- `@neondatabase/serverless`: Serverless PostgreSQL client optimized for edge runtimes
- `drizzle-orm`: TypeScript ORM with SQL-like query builder
- `drizzle-kit`: CLI tool for schema migrations and database management

**UI Component Libraries**
- `@radix-ui/*`: Collection of accessible, unstyled UI primitives (dialogs, dropdowns, tooltips, etc.)
- `recharts`: Chart library for data visualization (revenue charts)
- `lucide-react`: Icon library for consistent iconography
- `embla-carousel-react`: Carousel/slider component
- `cmdk`: Command palette component

**Form & Validation**
- `react-hook-form`: Performant form state management
- `@hookform/resolvers`: Integration layer for validation libraries
- `zod`: TypeScript-first schema validation
- `drizzle-zod`: Automatic Zod schema generation from Drizzle schemas

**Styling & Design**
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority`: Type-safe variant management for components
- `tailwind-merge`: Utility for merging Tailwind classes without conflicts
- `clsx`: Utility for conditional className construction

**Development Tools**
- `@replit/vite-plugin-*`: Replit-specific Vite plugins for enhanced development experience
- `tsx`: TypeScript execution engine for running server code
- `esbuild`: Fast JavaScript bundler for production builds

**Utility Libraries**
- `date-fns`: Modern date utility library for date formatting and manipulation
- `nanoid`: Secure, URL-friendly unique ID generator

**Build & Deployment**
- Vite for frontend bundling with optimized production builds
- ESBuild for server-side bundling (Node.js compatible)
- Separate build outputs: frontend to `dist/public`, server to `dist`