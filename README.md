# megathon-bhashini

# Vaidya Vaani - Breaking Language Barriers in Healthcare

> *"If you talk to a man in a language he understands, that goes to his head. If you talk to him in his language, that goes to his heart."* - Nelson Mandela

## Quick Start - How to Run

### Prerequisites
- Docker and Docker Compose installed on your system
- Ensure ports 5173, 8000, and 5432 are available

### Running the Application

```bash
# Clone the repository
git clone https://github.com/aryan12cc/megathon-bhashini.git
cd megathon-bhashini

# Build and start all services (docker compose for RHEL based systems and docker-compose for Ubuntu)
sudo docker compose build
sudo docker compose down -v  # Clean any existing containers
sudo docker compose up -d    # Start in detached mode

# Access the application: http://localhost:5173
```

** Main Application URL:** [http://localhost:5173](http://localhost:5173)

---

## About Vaidya Vaani

**Vaidya Vaani** (The Voice of the Healer) is powered by Bhashini and designed to democratize healthcare services for everyone in India. We believe that quality healthcare should not be limited by language barriers.

### The Problem

Meet Dr. Yajat from Delhi working in rural Telangana - a dedicated doctor who wants to help his patients but faces language barriers that hinder effective communication. This story is repeated across India where healthcare professionals and patients struggle to connect due to linguistic differences.

---

## System Architecture & Modules

### 1. **Frontend Application** (`vaidhya-vaani-suite-main/`)
**Technology:** React + TypeScript + Tailwind CSS + Vite

The main user interface providing a responsive, multilingual healthcare platform.

**Key Components:**
- **Language Context**: Manages multilingual state across the application
- **UI Components**: Comprehensive component library built with shadcn/ui
- **Page Modules**: Organized into feature-specific pages (Samvaad, Lipi-Gyan, Saaransh)

### 2. **API Server** (`api/`)
**Technology:** Python + FastAPI

Central backend service integrating all Bhashini AI capabilities.

**Modules:**
- **ASR (Automatic Speech Recognition)**: Converts speech to text in multiple Indian languages
- **MT (Machine Translation)**: Translates content between different languages
- **TTS (Text-to-Speech)**: Converts text to natural-sounding speech
- **OCR (Optical Character Recognition)**: Extracts text from medical documents and images

### 3. **Database Service** (`database/`)
**Technology:** PostgreSQL + Python

Manages persistent storage for user data, medical records, and application state.

### 4. **Speech-to-Speech Pipeline** (`s2s/`)
**Technology:** Python

Complete audio processing pipeline that combines ASR → MT → TTS for real-time multilingual conversation.

---

## Main Features

### 1. **Samvaad** (The Conversational Model)
> *Real-time multilingual communication for healthcare*

- **Clinical Consultation**: Live doctor-patient conversations with transcription and translation
- **Smart Reception & Triage**: Automated patient intake with multilingual support
- **Pharmacy Communication**: Clear medication counseling across language barriers

### 2. **Lipi-Gyan** (Document Analysis)
> *Making medical documents accessible to everyone*

- **Prescription Decoder**: OCR + AI analysis of handwritten prescriptions
- **Lab Report Analyzer**: Color-coded analysis with simple explanations
- **Discharge Summary Navigator**: Structured navigation of complex medical documents

### 3. **Saaransh** (Summaries Made for Everyone)
> *Clinical insights in your language*

- **Clinical Note Generator**: Automatic SOAP notes from consultation transcripts
- **Patient's Action Plan**: Simple, actionable healthcare instructions
- **Health Summary**: Comprehensive yet understandable health overviews

### 4. **Panchaang** (Appointments Made Easy)
> *Seamless appointment management*

**Features:**

- **Google Calendar Integration**: Easy and accessible appointment scheduling
- **Multilingual Support**: Book appointments in your preferred language
- **Smart Notifications**: Automated reminders and updates
- **Calendar Integration**: Sync with popular calendar applications


## 📁 Directory Structure

```
.
├── api/                          # Backend API server
│   ├── apiserver.py             # Main FastAPI application
│   ├── asr/                     # Speech recognition module
│   ├── mt/                      # Machine translation module  
│   ├── ocr/                     # Optical character recognition
│   └── tts/                     # Text-to-speech module
├── database/                     # PostgreSQL database service
├── s2s/                         # Speech-to-speech pipeline
├── vaidhya-vaani-suite-main/    # React frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── contexts/            # React contexts (Language, etc.)
│   │   ├── pages/               # Feature pages
│   │   │   ├── samvaad/         # Conversation modules
│   │   │   ├── lipi-gyan/       # Document analysis
│   │   │   └── saaransh/        # Summary generation
│   │   └── hooks/               # Custom React hooks
└── docker-compose.yml           # Container orchestration
```

---

## Use Cases

1. **Rural Healthcare**: Bridging communication gaps between urban doctors and rural patients
2. **Emergency Care**: Quick triage and patient intake in multilingual environments  
3. **Elderly Care**: Helping elderly patients understand medical reports and prescriptions
4. **Medical Tourism**: Assisting international patients with healthcare communication
5. **Public Health**: Making health information accessible across linguistic communities

---

## Advanced Features (Google Auth Branch)

### Google Calendar Integration

We have an enhanced version available in the `google-auth` branch that includes:

**Branch:** [`google-auth`](https://github.com/aryan12cc/megathon-bhashini/tree/google-auth)

**Features:**
- **Google Authentication**: Secure login using Google OAuth 2.0
- **Calendar Sync**: Automatic synchronization with Google Calendar
- **Event Management**: Create, update, and manage medical appointments
- **Automated Reminders**: Smart notifications for upcoming appointments
- **Cross-Platform Access**: Access your medical appointments from any device

**To use Google Auth features:**
```bash
git checkout google-auth
# Follow additional setup instructions in that branch
```

This integration ensures that your medical appointments are seamlessly managed across all your devices and calendar applications, making healthcare scheduling truly effortless.

---
