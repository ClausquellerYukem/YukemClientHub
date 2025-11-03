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