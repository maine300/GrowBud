# Smart Plant Monitoring System

## Overview

This is a full-stack smart plant monitoring application built for IoT plant management. The system allows users to track multiple plants, monitor environmental conditions through sensors, control devices remotely, manage care schedules, and capture plant photos for growth tracking. The application is designed as a modern web application with real-time capabilities and comprehensive plant care management features.

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## Recent Changes (Latest Session)

### Completed Features
- **Fixed Delete Plant Functionality**: Plant deletion now properly removes related records (photos, calendar events) before deleting the plant itself
- **Customizable Dashboard**: Full dashboard customization system with multiple layout options and widget sizing
- **Settings Page**: Comprehensive settings interface accessible from dashboard header (/settings route)
- **Widget Size Controls**: Individual sizing (Small/Medium/Large) for Environment, Plants, Calendar, Controls, and Analytics widgets
- **Layout Options**: Grid, Masonry, and Compact layout modes with real-time preview
- **Display Controls**: Compact mode, grid lines toggle, theme selection, and adjustable refresh intervals (1-30 seconds)
- **Editable Calendar Tasks**: Users can click on any calendar task to edit the text inline. Click to edit, Enter to save, Escape to cancel
- **Complete Cannabis Growing Schedule**: Added comprehensive 145-day seed-to-harvest schedule with professional PPM levels, watering schedules, and advanced techniques (LST, SCROG, topping, lollipopping)
- **Feeding Schedule Upload on Plant Pages**: Added feeding schedule upload feature directly to individual plant detail pages for better accessibility
- **Professional Growing Techniques**: Schedule includes specific PPM levels (200-1200), timing for techniques, trichome monitoring, and proper curing processes

### Technical Implementation
- Fixed DatabaseStorage.deletePlant() to handle foreign key constraints properly
- Created useDashboardSettings hook for persistent settings management via localStorage
- Added Settings page with comprehensive dashboard customization controls
- Enhanced calendar event generation endpoint with complete cannabis lifecycle
- Added EditableTaskItem component with inline editing capabilities
- Integrated feeding schedule upload dialog into plant detail sidebar
- Complete schedule option generates all stages from seed to harvest (145 days total)
- Implemented dynamic widget sizing and layout system with CSS class generation
- **ESP32/ESP8266 Integration**: Added complete hardware integration with Arduino code for sensor reading and device control
- **Stage-Based Light Automation**: Fixed light schedules to properly reflect plant growth stages (16/8 seed, 18/6 veg, 12/12 flower)
- **Plant Height Tracking**: Added height field to database with growth insights and stage recommendations
- **Professional Analytics**: Enhanced analytics with real height-based growth rate calculations

Date: January 28, 2025

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom plant-themed design tokens
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **File Uploads**: Multer for photo management
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: Hot reload with Vite middleware integration

### Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon (serverless PostgreSQL)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations
- **File Storage**: Local filesystem for uploaded photos
- **Backup System**: JSON-based backup functionality

## Key Components

### Database Schema
- **Plants**: Core plant entity with name, strain type, location, stage, and planting date
- **Photos**: Plant photography with metadata and file paths
- **Sensor Data**: Environmental readings (temperature, humidity, soil moisture)
- **Calendar Events**: Task scheduling and care reminders
- **Device States**: IoT device control states (lights, fans, pumps)
- **Backups**: System backup management

### API Structure
- **RESTful Design**: Standard HTTP methods for CRUD operations
- **Plant Management**: `/api/plants` endpoints for plant lifecycle
- **Photo Management**: `/api/photos` with file upload support
- **Sensor Integration**: `/api/sensor-data` for environmental monitoring
- **Calendar System**: `/api/calendar-events` with automated scheduling
- **Device Control**: `/api/devices` for IoT device management
- **Backup Operations**: `/api/backups` for data management

### UI Components
- **Dashboard**: Central monitoring interface with real-time data
- **Plant Grid**: Visual plant overview with status indicators
- **Environment Cards**: Sensor data visualization with status indicators
- **Control Panel**: Device management interface
- **Care Calendar**: Task scheduling and tracking system
- **Photo Gallery**: Plant photography management
- **Analytics Panel**: Growth tracking and system insights

## Data Flow

### Sensor Data Flow
1. External sensors (presumably Raspberry Pi-based) send data to `/api/sensor-data`
2. Data is validated against schema and stored in PostgreSQL
3. Frontend polls sensor data every 5 seconds for real-time updates
4. Environment cards display current readings with status indicators

### Plant Management Flow
1. Users create plants through the add plant form
2. Plant data is validated and stored with generated UUID
3. Calendar events can be auto-generated based on plant stage presets
4. Photos are uploaded and associated with specific plants
5. Plant detail pages provide comprehensive plant information

### Device Control Flow
1. Device states are managed through `/api/devices` endpoints
2. Toggle requests update device states in the database
3. External IoT devices (lights, fans, pumps) read states from the API
4. Control panel provides real-time device status and control

### Calendar System Flow
1. Events can be manually created or auto-generated from stage presets
2. Stage presets define common tasks for seed, vegetative, and flowering stages
3. Events are date-based and can be marked as completed
4. Calendar provides visual task management interface

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL for serverless database hosting
- **UI Components**: Extensive Radix UI ecosystem for accessible components
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **File Handling**: Multer for multipart form uploads
- **Date Management**: date-fns for date manipulation
- **Routing**: Wouter for lightweight routing

### Development Dependencies
- **TypeScript**: Full TypeScript support across frontend and backend
- **Vite**: Modern build tooling with hot reload
- **ESBuild**: Fast JavaScript bundling for production
- **Drizzle Kit**: Database schema management and migrations

### IoT Integration
- The system is designed to integrate with external IoT devices
- Sensor data endpoints accept environmental readings
- Device control endpoints manage IoT device states
- The attached assets suggest integration with Raspberry Pi systems

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React application to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations manage schema updates
- **Assets**: Photo uploads stored in local `uploads/photos` directory

### Environment Configuration
- **Database URL**: Required environment variable for PostgreSQL connection
- **Development Mode**: Automatic Vite middleware integration
- **Production Mode**: Serves static files from build output
- **File Uploads**: Configurable upload directory with size limits

### Scalability Considerations
- **Database**: Serverless PostgreSQL scales automatically
- **File Storage**: Currently local filesystem (could be enhanced with cloud storage)
- **Real-time Updates**: Polling-based approach (could be enhanced with WebSockets)
- **Device Integration**: RESTful API allows for distributed IoT deployment

The application follows modern full-stack patterns with type safety throughout, real-time capabilities, and comprehensive plant management features designed for both hobbyist and commercial growing operations.