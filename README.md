# megathon-bhashini

## Directory Structure

Use `git ls-files | tree --fromfile` to get the tree structure.

```
.
├── api
│   ├── apiserver.py
│   ├── asr
│   │   ├── asr_mapping.py
│   │   ├── asr_scraper.py
│   │   └── __pycache__
│   │       └── asr_mapping.cpython-311.pyc
│   ├── filled_megathon_models_68ea6227b93e3bec901fd8d7_1760194626.json
│   ├── mt
│   │   ├── mt_mapping.py
│   │   ├── mt_scraper.py
│   │   └── __pycache__
│   │       └── mt_mapping.cpython-311.pyc
│   ├── ocr
│   │   ├── ocr_mapping.py
│   │   ├── ocr_scraper.py
│   │   └── __pycache__
│   │       └── ocr_mapping.cpython-311.pyc
│   ├── README.md
│   ├── requirements.txt
│   ├── SANDBOX_API_SPECIFICATIONS.pdf
│   └── tts
│       ├── __pycache__
│       │   └── tts_mapping.cpython-311.pyc
│       ├── tts_mapping.py
│       └── tts_scraper.py
├── database
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── README.md
│   ├── requirements.txt
│   └── server.py
├── .gitignore
├── README.md
├── s2s
│   ├── input.wav
│   ├── output.wav
│   ├── README.md
│   ├── requirements.txt
│   └── s2s.py
├── user_experience_design.md
└── vaidhya-vaani-suite-main
    ├── components.json
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── postcss.config.js
    ├── public
    │   ├── favicon.ico
    │   ├── placeholder.svg
    │   └── robots.txt
    ├── README.md
    ├── src
    │   ├── App.css
    │   ├── App.tsx
    │   ├── components
    │   │   ├── FeatureCard.tsx
    │   │   ├── ModuleCard.tsx
    │   │   ├── Navbar.tsx
    │   │   └── ui
    │   │       ├── accordion.tsx
    │   │       ├── alert-dialog.tsx
    │   │       ├── alert.tsx
    │   │       ├── aspect-ratio.tsx
    │   │       ├── avatar.tsx
    │   │       ├── badge.tsx
    │   │       ├── breadcrumb.tsx
    │   │       ├── button.tsx
    │   │       ├── calendar.tsx
    │   │       ├── card.tsx
    │   │       ├── carousel.tsx
    │   │       ├── chart.tsx
    │   │       ├── checkbox.tsx
    │   │       ├── collapsible.tsx
    │   │       ├── command.tsx
    │   │       ├── context-menu.tsx
    │   │       ├── dialog.tsx
    │   │       ├── drawer.tsx
    │   │       ├── dropdown-menu.tsx
    │   │       ├── form.tsx
    │   │       ├── hover-card.tsx
    │   │       ├── input-otp.tsx
    │   │       ├── input.tsx
    │   │       ├── label.tsx
    │   │       ├── menubar.tsx
    │   │       ├── navigation-menu.tsx
    │   │       ├── pagination.tsx
    │   │       ├── popover.tsx
    │   │       ├── progress.tsx
    │   │       ├── radio-group.tsx
    │   │       ├── resizable.tsx
    │   │       ├── scroll-area.tsx
    │   │       ├── select.tsx
    │   │       ├── separator.tsx
    │   │       ├── sheet.tsx
    │   │       ├── sidebar.tsx
    │   │       ├── skeleton.tsx
    │   │       ├── slider.tsx
    │   │       ├── sonner.tsx
    │   │       ├── switch.tsx
    │   │       ├── table.tsx
    │   │       ├── tabs.tsx
    │   │       ├── textarea.tsx
    │   │       ├── toaster.tsx
    │   │       ├── toast.tsx
    │   │       ├── toggle-group.tsx
    │   │       ├── toggle.tsx
    │   │       ├── tooltip.tsx
    │   │       └── use-toast.ts
    │   ├── contexts
    │   │   └── LanguageContext.tsx
    │   ├── hooks
    │   │   ├── use-mobile.tsx
    │   │   └── use-toast.ts
    │   ├── index.css
    │   ├── lib
    │   │   └── utils.ts
    │   ├── main.tsx
    │   ├── pages
    │   │   ├── Index.tsx
    │   │   ├── lipi-gyan
    │   │   │   ├── Discharge.tsx
    │   │   │   ├── LabReport.tsx
    │   │   │   └── Prescription.tsx
    │   │   ├── LipiGyan.tsx
    │   │   ├── NotFound.tsx
    │   │   ├── saaransh
    │   │   │   ├── ActionPlan.tsx
    │   │   │   ├── ClinicalNotes.tsx
    │   │   │   └── HealthSummary.tsx
    │   │   ├── Saaransh.tsx
    │   │   ├── samvaad
    │   │   │   ├── Consultation.tsx
    │   │   │   ├── Pharmacy.tsx
    │   │   │   └── Triage.tsx
    │   │   ├── Samvaad.tsx
    │   │   └── Siksha.tsx
    │   └── vite-env.d.ts
    ├── tailwind.config.ts
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts

```