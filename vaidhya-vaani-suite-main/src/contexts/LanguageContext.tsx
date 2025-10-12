import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'te' | 'ta' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// TODO: Replace with actual translations from Bhashini API
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    'nav.dashboard': 'Dashboard',
    'nav.samvaad': 'Samvaad',
    'nav.lipiGyan': 'Lipi-Gyan',
    'nav.saaransh': 'Saaransh',
    'nav.panchang': 'Panchang',
    'nav.appName': 'Vaidya-Vaani',
    
    // Index page
    'index.hero.title': 'Welcome to Vaidya-Vaani',
    'index.hero.subtitle': 'Breaking language barriers in healthcare with AI-powered communication and document intelligence',
    'index.samvaad.title': 'Samvaad',
    'index.samvaad.description': 'Real-time communication tools for clinical consultations, reception triage, and pharmacy interactions',
    'index.lipiGyan.title': 'Lipi-Gyan',
    'index.lipiGyan.description': 'Document intelligence for prescriptions, lab reports, and discharge summaries',
    'index.saaransh.title': 'Saaransh',
    'index.saaransh.description': 'AI-powered insights including clinical notes, action plans, and health summaries',
    'index.panchang.title': 'Panchang',
    'index.panchang.description': 'Patient calendar for booking appointments, managing schedules, and tracking healthcare visits',
    'index.stats.tools': 'Specialized Tools',
    'index.stats.languages': 'Indian Languages',
    'index.stats.modules': 'Core Modules',
    'index.stats.accessible': 'Accessible',
    
    // Samvaad module
    'samvaad.title': 'Samvaad Module',
    'samvaad.subtitle': 'Real-time communication tools breaking language barriers in clinical settings',
    'samvaad.consultation.title': 'Clinical Consultation Room',
    'samvaad.consultation.description': 'Live doctor-patient conversations with split-screen transcripts and key point marking',
    'samvaad.consultation.badge': 'Real-time',
    'samvaad.triage.title': 'Smart Reception & Triage',
    'samvaad.triage.description': 'Guided conversational intake for patient registration and symptom screening',
    'samvaad.triage.badge': 'Automated',
          
    // Lipi-Gyan module
    'lipiGyan.title': 'Lipi-Gyan Module',
    'lipiGyan.subtitle': 'Document intelligence making medical documents accessible and understandable',
    'lipiGyan.prescription.title': 'Prescription Decoder',
    'lipiGyan.prescription.description': 'Structured tables showing medicine names, dosages, frequency, and duration with reminders',
    'lipiGyan.prescription.badge': 'OCR',
    'lipiGyan.labReport.title': 'Lab Report Analyzer',
    'lipiGyan.labReport.description': 'Color-coded analysis of test results with green/amber/red indicators and explanations',
    'lipiGyan.labReport.badge': 'AI-Powered',
    'lipiGyan.discharge.title': 'Discharge Summary Navigator',
    'lipiGyan.discharge.description': 'Tabbed interface for easy navigation of diagnosis, treatment, medications, and follow-ups',
    'lipiGyan.discharge.badge': 'Smart Parse',
    
    // Saaransh module
    'saaransh.title': 'Saaransh Module',
    'saaransh.subtitle': 'AI-powered insights generating actionable summaries for doctors and patients',
    'saaransh.clinicalNotes.title': 'Clinical Note Generator',
    'saaransh.clinicalNotes.description': 'Automatic SOAP notes from consultation transcripts for doctors',
    'saaransh.clinicalNotes.badge': 'SOAP',
    'saaransh.actionPlan.title': "Patient's Action Plan",
    'saaransh.actionPlan.description': "Simple, bulleted action items extracted from consultation in patient's language",
    'saaransh.actionPlan.badge': 'Simplified',
    
    // Panchang module
    'panchang.title': 'Panchang Module',
    'panchang.subtitle': 'Your personal healthcare calendar for appointments and schedule management',
    'panchang.proactive.title': 'Appointment Booking',
    'panchang.proactive.description': 'Schedule and manage doctor appointments with smart calendar integration',
    'panchang.proactive.badge': 'Smart',
    'panchang.encyclopedia.title': 'Healthcare Schedule Tracker',
    'panchang.encyclopedia.description': 'Track all your medical appointments, follow-ups, and medication schedules',
    'panchang.encyclopedia.badge': 'Organized',
    
    // Common
    'common.explore': 'Explore',
    'common.backToDashboard': 'Back to Dashboard',
  },
  hi: {
    // Navbar
    'nav.dashboard': 'डैशबोर्ड',
    'nav.samvaad': 'संवाद',
    'nav.lipiGyan': 'लिपि-ज्ञान',
    'nav.saaransh': 'सारांश',
    'nav.panchang': 'पंचांग',
    'nav.appName': 'वैद्य-वाणी',
    
    // Index page
    'index.hero.title': 'वैद्य-वाणी में आपका स्वागत है',
    'index.hero.subtitle': 'एआई-संचालित संचार और दस्तावेज़ बुद्धिमत्ता के साथ स्वास्थ्य सेवा में भाषा की बाधाओं को तोड़ना',
    'index.samvaad.title': 'संवाद (वार्तालाप)',
    'index.samvaad.description': 'नैदानिक परामर्श, रिसेप्शन ट्राइएज और फार्मेसी इंटरैक्शन के लिए रीयल-टाइम संचार उपकरण',
    'index.lipiGyan.title': 'लिपि-ज्ञान (लिपि ज्ञान)',
    'index.lipiGyan.description': 'प्रिस्क्रिप्शन, लैब रिपोर्ट और डिस्चार्ज सारांश के लिए दस्तावेज़ बुद्धिमत्ता',
    'index.saaransh.title': 'सारांश (सारांश)',
    'index.saaransh.description': 'क्लिनिकल नोट्स, एक्शन प्लान और स्वास्थ्य सारांश सहित एआई-संचालित अंतर्दृष्टि',
    'index.panchang.title': 'पंचांग (कैलेंडर)',
    'index.panchang.description': 'अपॉइंटमेंट बुक करने, शेड्यूल प्रबंधित करने और स्वास्थ्य सेवा यात्राओं को ट्रैक करने के लिए रोगी कैलेंडर',
    'index.stats.tools': 'विशेष उपकरण',
    'index.stats.languages': 'भारतीय भाषाएँ',
    'index.stats.modules': 'मुख्य मॉड्यूल',
    'index.stats.accessible': 'सुलभ',
    
    // Samvaad module
    'samvaad.title': 'संवाद (वार्तालाप) मॉड्यूल',
    'samvaad.subtitle': 'नैदानिक सेटिंग्स में भाषा की बाधाओं को तोड़ने वाले रीयल-टाइम संचार उपकरण',
    'samvaad.consultation.title': 'नैदानिक परामर्श कक्ष',
    'samvaad.consultation.description': 'स्प्लिट-स्क्रीन ट्रांसक्रिप्ट और मुख्य बिंदु अंकन के साथ लाइव डॉक्टर-रोगी वार्तालाप',
    'samvaad.consultation.badge': 'रीयल-टाइम',
    'samvaad.triage.title': 'स्मार्ट रिसेप्शन और ट्राइएज',
    'samvaad.triage.description': 'रोगी पंजीकरण और लक्षण स्क्रीनिंग के लिए निर्देशित वार्तालाप इनटेक',
    'samvaad.triage.badge': 'स्वचालित',
          
    // Lipi-Gyan module
    'lipiGyan.title': 'लिपि-ज्ञान (लिपि ज्ञान) मॉड्यूल',
    'lipiGyan.subtitle': 'चिकित्सा दस्तावेज़ों को सुलभ और समझने योग्य बनाने वाली दस्तावेज़ बुद्धिमत्ता',
    'lipiGyan.prescription.title': 'प्रिस्क्रिप्शन डिकोडर',
    'lipiGyan.prescription.description': 'अनुस्मारक के साथ दवा के नाम, खुराक, आवृत्ति और अवधि दिखाने वाली संरचित तालिकाएं',
    'lipiGyan.prescription.badge': 'OCR',
    'lipiGyan.labReport.title': 'लैब रिपोर्ट विश्लेषक',
    'lipiGyan.labReport.description': 'हरे/एम्बर/लाल संकेतक और स्पष्टीकरण के साथ परीक्षण परिणामों का रंग-कोडित विश्लेषण',
    'lipiGyan.labReport.badge': 'एआई-संचालित',
    'lipiGyan.discharge.title': 'डिस्चार्ज सारांश नेविगेटर',
    'lipiGyan.discharge.description': 'निदान, उपचार, दवाओं और फॉलो-अप की आसान नेविगेशन के लिए टैब इंटरफ़ेस',
    'lipiGyan.discharge.badge': 'स्मार्ट पार्स',
    
    // Saaransh module
    'saaransh.title': 'सारांश (सारांश) मॉड्यूल',
    'saaransh.subtitle': 'डॉक्टरों और रोगियों के लिए कार्रवाई योग्य सारांश उत्पन्न करने वाली एआई-संचालित अंतर्दृष्टि',
    'saaransh.clinicalNotes.title': 'नैदानिक नोट जनरेटर',
    'saaransh.clinicalNotes.description': 'डॉक्टरों के लिए परामर्श ट्रांसक्रिप्ट से स्वचालित SOAP नोट्स',
    'saaransh.clinicalNotes.badge': 'SOAP',
    'saaransh.actionPlan.title': 'रोगी की कार्य योजना',
    'saaransh.actionPlan.description': 'रोगी की भाषा में परामर्श से निकाले गए सरल, बुलेटेड कार्य आइटम',
    'saaransh.actionPlan.badge': 'सरलीकृत',
    
    // Panchang module
    'panchang.title': 'पंचांग (कैलेंडर) मॉड्यूल',
    'panchang.subtitle': 'अपॉइंटमेंट और शेड्यूल प्रबंधन के लिए आपका व्यक्तिगत स्वास्थ्य सेवा कैलेंडर',
    'panchang.proactive.title': 'अपॉइंटमेंट बुकिंग',
    'panchang.proactive.description': 'स्मार्ट कैलेंडर एकीकरण के साथ डॉक्टर अपॉइंटमेंट शेड्यूल और प्रबंधित करें',
    'panchang.proactive.badge': 'स्मार्ट',
    'panchang.encyclopedia.title': 'स्वास्थ्य सेवा शेड्यूल ट्रैकर',
    'panchang.encyclopedia.description': 'अपनी सभी चिकित्सा अपॉइंटमेंट, फॉलो-अप और दवा शेड्यूल ट्रैक करें',
    'panchang.encyclopedia.badge': 'व्यवस्थित',
    
    // Common
    'common.explore': 'अन्वेषण करें',
    'common.backToDashboard': 'डैशबोर्ड पर वापस',
  },
  te: {
    // Navbar
    'nav.dashboard': 'డాష్‌బోర్డ్',
    'nav.samvaad': 'సంవాద్',
    'nav.lipiGyan': 'లిపి-జ్ఞాన్',
    'nav.saaransh': 'సారాంశ్',
    'nav.panchang': 'పంచాంగ్',
    'nav.appName': 'వైద్య-వాణి',
    
    // Index page
    'index.hero.title': 'వైద్య-వాణికి స్వాగతం',
    'index.hero.subtitle': 'AI-ఆధారిత కమ్యూనికేషన్ మరియు డాక్యుమెంట్ ఇంటెలిజెన్స్‌తో ఆరోగ్య సంరక్షణలో భాషా అడ్డంకులను తొలగించడం',
    'index.samvaad.title': 'సంవాద్ (సంభాషణ)',
    'index.samvaad.description': 'క్లినికల్ కన్సల్టేషన్‌లు, రిసెప్షన్ ట్రయాజ్ మరియు ఫార్మసీ ఇంటరాక్షన్‌ల కోసం రియల్-టైం కమ్యూనికేషన్ సాధనాలు',
    'index.lipiGyan.title': 'లిపి-జ్ఞాన్ (లిపి జ్ఞానం)',
    'index.lipiGyan.description': 'ప్రిస్క్రిప్షన్‌లు, ల్యాబ్ రిపోర్టులు మరియు డిశ్చార్జ్ సారాంశాల కోసం డాక్యుమెంట్ ఇంటెలిజెన్స్',
    'index.saaransh.title': 'సారాంశ్ (సారాంశం)',
    'index.saaransh.description': 'క్లినికల్ నోట్స్, యాక్షన్ ప్లాన్‌లు మరియు ఆరోగ్య సారాంశాలతో సహా AI-ఆధారిత అంతర్దృష్టులు',
    'index.panchang.title': 'పంచాంగ్ (క్యాలెండర్)',
    'index.panchang.description': 'అపాయింట్‌మెంట్‌లను బుక్ చేసుకోవడానికి, షెడ్యూల్‌లను నిర్వహించడానికి మరియు ఆరోగ్య సంరక్షణ సందర్శనలను ట్రాక్ చేయడానికి పేషెంట్ క్యాలెండర్',
    'index.stats.tools': 'ప్రత్యేక సాధనాలు',
    'index.stats.languages': 'భారతీయ భాషలు',
    'index.stats.modules': 'ప్రధాన మాడ్యూళ్ళు',
    'index.stats.accessible': 'అందుబాటులో ఉంది',
    
    // Samvaad module
    'samvaad.title': 'సంవాద్ (సంభాషణ) మాడ్యూల్',
    'samvaad.subtitle': 'క్లినికల్ సెట్టింగ్‌లలో భాషా అడ్డంకులను తొలగించే రియల్-టైం కమ్యూనికేషన్ సాధనాలు',
    'samvaad.consultation.title': 'క్లినికల్ కన్సల్టేషన్ రూమ్',
    'samvaad.consultation.description': 'స్ప్లిట్-స్క్రీన్ ట్రాన్స్‌క్రిప్ట్‌లు మరియు కీలక పాయింట్ మార్కింగ్‌తో లైవ్ డాక్టర్-పేషెంట్ సంభాషణలు',
    'samvaad.consultation.badge': 'రియల్-టైం',
    'samvaad.triage.title': 'స్మార్ట్ రిసెప్షన్ & ట్రయాజ్',
    'samvaad.triage.description': 'పేషెంట్ రిజిస్ట్రేషన్ మరియు లక్షణ స్క్రీనింగ్ కోసం మార్గదర్శక సంభాషణ ఇన్‌టేక్',
    'samvaad.triage.badge': 'స్వయంచాలిత',
          
    // Lipi-Gyan module
    'lipiGyan.title': 'లిపి-జ్ఞాన్ (లిపి జ్ఞానం) మాడ్యూల్',
    'lipiGyan.subtitle': 'వైద్య పత్రాలను అందుబాటులో మరియు అర్థమయ్యేలా చేసే డాక్యుమెంట్ ఇంటెలిజెన్స్',
    'lipiGyan.prescription.title': 'ప్రిస్క్రిప్షన్ డీకోడర్',
    'lipiGyan.prescription.description': 'రిమైండర్‌లతో మందుల పేర్లు, మోతాదులు, ఫ్రీక్వెన్సీ మరియు వ్యవధిని చూపించే నిర్మాణాత్మక పట్టికలు',
    'lipiGyan.prescription.badge': 'OCR',
    'lipiGyan.labReport.title': 'ల్యాబ్ రిపోర్ట్ అనలైజర్',
    'lipiGyan.labReport.description': 'గ్రీన్/యాంబర్/రెడ్ ఇండికేటర్లు మరియు వివరణలతో టెస్ట్ ఫలితాల రంగు-కోడెడ్ విశ్లేషణ',
    'lipiGyan.labReport.badge': 'AI-ఆధారిత',
    'lipiGyan.discharge.title': 'డిశ్చార్జ్ సారాంశ నావిగేటర్',
    'lipiGyan.discharge.description': 'డయాగ్నోసిస్, ట్రీట్‌మెంట్, మందులు మరియు ఫాలో-అప్‌ల సులభ నావిగేషన్ కోసం ట్యాబ్డ్ ఇంటర్‌ఫేస్',
    'lipiGyan.discharge.badge': 'స్మార్ట్ పార్స్',
    
    // Saaransh module
    'saaransh.title': 'సారాంశ్ (సారాంశం) మాడ్యూల్',
    'saaransh.subtitle': 'డాక్టర్లు మరియు పేషెంట్ల కోసం చర్య తీసుకోదగిన సారాంశాలను రూపొందించే AI-ఆధారిత అంతర్దృష్టులు',
    'saaransh.clinicalNotes.title': 'క్లినికల్ నోట్ జనరేటర్',
    'saaransh.clinicalNotes.description': 'డాక్టర్ల కోసం కన్సల్టేషన్ ట్రాన్స్‌క్రిప్ట్‌ల నుండి స్వయంచాలిత SOAP నోట్స్',
    'saaransh.clinicalNotes.badge': 'SOAP',
    'saaransh.actionPlan.title': 'పేషెంట్ యాక్షన్ ప్లాన్',
    'saaransh.actionPlan.description': 'పేషెంట్ భాషలో కన్సల్టేషన్ నుండి సేకరించిన సాధారణ, బుల్లెట్ యాక్షన్ ఐటమ్‌లు',
    'saaransh.actionPlan.badge': 'సరళీకృతం',
    
    // Panchang module
    'panchang.title': 'పంచాంగ్ (క్యాలెండర్) మాడ్యూల్',
    'panchang.subtitle': 'అపాయింట్‌మెంట్‌లు మరియు షెడ్యూల్ నిర్వహణ కోసం మీ వ్యక్తిగత ఆరోగ్య సంరక్షణ క్యాలెండర్',
    'panchang.proactive.title': 'అపాయింట్‌మెంట్ బుకింగ్',
    'panchang.proactive.description': 'స్మార్ట్ క్యాలెండర్ ఇంటిగ్రేషన్‌తో డాక్టర్ అపాయింట్‌మెంట్‌లను షెడ్యూల్ చేయండి మరియు నిర్వహించండి',
    'panchang.proactive.badge': 'స్మార్ట్',
    'panchang.encyclopedia.title': 'హెల్త్‌కేర్ షెడ్యూల్ ట్రాకర్',
    'panchang.encyclopedia.description': 'మీ అన్ని వైద్య అపాయింట్‌మెంట్‌లు, ఫాలో-అప్‌లు మరియు మందుల షెడ్యూల్‌లను ట్రాక్ చేయండి',
    'panchang.encyclopedia.badge': 'వ్యవస్థీకృతం',
    
    // Common
    'common.explore': 'అన్వేషించండి',
    'common.backToDashboard': 'డాష్‌బోర్డ్‌కు తిరిగి వెళ్ళండి',
  },
  ta: {
    // Navbar
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.samvaad': 'சம்வாத்',
    'nav.lipiGyan': 'லிபி-ஞான்',
    'nav.saaransh': 'சாரன்ஷ்',
    'nav.panchang': 'பஞ்சாங்கம்',
    'nav.appName': 'வைத்ய-வாணி',
    
    // Index page
    'index.hero.title': 'வைத்ய-வாணிக்கு வரவேற்கிறோம்',
    'index.hero.subtitle': 'AI-இயங்கும் தகவல்தொடர்பு மற்றும் ஆவண நுண்ணறிவுடன் சுகாதாரத்தில் மொழி தடைகளை உடைத்தல்',
    'index.samvaad.title': 'சம்வாத் (உரையாடல்)',
    'index.samvaad.description': 'மருத்துவ ஆலோசனைகள், வரவேற்பு முன்னுரிமை மற்றும் மருந்தகம் தொடர்புகளுக்கான நேரலை தகவல்தொடர்பு கருவிகள்',
    'index.lipiGyan.title': 'லிபி-ஞான் (எழுத்து அறிவு)',
    'index.lipiGyan.description': 'மருந்து சீட்டுகள், ஆய்வக அறிக்கைகள் மற்றும் வெளியேற்ற சுருக்கங்களுக்கான ஆவண நுண்ணறிவு',
    'index.saaransh.title': 'சாரன்ஷ் (சுருக்கம்)',
    'index.saaransh.description': 'மருத்துவ குறிப்புகள், செயல் திட்டங்கள் மற்றும் சுகாதார சுருக்கங்கள் உட்பட AI-இயங்கும் நுண்ணறிவுகள்',
    'index.panchang.title': 'பஞ்சாங்கம் (நாட்காட்டி)',
    'index.panchang.description': 'சந்திப்புகளை முன்பதிவு செய்வதற்கும், அட்டவணைகளை நிர்வகிப்பதற்கும், சுகாதார வருகைகளைக் கண்காணிப்பதற்கும் நோயாளி நாட்காட்டி',
    'index.stats.tools': 'சிறப்பு கருவிகள்',
    'index.stats.languages': 'இந்திய மொழிகள்',
    'index.stats.modules': 'முக்கிய தொகுதிகள்',
    'index.stats.accessible': 'அணுகக்கூடியது',
    
    // Samvaad module
    'samvaad.title': 'சம்வாத் (உரையாடல்) தொகுதி',
    'samvaad.subtitle': 'மருத்துவ அமைப்புகளில் மொழி தடைகளை உடைக்கும் நேரலை தகவல்தொடர்பு கருவிகள்',
    'samvaad.consultation.title': 'மருத்துவ ஆலோசனை அறை',
    'samvaad.consultation.description': 'பிரிக்கப்பட்ட திரை படியெடுப்புகள் மற்றும் முக்கிய புள்ளி குறிப்பிடுதலுடன் நேரலை மருத்துவர்-நோயாளி உரையாடல்கள்',
    'samvaad.consultation.badge': 'நேரலை',
    'samvaad.triage.title': 'ஸ்மார்ட் வரவேற்பு & முன்னுரிமை',
    'samvaad.triage.description': 'நோயாளி பதிவு மற்றும் அறிகுறி திரையிடலுக்கான வழிகாட்டப்பட்ட உரையாடல் உட்கொள்ளல்',
    'samvaad.triage.badge': 'தானியங்கி',
          
    // Lipi-Gyan module
    'lipiGyan.title': 'லிபி-ஞான் (எழுத்து அறிவு) தொகுதி',
    'lipiGyan.subtitle': 'மருத்துவ ஆவணங்களை அணுகக்கூடியதாகவும் புரிந்துகொள்ளக்கூடியதாகவும் ஆக்கும் ஆவண நுண்ணறிவு',
    'lipiGyan.prescription.title': 'மருந்து சீட்டு குறிவிலக்கி',
    'lipiGyan.prescription.description': 'நினைவூட்டல்களுடன் மருந்து பெயர்கள், அளவுகள், அதிர்வெண் மற்றும் காலத்தைக் காட்டும் கட்டமைக்கப்பட்ட அட்டவணைகள்',
    'lipiGyan.prescription.badge': 'OCR',
    'lipiGyan.labReport.title': 'ஆய்வக அறிக்கை பகுப்பாய்வி',
    'lipiGyan.labReport.description': 'பச்சை/அம்பர்/சிவப்பு குறிகாட்டிகள் மற்றும் விளக்கங்களுடன் சோதனை முடிவுகளின் வண்ண-குறியிடப்பட்ட பகுப்பாய்வு',
    'lipiGyan.labReport.badge': 'AI-இயங்கும்',
    'lipiGyan.discharge.title': 'வெளியேற்ற சுருக்க வழிசெலுத்தி',
    'lipiGyan.discharge.description': 'நோயறிதல், சிகிச்சை, மருந்துகள் மற்றும் பின்தொடர்தல்களின் எளிய வழிசெலுத்தலுக்கான தாவல் இடைமுகம்',
    'lipiGyan.discharge.badge': 'ஸ்மார்ட் பார்ஸ்',
    
    // Saaransh module
    'saaransh.title': 'சாரன்ஷ் (சுருக்கம்) தொகுதி',
    'saaransh.subtitle': 'மருத்துவர்கள் மற்றும் நோயாளிகளுக்கான செயல்படக்கூடிய சுருக்கங்களை உருவாக்கும் AI-இயங்கும் நுண்ணறிவுகள்',
    'saaransh.clinicalNotes.title': 'மருத்துவ குறிப்பு உருவாக்கி',
    'saaransh.clinicalNotes.description': 'மருத்துவர்களுக்கான ஆலோசனை படியெடுப்புகளிலிருந்து தானியங்கி SOAP குறிப்புகள்',
    'saaransh.clinicalNotes.badge': 'SOAP',
    'saaransh.actionPlan.title': 'நோயாளியின் செயல் திட்டம்',
    'saaransh.actionPlan.description': 'நோயாளியின் மொழியில் ஆலோசனையிலிருந்து பிரித்தெடுக்கப்பட்ட எளிய, புள்ளி செயல் உருப்படிகள்',
    'saaransh.actionPlan.badge': 'எளிதாக்கப்பட்ட',
    
    // Panchang module
    'panchang.title': 'பஞ்சாங்கம் (நாட்காட்டி) தொகுதி',
    'panchang.subtitle': 'சந்திப்புகள் மற்றும் அட்டவணை நிர்வாகத்திற்கான உங்கள் தனிப்பட்ட சுகாதார நாட்காட்டி',
    'panchang.proactive.title': 'சந்திப்பு முன்பதிவு',
    'panchang.proactive.description': 'ஸ்மார்ட் நாட்காட்டி ஒருங்கிணைப்புடன் மருத்துவர் சந்திப்புகளை திட்டமிடுங்கள் மற்றும் நிர்வகிக்கவும்',
    'panchang.proactive.badge': 'ஸ்மார்ட்',
    'panchang.encyclopedia.title': 'சுகாதார அட்டவணை கண்காணிப்பி',
    'panchang.encyclopedia.description': 'உங்கள் அனைத்து மருத்துவ சந்திப்புகள், பின்தொடர்தல்கள் மற்றும் மருந்து அட்டவணைகளைக் கண்காணிக்கவும்',
    'panchang.encyclopedia.badge': 'ஒழுங்கமைக்கப்பட்ட',
    
    // Common
    'common.explore': 'ஆராயுங்கள்',
    'common.backToDashboard': 'டாஷ்போர்டுக்குத் திரும்பு',
  },
  bn: {
    // Navbar
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.samvaad': 'সংবাদ',
    'nav.lipiGyan': 'লিপি-জ্ঞান',
    'nav.saaransh': 'সারাংশ',
    'nav.panchang': 'পঞ্জিকা',
    'nav.appName': 'বৈদ্য-বাণী',
    
    // Index page
    'index.hero.title': 'বৈদ্য-বাণীতে স্বাগতম',
    'index.hero.subtitle': 'AI-চালিত যোগাযোগ এবং নথি বুদ্ধিমত্তার সাথে স্বাস্থ্যসেবায় ভাষার বাধা ভাঙা',
    'index.samvaad.title': 'সংবাদ (সংলাপ)',
    'index.samvaad.description': 'ক্লিনিকাল পরামর্শ, অভ্যর্থনা ট্রাইয়েজ এবং ফার্মেসি মিথস্ক্রিয়াগুলির জন্য রিয়েল-টাইম যোগাযোগ সরঞ্জাম',
    'index.lipiGyan.title': 'লিপি-জ্ঞান (লিপি জ্ঞান)',
    'index.lipiGyan.description': 'প্রেসক্রিপশন, ল্যাব রিপোর্ট এবং ডিসচার্জ সারাংশের জন্য নথি বুদ্ধিমত্তা',
    'index.saaransh.title': 'সারাংশ (সারাংশ)',
    'index.saaransh.description': 'ক্লিনিকাল নোট, অ্যাকশন প্ল্যান এবং স্বাস্থ্য সারাংশ সহ AI-চালিত অন্তর্দৃষ্টি',
    'index.panchang.title': 'পঞ্জিকা (ক্যালেন্ডার)',
    'index.panchang.description': 'অ্যাপয়েন্টমেন্ট বুক করতে, সময়সূচী পরিচালনা করতে এবং স্বাস্থ্যসেবা ভিজিট ট্র্যাক করতে রোগীর ক্যালেন্ডার',
    'index.stats.tools': 'বিশেষায়িত সরঞ্জাম',
    'index.stats.languages': 'ভারতীয় ভাষা',
    'index.stats.modules': 'মূল মডিউল',
    'index.stats.accessible': 'অ্যাক্সেসযোগ্য',
    
    // Samvaad module
    'samvaad.title': 'সংবাদ (সংলাপ) মডিউল',
    'samvaad.subtitle': 'ক্লিনিকাল সেটিংসে ভাষার বাধা ভাঙার রিয়েল-টাইম যোগাযোগ সরঞ্জাম',
    'samvaad.consultation.title': 'ক্লিনিকাল পরামর্শ কক্ষ',
    'samvaad.consultation.description': 'স্প্লিট-স্ক্রিন ট্রান্সক্রিপ্ট এবং মূল পয়েন্ট চিহ্নিতকরণ সহ লাইভ ডাক্তার-রোগী কথোপকথন',
    'samvaad.consultation.badge': 'রিয়েল-টাইম',
    'samvaad.triage.title': 'স্মার্ট অভ্যর্থনা এবং ট্রাইয়েজ',
    'samvaad.triage.description': 'রোগী নিবন্ধন এবং লক্ষণ স্ক্রীনিংয়ের জন্য নির্দেশিত কথোপকথন গ্রহণ',
    'samvaad.triage.badge': 'স্বয়ংক্রিয়',
          
    // Lipi-Gyan module
    'lipiGyan.title': 'লিপি-জ্ঞান (লিপি জ্ঞান) মডিউল',
    'lipiGyan.subtitle': 'চিকিৎসা নথিগুলিকে অ্যাক্সেসযোগ্য এবং বোধগম্য করে তোলে নথি বুদ্ধিমত্তা',
    'lipiGyan.prescription.title': 'প্রেসক্রিপশন ডিকোডার',
    'lipiGyan.prescription.description': 'অনুস্মারক সহ ওষুধের নাম, ডোজ, ফ্রিকোয়েন্সি এবং সময়কাল দেখানো কাঠামোগত টেবিল',
    'lipiGyan.prescription.badge': 'OCR',
    'lipiGyan.labReport.title': 'ল্যাব রিপোর্ট বিশ্লেষক',
    'lipiGyan.labReport.description': 'সবুজ/অ্যাম্বার/লাল নির্দেশক এবং ব্যাখ্যা সহ পরীক্ষা ফলাফলের রঙ-কোডেড বিশ্লেষণ',
    'lipiGyan.labReport.badge': 'AI-চালিত',
    'lipiGyan.discharge.title': 'ডিসচার্জ সারাংশ নেভিগেটর',
    'lipiGyan.discharge.description': 'নির্ণয়, চিকিৎসা, ওষুধ এবং ফলো-আপের সহজ নেভিগেশনের জন্য ট্যাবড ইন্টারফেস',
    'lipiGyan.discharge.badge': 'স্মার্ট পার্স',
    
    // Saaransh module
    'saaransh.title': 'সারাংশ (সারাংশ) মডিউল',
    'saaransh.subtitle': 'ডাক্তার এবং রোগীদের জন্য কার্যকর সারাংশ তৈরি করে AI-চালিত অন্তর্দৃষ্টি',
    'saaransh.clinicalNotes.title': 'ক্লিনিকাল নোট জেনারেটর',
    'saaransh.clinicalNotes.description': 'ডাক্তারদের জন্য পরামর্শ ট্রান্সক্রিপ্ট থেকে স্বয়ংক্রিয় SOAP নোট',
    'saaransh.clinicalNotes.badge': 'SOAP',
    'saaransh.actionPlan.title': 'রোগীর কর্ম পরিকল্পনা',
    'saaransh.actionPlan.description': "রোগীর ভাষায় পরামর্শ থেকে নিষ্কাশিত সহজ, বুলেটেড অ্যাকশন আইটেম",
    'saaransh.actionPlan.badge': 'সরলীকৃত',
    
    // Panchang module
    'panchang.title': 'পঞ্জিকা (ক্যালেন্ডার) মডিউল',
    'panchang.subtitle': 'অ্যাপয়েন্টমেন্ট এবং সময়সূচী পরিচালনার জন্য আপনার ব্যক্তিগত স্বাস্থ্যসেবা ক্যালেন্ডার',
    'panchang.proactive.title': 'অ্যাপয়েন্টমেন্ট বুকিং',
    'panchang.proactive.description': 'স্মার্ট ক্যালেন্ডার ইন্টিগ্রেশন সহ ডাক্তারের অ্যাপয়েন্টমেন্ট নির্ধারণ এবং পরিচালনা করুন',
    'panchang.proactive.badge': 'স্মার্ট',
    'panchang.encyclopedia.title': 'স্বাস্থ্যসেবা সময়সূচী ট্র্যাকার',
    'panchang.encyclopedia.description': 'আপনার সমস্ত চিকিৎসা অ্যাপয়েন্টমেন্ট, ফলো-আপ এবং ওষুধের সময়সূচী ট্র্যাক করুন',
    'panchang.encyclopedia.badge': 'সংগঠিত',
    
    // Common
    'common.explore': 'অন্বেষণ করুন',
    'common.backToDashboard': 'ড্যাশবোর্ডে ফিরে যান',
  },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};