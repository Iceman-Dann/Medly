# Medly

Medly is a privacy-first health tracking app that helps users monitor symptoms, identify patterns, and prepare for medical consultations. Features include local data storage, AI insights, professional SOAP notes, and secure sharing—all without compromising personal health data. Built with React, TypeScript, and offline-first architecture.

**Dev Season of Code 2026**

A secure medical symptom assistant that helps users track health trends, generate clinical SOAP notes for doctor visits, and use AI to prepare for appointments. Choose between cloud storage (Google login) or local storage (anonymous mode).

## Features

- **Symptom Logging**: Track symptoms and health events with detailed notes
- **AI-Powered Assistant**: Get insights and prepare for doctor visits with AI assistance
- **SOAP Note Generation**: Automatically generate clinical SOAP notes for medical appointments
- **Timeline View**: Visualize your health history and trends over time
- **Doctor's Prep Hub**: Prepare questions and organize information before appointments
- **Flexible Storage**: Choose between cloud storage (Google login) or local storage (anonymous mode)
- **QR Code Handshake**: Share medical reports securely via QR codes

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: Dexie (IndexedDB wrapper)
- **AI Services**: Google Gemini
- **Routing**: React Router
- **PDF Generation**: jsPDF
- **Validation**: Zod

## Prerequisites

- Node.js (v18 or higher recommended)
- A Gemini API key

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Medly
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your `GEMINI_API_KEY`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to the local development URL (typically `http://localhost:5173`)

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

- `/pages` - Main application pages (Dashboard, Logger, ChatAssistant, etc.)
- `/components` - Reusable React components
- `/lib` - Core libraries (chat, retrieval, patterns, sanitization)
- `/services` - External service integrations (Gemini)
- `/db.ts` - Database schema and operations
- `/public` - Static assets

## Privacy & Security

Medly is designed with flexibility in mind. Users can choose between cloud storage with Google login for data persistence across devices, or local storage (anonymous mode) for maximum privacy. No health information is transmitted to external servers unless explicitly shared via QR code handshake.

## License

This project was created for Dev Season of Code 2025.

## Contributors

- Iceman-Dann (https://github.com/Iceman-Dann)
