# Design Guidelines: Yukem White Label Client Management Platform

## Design Approach
**Selected Approach**: Design System + Modern SaaS Admin Inspiration

Drawing from Linear, Stripe Dashboard, and Vercel's data-centric interfaces, combined with Material Design principles for information-dense applications. This platform prioritizes data clarity, operational efficiency, and professional aesthetics suitable for B2B SaaS administration.

## Core Design Elements

### Typography
- **Primary Font**: Inter or DM Sans via Google Fonts (clean, readable at small sizes)
- **Hierarchy**:
  - Page Titles: 2xl font, semibold (text-2xl font-semibold)
  - Section Headers: xl font, semibold (text-xl font-semibold)
  - Card Titles: lg font, medium (text-lg font-medium)
  - Body Text: base font, normal (text-base)
  - Table Headers: sm font, medium uppercase tracking-wide (text-sm font-medium uppercase tracking-wide)
  - Table Data: sm font, normal (text-sm)
  - Metadata/Labels: xs font, medium (text-xs font-medium)

### Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: gap-6 to gap-8
- Card spacing: p-6
- Form field spacing: space-y-4
- Grid gaps: gap-4 to gap-6

**Grid Structure**:
- Main container: max-w-7xl with px-4 to px-8
- Dashboard metrics: 4-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Content areas: 2-column where needed (grid-cols-1 lg:grid-cols-2)

### Layout Architecture

**Sidebar Navigation** (Fixed Left):
- Width: 64 (w-64) on desktop, collapsible on mobile
- Contains: Logo at top, main navigation links with icons, user profile at bottom
- Active state: Highlighted background with subtle left border accent
- Icons: Heroicons (Dashboard, Users, CreditCard, Key, Settings)

**Main Content Area**:
- Top Bar: Breadcrumb navigation, search input, notifications, user menu
- Page Header: Title + primary action button (right-aligned)
- Content Cards: Elevated cards (shadow-sm with border) containing modules

## Component Library

### Dashboard Metrics Cards
- 4 stat cards in grid layout
- Each card contains: Icon (top-left), Metric label (text-xs uppercase), Large number (text-3xl font-bold), Trend indicator with percentage
- Cards: Rounded corners (rounded-lg), subtle border, padding p-6

### Data Tables
- Sticky header row with subtle background
- Row hover states for interactivity
- Alternating row backgrounds for readability
- Action column (right-aligned): Icon buttons for Edit, View, Delete
- Pagination controls at bottom
- Search and filter controls above table
- Badge components for status indicators (Ativo/Inativo, Pago/Pendente)

### Forms (Client Registration & License Management)
- Two-column layout on desktop (grid-cols-1 lg:grid-cols-2)
- Field groups with clear labels above inputs
- Input styling: Border, rounded corners (rounded-md), focus ring
- Required field indicators with asterisks
- Helper text below fields when needed
- Action buttons at bottom: Primary (Save), Secondary (Cancel)

### Status Badges
- Rounded-full with px-3 py-1
- Different semantic variations:
  - Active/Paid: Green background
  - Pending: Yellow/Amber background
  - Inactive/Overdue: Red background
  - Trial: Blue background
- Small text (text-xs font-medium)

### Financial Module Components
- Invoice list table with columns: ID, Cliente, Valor, Data Vencimento, Status, Ações
- Payment history timeline view
- Revenue summary cards showing: Receita Mensal, Receita Anual, Taxa de Conversão
- Filtros: Date range picker, status filter, client filter

### License Management Interface
- Client list with license status column
- Toggle switches for activate/deactivate licenses
- License details modal showing: Client name, License key, Activation date, Expiry date, Status
- Bulk action capabilities with checkboxes

## Navigation Structure
**Sidebar Menu Items**:
1. Dashboard (home icon)
2. Clientes (users icon)
3. Financeiro (credit card icon)
4. Licenças (key icon)
5. Configurações (settings icon - bottom)

## Interactive Elements
- Hover states: Subtle background change on table rows, buttons, and nav items
- Focus states: Visible ring on all interactive elements
- Loading states: Skeleton screens for tables, spinner for buttons
- Empty states: Centered icon + message for empty data tables
- Confirmation modals for destructive actions (delete client, deactivate license)

## Critical Patterns
- Consistent spacing between all sections
- All tables must have search and filter capabilities
- All forms must have clear validation feedback
- Success/error toast notifications for actions
- Breadcrumb navigation on all internal pages
- Responsive tables that stack on mobile or use horizontal scroll

## Images
**No hero images required** - This is a functional admin dashboard. Use icons throughout from Heroicons for navigation, metrics, and table actions. Avatar placeholders for user profiles only.