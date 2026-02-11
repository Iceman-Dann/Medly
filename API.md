# Medly API Documentation

## Overview

The Medly API provides comprehensive access to health intelligence features, including AI-powered symptom analysis, health data management, and patient preparation tools. This API is designed with privacy-first principles and HIPAA compliance in mind.

## Base URL

```
https://api.medly.app/v1
```

## Authentication

### API Key Authentication

```http
Authorization: Bearer your-api-key-here
```

### Firebase Authentication

```http
Authorization: Firebase id-token-here
```

## Rate Limiting

- **Standard**: 100 requests per minute
- **Premium**: 1000 requests per minute
- **Enterprise**: Custom limits

## Endpoints

### Health Data Management

#### Create Health Entry

```http
POST /health/entries
```

**Request Body:**
```json
{
  "type": "symptom",
  "data": {
    "symptoms": ["headache", "fatigue"],
    "severity": "moderate",
    "duration": "3 days",
    "notes": "Worse in the morning"
  },
  "timestamp": "2025-02-11T10:00:00Z"
}
```

**Response:**
```json
{
  "id": "entry_123456",
  "status": "created",
  "timestamp": "2025-02-11T10:00:00Z",
  "encrypted": true
}
```

#### Get Health Entries

```http
GET /health/entries?start=2025-02-01&end=2025-02-11&type=symptom
```

**Response:**
```json
{
  "entries": [
    {
      "id": "entry_123456",
      "type": "symptom",
      "data": {
        "symptoms": ["headache", "fatigue"],
        "severity": "moderate",
        "duration": "3 days"
      },
      "timestamp": "2025-02-11T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1
}
```

#### Update Health Entry

```http
PUT /health/entries/{entryId}
```

**Request Body:**
```json
{
  "data": {
    "symptoms": ["headache", "fatigue", "nausea"],
    "severity": "severe",
    "duration": "4 days"
  }
}
```

#### Delete Health Entry

```http
DELETE /health/entries/{entryId}
```

### AI Analysis

#### Analyze Symptoms

```http
POST /ai/analyze-symptoms
```

**Request Body:**
```json
{
  "symptoms": ["headache", "fatigue", "nausea"],
  "duration": "4 days",
  "severity": "moderate",
  "additionalContext": "Stressful work week",
  "medicalHistory": ["migraines", "anxiety"]
}
```

**Response:**
```json
{
  "analysis": {
    "urgency": "medium",
    "possibleCauses": [
      "stress-related tension",
      "viral infection",
      "migraine variant"
    ],
    "recommendations": [
      "monitor symptoms for 48 hours",
      "consider stress reduction techniques",
      "consult doctor if symptoms worsen"
    ],
    "questionsForDoctor": [
      "Have you noticed any triggers for these symptoms?",
      "Are you experiencing any fever or body aches?",
      "How is your sleep quality?"
    ],
    "confidence": 0.94
  },
  "timestamp": "2025-02-11T10:05:00Z",
  "processingTime": "1.2s"
}
```

#### Generate Health Report

```http
POST /ai/generate-report
```

**Request Body:**
```json
{
  "timeframe": "30d",
  "includeSymptoms": true,
  "includePatterns": true,
  "includeRecommendations": true,
  "format": "pdf"
}
```

**Response:**
```json
{
  "reportId": "report_789012",
  "downloadUrl": "https://api.medly.app/reports/report_789012.pdf",
  "expiresAt": "2025-02-18T10:05:00Z",
  "summary": {
    "totalEntries": 15,
    "mainSymptoms": ["headache", "fatigue"],
    "patterns": ["stress-related", "weekend improvement"],
    "recommendations": ["stress management", "sleep improvement"]
  }
}
```

### Doctor Visit Preparation

#### Generate Preparation Questions

```http
POST /prep/questions
```

**Request Body:**
```json
{
  "symptoms": ["headache", "fatigue"],
  "duration": "4 days",
  "visitType": "general",
  "doctorSpecialty": "primary_care"
}
```

**Response:**
```json
{
  "questions": [
    {
      "category": "symptom_details",
      "question": "Can you describe the headache pain (sharp, dull, throbbing)?",
      "priority": "high"
    },
    {
      "category": "timing",
      "question": "What time of day are symptoms most severe?",
      "priority": "medium"
    },
    {
      "category": "lifestyle",
      "question": "Any recent changes in diet, sleep, or stress levels?",
      "priority": "high"
    }
  ],
  "checklist": [
    "List all current medications and dosages",
    "Bring previous medical records if available",
    "Note any allergies or adverse reactions"
  ],
  "estimatedVisitTime": "15-20 minutes"
}
```

#### Generate Visit Summary

```http
POST /prep/summary
```

**Request Body:**
```json
{
  "visitDate": "2025-02-15",
  "symptoms": ["headache", "fatigue"],
  "questions": ["Question 1", "Question 2"],
  "medications": ["ibuprofen 200mg as needed"],
  "notes": "Symptoms worse during work stress"
}
```

### User Management

#### Create User Profile

```http
POST /users/profile
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "dateOfBirth": "1990-01-15",
  "medicalConditions": ["migraines", "seasonal allergies"],
  "medications": ["ibuprofen 200mg as needed"],
  "allergies": ["penicillin"],
  "preferences": {
    "language": "en",
    "units": "metric",
    "notifications": true
  }
}
```

#### Get User Profile

```http
GET /users/profile
```

**Response:**
```json
{
  "id": "user_456789",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "dateOfBirth": "1990-01-15",
  "medicalConditions": ["migraines", "seasonal allergies"],
  "medications": ["ibuprofen 200mg as needed"],
  "allergies": ["penicillin"],
  "preferences": {
    "language": "en",
    "units": "metric",
    "notifications": true
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "lastUpdated": "2025-02-11T10:00:00Z"
}
```

#### Update User Profile

```http
PUT /users/profile
```

### Analytics & Insights

#### Get Health Trends

```http
GET /analytics/trends?period=30d&metrics=symptoms,severity
```

**Response:**
```json
{
  "period": "30d",
  "trends": {
    "symptoms": {
      "headache": {
        "frequency": 8,
        "trend": "decreasing",
        "change": -25
      },
      "fatigue": {
        "frequency": 12,
        "trend": "stable",
        "change": 0
      }
    },
    "severity": {
      "average": 3.2,
      "trend": "improving",
      "change": -15
    }
  },
  "insights": [
    "Headache frequency has decreased by 25% over the past month",
    "Symptoms appear to correlate with stress levels",
    "Consider tracking sleep patterns for better insights"
  ]
}
```

#### Get Health Score

```http
GET /analytics/health-score
```

**Response:**
```json
{
  "overallScore": 78,
  "breakdown": {
    "symptomControl": 82,
    "patternRecognition": 75,
    "preparationQuality": 85,
    "trendImprovement": 70
  },
  "recommendations": [
    "Focus on stress management techniques",
    "Maintain consistent sleep schedule",
    "Continue regular symptom tracking"
  ],
  "lastCalculated": "2025-02-11T10:00:00Z"
}
```

## Data Models

### Health Entry

```typescript
interface HealthEntry {
  id: string;
  type: 'symptom' | 'medication' | 'appointment' | 'note';
  data: {
    symptoms?: string[];
    severity?: 'mild' | 'moderate' | 'severe';
    duration?: string;
    medications?: string[];
    notes?: string;
  };
  timestamp: string;
  encrypted: boolean;
}
```

### AI Analysis

```typescript
interface AIAnalysis {
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  possibleCauses: string[];
  recommendations: string[];
  questionsForDoctor: string[];
  confidence: number;
  timestamp: string;
  processingTime: string;
}
```

### User Profile

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  medicalConditions: string[];
  medications: string[];
  allergies: string[];
  preferences: {
    language: string;
    units: 'metric' | 'imperial';
    notifications: boolean;
  };
  createdAt: string;
  lastUpdated: string;
}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request body is invalid",
    "details": {
      "field": "symptoms",
      "issue": "Cannot be empty"
    },
    "timestamp": "2025-02-11T10:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_REQUEST` | Request body is invalid | 400 |
| `UNAUTHORIZED` | Authentication failed | 401 |
| `FORBIDDEN` | Access denied | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `RATE_LIMITED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |
| `SERVICE_UNAVAILABLE` | AI service unavailable | 503 |

## SDKs & Libraries

### JavaScript/TypeScript

```bash
npm install @medly/api-client
```

```typescript
import { MedlyAPI } from '@medly/api-client';

const medly = new MedlyAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.medly.app/v1'
});

// Analyze symptoms
const analysis = await medly.analyzeSymptoms({
  symptoms: ['headache', 'fatigue'],
  duration: '3 days',
  severity: 'moderate'
});
```

### Python

```bash
pip install medly-python
```

```python
from medly import MedlyClient

client = MedlyClient(api_key='your-api-key')

# Analyze symptoms
analysis = client.analyze_symptoms(
    symptoms=['headache', 'fatigue'],
    duration='3 days',
    severity='moderate'
)
```

### cURL Examples

```bash
# Analyze symptoms
curl -X POST https://api.medly.app/v1/ai/analyze-symptoms \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["headache", "fatigue"],
    "duration": "3 days",
    "severity": "moderate"
  }'
```

## Webhooks

### Configure Webhooks

```http
POST /webhooks/configure
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks/medly",
  "events": ["symptom.analyzed", "report.generated", "appointment.reminder"],
  "secret": "your-webhook-secret"
}
```

### Webhook Events

#### Symptom Analyzed

```json
{
  "event": "symptom.analyzed",
  "data": {
    "entryId": "entry_123456",
    "analysis": {
      "urgency": "medium",
      "confidence": 0.94
    }
  },
  "timestamp": "2025-02-11T10:00:00Z"
}
```

## Testing

### Sandbox Environment

```
https://sandbox-api.medly.app/v1
```

### Test Data

Use test API keys for development:

```bash
# Test API key
export MEDLY_API_KEY="test_key_sandbox_12345"
```

## Support

### Documentation
- [API Reference](https://docs.medly.app/api)
- [SDK Documentation](https://docs.medly.app/sdks)
- [Examples](https://docs.medly.app/examples)

### Support Channels
- **Email**: api-support@medly.app
- **Discord**: [Developer Discord](https://discord.gg/medly-dev)
- **GitHub**: [API Issues](https://github.com/Iceman-Dann/Medly/issues)

### Status Page
- [API Status](https://status.medly.app)
- [Uptime History](https://status.medly.app/history)

---

## Rate Limits & Quotas

### Standard Plan
- **Requests**: 100/minute
- **Storage**: 1GB
- **AI Analysis**: 1000/month
- **Reports**: 50/month

### Premium Plan
- **Requests**: 1000/minute
- **Storage**: 10GB
- **AI Analysis**: 10,000/month
- **Reports**: 500/month

### Enterprise Plan
- **Requests**: Custom
- **Storage**: Custom
- **AI Analysis**: Unlimited
- **Reports**: Unlimited

---

*API Documentation Version: 1.0.0*  
*Last Updated: February 11, 2025*
