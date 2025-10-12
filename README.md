
# megathon-bhashini

## Vaidya Vaani - Breaking Language Barriers in Healthcare

> *"If you talk to a man in a language he understands, that goes to his head. If you talk to him in his language, that goes to his heart."* - Nelson Mandela

### Our Mission

Language is a means of communication, not division. **Vaidya Vaani** (The Voice of the Healer) is powered by Bhashini and designed to democratize healthcare services for everyone in India. We believe that quality healthcare should not be limited by language barriers.

### The Problem

Meet Dr. Yajat from Delhi working in rural Telangana - a dedicated doctor who wants to help his patients but faces language barriers that hinder effective communication. This story is repeated across India where healthcare professionals and patients struggle to connect due to linguistic differences.

### Our Solution

Vaidya Vaani is built with inclusivity in mind, featuring a language-agnostic interface that empowers both healthcare providers and patients. Our platform leverages the power of Bhashini's multilingual AI capabilities to create seamless healthcare experiences.

## Main Features

### 1. Samvaad (The Conversational Model)
*Real-time multilingual communication for healthcare*

**Key Use Cases:**
- **Clinical Consultation**: Real-time doctor-patient conversations with live transcription and translation
- **Smart Reception & Triage**: Automated patient intake with comprehensive multilingual support

### 2. Lipi-Gyan (Document Analysis)
*Making medical documents accessible to everyone*

**Core Features:**
- **Prescription Decoder**: Scan and understand prescriptions in a structured, easy-to-read format
- **Lab Report Analyzer**: Color-coded analysis with simple explanations for each test result
- **Discharge Summary Navigator**: Navigate complex discharge summaries with tabbed sections for quick access

### 3. Saaransh (Summaries Made for Everyone)
*Clinical insights in your language*

**Capabilities:**
- **Clinical Note Generator**: Automatic SOAP notes generation from consultation transcripts
- **Patient's Action Plan**: Generate simple, actionable items in the patient's preferred language
- **Health Summary**: Comprehensive yet understandable health summaries for patients

### 4. Panchaang (Appointments Made Easy)
*Seamless appointment management*

**Features:**
- **Google Calendar Integration**: Easy and accessible appointment scheduling
- **Multilingual Support**: Book appointments in your preferred language
- **Smart Notifications**: Automated reminders and updates

## Use Cases

Our platform addresses real-world healthcare challenges:

1. **Rural Healthcare**: Bridging communication gaps between urban doctors and rural patients
2. **Emergency Care**: Quick triage and patient intake in multilingual environments  
3. **Elderly Care**: Helping elderly patients understand medical reports and prescriptions
4. **Medical Tourism**: Assisting international patients with healthcare communication
5. **Public Health**: Making health information accessible across linguistic communities

## Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Python (FastAPI)
- **AI/ML**: Bhashini APIs (ASR, MT, TTS, OCR)
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose
- **Integration**: Google Calendar API

## Directory Structure

Use `git ls-files | tree --fromfile` to get the tree structure.

```
.
├── api
│   ├── apiserver.py
│   ├── asr
│   │   ├── asr_mapping.py
│   │   ├── asr_scraper.py
│   │   └── _pycache_
│   │       └── asr_mapping.cpython-311.pyc
│   ├── filled_megathon_models_68ea6227b93e3bec901fd8d7_1760194626.json
│   ├── mt
│   │   ├── mt_mapping.py
│   │   ├── mt_scraper.py
│   │   └── _pycache_
│   │       └── mt_mapping.cpython-311.pyc
│   ├── ocr
│   │   ├── ocr_mapping.py
│   │   ├── ocr_scraper.py
│   │   └── _pycache_
│   │       └── ocr_mapping.cpython-311.pyc
│   ├── README.md
│   ├── requirements.txt
│   ├── SANDBOX_API_SPECIFICATIONS.pdf
│   └── tts
│       ├── _pycache_
│       │   └── tts_mapping.cpython-311.pyc
│       ├── tts_mapping.py
│       └── tts_scraper.py
├── database
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── README.md
│   ├── requirements.txt
│   └── server.py
├── .gitignore
├── README.md
├── s2s
│   ├── input.wav
│   ├── output.wav
│   ├── README.md
│   ├── requirements.txt
│   └── s2s.py
├── user_experience_design.md
└── vaidhya-vaani-suite-main
    ├── components.json
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── postcss.config.js
    ├── public
    │   ├── favicon.ico
    │   ├── placeholder.svg
    │   └── robots.txt
    ├── README.md
    ├── src
    │   ├── App.css
    │   ├── App.tsx
    │   ├── components
    │   │   ├── FeatureCard.tsx
    │   │   ├── ModuleCard.tsx
    │   │   ├── Navbar.tsx
    │   │   └── ui
    │   │       ├── accordion.tsx
    │   │       ├── alert-dialog.tsx
    │   │       ├── alert.tsx
    │   │       ├── aspect-ratio.tsx
    │   │       ├── avatar.tsx
    │   │       ├── badge.tsx
    │   │       ├── breadcrumb.tsx
    │   │       ├── button.tsx
    │   │       ├── calendar.tsx
    │   │       ├── card.tsx
    │   │       ├── carousel.tsx
    │   │       ├── chart.tsx
    │   │       ├── checkbox.tsx
    │   │       ├── collapsible.tsx
    │   │       ├── command.tsx
    │   │       ├── context-menu.tsx
    │   │       ├── dialog.tsx
    │   │       ├── drawer.tsx
    │   │       ├── dropdown-menu.tsx
    │   │       ├── form.tsx
    │   │       ├── hover-card.tsx
    │   │       ├── input-otp.tsx
    │   │       ├── input.tsx
    │   │       ├── label.tsx
    │   │       ├── menubar.tsx
    │   │       ├── navigation-menu.tsx
    │   │       ├── pagination.tsx
    │   │       ├── popover.tsx
    │   │       ├── progress.tsx
    │   │       ├── radio-group.tsx
    │   │       ├── resizable.tsx
    │   │       ├── scroll-area.tsx
    │   │       ├── select.tsx
    │   │       ├── separator.tsx
    │   │       ├── sheet.tsx
    │   │       ├── sidebar.tsx
    │   │       ├── skeleton.tsx
    │   │       ├── slider.tsx
    │   │       ├── sonner.tsx
    │   │       ├── switch.tsx
    │   │       ├── table.tsx
    │   │       ├── tabs.tsx
    │   │       ├── textarea.tsx
    │   │       ├── toaster.tsx
    │   │       ├── toast.tsx
    │   │       ├── toggle-group.tsx
    │   │       ├── toggle.tsx
    │   │       ├── tooltip.tsx
    │   │       └── use-toast.ts
    │   ├── contexts
    │   │   └── LanguageContext.tsx
    │   ├── hooks
    │   │   ├── use-mobile.tsx
    │   │   └── use-toast.ts
    │   ├── index.css
    │   ├── lib
    │   │   └── utils.ts
    │   ├── main.tsx
    │   ├── pages
    │   │   ├── Index.tsx
    │   │   ├── lipi-gyan
    │   │   │   ├── Discharge.tsx
    │   │   │   ├── LabReport.tsx
    │   │   │   └── Prescription.tsx
    │   │   ├── LipiGyan.tsx
    │   │   ├── NotFound.tsx
    │   │   ├── saaransh
    │   │   │   ├── ActionPlan.tsx
    │   │   │   ├── ClinicalNotes.tsx
    │   │   │   └── HealthSummary.tsx
    │   │   ├── Saaransh.tsx
    │   │   ├── samvaad
    │   │   │   ├── Consultation.tsx
    │   │   │   ├── Pharmacy.tsx
    │   │   │   └── Triage.tsx
    │   │   ├── Samvaad.tsx
    │   │   └── Siksha.tsx
    │   └── vite-env.d.ts
    ├── tailwind.config.ts
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts

```


```
sudo docker compose build
sudo docker compose down -v
sudo docker compose up -d
```

## Go to: http://localhost:5173 for accessing the website
