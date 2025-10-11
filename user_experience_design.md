# 🏥 Vaidya-Vaani: Fine-Grained Feature Architecture

The four main modules remain, but the user will interact with specialized tools within them. The main dashboard won't just say "Scan Document"; it will have icons for "Scan Prescription," "Read Lab Report," etc.

## 1. Real-time Communication: The "Samvaad" (Dialogue) Module 🗣️

This module is now split into context-aware communication tools.

* **1a. Application: Clinical Consultation Room**
  * **Purpose:** For live doctor-patient conversations.
  * **UI:** The split-screen transcript view remains. Additionally, there's a small, persistent window showing the patient's key vitals (if available from an EMR) and a "Mark as Key Point" button for the doctor.
  * **Workflow:** During the conversation, if the doctor mentions a specific instruction like "Avoid salt for 15 days," they can tap the "Mark as Key Point" button. This tagged snippet will be automatically prioritized in the post-consultation summary.

* **1b. Application: Smart Reception & Triage Agent**
  * **Purpose:** To assist front-desk staff (Ms. Sunita) or act as a kiosk-based conversational agent for patient intake.
  * **UI:** A guided, form-like conversational interface. The app asks questions one by one ("What is your name?", "What symptoms are you experiencing?").
  * **Workflow:**
        1. The app asks a question in the local language (TTS).
        2. The patient replies in their language.
        3. **Bhashini ASR+MT** transcribes and translates the answer, auto-filling the English digital registration form.
        4. For symptom collection, it uses a pre-defined set of questions to triage the patient, suggesting which department they should visit (e.g., Cardiology, General Physician). This automates and streamlines the initial screening process.

* **1c. Application: Pharmacy Connect**
  * **Purpose:** For quick, clear communication between a patient and a pharmacist.
  * **UI:** A simple conversation interface. It includes a button to instantly pull up and display the patient's most recent prescription (scanned via the Lipi-Gyan module) on the screen for both parties to see.
  * **Workflow:** Mr. Rao can ask the pharmacist in Telugu, "ఈ టాబ్లెట్‌తో ఏమైనా సైడ్ ఎఫెక్ట్స్ ఉన్నాయా?" ("Are there any side effects with this tablet?"). The pharmacist sees the question in English alongside the specific medicine being discussed and can respond accurately.

## 2. Document Intelligence: The "Lipi-Gyan" (Script Knowledge) Module 📄

This is where the most significant fine-graining occurs. Instead of a generic "scan" button, the UI presents distinct options.

* **2a. Application: Prescription Decoder**
  * **Purpose:** Specifically for understanding prescriptions.
  * **UI:** After scanning, it doesn't show a wall of text. It presents a structured, easy-to-read table.
  * **Workflow:**
        1. **Bhashini OCR** extracts the text.
        2. **Gemini/Sarvam's** reasoning capabilities are used to parse the unstructured text, identifying: **Medicine Name**, **Dosage** (e.g., 650mg), **Frequency** (parsing "1-0-1" into Morning/Night icons), and **Duration**.
        3. The translated output is shown in a table. Each row is a medicine.
        4. **Interactive Feature:** Each medicine has a "Set Reminder" button that integrates with the phone's alarm/calendar and a "Learn More" button that links to the Siksha module for an explanatory video.

* **2b. Application: Lab Report Analyzer**
  * **Purpose:** To demystify complex lab reports.
  * **UI:** A color-coded report summary.
  * **Workflow:**
        1. **Bhashini OCR** extracts text.
        2. The AI model identifies three key pieces of information for each test: **Test Name** (e.g., "Fasting Blood Sugar"), **Result Value** ("140 mg/dL"), and **Reference Range** ("70-99 mg/dL").
        3. The UI displays this in a translated table. The "Result Value" is color-coded: **Green** (within range), **Amber** (borderline), **Red** (out of range).
        4. Tapping on any test provides a simple, one-line explanation in the local language, e.g., "ఇది మీ రక్తంలో చక్కెర స్థాయిని కొలుస్తుంది" ("This measures your blood sugar level"). This provides immediate context without medical jargon.

* **2c. Application: Discharge Summary Navigator**
  * **Purpose:** To make long discharge summaries easy to navigate.
  * **UI:** A tabbed interface.
  * **Workflow:**
        1. After scanning the (often multi-page) summary, **Bhashini OCR+MT** translates the whole document.
        2. The **Gemini API** then processes the translated text, automatically identifying and chunking the content into logical sections.
        3. The output is presented in tabs like: **"Diagnosis," "Treatment History," "Medications to Take,"** and **"Follow-up Instructions."** The patient can jump directly to the section they need without scrolling through pages of text.

## 3. AI-Powered Insights: The "Saaransh" (Summary) Module 🧠

This module provides context-specific summaries based on the input source.

* **3a. Application: Doctor's Clinical Note Generator**
  * **Purpose:** To reduce documentation time for doctors.
  * **Workflow:** After a "Clinical Consultation," Dr. Singh can press a "Generate SOAP Note" button. The **Gemini API** analyzes the English transcript of the conversation and automatically drafts a structured clinical note (Subjective, Objective, Assessment, Plan), which she can quickly review and save.

* **3b. Application: Patient's Action Plan**
  * **Purpose:** To give patients clear, actionable instructions.
  * **Workflow:** For Mr. Rao, the same consultation transcript is used to generate a simple, bulleted list in Telugu using the **Sarvam API**. It extracts only the direct instructions and advice:
    * 💊 Take these medicines as prescribed.
    * 🩸 Get the blood test done.
    * 🗓️ Visit again in 2 weeks.

* **3c. Application: Longitudinal Health Summary**
  * **Purpose:** A powerful tool for doctors to get a quick overview of a patient's history.
  * **UI:** A "Generate Timeline" button in the patient's profile.
  * **Workflow:** The doctor selects multiple documents (past lab reports, discharge summaries). The **Gemini API** processes the content from all these sources and generates a chronological summary of the patient's medical history in English, highlighting significant events, diagnoses, and changes in lab values.

## 4. Patient Education: The "Siksha" (Education) Module 🎓

This module becomes proactive and personalized.

* **4a. Application: Proactive Learning Assistant**
  * **Purpose:** To provide relevant information automatically.
  * **Workflow:** The system is context-aware. If the "Prescription Decoder" identifies an anti-diabetic drug, or if the doctor's diagnosis mentions "Hypertension," the Siksha module sends a notification: "We've added some helpful videos about managing your condition to your Health Library. Would you like to watch them now?" All content is, of course, available in the patient's preferred language (using the video dubbing/subtitling feature).

* **4b. Application: Interactive Medicine Encyclopedia**
  * **Purpose:** To provide detailed information about specific medicines.
  * **UI:** Accessed via the "Learn More" button in the Prescription Decoder.
  * **Workflow:** Tapping the button opens a dedicated page with a short video (dubbed in the local language via **Bhashini TTS**) explaining what the drug does, how to take it, common side effects, and food to avoid. This is far more effective than a tiny, jargon-filled paper insert.

By breaking down the features this way, **Vaidya-Vaani** becomes a suite of specialized, interconnected tools. The user experience is tailored to the specific task at hand, making the application incredibly intuitive and genuinely useful in a real-world clinical setting.
