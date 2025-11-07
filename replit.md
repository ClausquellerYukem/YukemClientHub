# Yukem White Label Client Management Platform

## Overview

Yukem is a white label client management platform for ERP client management, offering a SaaS dashboard for client, license, invoice management, and financial tracking. It aims to modernize client relationship management and financial operations for representatives, facilitating efficient scaling and improved business intelligence. The platform includes a comprehensive Reports module for data analysis with various report types and robust security measures.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The frontend is built with React 18, TypeScript, Vite, and Wouter for routing. It utilizes Shadcn/ui (Radix UI) and Tailwind CSS for a "new-york" style design system with light/dark modes. State management and data fetching are handled by TanStack Query, while React Hook Form and Zod manage forms and validation.

The backend uses Express.js with TypeScript and ESM, featuring a RESTful API with Zod for payload validation and centralized error handling. Drizzle ORM provides type-safe database interactions. Authentication is managed via Replit Auth (OpenID Connect) with PostgreSQL-backed session management. Core features include robust RBAC, multi-tenant client and license management (with soft-delete and automated blocking/unblocking), company registration with financial configurations, and external API integration for boleto printing. Key functionalities include user-company association management, a company selector for multi-tenant contexts, automated invoice generation, and automated license generation. The system also includes a comprehensive Reports module with predefined reports, a query builder, and custom SQL capabilities, all secured with multi-tenant isolation and parameter binding to prevent SQL injection.

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