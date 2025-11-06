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

### Automated Invoice Generation by Due Date (Completed - Nov 5, 2025)
- **Schema Enhancement**: Added `dueDay` field to clients table
  - Integer field (1-31) representing the day of month for invoice due date
  - Validated with Zod: min(1).max(31)
  - Form uses z.coerce.number() for proper numeric input handling
- **Invoice Generation Endpoint**: POST /api/invoices/generate
  - Accepts clientId in request body
  - Calculates due date based on client's dueDay + current month/year
  - Handles month overflow (e.g., day 31 in February becomes last day of month)
  - Normalized date comparison prevents same-day bugs (compares calendar days, not timestamps)
  - Multi-tenant security: validates client belongs to user's activeCompanyId
  - Returns 201 with created invoice on success
- **UI Integration**: "Gerar Fatura" button in clients table
  - FileText icon button in each client row (data-testid="button-generate-invoice-{clientId}")
  - Loading state during generation
  - Toast notification on success: "Fatura gerada com sucesso!"
- **Date Logic Details**:
  - Uses normalized calendar day comparison (not timestamps) to prevent time-of-day issues
  - If dueDay exceeds days in current month, sets to last day of month
  - If calculated due date is in the past, uses next month
  - All date calculations handle edge cases (leap years, short months, etc.)
- **Production-Ready**: Architect-approved with comprehensive edge case handling and security validation
- **Duplicate Protection (Nov 5, 2025)**: Added validation to prevent duplicate invoice generation
  - Checks for existing invoices with same due date before creating
  - Returns 409 Conflict with Portuguese message if duplicate detected

### Automated License Generation (Completed - Nov 5, 2025)
- **License Generation Endpoint**: POST /api/licenses/generate
  - Accepts clientId in request body
  - Validates client belongs to user's activeCompanyId (multi-tenant security)
  - Checks for existing active licenses to prevent duplicates
  - Generates unique license key in format XXXX-XXXX-XXXX-XXXX
  - Uses customAlphabet with uppercase alphanumerics only (0-9, A-Z)
  - Sets expiration date to 1 year from generation
  - Returns 201 with created license on success
  - Returns 409 Conflict if active license already exists
- **UI Integration**: "Gerar Licença" button in clients table
  - Key icon button in each client row (data-testid="button-generate-license-{clientId}")
  - Positioned between "Gerar Fatura" and "Delete" buttons
  - Loading state during generation
  - Toast notifications for success/error in Portuguese
- **Duplicate Protection**: Both licenses and invoices
  - Licenses: checks for existing active license per client
  - Invoices: checks for existing invoice with same due date
  - Returns appropriate error messages in Portuguese
- **Localization**: All error messages in Portuguese
  - Validation errors, not found errors, and generic failures
  - Consistent user experience with localized feedback
- **Production-Ready**: Architect-approved with secure key generation and complete error handling

### OAuth Callback Redirect Issue Fix (Completed - Nov 6, 2025)
- **Issue**: After clicking "Allow" on OAuth consent screen, user redirected back to landing page instead of dashboard
  - Backend logs showed successful callback and session creation
  - Multiple GET /api/auth/user requests returning 200
  - Session cookies not being persisted/sent in production environment
- **Root Cause**: Session cookie configuration incompatible with Cloud Run proxy
  - Missing `proxy: true` setting prevented proper HTTPS cookie handling
  - No explicit cookie path caused inconsistent cookie delivery
- **Fixes Applied** (server/replitAuth.ts):
  - Added `proxy: true` to trust Cloud Run/Replit proxy for secure cookie handling
  - Added custom cookie name `yukem.sid` to avoid conflicts
  - Added explicit `path: '/'` to ensure cookies sent on all routes
  - Maintained `sameSite: 'lax'` for OAuth redirect compatibility
  - Added detailed logging in callback handler for debugging
- **Frontend Improvements** (client/src/hooks/useAuth.ts):
  - Set `staleTime: 0` to always fetch fresh auth data
  - Added console logging for debugging auth state
  - Removed retry logic that was causing duplicate requests
- **Production-Ready**: Session cookies now properly persist across OAuth flow in production

### Authentication Flow Fix (Completed - Nov 5, 2025)
- **Issue**: System froze with infinite loading screen after login
  - Backend returned 200 but frontend never rendered Dashboard
  - Multiple GET /api/auth/user requests observed
- **Root Cause Analysis**:
  1. Duplicate useAuth() calls in Router and AuthLayout components
  2. Stale cache showing null after OAuth callback redirect
  3. Render loop where Router remounts triggered fresh queries before previous settled
- **Fixes Applied**:
  - **Single Source of Truth**: Removed useAuth() from Router component
    - Router now receives `isAuthenticated` prop from AuthLayout
    - AuthLayout is the only component calling useAuth()
    - Eliminates render loop and duplicate query triggers
  - **Cache Invalidation**: Added useEffect in AuthLayout to invalidate `/api/auth/user` cache on mount
    - Ensures fresh auth data fetched after OAuth redirect from /api/callback
    - Prevents stale null/401 cache from blocking dashboard render
  - **Optimized Query Settings** (client/src/hooks/useAuth.ts):
    - staleTime: 1 minute (prevents excessive refetches while maintaining freshness)
    - gcTime: 5 minutes (keeps data in cache)
    - refetchOnWindowFocus: false (avoids unnecessary refetches)
- **Testing**: End-to-end login flow validated with playwright
  - User clicks login → OIDC flow → callback → Dashboard renders successfully
  - No infinite loading states
  - No excessive duplicate requests
- **Production-Ready**: Architect-approved, no performance or security issues