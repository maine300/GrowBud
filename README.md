# SmartGrow Plant Monitoring System

An advanced IoT plant monitoring system with real-time sensor data, device controls, and comprehensive plant care management.

## Features

- **Real-time Monitoring**: Temperature, humidity, and soil moisture tracking
- **Device Control**: Remote control of lights, fans, and pumps
- **Plant Management**: Add, track, and manage multiple plants
- **Care Calendar**: Automated scheduling and task management
- **Photo Tracking**: Growth documentation with image uploads
- **Analytics**: Growth insights and environmental data visualization
- **Hardware Integration**: ESP32/ESP8266 sensor support

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Tailwind CSS + Radix UI components
- **Hardware**: ESP32/ESP8266 integration

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NODE_ENV`: production or development
4. Build the app: `npm run build`
5. Start the server: `npm start`

## Deployment

This app is optimized for deployment on Render.com:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/index.js`
- **Environment Variables**: `NODE_ENV=production`, `DATABASE_URL`

## Hardware Integration

Compatible with ESP32 and ESP8266 microcontrollers for sensor data collection and device automation. See `/esp-integration` folder for Arduino code.

## License

MIT License