// Vaidya-Vaani MVP - MongoDB initialization script

// Switch to the vaidyavaani database
db = db.getSiblingDB('vaidyavaani');

// Create collections
db.createCollection('conversations');
db.createCollection('documents');
db.createCollection('health_summaries');

// Create indexes

// conversations collection
db.conversations.createIndex({ patientId: 1, createdAt: -1 });
db.conversations.createIndex({ providerId: 1, createdAt: -1 });
db.conversations.createIndex({ status: 1 });
db.conversations.createIndex({ conversationType: 1 });

// documents collection
db.documents.createIndex({ patientId: 1, createdAt: -1 });
db.documents.createIndex({ documentType: 1 });
db.documents.createIndex({ tags: 1 });
db.documents.createIndex({ ocrStatus: 1 });
db.documents.createIndex({ uploadedBy: 1 });

// health_summaries collection
db.health_summaries.createIndex({ patientId: 1, generatedAt: -1 });
db.health_summaries.createIndex({ generatedBy: 1 });

// Insert sample data

// Sample conversation
db.conversations.insertOne({
  conversationType: "clinical_consultation",
  patientId: "patient-uuid-1",
  patientName: "Ramesh Rao",
  providerId: "doctor-uuid-1",
  providerName: "Dr. Priya Singh",
  patientLanguage: "te",
  providerLanguage: "en",
  startTime: new Date("2025-10-11T10:00:00Z"),
  endTime: new Date("2025-10-11T10:30:00Z"),
  status: "completed",
  transcript: [
    {
      speaker: "patient",
      speakerId: "patient-uuid-1",
      originalText: "నాకు తలనొప్పి ఉంది",
      originalLanguage: "te",
      translatedText: "I have a headache",
      translatedLanguage: "en",
      timestamp: 0,
      isKeyPoint: false
    },
    {
      speaker: "provider",
      speakerId: "doctor-uuid-1",
      originalText: "How long have you had this headache?",
      originalLanguage: "en",
      translatedText: "మీకు ఎంతకాలం నుండి ఈ తలనొప్పి ఉంది?",
      translatedLanguage: "te",
      timestamp: 5,
      isKeyPoint: false
    },
    {
      speaker: "patient",
      speakerId: "patient-uuid-1",
      originalText: "రెండు రోజులు",
      originalLanguage: "te",
      translatedText: "Two days",
      translatedLanguage: "en",
      timestamp: 10,
      isKeyPoint: false
    },
    {
      speaker: "provider",
      speakerId: "doctor-uuid-1",
      originalText: "I'll prescribe you Paracetamol. Take it after meals, twice daily.",
      originalLanguage: "en",
      translatedText: "నేను మీకు పారాసిటమాల్ సూచిస్తాను. ఆహారం తర్వాత రోజుకు రెండుసార్లు తీసుకోండి.",
      translatedLanguage: "te",
      timestamp: 15,
      isKeyPoint: true
    }
  ],
  aiSummary: "Patient Ramesh Rao presented with a 2-day history of headache. On examination, vital signs were stable. Diagnosed as tension headache. Prescribed Paracetamol 650mg to be taken twice daily after meals for 5 days. Advised adequate rest and hydration.",
  triageData: null,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Sample triage conversation
db.conversations.insertOne({
  conversationType: "triage",
  patientId: "patient-uuid-2",
  patientName: "Lakshmi Devi",
  providerId: "staff-uuid-1",
  providerName: "Sunita Reddy",
  patientLanguage: "hi",
  providerLanguage: "hi",
  startTime: new Date("2025-10-11T09:00:00Z"),
  endTime: new Date("2025-10-11T09:15:00Z"),
  status: "completed",
  transcript: [
    {
      speaker: "provider",
      speakerId: "staff-uuid-1",
      originalText: "आपका क्या नाम है?",
      originalLanguage: "hi",
      translatedText: "What is your name?",
      translatedLanguage: "en",
      timestamp: 0,
      isKeyPoint: false
    },
    {
      speaker: "patient",
      speakerId: "patient-uuid-2",
      originalText: "लक्ष्मी देवी",
      originalLanguage: "hi",
      translatedText: "Lakshmi Devi",
      translatedLanguage: "en",
      timestamp: 3,
      isKeyPoint: false
    }
  ],
  aiSummary: "Patient registration completed for Lakshmi Devi. Chief complaint: Chest pain for 1 hour. Vitals: BP 150/95, Pulse 95. Triaged as urgent, recommended Cardiology consultation.",
  triageData: {
    chiefComplaint: "Chest pain",
    symptoms: ["chest pain", "shortness of breath", "sweating"],
    urgencyLevel: "urgent",
    recommendedDepartment: "Cardiology"
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Sample prescription document
db.documents.insertOne({
  documentType: "prescription",
  patientId: "patient-uuid-1",
  patientName: "Ramesh Rao",
  fileUrl: "s3://vaidya-vaani/docs/prescription-001.pdf",
  fileFormat: "pdf",
  uploadedBy: "patient-uuid-1",
  uploadedAt: new Date(),
  documentDate: new Date("2025-10-10"),
  ocrStatus: "completed",
  originalText: "Dr. Priya Singh\nMBBS, MD (General Medicine)\nReg. No: 12345\n\nCity Hospital\n\nPrescription\n\nPatient Name: Ramesh Rao\nAge: 45 years\nDate: 10-Oct-2025\n\nRx:\n\n1. Tab. Paracetamol 650mg\n   1-0-1 (Morning and Evening)\n   Duration: 5 days\n   Instructions: Take after food\n\n2. Rest advised\n3. Adequate hydration\n\nFollow-up: If symptoms persist after 3 days\n\nDr. Priya Singh\nSignature",
  translatedText: "డాక్టర్ ప్రియా సింగ్\nMBBS, MD (జనరల్ మెడిసిన్)\nరిజి. నం: 12345\n\nసిటి హాస్పిటల్\n\nప్రిస్క్రిప్షన్\n\nరోగి పేరు: రమేష్ రావు\nవయస్సు: 45 సంవత్సరాలు\nతేదీ: 10-అక్టోబర్-2025\n\nRx:\n\n1. టాబ్. పారాసిటమాల్ 650mg\n   1-0-1 (ఉదయం మరియు సాయంత్రం)\n   వ్యవధి: 5 రోజులు\n   సూచనలు: ఆహారం తర్వాత తీసుకోండి\n\n2. విశ్రాంతి సూచించబడింది\n3. తగినంత నీరు త్రాగండి\n\nఫాలో-అప్: 3 రోజుల తర్వాత లక్షణాలు కొనసాగితే\n\nడాక్టర్ ప్రియా సింగ్\nసంతకం",
  aiAnalysis: "PRESCRIPTION ANALYSIS\n\nPrescribed by: Dr. Priya Singh (MBBS, MD)\nHospital: City Hospital\nPatient: Ramesh Rao, 45 years\nDate: October 10, 2025\n\nMEDICATION:\n- Medicine Name: Paracetamol\n- Strength: 650mg\n- Form: Tablet\n- Dosage: 1-0-1 (1 tablet in morning, 1 tablet in evening)\n- Duration: 5 days\n- Instructions: Take after food\n\nADDITIONAL ADVICE:\n- Rest advised\n- Maintain adequate hydration\n- Follow-up if symptoms persist after 3 days\n\nMEDICATION PURPOSE: Pain relief and fever reduction\nIMPORTANT: Do not exceed recommended dosage. Complete the full course.",
  tags: ["prescription", "paracetamol", "pain relief", "headache"],
  createdAt: new Date(),
  updatedAt: new Date()
});

// Sample lab report document
db.documents.insertOne({
  documentType: "lab_report",
  patientId: "patient-uuid-1",
  patientName: "Ramesh Rao",
  fileUrl: "s3://vaidya-vaani/docs/lab-report-001.pdf",
  fileFormat: "pdf",
  uploadedBy: "doctor-uuid-1",
  uploadedAt: new Date(),
  documentDate: new Date("2025-10-09"),
  ocrStatus: "completed",
  originalText: "City Diagnostic Center\nLab Report\n\nPatient: Ramesh Rao\nAge: 45 years\nDate: 09-Oct-2025\n\nBLOOD TEST RESULTS:\n\n1. Fasting Blood Sugar: 140 mg/dL (Reference: 70-99 mg/dL) [HIGH]\n2. HbA1c: 7.2% (Reference: 4.0-5.6%) [HIGH]\n3. Total Cholesterol: 220 mg/dL (Reference: <200 mg/dL) [HIGH]\n4. HDL Cholesterol: 35 mg/dL (Reference: >40 mg/dL) [LOW]\n5. LDL Cholesterol: 150 mg/dL (Reference: <100 mg/dL) [HIGH]\n6. Triglycerides: 180 mg/dL (Reference: <150 mg/dL) [HIGH]\n7. Hemoglobin: 13.5 g/dL (Reference: 13-17 g/dL) [NORMAL]\n\nRemarks: Results suggest pre-diabetic condition and dyslipidemia. Recommend lifestyle modification and medical consultation.\n\nPathologist: Dr. Ramesh Kumar\nSignature",
  translatedText: "సిటి డయాగ్నోస్టిక్ సెంటర్\nల్యాబ్ రిపోర్ట్\n\nరోగి: రమేష్ రావు\nవయస్సు: 45 సంవత్సరాలు\nతేదీ: 09-అక్టోబర్-2025\n\nరక్త పరీక్ష ఫలితాలు:\n\n1. ఉపవాస రక్త చక్కెర: 140 mg/dL (సూచన: 70-99 mg/dL) [అధికం]\n2. HbA1c: 7.2% (సూచన: 4.0-5.6%) [అధికం]\n3. మొత్తం కొలెస్ట్రాల్: 220 mg/dL (సూచన: <200 mg/dL) [అధికం]\n4. HDL కొలెస్ట్రాల్: 35 mg/dL (సూచన: >40 mg/dL) [తక్కువ]\n5. LDL కొలెస్ట్రాల్: 150 mg/dL (సూచన: <100 mg/dL) [అధికం]\n6. ట్రైగ్లిజరైడ్స్: 180 mg/dL (సూచన: <150 mg/dL) [అధికం]\n7. హిమోగ్లోబిన్: 13.5 g/dL (సూచన: 13-17 g/dL) [సాధారణం]\n\nటిప్పణి: ఫలితాలు ప్రీ-డయాబెటిక్ పరిస్థితి మరియు డిస్లిపిడెమియాను సూచిస్తున్నాయి. జీవనశైలి మార్పు మరియు వైద్య సంప్రదింపు సిఫార్సు చేయబడింది.\n\nపాథాలజిస్ట్: డాక్టర్ రమేష్ కుమార్\nసంతకం",
  aiAnalysis: "LAB REPORT ANALYSIS\n\nPatient: Ramesh Rao, 45 years\nTest Date: October 9, 2025\nLab: City Diagnostic Center\n\nKEY FINDINGS:\n\n⚠️ ABNORMAL RESULTS:\n1. Fasting Blood Sugar: 140 mg/dL (HIGH) - Normal range: 70-99 mg/dL\n   → Indicates elevated blood glucose levels\n\n2. HbA1c: 7.2% (HIGH) - Normal range: 4.0-5.6%\n   → Indicates poor blood sugar control over past 3 months\n\n3. Total Cholesterol: 220 mg/dL (HIGH) - Should be <200 mg/dL\n   → Elevated cholesterol levels\n\n4. HDL Cholesterol: 35 mg/dL (LOW) - Should be >40 mg/dL\n   → Low 'good' cholesterol\n\n5. LDL Cholesterol: 150 mg/dL (HIGH) - Should be <100 mg/dL\n   → High 'bad' cholesterol\n\n6. Triglycerides: 180 mg/dL (HIGH) - Should be <150 mg/dL\n   → Elevated fat levels in blood\n\n✅ NORMAL RESULTS:\n7. Hemoglobin: 13.5 g/dL (NORMAL) - Range: 13-17 g/dL\n\nINTERPRETATION:\nResults suggest pre-diabetic condition (impaired fasting glucose and elevated HbA1c) along with dyslipidemia (abnormal cholesterol and triglyceride levels).\n\nRECOMMENDATIONS:\n- Consult a physician immediately\n- Lifestyle modifications: Diet control, regular exercise\n- May require medication for blood sugar and cholesterol management\n- Regular monitoring advised\n\nURGENCY: Moderate - Medical consultation recommended within 1 week",
  tags: ["lab_report", "diabetes", "cholesterol", "blood_test"],
  createdAt: new Date(),
  updatedAt: new Date()
});

// Sample health summary
db.health_summaries.insertOne({
  patientId: "patient-uuid-1",
  sourceDocumentIds: [],
  summaryText: "HEALTH TIMELINE SUMMARY FOR RAMESH RAO (Age: 45 years)\n\nPERIOD: January 2025 - October 2025\n\nCHRONOLOGICAL EVENTS:\n\nOctober 9, 2025 - Blood Test Results\n- Fasting Blood Sugar: 140 mg/dL (High) - Pre-diabetic range\n- HbA1c: 7.2% (High) - Indicates poor blood sugar control\n- Cholesterol levels abnormal: Total 220, LDL 150, HDL 35, Triglycerides 180\n- Interpretation: Pre-diabetic condition with dyslipidemia\n- Action needed: Lifestyle modification and medical consultation\n\nOctober 10, 2025 - Medical Consultation\n- Chief complaint: Headache for 2 days\n- Diagnosis: Tension headache\n- Treatment: Paracetamol 650mg twice daily for 5 days\n- Advice: Rest and hydration\n\nKEY HEALTH CONCERNS:\n1. Pre-diabetic condition - Requires immediate attention\n2. Abnormal lipid profile - Risk factor for cardiovascular disease\n3. Recent headache episode - Resolved with medication\n\nRECOMMENDATIONS:\n- Urgent consultation with endocrinologist/diabetologist\n- Lifestyle modifications: Diet control, regular exercise, weight management\n- Regular blood sugar and lipid profile monitoring\n- Stress management for headaches\n- Follow-up appointments as scheduled\n\nRISK ASSESSMENT: Moderate risk for developing Type 2 Diabetes and cardiovascular complications if not managed properly.\n\nNEXT STEPS:\n1. Schedule appointment with specialist\n2. Start lifestyle modifications immediately\n3. Regular monitoring of vitals\n4. Medication compliance",
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-10-11"),
  generatedBy: "doctor-uuid-1",
  generatedAt: new Date()
});

print("MongoDB initialization completed successfully!");
print("Collections created: conversations, documents, health_summaries");
print("Sample data inserted for testing");
