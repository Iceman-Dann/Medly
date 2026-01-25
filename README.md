# Symra - Medical Empowerment Assistant

**RoseHack 2026**

A secure, privacy-first medical symptom assistant that helps users track health trends, generate clinical SOAP notes for doctor visits, and use AI to prepare for appointments. All data is stored locally in your browser.

## Features

- **Symptom Logging**: Track symptoms and health events with detailed notes
- **AI-Powered Assistant**: Get insights and prepare for doctor visits with AI assistance
- **SOAP Note Generation**: Automatically generate clinical SOAP notes for medical appointments
- **Timeline View**: Visualize your health history and trends over time
- **Doctor's Prep Hub**: Prepare questions and organize information before appointments
- **Privacy-First**: All data stored locally in your browser using IndexedDB
- **QR Code Handshake**: Share medical reports securely via QR codes

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: Dexie (IndexedDB wrapper)
- **AI Services**: Google Gemini, OpenAI, Anthropic Claude, Groq
- **Routing**: React Router
- **PDF Generation**: jsPDF
- **Validation**: Zod

## Prerequisites

- Node.js (v18 or higher recommended)
- A Gemini API key (or other AI service API keys)

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Symra
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your `GEMINI_API_KEY` (or other AI service API keys)

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
- `/services` - External service integrations (Gemini, OpenAI)
- `/db.ts` - Database schema and operations
- `/public` - Static assets

## Privacy & Security

Symra is designed with privacy as a core principle. All user data is stored locally in the browser using IndexedDB. No health information is transmitted to external servers unless explicitly shared via QR code handshake.

## License

This project was created for RoseHack 2026.
