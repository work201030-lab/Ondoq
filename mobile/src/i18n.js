import { useEffect, useState } from 'react';

export const LANGS = [
  ['ar', 'العربية'],
  ['en', 'English'],
  ['fr', 'Français'],
  ['es', 'Español'],
  ['de', 'Deutsch'],
];

const SUPPORTED = LANGS.map(([code]) => code);

function detectDeviceLanguage() {
  const candidates = [
    navigator.language,
    ...(navigator.languages || []),
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  for (const value of candidates) {
    const base = value.split('-')[0];

    if (SUPPORTED.includes(base)) {
      return base;
    }
  }

  return 'en';
}

function getInitialLanguage() {
  const saved = localStorage.getItem('lang');
  const savedMode = localStorage.getItem('ondoq-language-mode');

  if (
    savedMode === 'manual' &&
    SUPPORTED.includes(saved)
  ) {
    return saved;
  }

  const detected = detectDeviceLanguage();

  localStorage.setItem('lang', detected);
  localStorage.setItem('ondoq-language-mode', 'auto');

  return detected;
}

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
    clinicName: 'اسم العيادة',
    slug: 'معرّف العيادة',
    create: 'إنشاء الحساب',
    nearby: 'العثور على أقرب عيادة',
    home: 'الرئيسية',
    doctors: 'الأطباء',
    patients: 'المرضى',
    appointments: 'المواعيد',
    logout: 'خروج',
    delete: 'حذف الحساب',
    location: 'موقع العيادة',
    useLocation: 'تحديد موقع العيادة الحالي',
    updateLocation: 'تحديث موقعي',
    removeLocation: 'إزالة الموقع',
    address: 'العنوان',
    privacy: 'الخصوصية',
    privacyText:
      'نستخدم بيانات العيادة والمرضى لتشغيل نظام إدارة المواعيد والمرضى.',
    discover: 'اكتشاف العيادات',
    findNearest: 'اعثر على أقرب عيادة',
    distance: 'المسافة',
    specialty: 'التخصص',
    allSpecialties: 'كل التخصصات',
    openNow: 'مفتوحة الآن',
    onlineBooking: 'حجز أونلاين',
    book: 'احجز موعد',
    directions: 'ابدأ الطريق',
    googleMaps: 'فتح على Google Maps',
    booking: 'حجز موعد',
    doctor: 'الطبيب',
    date: 'التاريخ',
    time: 'الوقت',
    chooseDoctor: 'اختر الطبيب',
    patientName: 'اسم المريض',
    notes: 'ملاحظات اختيارية',
    confirmBooking: 'تأكيد حجز الموعد',
    confirmed: 'تم تأكيد الحجز',
    back: 'رجوع',
    noSlots: 'لا توجد مواعيد متاحة في هذا اليوم.',
    searching: 'جارٍ البحث...',
    loading: 'جارٍ التحميل...',
    rating: 'التقييم',
    reviews: 'التقييمات',
    rate: 'قيّم الموعد',
    stars: 'نجوم',
    comment: 'تعليق',
    submitReview: 'إرسال التقييم',
    reviewDone: 'شكرًا! تم تسجيل تقييمك.',
    reviewOnlyAfter: 'يمكن إضافة التقييم بعد إكمال الموعد.',
    completeAppointment: 'تحديد الموعد كمكتمل',
    uploadClinic: 'إضافة صورة للعيادة',
    uploadDoctor: 'إضافة صورة للطبيب',
    imageHint: 'JPG/PNG/WebP حتى 5MB',
    language: 'اللغة',
    overview: 'نظرة عامة',
    trial: 'يوم تجربة',
    noDoctors: 'لا يوجد أطباء حتى الآن',
    noPatients: 'لا يوجد مرضى حتى الآن',
    noAppointments: 'لا توجد مواعيد',
    management: 'إدارة عيادتك بسهولة',
    nearbyText:
      'ابحث حسب المسافة والتخصص والتقييم، ثم احجز مباشرة.',
    km: 'كم',
    open: 'مفتوحة الآن',
    noClinics: 'لا توجد عيادات مطابقة.',
    patientAccount: 'حساب المريض',
    myAppointments: 'مواعيدي',
    allBookings: 'كل حجوزاتك في مكان واحد',
    deletePatientAccount: 'حذف حساب المريض',
    deletePatientConfirm:
      'هل أنت متأكد من حذف حساب المريض؟ سيتم حذف بيانات تسجيل الدخول للحساب. قد تحتفظ العيادات بسجلات المواعيد التي يلزم الاحتفاظ بها قانونيًا.',
    accountDeleted: 'تم حذف حساب المريض.',
    subscription: 'الاشتراك',
    cancelScheduled: 'تم جدولة الإلغاء عند نهاية الفترة.',
    monthAppointments: 'هذا الشهر',
    revenue: 'الإيرادات المدفوعة (جنيه)',
    performance: 'الأداء',
    aiAssistant: 'مساعد إدارة العيادة بالذكاء الاصطناعي',
    aiAssistantHint:
      'للمساعدة التشغيلية فقط — ليس نصيحة طبية.',
    aiPlaceholder:
      'اسأل عن المواعيد أو التذكيرات أو توزيع العمل أو أداء العيادة…',
    askAI: 'اسأل الذكاء الاصطناعي',
    completed: 'مكتمل',
    cancelled: 'ملغى',
    noShow: 'لم يحضر',
    upcoming: 'قادم',
    remind: 'إرسال تذكير',
    reminderSent: 'تم إرسال التذكير.',
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
    clinicName: 'Clinic name',
    slug: 'Clinic slug',
    create: 'Create account',
    nearby: 'Find a nearby clinic',
    home: 'Home',
    doctors: 'Doctors',
    patients: 'Patients',
    appointments: 'Appointments',
    logout: 'Log out',
    delete: 'Delete account',
    location: 'Clinic location',
    useLocation: 'Use current clinic location',
    updateLocation: 'Update my location',
    removeLocation: 'Remove location',
    address: 'Address',
    privacy: 'Privacy',
    privacyText:
      'We use clinic and patient data to operate appointments and clinic management.',
    discover: 'Discover clinics',
    findNearest: 'Find the nearest clinic',
    distance: 'Distance',
    specialty: 'Specialty',
    allSpecialties: 'All specialties',
    openNow: 'Open now',
    onlineBooking: 'Online booking',
    book: 'Book appointment',
    directions: 'Get directions',
    googleMaps: 'Open in Google Maps',
    booking: 'Book appointment',
    doctor: 'Doctor',
    date: 'Date',
    time: 'Time',
    chooseDoctor: 'Choose a doctor',
    patientName: 'Patient name',
    notes: 'Optional notes',
    confirmBooking: 'Confirm appointment',
    confirmed: 'Appointment confirmed',
    back: 'Back',
    noSlots: 'No available appointments on this day.',
    searching: 'Searching...',
    loading: 'Loading...',
    rating: 'Rating',
    reviews: 'Reviews',
    rate: 'Rate appointment',
    stars: 'stars',
    comment: 'Comment',
    submitReview: 'Submit review',
    reviewDone: 'Thank you! Your review was submitted.',
    reviewOnlyAfter:
      'You can review after the appointment is completed.',
    completeAppointment: 'Mark appointment completed',
    uploadClinic: 'Add clinic photo',
    uploadDoctor: 'Add doctor photo',
    imageHint: 'JPG/PNG/WebP up to 5MB',
    language: 'Language',
    overview: 'Overview',
    trial: 'Trial days',
    noDoctors: 'No doctors yet',
    noPatients: 'No patients yet',
    noAppointments: 'No appointments',
    management: 'Manage your clinic with ease',
    nearbyText:
      'Search by distance, specialty and rating, then book directly.',
    km: 'km',
    open: 'Open now',
    noClinics: 'No matching clinics.',
    patientAccount: 'Patient account',
    myAppointments: 'My appointments',
    allBookings: 'All your bookings in one place',
    deletePatientAccount: 'Delete patient account',
    deletePatientConfirm:
      'Are you sure you want to delete your patient account? Your account login data will be deleted. Clinics may retain appointment records when legally required.',
    accountDeleted: 'Patient account deleted.',
    subscription: 'Subscription',
    cancelScheduled: 'Cancellation scheduled at period end.',
    monthAppointments: 'This month',
    revenue: 'Paid revenue (EGP)',
    performance: 'Performance',
    aiAssistant: 'AI clinic operations assistant',
    aiAssistantHint:
      'Operational help only — not medical advice.',
    aiPlaceholder:
      'Ask about scheduling, reminders, staffing, or clinic performance…',
    askAI: 'Ask AI',
    completed: 'completed',
    cancelled: 'cancelled',
    noShow: 'no-show',
    upcoming: 'upcoming',
    remind: 'Send reminder',
    reminderSent: 'Reminder sent.',
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
    clinicName: 'Nom du cabinet',
    slug: 'Identifiant du cabinet',
    create: 'Créer le compte',
    nearby: 'Trouver un cabinet proche',
    home: 'Accueil',
    doctors: 'Médecins',
    patients: 'Patients',
    appointments: 'Rendez-vous',
    logout: 'Déconnexion',
    delete: 'Supprimer le compte',
    location: 'Emplacement du cabinet',
    useLocation: 'Utiliser ma position',
    updateLocation: 'Mettre à jour',
    removeLocation: 'Supprimer',
    address: 'Adresse',
    privacy: 'Confidentialité',
    privacyText:
      'Nous utilisons les données du cabinet et des patients pour gérer les rendez-vous.',
    discover: 'Découvrir les cabinets',
    findNearest: 'Trouver le cabinet le plus proche',
    distance: 'Distance',
    specialty: 'Spécialité',
    allSpecialties: 'Toutes les spécialités',
    openNow: 'Ouvert maintenant',
    onlineBooking: 'Réservation en ligne',
    book: 'Prendre rendez-vous',
    directions: 'Itinéraire',
    googleMaps: 'Ouvrir Google Maps',
    booking: 'Prendre rendez-vous',
    doctor: 'Médecin',
    date: 'Date',
    time: 'Heure',
    chooseDoctor: 'Choisir un médecin',
    patientName: 'Nom du patient',
    notes: 'Notes facultatives',
    confirmBooking: 'Confirmer le rendez-vous',
    confirmed: 'Rendez-vous confirmé',
    back: 'Retour',
    noSlots: 'Aucun créneau disponible.',
    searching: 'Recherche...',
    loading: 'Chargement...',
    rating: 'Note',
    reviews: 'Avis',
    rate: 'Évaluer',
    stars: 'étoiles',
    comment: 'Commentaire',
    submitReview: 'Envoyer',
    reviewDone: 'Merci ! Votre avis a été envoyé.',
    reviewOnlyAfter:
      'Vous pourrez évaluer après le rendez-vous.',
    completeAppointment: 'Marquer comme terminé',
    uploadClinic: 'Ajouter une photo du cabinet',
    uploadDoctor: 'Ajouter une photo du médecin',
    imageHint: 'JPG/PNG/WebP jusqu’à 5 Mo',
    language: 'Langue',
    overview: 'Aperçu',
    trial: 'Jours d’essai',
    noDoctors: 'Aucun médecin',
    noPatients: 'Aucun patient',
    noAppointments: 'Aucun rendez-vous',
    management: 'Gérez votre cabinet facilement',
    nearbyText:
      'Recherchez par distance, spécialité et note, puis réservez.',
    km: 'km',
    open: 'Ouvert',
    noClinics: 'Aucun cabinet correspondant.',
    patientAccount: 'Compte patient',
    myAppointments: 'Mes rendez-vous',
    allBookings: 'Tous vos rendez-vous au même endroit',
    deletePatientAccount: 'Supprimer le compte patient',
    deletePatientConfirm:
      'Supprimer votre compte patient ? Les données de connexion seront supprimées. Les cabinets peuvent conserver les dossiers de rendez-vous lorsque la loi l’exige.',
    accountDeleted: 'Compte patient supprimé.',
    subscription: 'Abonnement',
    cancelScheduled:
      'Annulation prévue à la fin de la période.',
    monthAppointments: 'Ce mois-ci',
    revenue: 'Revenus payés (EGP)',
    performance: 'Performance',
    aiAssistant: 'Assistant IA pour la gestion du cabinet',
    aiAssistantHint:
      'Aide opérationnelle uniquement — pas un avis médical.',
    aiPlaceholder:
      'Posez une question sur les rendez-vous, rappels, personnel ou performance…',
    askAI: 'Demander à l’IA',
    completed: 'terminé',
    cancelled: 'annulé',
    noShow: 'absent',
    upcoming: 'à venir',
    remind: 'Envoyer un rappel',
    reminderSent: 'Rappel envoyé.',
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
    clinicName: 'Nombre de la clínica',
    slug: 'Identificador de clínica',
    create: 'Crear cuenta',
    nearby: 'Buscar clínica cercana',
    home: 'Inicio',
    doctors: 'Médicos',
    patients: 'Pacientes',
    appointments: 'Citas',
    logout: 'Salir',
    delete: 'Eliminar cuenta',
    location: 'Ubicación de la clínica',
    useLocation: 'Usar ubicación actual',
    updateLocation: 'Actualizar',
    removeLocation: 'Eliminar',
    address: 'Dirección',
    privacy: 'Privacidad',
    privacyText:
      'Usamos los datos de la clínica y pacientes para gestionar las citas.',
    discover: 'Descubrir clínicas',
    findNearest: 'Encuentra la clínica más cercana',
    distance: 'Distancia',
    specialty: 'Especialidad',
    allSpecialties: 'Todas las especialidades',
    openNow: 'Abierta ahora',
    onlineBooking: 'Reserva online',
    book: 'Reservar cita',
    directions: 'Cómo llegar',
    googleMaps: 'Abrir Google Maps',
    booking: 'Reservar cita',
    doctor: 'Médico',
    date: 'Fecha',
    time: 'Hora',
    chooseDoctor: 'Elegir médico',
    patientName: 'Nombre del paciente',
    notes: 'Notas opcionales',
    confirmBooking: 'Confirmar cita',
    confirmed: 'Cita confirmada',
    back: 'Volver',
    noSlots: 'No hay citas disponibles.',
    searching: 'Buscando...',
    loading: 'Cargando...',
    rating: 'Valoración',
    reviews: 'Reseñas',
    rate: 'Valorar cita',
    stars: 'estrellas',
    comment: 'Comentario',
    submitReview: 'Enviar valoración',
    reviewDone: '¡Gracias! Tu valoración fue enviada.',
    reviewOnlyAfter:
      'Puedes valorar después de completar la cita.',
    completeAppointment: 'Marcar cita como completada',
    uploadClinic: 'Añadir foto de la clínica',
    uploadDoctor: 'Añadir foto del médico',
    imageHint: 'JPG/PNG/WebP hasta 5 MB',
    language: 'Idioma',
    overview: 'Resumen',
    trial: 'Días de prueba',
    noDoctors: 'Aún no hay médicos',
    noPatients: 'Aún no hay pacientes',
    noAppointments: 'No hay citas',
    management: 'Gestiona tu clínica fácilmente',
    nearbyText:
      'Busca por distancia, especialidad y valoración, y reserva directamente.',
    km: 'km',
    open: 'Abierta',
    noClinics: 'No hay clínicas coincidentes.',
    patientAccount: 'Cuenta del paciente',
    myAppointments: 'Mis citas',
    allBookings: 'Todas tus citas en un solo lugar',
    deletePatientAccount: 'Eliminar cuenta del paciente',
    deletePatientConfirm:
      '¿Seguro que quieres eliminar tu cuenta de paciente? Se eliminarán los datos de acceso. Las clínicas pueden conservar los registros de citas cuando la ley lo exija.',
    accountDeleted: 'Cuenta del paciente eliminada.',
    subscription: 'Suscripción',
    cancelScheduled:
      'Cancelación programada al final del período.',
    monthAppointments: 'Este mes',
    revenue: 'Ingresos pagados (EGP)',
    performance: 'Rendimiento',
    aiAssistant: 'Asistente de IA para operaciones de la clínica',
    aiAssistantHint:
      'Solo ayuda operativa — no es consejo médico.',
    aiPlaceholder:
      'Pregunta sobre citas, recordatorios, personal o rendimiento…',
    askAI: 'Preguntar a la IA',
    completed: 'completada',
    cancelled: 'cancelada',
    noShow: 'no asistió',
    upcoming: 'próxima',
    remind: 'Enviar recordatorio',
    reminderSent: 'Recordatorio enviado.',
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
    clinicName: 'Klinikname',
    slug: 'Klinik-ID',
    create: 'Konto erstellen',
    nearby: 'Nahe Klinik finden',
    home: 'Start',
    doctors: 'Ärzte',
    patients: 'Patienten',
    appointments: 'Termine',
    logout: 'Abmelden',
    delete: 'Konto löschen',
    location: 'Klinikstandort',
    useLocation: 'Aktuellen Standort verwenden',
    updateLocation: 'Standort aktualisieren',
    removeLocation: 'Standort entfernen',
    address: 'Adresse',
    privacy: 'Datenschutz',
    privacyText:
      'Wir verwenden Klinik- und Patientendaten zur Terminverwaltung.',
    discover: 'Kliniken entdecken',
    findNearest: 'Nächste Klinik finden',
    distance: 'Entfernung',
    specialty: 'Fachgebiet',
    allSpecialties: 'Alle Fachgebiete',
    openNow: 'Jetzt geöffnet',
    onlineBooking: 'Online-Buchung',
    book: 'Termin buchen',
    directions: 'Route',
    googleMaps: 'In Google Maps öffnen',
    booking: 'Termin buchen',
    doctor: 'Arzt',
    date: 'Datum',
    time: 'Zeit',
    chooseDoctor: 'Arzt auswählen',
    patientName: 'Patientenname',
    notes: 'Optionale Notizen',
    confirmBooking: 'Termin bestätigen',
    confirmed: 'Termin bestätigt',
    back: 'Zurück',
    noSlots: 'Keine Termine verfügbar.',
    searching: 'Suche...',
    loading: 'Laden...',
    rating: 'Bewertung',
    reviews: 'Bewertungen',
    rate: 'Termin bewerten',
    stars: 'Sterne',
    comment: 'Kommentar',
    submitReview: 'Bewertung senden',
    reviewDone: 'Danke! Deine Bewertung wurde gesendet.',
    reviewOnlyAfter:
      'Bewertung nach abgeschlossenem Termin möglich.',
    completeAppointment:
      'Termin als abgeschlossen markieren',
    uploadClinic: 'Klinikfoto hinzufügen',
    uploadDoctor: 'Arztfoto hinzufügen',
    imageHint: 'JPG/PNG/WebP bis 5 MB',
    language: 'Sprache',
    overview: 'Übersicht',
    trial: 'Testtage',
    noDoctors: 'Noch keine Ärzte',
    noPatients: 'Noch keine Patienten',
    noAppointments: 'Keine Termine',
    management: 'Verwalten Sie Ihre Klinik einfach',
    nearbyText:
      'Nach Entfernung, Fachgebiet und Bewertung suchen und direkt buchen.',
    km: 'km',
    open: 'Geöffnet',
    noClinics: 'Keine passenden Kliniken.',
    patientAccount: 'Patientenkonto',
    myAppointments: 'Meine Termine',
    allBookings: 'Alle Ihre Termine an einem Ort',
    deletePatientAccount: 'Patientenkonto löschen',
    deletePatientConfirm:
      'Patientenkonto löschen? Ihre Anmeldedaten werden gelöscht. Kliniken können Termindaten aufbewahren, wenn dies gesetzlich erforderlich ist.',
    accountDeleted: 'Patientenkonto gelöscht.',
    subscription: 'Abonnement',
    cancelScheduled:
      'Kündigung zum Ende des Zeitraums geplant.',
    monthAppointments: 'Diesen Monat',
    revenue: 'Bezahlter Umsatz (EGP)',
    performance: 'Leistung',
    aiAssistant:
      'KI-Assistent für den Klinikbetrieb',
    aiAssistantHint:
      'Nur operative Hilfe — keine medizinische Beratung.',
    aiPlaceholder:
      'Frage zu Terminen, Erinnerungen, Personal oder Klinikleistung…',
    askAI: 'KI fragen',
    completed: 'abgeschlossen',
    cancelled: 'storniert',
    noShow: 'nicht erschienen',
    upcoming: 'bevorstehend',
    remind: 'Erinnerung senden',
    reminderSent: 'Erinnerung gesendet.',
  },
};

export function useI18n() {
  const [lang, setLangState] = useState(getInitialLanguage);

  useEffect(() => {
    const sync = () => {
      const next = localStorage.getItem('lang') || 'ar';

      setLangState(
        SUPPORTED.includes(next)
          ? next
          : 'ar'
      );
    };

    window.addEventListener(
      'ondoq-language',
      sync
    );

    return () => {
      window.removeEventListener(
        'ondoq-language',
        sync
      );
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir =
      lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = (next) => {
    if (!SUPPORTED.includes(next)) {
      return;
    }

    localStorage.setItem('lang', next);
    localStorage.setItem(
      'ondoq-language-mode',
      'manual'
    );

    setLangState(next);

    window.dispatchEvent(
      new Event('ondoq-language')
    );
  };

  const t = (key) => {
    return (
      D[lang]?.[key] ??
      D.en?.[key] ??
      key
    );
  };

  return {
    lang,
    setLang,
    t,
  };
}

export function LanguageSelect({
  lang,
  setLang,
}) {
  return (
    <select
      className="language-select"
      value={lang}
      onChange={(event) =>
        setLang(event.target.value)
      }
      aria-label="Language"
    >
      {LANGS.map(([code, label]) => (
        <option
          key={code}
          value={code}
        >
          {label}
        </option>
      ))}
    </select>
  );
}
