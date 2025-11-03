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

### Client Management Features (Completed - Nov 2025)
- **Soft Delete Implementation**: DELETE endpoint now changes client status to "inactive" instead of removing from database
- **View Client Details**: Dialog showing complete client information with icons for each field
- **Edit Client**: Dialog with pre-populated form using ClientForm component with initialData support
- **Deactivate Confirmation**: AlertDialog requiring confirmation before marking client as inactive
- **Status Management**: Clients can have "active", "inactive", or "trial" status with colored badges
- **E2E Tested**: All CRUD operations verified including soft delete workflow

### Boleto Printing Integration (Completed - Nov 2025)
- **External API Integration**: Connects to external boleto API (http://51.222.16.165:3010/v1/boleto/{id}) with custom authentication headers
- **Configuration Management**: Dedicated page (/configuracoes) for managing app_token and access_token credentials
- **Security Features**:
  - Tokens stored in PostgreSQL database via boleto_config table
  - GET endpoint returns masked tokens (first 4 + last 4 characters visible)
  - Form validation prevents posting masked values
  - Clear UX messaging for credential updates
- **Print Functionality**:
  - "Print Boleto" button on each invoice in financial screen
  - Handles multiple response formats: URLs (http/https), base64 PDFs, or other formats
  - Opens boleto in new tab for user access
  - Comprehensive error handling with user-friendly toast messages
- **Database Schema**: Created boleto_config table with app_token, access_token fields using Drizzle Kit
- **Bug Fixes**: Fixed upsertUser to use email as conflict target (not id) to handle unique constraint properly
- **E2E Tested**: Full flow verified from configuration save → token masking → print button → error handling

### Granular Role-Based Access Control (Completed - Nov 2025)
- **Comprehensive RBAC System**: Full role and permission management with granular resource-action controls
- **Database Schema**:
  - **roles** table: Named roles (e.g., 'admin', 'user', 'manager') with display names
  - **role_assignments** table: Many-to-many relationship linking users to multiple roles
  - **role_permissions** table: Granular permissions per role (resource + action pairs)
- **Permission Model**: Resource-action matrix covering all operations
  - Resources: clients, licenses, invoices, boleto_config
  - Actions: create, read, update, delete
  - Each role can have specific permissions for each resource-action combination
- **Authorization Middleware**:
  - `requirePermission(resource, action)`: Enforces granular permissions on all CRUD routes
  - Admin bypass: users.role='admin' have implicit full access for backward compatibility
  - Permission aggregation: Users with multiple roles get combined permissions from all assigned roles
- **Protected Routes**: All CRUD endpoints now use permission-based authorization
  - Collection routes: GET /api/clients, POST /api/clients, etc.
  - Individual routes: GET /api/clients/:id, PATCH /api/clients/:id, DELETE /api/clients/:id
  - Boleto routes: GET /api/boleto/config, POST /api/boleto/config, POST /api/boleto/print/:id
- **Admin UI**:
  - **/admin/usuarios**: User management page for assigning/removing roles from users
  - **/admin/permissoes**: Permission matrix for configuring role permissions (checkboxes for each resource-action)
  - Admin section visible only to users with admin role
- **Default Roles**:
  - **admin**: Full permissions on all resources (create, read, update, delete)
  - **user**: Read-only access to all resources (read only)
- **Auto-Assignment**:
  - New users automatically assigned role based on `users.role` field on first login
  - Users with `@yukem.com` emails automatically receive admin role (for testing/demo)
  - Ensures every user has at least one role assignment
- **Security Features**:
  - 403 errors for unauthorized access attempts with Portuguese error messages
  - Permissions verified from database on every request (no stale session data)
  - Frontend hides unauthorized UI elements based on user permissions
  - Migration of existing users: All users automatically assigned to appropriate roles on first load
- **Production-Ready**: Comprehensive authorization coverage with no security gaps, E2E tested

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
- Primary entities: Clients, Licenses, Invoices, and Boleto Config
- RBAC entities: Users, Roles, Role Assignments, Role Permissions
- UUID primary keys generated via PostgreSQL `gen_random_uuid()`
- Foreign key relationships: Licenses and Invoices reference Clients; Role Assignments reference Users and Roles
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
- **Boleto Config Table**: Stores external API credentials (app_token, access_token) for boleto printing integration
- **Users Table**: Authentication data with email as unique identifier for OIDC upsert operations
- **Sessions Table**: PostgreSQL-backed session storage for Replit Auth

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