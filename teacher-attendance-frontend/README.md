# Teacher Attendance Frontend

A modern React application for teacher attendance tracking using QR codes.

## Features

- QR code scanning for attendance marking
- Real-time clock display
- Automatic date/time capture
- Responsive design for mobile devices
- Direct API integration with backend

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3001`

## Usage

1. Teachers scan the QR code displayed in the Super Admin Dashboard
2. Enter your name in the form
3. Select whether you're starting or ending work
4. Submit the form to record your attendance

## API Integration

The application connects to the backend API at `http://localhost:5000` for attendance data storage and retrieval.

## Technologies Used

- React 18
- Vite
- react-qr-reader for QR scanning
- Modern CSS with gradients and animations