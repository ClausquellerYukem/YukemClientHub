# Yukem White Label Client Management Platform

## Overview

Yukem is a white label client management platform for managing ERP clients, offering tools for client, license, invoice management, and financial tracking via a SaaS dashboard. It aims to provide a modern, data-centric user experience inspired by leading platforms. The project's ambition is to streamline client relationship management and financial operations for representatives, enabling efficient scaling and enhanced business intelligence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18 and TypeScript, using Vite for fast development and Wouter for lightweight routing. UI components leverage Shadcn/ui (built on Radix UI) and Tailwind CSS for a utility-first approach and a "new-york" style design system, supporting light/dark modes. State management and data fetching are handled by TanStack Query, with form management and validation using React Hook Form and Zod. The architecture emphasizes reusable components, responsive design, and toast notifications for user feedback.

### Backend Architecture

The backend utilizes Express.js with TypeScript and ESM for API routing and server-side logic. It features a RESTful API design with Zod for request payload validation and centralized error handling. Drizzle ORM provides type-safe database interactions, following a schema-first approach. Authentication is managed via Replit Auth (OpenID Connect), supporting multiple providers and PostgreSQL-backed session management. Core features include robust RBAC with granular resource-action permissions, client and license management (including soft-delete and automatic blocking/unblocking based on payment status), company registration with comprehensive financial configurations, and external API integration for boleto printing.

### Data Storage Solution

PostgreSQL, specifically Neon serverless PostgreSQL, is used for data persistence. Drizzle ORM and Drizzle Kit manage the database schema and migrations. Key tables include Clients, Licenses, Invoices, Boleto Config, Users, Roles, Role Assignments, and Role Permissions. UUIDs are used for primary keys, with foreign key relationships linking entities. Drizzle-Zod integration ensures shared, type-safe validation schemas between frontend and backend.

## External Dependencies

**Database & ORM**
- `@neondatabase/serverless`: Serverless PostgreSQL client.
- `drizzle-orm`: TypeScript ORM.
- `drizzle-kit`: Schema migration tool.

**UI Component Libraries**
- `@radix-ui/*`: Accessible UI primitives.
- `recharts`: Charting library.
- `lucide-react`: Icon library.
- `embla-carousel-react`: Carousel component.
- `cmdk`: Command palette.

**Form & Validation**
- `react-hook-form`: Form state management.
- `@hookform/resolvers`: Validation integration.
- `zod`: Schema validation.
- `drizzle-zod`: Zod schema generation from Drizzle.

**Styling & Design**
- `tailwindcss`: Utility-first CSS framework.
- `class-variance-authority`: Type-safe variant management.
- `tailwind-merge`: Tailwind class merging utility.
- `clsx`: Conditional className construction.

**Development Tools**
- `@replit/vite-plugin-*`: Replit-specific Vite plugins.
- `tsx`: TypeScript execution engine.
- `esbuild`: JavaScript bundler.

**Utility Libraries**
- `date-fns`: Date utility library.
- `nanoid`: Secure unique ID generator.

## Recent Implementations

### User-Company Association Management (Completed - Nov 2025)
- **Admin Interface**: New page at /admin/usuarios for managing users
  - Lists all users with their associated companies and roles
  - Visual badges showing current associations
  - Quick actions to add/remove companies and roles
- **Backend Endpoints**:
  - GET /api/users: Returns all users with companies and roles (admin only)
  - POST /api/user/companies: Create user-company association (admin only)
  - DELETE /api/user/companies/:userId/:companyId: Remove association (admin only)
- **UI Features**:
  - Dialogs for adding new associations with dropdown selectors
  - Inline removal via X buttons on badges
  - Prevents duplicate associations (filters already-assigned items)
  - Toast notifications for all operations
- **Security**: All endpoints protected with isAuthenticated + isAdmin middleware
- **Production-Ready**: Architect-approved with no security concerns

### Company Selector for Multi-Tenant Context (Completed - Nov 2025)
- **Active Company Selection**: Users can select which company they're working with from the header
- **Visual Component**: CompanySelector displayed in app header next to theme toggle
  - Dropdown selector when user has multiple companies
  - Read-only display showing company name when user has single company
  - Building icon (lucide-react) for visual identification
- **Backend Security**: PATCH /api/user/active-company endpoint
  - Validates user has access to requested company before updating
  - Returns 403 Forbidden if unauthorized access attempted
  - Prevents privilege escalation across tenant boundaries
- **Automatic Cache Invalidation**: Refreshes all relevant data after company switch
  - User profile, clients list, licenses, invoices, dashboard statistics, boleto config
- **Toast Notifications**: User feedback when company successfully changed
- **Data Isolation**: All operations use user's activeCompanyId for filtering
  - **getCompanyIdForUser() helper**: Returns activeCompanyId when set (for both admins and regular users), undefined only for admins without activeCompanyId
  - All read operations (GET /api/clients, /api/licenses, /api/invoices, etc.) filter by activeCompanyId
  - All create operations use user's activeCompanyId
  - Fixes "erro ao salvar cliente" - client creation now works with proper company context
  - **Critical Fix (Nov 5, 2025)**: Admin users now correctly see filtered data based on selected company instead of all companies