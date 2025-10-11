import React, { createContext, useContext, useState, ReactNode } from 'react';

// Add codes for the major 10 languages (plus en)
export type Language =
  | 'en'
  | 'hi' // Hindi
  | 'bn' // Bengali
  | 'mr' // Marathi
  | 'te' // Telugu
  | 'ta' // Tamil
  | 'gu' // Gujarati
  | 'ur' // Urdu
  | 'kn' // Kannada
  | 'od' // Odia
  | 'ml'; // Malayalam

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Load generated translations at runtime (do not use a static import so dev/build won't fail if file is missing)
let translations: Record<string, Record<string, string>> = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gen = require('./translations.generated');
  translations = gen && gen.translations ? gen.translations : {};
} catch (err) {
  try {
    // fallback to base english file if present
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const base = require('./translations.base.json');
    translations = base && base.en ? base : { en: {} };
  } catch (err2) {
    translations = { en: {} };
  }
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return (translations[language] && translations[language][key]) || key;
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
