# Nursing Care Web Portal

A high-performance React SPA built with Vite and MUI representing an enterprise of on-demand nursing care services and home residential care.

---

## Overview

The Nursing Care Web Portal is a comprehensive administrative and client-facing application designed for the management of on-demand nursing services and residential home care operations.

### Key Features
- **Client Interface**: Create and track nursing and residential care requests with automated pricing.
- **Admin Dashboard**: Real-time stats, service monitoring, and action items.
- **User Management**: Admins can manage system users, accounts, and roles across the enterprise.
- **Nurse Profiles**: Create, edit, and review nurse profiles and residential care qualifications.
- **Pricing Catalog**: Comprehensive management of system-wide service prices for all care types.
- **Audit Logs & Notifications**: Detailed monitoring and real-time alerts for enterprise operations.

---

## Key Pages & Screens

### Client & Public
- **Home**: Landing page with an overview of nursing and residential services.
- **Login / Register**: Secure authentication with Google OAuth2 support.
- **Create Service Request**: Guided form for submitting new nursing or residential care requests.
- **Service Request List**: Status tracking and historical details for all care services.
- **Account Settings**: Profile and session management.

### Admin Portal
- **Dashboard**: High-level system health and activity summaries for the enterprise.
- **Users & Accounts Management**: CRUD operations for all staff and administrative users.
- **Service Requests Queue**: Powerful list with detailed views and approval workflows for all care types.
- **Nurse Profiles Management**: Lifecycle management for medical and residential staff.
- **Clients Management**: Tools for overseeing client data and service history.
- **Pricing Catalog**: Global pricing management for all on-demand and residential service types.
- **Action Queue & Audit Logs**: Operational monitoring tools for enterprise compliance.

---

## Tech Stack

- **Framework**: React 19 + Vite
- **UI Library**: Material UI (MUI)
- **State Management**: React Context, Custom Hooks
- **Communication**: Axios with Interceptors
- **Testing**: Vitest + React Testing Library
- **Type Safety**: TypeScript (Strict Mode)

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Copy .env.example to .env.local and set VITE_API_BASE_URL to your backend instance (e.g., http://localhost:5050/api).

3. **Start the development server**:
   ```bash
   npm start
   ```

### URLs
- **Local Dev**: http://localhost:3000

---

## Available Scripts

- **npm start**: Run the Vite development server.
- **npm run build**: Build the production-ready bundle.
- **npm run preview**: Preview the production build locally.
- **npm test**: Run the Vitest test suite. **Mandatory: Must pass before commit.**

---

## Project Structure

- **src/api/**: API definitions and centralized HTTP client.
- **src/pages/**: Full-screen page components (Admin and Client).
- **src/components/**: Shared UI components and layout shells.
- **src/context/**: Authentication and global state providers.
- **src/hooks/**: Custom React hooks for business logic and data fetching.
- **src/types/**: Shared TypeScript interfaces and DTOs.

---

## Security & Privacy Note

- **No Secrets in Repo**: Ensure .env.local is listed in .gitignore.
- **No Icons/Emojis**: Documentation files must not contain emojis or icons.
- **Anonymized Examples**: All screenshots and documentation use placeholder data.
- **Public Visibility**: This repository is designed for public transparency; do NOT commit real user data or private information.
