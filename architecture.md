# System Architecture: Seychelles Transfer & Tours Manager

## Overview
This application is designed as a modular React SPA (Single Page Application) using TypeScript. Ideally, it interfaces with a Supabase backend. Currently, it uses a Service Layer Abstraction to mock data interactions, allowing for seamless transition to a real backend.

## Tech Stack
- **Frontend:** React 18+
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State/Query Management:** TanStack Query (React Query)
- **Validation:** Zod
- **Routing:** React Router v6
- **Icons:** Heroicons

## Core Modules

### 1. Authentication (`services/authService.ts`)
- **Context API:** Uses React Context (`AuthProvider`) to wrap the application in `index.tsx`.
- **State:** Manages `user` state and `isLoading` status.
- **Persistence:** Syncs user session to `localStorage` to allow page reloads without logging out in mock mode.
- **RBAC:** `UserRole` enum drives access. `PrivateLayout` component in `App.tsx` checks these roles before rendering routes.
  - **ADMIN:** Full access.
  - **MANAGER:** Dashboard, Bookings, Finance, Users.
  - **CLIENT:** Client Portal only.

### 2. Booking System (`services/bookingService.ts`)
- Manages the lifecycle of a booking: `PENDING` -> `CONFIRMED` -> `COMPLETED`.
- Supports various service types (Transfer, Tour, Charter).
- Uses Zod for input sanitization and validation on the booking form.

### 3. Financial Module (`services/financeService.ts`)
- **Tax Logic:** Implements Seychelles Value Added Tax (VAT) logic (default 15%).
- **Invoicing:** Generates invoice objects based on booking data.
- **Reporting:** Simple aggregation of revenue.

### 4. Database Schema (Supabase/PostgreSQL)
*See `db_schema.sql` for the proposed table structure.*

## Visual Identity
The app strictly follows the Seychelles flag color palette to align with the client's branding:
- Blue (`#003D88`)
- Yellow (`#FCD856`)
- Red (`#D62828`)
- White (`#FFFFFF`)
- Green (`#007A3D`)

## Security Considerations
1.  **RBAC:** Route wrappers prevent unauthorized access to pages.
2.  **Input Sanitization:** Zod schemas ensure data integrity before "sending" to the service layer.
4.  **Stability & Initialization:** `authService.ts` implements a dual-layer initialization check (manual session fetch + lifecycle listener) and a 5-second safety timeout to prevent stuck loading states.
5.  **Print Optimization:** Uses `@media print` directives and `print:hidden` Tailwind utilities to isolate document content (like Invoices) for professional physical output.

## Directory Structure
- `lib/`: Utilities and third-party wrappers.
- `services/`: API calls and business logic (currently mocked).
- `pages/`: Page-level components.
- `components/`: Reusable UI bricks.
