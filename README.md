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
   Vite reads environment files by mode. Use `development-docker` when the Docker/Nginx proxy is running on HTTPS, `development-direct` when you run the .NET API directly on HTTP, `.env.staging` for staging, and `.env.production` for production. If your machine needs a private override for Docker dev, use `.env.development-docker.local`.

   Typical local Docker setup:
   `VITE_API_BASE_URL=/api`
   `VITE_API_PROXY_TARGET=https://localhost:5050`

   Typical direct API setup:
   `VITE_API_BASE_URL=/api`
   `VITE_API_PROXY_TARGET=http://localhost:8080`

   Typical production setup:
   `VITE_API_BASE_URL=https://api.yourdomain.com/api`

3. **Start the development server**:
   ```bash
   npm start
   ```

### URLs
- **Local Dev**: http://localhost:3000
- **Mobile Dev**: http://[YOUR_LOCAL_IP]:3000 (see Mobile Development section)

### Mobile Development

To access the application from mobile devices (e.g., using Expo):

1. **Quick setup script** (recommended):
   ```bash
   ./scripts/setup-mobile-dev.sh
   ```

2. **Manual setup**: Copy `.env.mobile` to `.env.development.local` and update with your local IP
   ```bash
   cp .env.mobile .env.development.local
   ```

📖 **For detailed instructions, see [MOBILE_DEVELOPMENT.md](./MOBILE_DEVELOPMENT.md)**

### VS Code Environment Picker

Use the workspace launch/task configuration if you want to choose the target environment from the IDE GUI:

- Run task: `web-run-selected-environment`
- Build task: `web-build-selected-environment`
- Launch profile: `Launch NursingCare Web`

When you start one of those, VS Code shows a picker for `development-docker`, `development-direct`, `staging`, or `production`.

- `development-docker` uses the Docker/Nginx local endpoint on `https://localhost:5050`
- `development-direct` uses the .NET API directly on `http://localhost:8080`
- `staging` maps to `.env.staging`
- `production` maps to `.env.production`

If you see `400 The plain HTTP request was sent to HTTPS port`, you selected the direct HTTP target while the Docker/Nginx HTTPS proxy is running on port `5050`. In that case use `development-docker`.

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
