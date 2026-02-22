# Changelog

## [2.2.11] - 2026-02-22
### Finalized Professionalism & Stability
- **Professional Invoice Printing**: Redesigned the entire print system from scratch. Implemented a **Document-First Architecture** using React Portals to isolate the invoice document from the main app root.
- **Bug Fix**: Resolved "blank page" issues in PDF output by ensuring the print document rendered as a direct child of the `body`, bypassing flex-container clipping.
- **Security Hardening**: Updated `userService.updateUserProfile` with a restrictive whitelist of allowed columns, preventing "Save" button failures caused by invalid fields (like `password` or missing columns).
- **Schema Identification**: Identified missing `company` column in the `profiles` table and updated documentation for manual schema correction.

## [2.2.10] - 2026-02-22
### Refined
- **Professional Print View**: Applied `print:hidden` to all layout headers, sidebars, page banners, and view toggles. This ensures that only the invoice/report content is visible on printed PDFs.
- **UI Consistency**: Hidden the `BookingDetailPanel` overlay during print operations.
- **Code Health**: Fixed query function signatures in `Dashboard.tsx` to align with the refactored services.

## [2.2.9] - 2026-02-22
### Optimized
- **Supabase Egress**: Refactored major services to use server-side counts (`head: true`) and range-based pagination.
- **Dashboard Performance**: Implemented date-filtered financial stats to prevent unbounded historical data fetching.
- **User Management**: Added pagination to the users list in `UsersPage`.
- **Finance Record**: Added pagination to the expenses list in `FinancePage`.

## [2.2.8] - 2026-02-22
### Professional Refinements
- **Invoice Printing**: Implemented dedicated print-view styling. Hidden unnecessary UI elements (sidebar, headers, buttons) during printing to ensure a clean, professional invoice document.
- **Improved Workflow**: Made the "Invoice Generated" status in the Booking Detail Panel clickable, allowing managers to view/print invoices directly from the booking inspector.
- **Advanced Parity**: Synchronized bank details and client address integration with the modern Next.js version for complete feature parity.
- **Stability Fix**: Resolved "infinite loading" issue by adding an explicit initial session check and a 5-second safety timeout to the authentication service.

## [2.2.7] - 2024-05-24
### Bug Fix: Booking Visibility
- **Self-Healing Linking**: Implemented a robust "sync" mechanism that runs automatically when a client visits their portal. This searches for any past "guest" bookings made with their email and links them to their account, fixing issues where sign-up triggers might have missed older data.
- **Case-Insensitive Queries**: Updated `bookingService` to use case-insensitive matching (`ilike`) for email addresses. This resolves issues where users couldn't see bookings if they capitalized their email differently during sign-up vs booking.

## [2.2.6] - 2024-05-24
### Connection & Data Integrity
- **Disable Caching**: Updated `QueryClient` configuration to disable data caching (`staleTime: 0`, `gcTime: 0`). This ensures users always fetch fresh data from the server, preventing stale session issues on page reload.
- **Enhanced Guest Linking**: 
  - Implemented a new database trigger `link_booking_to_user` that automatically links new bookings to an existing user profile if the email addresses match, even if the user is not logged in during booking.
  - Normalized email inputs (trim/lowercase) in `bookingService` to ensure reliable matching.

## [2.2.5] - 2024-05-24
### Database Integrity
- **Schema Fix**: Added missing SQL migrations for `currency` columns in `bookings`, `invoices`, and `expenses` tables.
- **Migration Logic**: Updated `db_schema.sql` to safely add new columns (`vat_included`, `reference`, etc.) to existing tables without data loss.
- **Cache Invalidation**: Ensured `NOTIFY pgrst, 'reload schema';` is executed to refresh Supabase schema cache immediately after migrations.

## [2.2.4] - 2024-05-24
### Added
- **Dynamic Exchange Rates**: Implemented user-managed exchange rates for EUR and USD. Admins can now define these rates in Settings -> Finance & Operations.
- **Financial Accuracy**: The dashboard and financial reports now use the user-defined exchange rates to aggregate all multi-currency bookings and invoices into the base currency (SCR).

## [2.2.3] - 2024-05-24
### UI/UX Improvements
- **Booking Management**: Redesigned the booking details view. Replaced the status button row with a professional **Action Toolbar** featuring a status dropdown and intelligent primary actions (e.g., "Confirm Booking" is highlighted for Pending requests).
- **Visuals**: Improved the layout of the booking inspector for better readability and administrative workflow.

### Bug Fixes
- **Stability**: Fixed TypeScript type definitions in the `ErrorBoundary` component to ensure reliable crash handling.

## [2.1.3] - 2024-05-24
### Refactoring & Optimization
- **Codebase Cleanup**: Extracted reusable UI components (`StatCard`, `SidebarLink`) to reduce duplication and improve maintainability.
- **Security Hardening**: Centralized cryptographic UUID generation in `lib/utils.ts` to ensure consistent and secure ID creation across all services.
- **Standardization**: Implemented unified currency and date formatting utilities for a consistent user experience.
- **Performance**: Optimized imports and removed redundant code blocks in Finance and Booking modules.

## [2.1.1] - 2024-05-24
### Feature: Smart Guest Linking
- **Intelligent Linking**: Implemented a dual-layer system to link Guest bookings to User accounts.
  - **Database Trigger**: Automatically links historical bookings to new users based on email address matching upon sign-up.
  - **Smart RLS**: Updated Row Level Security policies to allow authenticated users to view unlinked guest bookings if the email address matches their account email.
  - **Robust Querying**: Updated `bookingService` to query by ID or Email, ensuring users see their trips immediately even if database processing is delayed.

## [2.1.0] - 2024-05-24
### Security & Performance Update
- **Security**: Replaced `Math.random` UUID generation with cryptographically secure `crypto.randomUUID()` to ensure ID uniqueness and security.
- **Scalability**: Implemented server-side pagination for Bookings and Invoices lists. The dashboard now fetches optimized statistics instead of loading all records.
- **Data Integrity**: Refactored financial calculations to use integer math (cents) to eliminate floating-point precision errors in VAT and Tax reporting.

## [2.0.7] - 2024-05-24
### Production Release
- **Audit**: Completed full production readiness audit.
- **Branding**: Added official version number and JBVservices signature to application footer and sidebar.
- **Security**: Hardened invoice inputs against NaN/Null database errors.

## [1.5.7] - 2024-05-24
### Added
- **Smart Signup**: Implemented automatic booking linking. When a new user signs up, the system now automatically searches for existing "Guest" bookings made with their email address and links them to their new account immediately.
- **Finance Upgrade**: Added delete capability for expenses and improved invoice workflow.

## [1.5.5] - 2024-05-24
### Added
- **Performance Monitoring**: Integrated `@vercel/speed-insights` to track real-world performance metrics (Core Web Vitals) directly within the Vercel dashboard. Added the component to the root `App.tsx` and updated the import map in `index.html`.

## [1.5.4] - 2024-05-24
### Changed
- **Database Migration**: Switched Supabase backend connection to project `iezlmplizekdrlktbaat`. Updated `.env` and `supabaseClient.ts` fallback credentials.

## [1.5.3] - 2024-05-24
### Fixed
- **App Crash**: Resolved `TypeError: Cannot read properties of undefined` in `supabaseClient.ts`. Added safe access checks for `import.meta.env` with fallback credentials to support non-Vite/no-build environments where environment variables are not injected.

## [1.5.2] - 2024-05-24
### Fixed
- **Settings Save Issue**: Fixed a bug where updating business settings (including Hero Image) would fail silently and revert to previous values due to RLS policies blocking `upsert` operations. Switched to explicit `update` for the singleton settings row.

## [1.5.1] - 2024-05-24
### Changed
- **Booking References**: Replaced raw UUIDs with professional short codes (e.g., `KIT-1A2B3C4D`) across all views (Dashboard, List, Portal, Invoices, Toasts).
- **UI Polish**: Applied the new booking reference format to the Dashboard recent activity, Client Portal list, and Invoice print views.

## [1.5.0] - 2024-05-24
### Changed
- **Login Screen**: Completely redesigned `LoginPage` for a production-ready look.
  - Implemented split-screen layout with Seychelles-themed hero image.
  - Removed dev-mode demo credential buttons.
  - Improved form aesthetics, input states, and typography.
  - Added "Remember Me" and "Forgot Password" UI elements.
- **Home Page**: Enhanced "Featured Experiences" cards.
  - Added "Book This Experience" button to advert cards.
  - Clicking an advert now auto-scrolls to the booking form and pre-fills details (Service Type: Tour, Notes: Offer Title + Price).

### Fixed
- **Guest Booking**: Resolved a "Failed to submit booking" error for guest users.
  - Modified `bookingService.createBooking` to bypass RLS read restrictions by generating UUIDs client-side and returning the constructed object instead of selecting from the DB immediately after insertion.

## [1.4.4] - 2024-05-24
### Fixed
- **Images**: Updated `settingsService` with a new set of verified, high-availability Unsplash IDs for Seychelles (La Digue Boulders, Vallee de Mai, Aldabra Tortoise).
- **Fallbacks**: Updated `HomePage` hero fallback URL to match the verified Anse Source d'Argent image.

## [1.4.3] - 2024-05-24
### Fixed
- **Image URLs**: Updated `settingsService` with reliable Unsplash IDs for Seychelles imagery (Anse Source d'Argent, Aldabra Tortoises, Vallee de Mai) to resolve broken link issues.

## [1.4.2] - 2024-05-24
### Fixed
- **Broken Images**: Replaced broken placeholder images in `settingsService` with fresh, high-quality Unsplash URLs depicting authentic Seychelles scenery (Anse Source d'Argent, Tortoises, Catamarans).

## [1.4.1] - 2024-05-24
### Fixed
- **React Router Warnings**: Permanently silenced console warnings regarding React Router v7 future flags by opting into `v7_startTransition` and `v7_relativeSplatPath` in the `HashRouter`.

## [1.4.0] - 2024-05-24
### Branding & Aesthetics
- **New Logo**: Designed and implemented a vector SVG logo (`components/Logo.tsx`) featuring the 5 colors of the Seychelles flag in a radiating pattern.
- **Authentic Imagery**: Updated default settings to use high-quality, real photos of Seychelles (Anse Source d'Argent, Vallee de Mai, Giant Tortoises) instead of placeholders.
- **UI Updates**: Replaced text-based headers in the Sidebar, Navbar, and Footer with the new Logo component.

## [1.3.0] - 2024-05-24
### Added
- **Image Upload Feature**: Implemented a mock file uploader allowing Admins to upload actual image files for Adverts, Gallery, and the Hero Background.
  - Files are converted to Base64 to simulate persistence within `localStorage`.
  - Added strict 2MB limit to prevent storage quota issues.
- **Custom Hero Image**: Admins can now change the large top background image on the Home Page via Settings -> General Info.
- **Improved Settings UI**: Replaced text input fields for "Image URL" with a user-friendly file upload widget with preview.

## [1.2.0] - 2024-05-24
### Security & Role Updates
- **RBAC Hardening**: Implemented strict separation between ADMIN and MANAGER roles.
- **Settings Restriction**: `SettingsPage` (System Config, Adverts, Gallery) is now exclusive to ADMINs. Managers cannot access the route or see the sidebar link.
- **User Management**: Managers now have read-only access to the User List. Only ADMINs can see "Edit" and "Delete" actions/buttons.

## [1.1.2] - 2024-05-24
### Fixed
- **Router Warning**: Added `v7_startTransition: true` to `HashRouter` future flags in `App.tsx` to fix React Router warning about state updates wrapping.

## [1.1.1] - 2024-05-24
### Fixed
- **Login Intelligence**: Replaced role selection buttons with a single login form. `authService` now intelligently assigns roles based on email patterns (admin/manager keywords) simulating a real backend.
- **Client Portal Navigation**: The "Client Portal" button on HomePage now automatically directs logged-in users to their correct dashboard (Admin/Manager -> Dashboard, Client -> Portal) without re-login.
- **Router Warning**: Added `future={{ v7_relativeSplatPath: true }}` to `HashRouter` in `App.tsx` to fix React Router v7 future flag warning.

## [1.1.0] - 2024-05-24
### Added
- **Settings Module**: Added `SettingsPage` for Admin/Managers to manage business info.
- **Content Management**: Added ability to manage "Adverts" and "Gallery" images via Settings.
- **Redesigned Home Page**: Complete overhaul of `HomePage` to reflect "Kreol Island Tours and Transfers" branding.
  - Added Hero section with dynamic business name.
  - Added Services section.
  - Added Featured Adverts/Offers section.
  - Added Photo Gallery section.
  - Improved Footer with dynamic contact info.
- **Service Layer**: Added `settingsService.ts` to mock data persistence for settings, adverts, and gallery.
- **Branding**: Updated `index.html` title and App Sidebar to "Kreol Island Tours".

## [1.0.1] - 2024-05-24
### Fixed
- Added missing `services/authService.ts` to fix compile errors.
- Downgraded `react-router-dom` to stable v6.28.0 to prevent version conflict.
- Updated `App.tsx` RBAC to allow Managers access to the User Management module.
- Wrapped `App` in `AuthProvider` in `index.tsx`.

## [1.0.0] - 2024-05-24
### Added
- Initial project structure with React, TypeScript, and Tailwind.
- Defined domain types (`User`, `Booking`, `Invoice`).
- Implemented `authService` with mock login and RBAC.
- Created `bookingService` with Zod validation schemas.
- Created `financeService` for VAT calculation and invoicing.
- Built responsive Sidebar and Mobile navigation layout using Seychelles flag colors.
- Implemented `HomePage` for public booking with Zod validation.
- Implemented `Dashboard` with basic statistics.
- Implemented `BookingsList` for management.
- Implemented `FinancePage` for tax and invoice viewing.
- Implemented `ClientPortal` for client self-service.
- Added `db_schema.sql` for future Supabase integration.
- Added `architecture.md` file.