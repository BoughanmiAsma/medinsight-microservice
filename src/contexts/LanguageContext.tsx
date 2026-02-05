import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'en' | 'ar';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'osmos-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return (stored as Language) || 'fr';
    });

    const direction = language === 'ar' ? 'rtl' : 'ltr';

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, language);
        document.documentElement.setAttribute('lang', language);
        document.documentElement.setAttribute('dir', direction);
    }, [language, direction]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    // Simple translation function
    const t = (key: string): string => {
        return translations[language]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, direction }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
    fr: {
        // Navigation
        'nav.dashboard': 'Tableau de bord',
        'nav.staff': 'Personnel',
        'nav.patients': 'Dossiers Patients',
        'nav.appointments': 'Rendez-vous',
        'nav.lab': 'Laboratoire',
        'nav.prescriptions': 'Ordonnances',

        // Settings
        'settings.title': 'Réglages MedInsight',
        'settings.appearance': 'Apparence',
        'settings.language': 'Langue',
        'settings.experience': 'Expérience',
        'settings.accessibility': 'Accessibilité',
        'settings.preferences': 'Préférences',

        // Common
        'common.logout': 'Déconnexion',
        'common.settings': 'Paramètres',
        'common.search': 'Rechercher',
        'common.filter': 'Filtrer',
        'common.save': 'Enregistrer',
        'common.cancel': 'Annuler',
        'common.delete': 'Supprimer',
        'common.edit': 'Modifier',
        'common.add': 'Ajouter',
        'common.back': 'Retour',
        'common.actions': 'Actions',
        'common.status': 'Statut',
        'common.date': 'Date',
        'common.details': 'Détails',
        'common.loading': 'Chargement...',
        'common.no_results': 'Aucun résultat trouvé',
        'common.error': 'Une erreur est survenue',
        'common.success': 'Opération réussie',
        'common.actions.quick': 'Actions Rapides',
        'common.actions.generate_report': 'Générer Rapport',
        'common.actions.refresh': 'Actualiser',
        'common.no_data': 'Pas de données disponibles',
        'common.unknown': 'Inconnu',
        'common.male_gender': 'Homme',
        'common.female_gender': 'Femme',
        'common.email_none': 'Pas d\'email',
        'common.phone_none': 'Pas de téléphone',
        'common.not_found': 'Dossier introuvable',
        'common.success.consultation': 'Consultation enregistrée',
        'common.success.lab_order': 'Demande d’analyse envoyée',
        'common.success.prescription': 'Ordonnance envoyée',
        'common.success.status_updated': 'Statut mis à jour',
        'common.refresh_info': 'Données actualisées',
        'common.preparing_report': 'Préparation du rapport...',
        'common.result_available': 'Le résultat est disponible.',
        'common.view_analysis_report': 'Voir le rapport d\'analyse',
        'common.lab_processing': 'Analyse en cours de traitement par le laboratoire...',
        'common.no_consultation': 'Aucune consultation enregistrée',
        'common.no_lab_results': 'Aucun résultat d\'analyse disponible',
        'common.no_prescriptions': 'Aucune ordonnance disponible',
        'common.medication_details_none': 'Détails non disponibles',
        'common.emitted_on': 'Émise le',
        'common.diagnosis': 'Diagnostic',
        'common.notes': 'Notes',
        'common.reason': 'Motif',
        'common.doctor': 'Dr.',
        'common.back_to_records': 'Retour aux dossiers',
        'common.id_patient': 'ID Patient',
        'common.id_request': 'ID Demande',
        'common.weight_kg': 'kg',
        'common.years_old': 'ans',
        'common.lab.write_analysis': 'Écrire Analyse',
        'common.lab.request_analysis': 'Demander Analyse',
        'common.email': 'Email',

        // Patient Dossier
        'patient.new_dossier': 'Nouveau Dossier',
        'patient.tabs.consultations': 'Consultations',
        'patient.tabs.analyses': 'Analyses',
        'patient.tabs.prescriptions': 'Ordonnances',
        'patient.tabs.medical_history': 'Antécédents',
        'patient.info.vital_signs': 'Infos Vitales',
        'patient.info.contact': 'Contact',
        'patient.info.weight': 'Poids',
        'patient.info.age': 'Âge',
        'patient.info.blood_group': 'Groupe Sanguin',
        'patient.info.sex': 'Sexe',
        'patient.actions.new_consultation': 'Nouvelle Consultation',
        'patient.actions.request_analysis': 'Demander Analyse',
        'patient.actions.new_prescription': 'Nouvelle Ordonnance',
        'patient.actions.back_to_list': 'Retour aux dossiers',

        // Lab
        'lab.status.pending': 'En attente',
        'lab.status.completed': 'Terminé',
        'lab.actions.upload': 'Téléverser',
        'lab.actions.view_report': 'Voir le rapport',
        'lab.request_date': 'Date de demande',

        // Prescription
        'prescription.status.created': 'Créée',
        'prescription.status.dispensed': 'Délivrée',
        'prescription.actions.mark_dispensed': 'Marquer comme délivrée',
        'prescription.medications_purchased': 'Médicaments achetés',

        // Staff
        'staff.add_member': 'Ajouter Personnel',
        'staff.role': 'Rôle',
        'staff.specialty': 'Spécialité',
        'staff.license': 'N° Licence',

        // Theme
        'theme.light': 'Claire',
        'theme.dark': 'Sombre',
        'theme.system': 'Système',
        'theme.auto': 'Auto-Garde',

        'patient.form.first_name': 'Prénom',
        'patient.form.last_name': 'Nom',
        'patient.form.email': 'Email',
        'patient.form.phone': 'Téléphone',
        'patient.form.sex': 'Sexe',
        'patient.form.birth_date': 'Date de Naissance',
        'patient.form.weight': 'Poids (kg)',
        'patient.form.blood_group': 'Groupe Sanguin',
        'patient.form.male': 'Masculin',
        'patient.form.female': 'Féminin',
        'patient.form.save': 'Enregistrer',
        'patient.form.description': 'Créez un nouveau dossier médical pour un patient.',
        'patient.list.title': 'Dossiers Patients',
        'patient.list.count': 'patients dans la base de données',
        'patient.list.search_placeholder': 'Rechercher par nom, email ou téléphone...',
        'patient.table.patient': 'Patient',
        'patient.table.age_sex': 'Âge / Sexe',
        'patient.table.weight': 'Poids',
        'patient.table.contact': 'Contact',
        'patient.table.blood_group': 'Groupe Sanguin',
        'patient.table.last_update': 'Dernière Mise à Jour',
        'patient.years': 'ans',
    },

    en: {
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.staff': 'Staff',
        'nav.patients': 'Patient Records',
        'nav.appointments': 'Appointments',
        'nav.lab': 'Laboratory',
        'nav.prescriptions': 'Prescriptions',

        // Settings
        'settings.title': 'MedInsight Settings',
        'settings.appearance': 'Appearance',
        'settings.language': 'Language',
        'settings.experience': 'Experience',
        'settings.accessibility': 'Accessibility',
        'settings.preferences': 'Preferences',

        // Common
        'common.logout': 'Logout',
        'common.settings': 'Settings',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.add': 'Add',
        'common.back': 'Back',
        'common.actions': 'Actions',
        'common.status': 'Status',
        'common.date': 'Date',
        'common.details': 'Details',
        'common.loading': 'Loading...',
        'common.no_results': 'No results found',
        'common.error': 'An error occurred',
        'common.success': 'Operation successful',
        'common.actions.quick': 'Quick Actions',
        'common.actions.generate_report': 'Generate Report',
        'common.actions.refresh': 'Refresh',
        'common.no_data': 'No data available',
        'common.unknown': 'Unknown',
        'common.male_gender': 'Male',
        'common.female_gender': 'Female',
        'common.email_none': 'No email',
        'common.phone_none': 'No telephone',
        'common.not_found': 'Record not found',
        'common.success.consultation': 'Consultation recorded',
        'common.success.lab_order': 'Lab order sent',
        'common.success.prescription': 'Prescription sent',
        'common.success.status_updated': 'Status updated',
        'common.refresh_info': 'Data refreshed',
        'common.preparing_report': 'Preparing report...',
        'common.result_available': 'The result is available.',
        'common.view_analysis_report': 'View analysis report',
        'common.lab_processing': 'Analysis currently being processed by the lab...',
        'common.no_consultation': 'No consultations recorded',
        'common.no_lab_results': 'No lab results available',
        'common.no_prescriptions': 'No prescriptions available',
        'common.medication_details_none': 'Details not available',
        'common.emitted_on': 'Emitted on',
        'common.diagnosis': 'Diagnosis',
        'common.notes': 'Notes',
        'common.reason': 'Reason',
        'common.doctor': 'Dr.',
        'common.back_to_records': 'Back to records',
        'common.id_patient': 'Patient ID',
        'common.id_request': 'Request ID',
        'common.weight_kg': 'kg',
        'common.years_old': 'yrs old',
        'common.lab.write_analysis': 'Write Analysis',
        'common.lab.request_analysis': 'Request Analysis',
        'common.email': 'Email',

        // Patient Dossier
        'patient.new_dossier': 'New Record',
        'patient.tabs.consultations': 'Consultations',
        'patient.tabs.analyses': 'Lab Results',
        'patient.tabs.prescriptions': 'Prescriptions',
        'patient.tabs.medical_history': 'Medical History',
        'patient.info.vital_signs': 'Vital Signs',
        'patient.info.contact': 'Contact',
        'patient.info.weight': 'Weight',
        'patient.info.age': 'Age',
        'patient.info.blood_group': 'Blood Group',
        'patient.info.sex': 'Sex',
        'patient.actions.new_consultation': 'New Consultation',
        'patient.actions.request_analysis': 'Order Lab Test',
        'patient.actions.new_prescription': 'New Prescription',
        'patient.actions.back_to_list': 'Back to records',

        // Lab
        'lab.status.pending': 'Pending',
        'lab.status.completed': 'Completed',
        'lab.actions.upload': 'Upload',
        'lab.actions.view_report': 'View Report',
        'lab.request_date': 'Request Date',

        // Prescription
        'prescription.status.created': 'Created',
        'prescription.status.dispensed': 'Dispensed',
        'prescription.actions.mark_dispensed': 'Mark as Dispensed',
        'prescription.medications_purchased': 'Medications purchased',

        // Staff
        'staff.add_member': 'Add Staff',
        'staff.role': 'Role',
        'staff.specialty': 'Specialty',
        'staff.license': 'License No',

        // Theme
        'theme.light': 'Light',
        'theme.dark': 'Dark',
        'theme.system': 'System',
        'theme.auto': 'Auto-Night',

        'patient.form.first_name': 'First Name',
        'patient.form.last_name': 'Last Name',
        'patient.form.email': 'Email',
        'patient.form.phone': 'Phone',
        'patient.form.sex': 'Sex',
        'patient.form.birth_date': 'Birth Date',
        'patient.form.weight': 'Weight (kg)',
        'patient.form.blood_group': 'Blood Group',
        'patient.form.male': 'Male',
        'patient.form.female': 'Female',
        'patient.form.save': 'Save',
        'patient.form.description': 'Create a new medical record for a patient.',
        'patient.list.title': 'Patient Records',
        'patient.list.count': 'patients in the database',
        'patient.list.search_placeholder': 'Search by name, email or phone...',
        'patient.table.patient': 'Patient',
        'patient.table.age_sex': 'Age / Sex',
        'patient.table.weight': 'Weight',
        'patient.table.contact': 'Contact',
        'patient.table.blood_group': 'Blood Group',
        'patient.table.last_update': 'Last Update',
        'patient.years': 'yrs',
    },

    ar: {
        // Navigation
        'nav.dashboard': 'لوحة التحكم',
        'nav.staff': 'الموظفون',
        'nav.patients': 'ملفات المرضى',
        'nav.appointments': 'المواعيد',
        'nav.lab': 'المختبر',
        'nav.prescriptions': 'الوصفات الطبية',

        // Settings
        'settings.title': 'إعدادات MedInsight',
        'settings.appearance': 'المظهر',
        'settings.language': 'اللغة',
        'settings.experience': 'التجربة',
        'settings.accessibility': 'إمكانية الوصول',
        'settings.preferences': 'التفضيلات',

        // Common
        'common.logout': 'تسجيل الخروج',
        'common.settings': 'الإعدادات',
        'common.search': 'بحث',
        'common.filter': 'تصفية',
        'common.save': 'حفظ',
        'common.cancel': 'إلغاء',
        'common.delete': 'حذف',
        'common.edit': 'تعديل',
        'common.add': 'إضافة',
        'common.back': 'عودة',
        'common.actions': 'إجراءات',
        'common.status': 'الحالة',
        'common.date': 'التاريخ',
        'common.details': 'التفاصيل',
        'common.loading': 'جاري التحميل...',
        'common.no_results': 'لم يتم العثور على نتائج',
        'common.error': 'حدث خطأ ما',
        'common.success': 'تمت العملية بنجاح',
        'common.actions.quick': 'إجراءات سريعة',
        'common.actions.generate_report': 'توليد تقرير',
        'common.actions.refresh': 'تحديث',
        'common.no_data': 'لا توجد بيانات',
        'common.unknown': 'غير معروف',
        'common.male_gender': 'ذكر',
        'common.female_gender': 'أنثى',
        'common.email_none': 'لا يوجد بريد',
        'common.phone_none': 'لا يوجد هاتف',
        'common.not_found': 'الملف غير موجود',
        'common.success.consultation': 'تم تسجيل الاستشارة',
        'common.success.lab_order': 'تم إرسال طلب التحليل',
        'common.success.prescription': 'تم إرسال الوصفة للطبية',
        'common.success.status_updated': 'تم تحديث الحالة',
        'common.refresh_info': 'تم تحديث البيانات',
        'common.preparing_report': 'جاري تحضير التقرير...',
        'common.result_available': 'النتيجة متاحة.',
        'common.view_analysis_report': 'عرض تقرير التحليل',
        'common.lab_processing': 'التحليل قيد المعالجة من قبل المختبر...',
        'common.no_consultation': 'لا توجد استشارات مسجلة',
        'common.no_lab_results': 'لا توجد نتائج تحاليل متاحة',
        'common.no_prescriptions': 'لا توجد وصفات طبية متاحة',
        'common.medication_details_none': 'التفاصيل غير متاحة',
        'common.emitted_on': 'صدرت في',
        'common.diagnosis': 'التشخيص',
        'common.notes': 'ملاحظات',
        'common.reason': 'السبب',
        'common.doctor': 'د.',
        'common.back_to_records': 'العودة للملفات',
        'common.id_patient': 'معرف المريض',
        'common.id_request': 'معرف الطلب',
        'common.weight_kg': 'كغ',
        'common.years_old': 'سنة',
        'common.lab.write_analysis': 'كتابة التحليل',
        'common.lab.request_analysis': 'طلب تحليل',
        'common.email': 'البريد الإلكتروني',

        // Patient Dossier
        'patient.new_dossier': 'ملف جديد',
        'patient.tabs.consultations': 'الاستشارات',
        'patient.tabs.analyses': 'التحاليل',
        'patient.tabs.prescriptions': 'الوصفات الطبية',
        'patient.tabs.medical_history': 'السوابق الطبية',
        'patient.info.vital_signs': 'المؤشرات الحيوية',
        'patient.info.contact': 'الاتصال',
        'patient.info.weight': 'الوزن',
        'patient.info.age': 'العمر',
        'patient.info.blood_group': 'فصيلة الدم',
        'patient.info.sex': 'الجنس',
        'patient.actions.new_consultation': 'استشارة جديدة',
        'patient.actions.request_analysis': 'طلب تحليل',
        'patient.actions.new_prescription': 'وصفة طبية جديدة',
        'patient.actions.back_to_list': 'العودة للملفات',

        // Lab
        'lab.status.pending': 'قيد الانتظار',
        'lab.status.completed': 'مكتمل',
        'lab.actions.upload': 'رفع',
        'lab.actions.view_report': 'عرض التقرير',
        'lab.request_date': 'تاريخ الطلب',

        // Prescription
        'prescription.status.created': 'أنشئت',
        'prescription.status.dispensed': 'صرفت',
        'prescription.actions.mark_dispensed': 'تعليم كمسلمة',
        'prescription.medications_purchased': 'الأدوية المشتراة',

        // Staff
        'staff.add_member': 'إضافة موظف',
        'staff.role': 'الدور',
        'staff.specialty': 'التخصص',
        'staff.license': 'رقم الرخصة',

        // Theme
        'theme.light': 'فاتح',
        'theme.dark': 'داكن',
        'theme.system': 'النظام',
        'theme.auto': 'تلقائي',

        'medical.mode': 'وضع الليل الطبي',
        'medical.mode.desc': 'يقلل من إجهاد العين أثناء النوبات الليلية',
        'patient.form.first_name': 'الاسم الأول',
        'patient.form.last_name': 'الاسم العائلي',
        'patient.form.email': 'البريد الإلكتروني',
        'patient.form.phone': 'الهاتف',
        'patient.form.sex': 'الجنس',
        'patient.form.birth_date': 'تاريخ الميلاد',
        'patient.form.weight': 'الوزن (كغ)',
        'patient.form.blood_group': 'فصيلة الدم',
        'patient.form.male': 'ذكر',
        'patient.form.female': 'أنثى',
        'patient.form.save': 'حفظ',
        'patient.form.description': 'إنشاء ملف طبي جديد لمريض.',
        'patient.list.title': 'ملفات المرضى',
        'patient.list.count': 'مرضى في قاعدة البيانات',
        'patient.list.search_placeholder': 'البحث بالاسم أو البريد أو الهاتف...',
        'patient.table.patient': 'المريض',
        'patient.table.age_sex': 'العمر / الجنس',
        'patient.table.weight': 'الوزن',
        'patient.table.contact': 'الاتصال',
        'patient.table.blood_group': 'فصيلة الدم',
        'patient.table.last_update': 'آخر تحديث',
        'patient.years': 'سنوات',
    },
};
