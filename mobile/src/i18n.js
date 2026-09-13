import { useEffect, useState } from 'react';

export const LANGS = [
  ['ar', 'العربية'],
  ['en', 'English'],
  ['fr', 'Français'],
  ['es', 'Español'],
  ['de', 'Deutsch'],
];

const SUPPORTED = LANGS.map(([code]) => code);

const D = {
  ar: {
    app: 'أوندوك',
    tag: 'إدارة العيادة في مكان واحد',
    login: 'دخول',
    register: 'إنشاء حساب',
    clinic: 'العيادة',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    name: 'الاسم',
    phone: 'رقم الهاتف',
    home: 'الرئيسية',
    doctors: 'الأطباء',
    patients: 'المرضى',
    appointments: 'المواعيد',
    logout: 'خروج',
    language: 'اللغة',
    loading: 'جارٍ التحميل...',
  },
  en: {
    app: 'ONDOQ',
    tag: 'Clinic management in one place',
    login: 'Sign in',
    register: 'Create account',
    clinic: 'Clinic',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    phone: 'Phone',
    home: 'Home',
    doctors: 'Doctors',
    patients: 'Patients',
    appointments: 'Appointments',
    logout: 'Log out',
    language: 'Language',
    loading: 'Loading...',
  },
  fr: {
    app: 'ONDOQ',
    tag: 'La gestion du cabinet en un seul endroit',
    login: 'Connexion',
    register: 'Créer un compte',
    clinic: 'Cabinet',
    email: 'E-mail',
    password: 'Mot de passe',
    name: 'Nom',
    phone: 'Téléphone',
    home: 'Accueil',
    doctors: 'Médecins',
    patients: 'Patients',
    appointments: 'Rendez-vous',
    logout: 'Déconnexion',
    language: 'Langue',
    loading: 'Chargement...',
  },
  es: {
    app: 'ONDOQ',
    tag: 'Gestión de clínicas en un solo lugar',
    login: 'Iniciar sesión',
    register: 'Crear cuenta',
    clinic: 'Clínica',
    email: 'Correo',
    password: 'Contraseña',
    name: 'Nombre',
    phone: 'Teléfono',
    home: 'Inicio',
    doctors: 'Médicos',
    patients: 'Pacientes',
    appointments: 'Citas',
    logout: 'Salir',
    language: 'Idioma',
    loading: 'Cargando...',
  },
  de: {
    app: 'ONDOQ',
    tag: 'Klinikverwaltung an einem Ort',
    login: 'Anmelden',
    register: 'Konto erstellen',
    clinic: 'Klinik',
    email: 'E-Mail',
    password: 'Passwort',
    name: 'Name',
    phone: 'Telefon',
    home: 'Start',
    doctors: 'Ärzte',
    patients: 'Patienten',
    appointments: 'Termine',
    logout: 'Abmelden',
    language: 'Sprache',
    loading: 'Laden...',
  },
};

function detectDeviceLanguage() {
  const candidate = (navigator.language || 'en').split('-')[0];
  return SUPPORTED.includes(candidate) ? candidate : 'en';
}

function getInitialLanguage() {
  const saved = localStorage.getItem('lang');
  if (SUPPORTED.includes(saved)) return saved;
  const detected = detectDeviceLanguage();
  localStorage.setItem('lang', detected);
  return detected;
}

export function useI18n() {
  const [lang, setLangState] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = (next) => {
    if (!SUPPORTED.includes(next)) return;
    localStorage.setItem('lang', next);
    setLangState(next);
  };

  const t = (key) => {
    return D[lang]?.[key] ?? D.en?.[key] ?? key;
  };

  return { lang, setLang, t };
}

export function LanguageSelect({ lang, setLang }) {
  return (
    <select
      className="language-select"
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      aria-label="Language"
    >
      {LANGS.map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}
