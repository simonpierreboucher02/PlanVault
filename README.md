# PlanVault - Privacy-First Calendar & Reminders App

## Overview

PlanVault is a privacy-first calendar and reminders application built as part of the MinimalAuth suite. It provides users with a secure, private way to organize schedules, track important dates, and manage personal reminders without relying on big-tech providers. The application features a minimal authentication system (username + password + recovery key) and focuses on client-side encryption and user privacy.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Custom session-based auth with bcrypt password hashing
- **API Design**: RESTful API with JSON responses and standardized error handling

### Data Storage Solutions
- **Primary Database**: PostgreSQL configured through Drizzle ORM
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema**: Type-safe database schema with relations for users, events, reminders, and sessions
- **Encryption**: Client-side encryption for sensitive event data using CryptoJS
- **Migrations**: Drizzle Kit for database schema migrations

### Authentication and Authorization
- **Authentication Method**: Username/password with recovery key system (MinimalAuth principle)
- **Session Management**: Server-side sessions stored in database with expiration
- **Password Security**: bcrypt hashing with salt for password storage
- **Client-side Encryption**: Per-user encryption keys for sensitive calendar data
- **Authorization**: Session-based middleware for protected API endpoints

### Key Features Implementation
- **Calendar Views**: Monthly, weekly, and daily calendar interfaces with drag-and-drop functionality
- **Event Management**: CRUD operations for events with categories, recurring patterns, and reminders
- **Reminder System**: Configurable reminders (15min, 30min, 1hr, 1day before events)
- **Data Import/Export**: CSV and JSON import/export functionality for calendar portability
- **Search and Filtering**: Real-time event search with category and date range filtering
- **Theme Support**: Light/dark theme toggle with CSS custom properties

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect

### UI and Styling
- **Radix UI**: Headless UI component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent iconography
- **Google Fonts**: Inter font family for typography

### Development Tools
- **Vite**: Frontend build tool with React plugin and TypeScript support
- **Replit Integration**: Development environment plugins for cartographer and dev banner
- **ESBuild**: JavaScript bundler for server-side code compilation

### Utility Libraries
- **date-fns**: Date manipulation and formatting utilities
- **crypto-js**: Client-side cryptographic functions for data encryption
- **zod**: Schema validation library for type-safe data validation
- **clsx/twMerge**: Utility for conditional CSS class names

### Authentication & Security
- **bcrypt**: Password hashing library for secure password storage
- **nanoid**: Secure random ID generation for sessions and entities