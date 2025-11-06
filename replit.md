# Yukem White Label Client Management Platform

## Overview

Yukem is a white label client management platform designed for managing ERP clients. It provides a SaaS dashboard with tools for client, license, invoice management, and financial tracking. The platform aims to modernize client relationship management and financial operations for representatives, enabling efficient scaling and improved business intelligence.

## Recent Changes (Nov 2025)

**Dashboard Metrics Fix (Nov 6, 2025)**
- Fixed misleading month-over-month comparisons that showed fake percentages when no historical data existed
- All dashboard cards now use aligned time windows for value/trend comparisons:
  - Revenue metrics compare current month vs previous month (not lifetime vs single month)
  - Invoice counts compare monthly periods (not lifetime vs monthly)
  - License counts use date-based calculations (activatedAt/expiresAt) for both current and historical periods
  - Pending invoices correctly identify which invoices were pending at end of each month
- Trends return `null` when previous period has zero data, preventing misleading percentages
- Card labels updated to clarify monthly metrics: "Receita do Mês", "Faturas Pagas (Mês)", "Pendentes (Mês)"

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