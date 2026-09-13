import { useState, useEffect, createElement } from 'react';

const translations = {
  ar: {
    app: 'أوندوك',
    login: 'دخول',
    logout: 'خروج',
    language: 'اللغة',
    loading: 'جارٍ التحميل...'
  },
  en: {
    app: 'ONDOQ',
    login: 'Sign in',
    logout: 'Log out',
    language: 'Language',
    loading: 'Loading...'
  },
  fr: {
    app: 'ONDOQ',
    login: 'Connexion',
    logout: 'Déconnexion',
    language: 'Langue',
    loading: 'Chargement...'
  },
  es: {
    app: 'ONDOQ',
    login: 'Iniciar sesión',
    logout: 'Salir',
    language: 'Idioma',
    loading: 'Cargando...'
  },
  de: {
    app: 'ONDOQ',
    login: 'Anmelden',
    logout: 'Abmelden',
    language: 'Sprache',
    loading: 'Laden...'
  }
};

export const LANGS = [
  ['ar', 'العربية'],
  ['en', 'English'],
  ['fr', 'Français'],
  ['es', 'Español'],
  ['de', 'Deutsch']
];

const SUPPORTED = ['ar', 'en', 'fr', 'es', 'de'];

export function useI18n() {
  const [lang, setLangState] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
    return SUPPORTED.includes(saved) ? saved : 'en';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }, [lang]);

  const setLang = (next) => {
    if (!SUPPORTED.includes(next)) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', next);
    }
    setLangState(next);
  };

  const t = (key) => {
    return translations[lang]?.[key] ?? translations.en[key] ?? key;
  };

  return { lang, setLang, t };
}

export function LanguageSelect({ lang, setLang }) {
  return createElement(
    'select',
    {
      className: 'language-select',
      value: lang,
      onChange: (e) => setLang(e.target.value),
      'aria-label': 'Language'
    },
    LANGS.map(([code, label]) =>
      createElement(
        'option',
        { key: code, value: code },
        label
      )
    )
  );
}
