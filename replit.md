# Yukem White Label Client Management Platform

## Overview

Yukem is a white label client management platform designed for managing ERP clients. It provides a SaaS dashboard with tools for client, license, invoice management, and financial tracking. The platform aims to modernize client relationship management and financial operations for representatives, enabling efficient scaling and improved business intelligence.

## Recent Changes (Nov 2025)

**Favicon and Logo Update (Nov 6, 2025)**
- Added custom favicon.ico to application
  - Favicon file placed in client/public/favicon.ico
  - HTML updated to reference /favicon.ico with proper MIME type
- Replaced placeholder "Yukem White Label" text branding with official Yukem logo
- Logo now appears in:
  - Sidebar header (centered, h-12)
  - Landing page header (h-10)
- Logo imported from: attached_assets/yukem completa sem fundo_1762452903411.png
- Uses @assets/ alias for proper Vite bundling
- Maintains aspect ratio with w-auto for responsiveness

**Boleto API Integration (Nov 6, 2025)**
- Integrated external boleto generation API (api.yukem.com.br/v1/geraboletoapi)
- Added boleto data fields to invoices table: ParcelaId, qrcodeId, qrcode, qrcodeBase64, url, generatedAt
- Created POST /api/invoices/:id/generate-boleto endpoint that:
  - Retrieves app_token and access_token from company's boleto configuration
  - Calls external API with proper authentication headers
  - Saves response data to database for future reference
  - Returns URL for immediate printing in new browser tab
- Frontend "Imprimir Boleto" button now uses new endpoint and opens boleto URL automatically
- All boleto operations respect multi-tenant isolation (company-scoped)

**Dashboard Metrics Fix (Nov 6, 2025)**
- Fixed misleading month-over-month comparisons that showed fake percentages when no historical data existed
- All dashboard cards now use aligned time windows for value/trend comparisons:
  - Revenue metrics compare current month vs previous month (not lifetime vs single month)
  - Invoice counts compare monthly periods (not lifetime vs monthly)
  - License counts use date-based calculations (activatedAt/expiresAt) for both current and historical periods
  - Pending invoices correctly identify which invoices were pending at end of each month
- Trends return `null` when previous period has zero data, preventing misleading percentages
- Card labels updated to clarify monthly metrics: "Receita do Mês", "Faturas Pagas (Mês)", "Pendentes (Mês)"

**Production Database Setup & Diagnostics (Nov 6, 2025)**
- Added comprehensive diagnostic logging to track user-company association issues
- Enhanced server-side logging in:
  - POST /api/admin/initial-setup endpoint with step-by-step association tracking
  - GET /api/user/companies endpoint to log userId and found companies
  - getUserCompanies storage method to trace database queries and results
- Created admin-only initial setup endpoint (POST /api/admin/initial-setup) that:
  - Associates current admin user with all existing companies in the database
  - Idempotent operation: safely handles already-associated companies
  - Sets first company as active if user has no active company
  - Returns detailed results including company names and association counts
  - **Security**: Requires MASTER_PASSWORD environment variable (mandatory, no default)
  - **Rate limiting**: 5 attempts per hour per user to prevent brute force
  - **Protection**: Validation errors don't reveal detailed information in production
- **Deployment requirement**: MASTER_PASSWORD secret must be set before deploying to production

**Admin Company Selector Enhancement (Nov 6, 2025)**
- Modified GET /api/user/companies to return ALL companies for admin users:
  - Detects admin role via getUserFromSession
  - Admins receive storage.getAllCompanies() instead of associated companies only
  - Non-admins continue to receive only their associated companies via getUserCompanies()
  - Differentiated logging for admin vs non-admin access
- Modified PATCH /api/user/active-company to allow admins to switch to any company:
  - Admins can switch to any company in the system
  - Non-admins restricted to their associated companies (validation enforced)
- Simplified CompanySelector component:
  - Removed "Configuração Inicial" button and dialog logic
  - Focused solely on company selection functionality
  - Cleaner, more maintainable code
- Moved initial setup functionality to Profile page:
  - "Configuração Inicial" button now appears only in Profile page
  - Restricted to comtecnologia.erp@gmail.com email only
  - AlertDialog confirmation requires master password before execution
  - Clear error handling and user feedback via toast notifications
  - Loading state during setup process
- **Use case**: Admins see all companies in the selector and can switch freely. Initial setup for associating admin with all companies is accessed from Profile page by authorized user only.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The frontend is built with React 18, TypeScript, Vite, and Wouter for routing. It uses Shadcn/ui (Radix UI) and Tailwind CSS for a "new-york" style design system with light/dark modes. State management and data fetching are handled by TanStack Query, while React Hook Form and Zod are used for form management and validation.

The backend uses Express.js with TypeScript and ESM, featuring a RESTful API with Zod for payload validation and centralized error handling. Drizzle ORM provides type-safe database interactions. Authentication is managed via Replit Auth (OpenID Connect) with PostgreSQL-backed session management. Core features include robust RBAC, client and license management (with soft-delete and automated blocking/unblocking), company registration with financial configurations, and external API integration for boleto printing. Key functionalities include user-company association management, a company selector for multi-tenant contexts, automated invoice generation based on due dates, and automated license generation.

PostgreSQL, specifically Neon serverless PostgreSQL, is used for data persistence, with Drizzle ORM and Drizzle Kit managing schema and migrations. Key tables include Clients, Licenses, Invoices, Boleto Config, Users, Roles, Role Assignments, and Role Permissions, utilizing UUIDs for primary keys and foreign key relationships.

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