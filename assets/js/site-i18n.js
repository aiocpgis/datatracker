
(function () {
  'use strict';

  const STORAGE_KEY = 'site_lang';
  const currentLang = () => (localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ar');

  const I18N = {
    ar: {
      title: 'لوحة GIS غزة',
      navHome: 'محرر الخرائط',
      navStats: 'الإحصاء التحليلي',
      navFlow: 'عرض البيانات',
      navStyle: 'الإخراج الفني',
      navPersonas: 'مخرجات الحصر',
      navUsers: 'مركز التحكم',
      live: 'متصل بالخادم (Live)',
      homeHeading: 'محرر الخرائط التفاعلي',
      homeSubheading: 'تحرير ورسم مباشر على البيانات الجيومكانية',
      btnDrawMarker: 'علامة',
      btnDrawLine: 'مسار',
      btnDrawPoly: 'مضلع',
      btnDrawRect: 'مستطيل',
      btnDrawCircle: 'دائرة',
      btnCutMode: 'قص',
      btnDragMode: 'سحب',
      btnDeleteMode: 'حذف',
      processHeading: 'الإحصاء التحليلي',
      processSubheading: 'استيراد بيانات جيومكانية وتحليلها إحصائياً',
      flowHeading: 'عرض البيانات',
      flowSubheading: 'استعراض حي للزونات والبيانات الميدانية',
      usersHeading: 'إدارة المستخدمين',
      usersSubheading: 'التحكم في صلاحيات الوصول والحسابات النشطة',
      addUser: 'إضافة مستخدم جديد',
      usersTh1: 'الاسم',
      usersTh2: 'البريد الإلكتروني',
      usersTh3: 'الدور',
      usersTh4: 'المحافظة',
      usersTh5: 'الحالة',
      usersTh6: 'إجراءات',
      loginTitle: 'لوحة الحصر الميداني المتقدمة',
      loginSubtitle: 'نظام المعلومات الجغرافية المتكامل - غزة',
      loginUserLabel: 'البريد الإلكتروني أو اسم المستخدم',
      loginUserPlaceholder: 'مثال: ibrahim أو user@example.com',
      loginPassLabel: 'كلمة المرور',
      loginButton: 'تسجيل الدخول',
      loginError: 'خطأ في البريد الإلكتروني أو اسم المستخدم أو كلمة المرور',
      loginLoading: 'جاري التحقق...',
      loginDbError: 'خطأ في الاتصال بقاعدة البيانات',
      loginFooter: '© جميع الحقوق محفوظة لدى الهيئة العربية الدولية للإعمار في فلسطين'
    },
    en: {
      title: 'Gaza GIS Dashboard',
      navHome: 'Map Editor',
      navStats: 'Analytical Statistics',
      navFlow: 'Data View',
      navStyle: 'Cartographic Output',
      navPersonas: 'Survey Outputs',
      navUsers: 'Control Center',
      live: 'Connected to server (Live)',
      homeHeading: 'Interactive Map Editor',
      homeSubheading: 'Direct editing and drawing on geospatial data',
      btnDrawMarker: 'Marker',
      btnDrawLine: 'Line',
      btnDrawPoly: 'Polygon',
      btnDrawRect: 'Rectangle',
      btnDrawCircle: 'Circle',
      btnCutMode: 'Cut',
      btnDragMode: 'Drag',
      btnDeleteMode: 'Delete',
      processHeading: 'Analytical Statistics',
      processSubheading: 'Import geospatial data and analyze it statistically',
      flowHeading: 'Data View',
      flowSubheading: 'Live review of survey zones and field data',
      usersHeading: 'User Management',
      usersSubheading: 'Control access permissions and active accounts',
      addUser: 'Add New User',
      usersTh1: 'Name',
      usersTh2: 'Email',
      usersTh3: 'Role',
      usersTh4: 'Governorate',
      usersTh5: 'Status',
      usersTh6: 'Actions',
      loginTitle: 'Advanced Field Survey Dashboard',
      loginSubtitle: 'Integrated Geographic Information System - Gaza',
      loginUserLabel: 'Email or Username',
      loginUserPlaceholder: 'Example: ibrahim or user@example.com',
      loginPassLabel: 'Password',
      loginButton: 'Sign In',
      loginError: 'Incorrect email, username, or password',
      loginLoading: 'Verifying...',
      loginDbError: 'Database connection error',
      loginFooter: '© All rights reserved for the Arab International Reconstruction Organization in Palestine'
    }
  };

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function setHtml(selector, html) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
  }

  function applyIndex(lang) {
    const t = I18N[lang];
    document.title = t.title;
    setText('#nav-home', t.navHome);
    setText('#nav-stats', t.navStats);
    setText('#nav-flow', t.navFlow);
    setText('#navStyleLabel', t.navStyle);
    setText('#nav-personas', t.navPersonas);
    setText('#nav-users', t.navUsers);
    setText('#cloudSyncText', t.live);
    setHtml('#nav-home', '<i class="fa-solid fa-pen-to-square"></i> ' + t.navHome);
    setHtml('#nav-stats', '<i class="fa-solid fa-chart-bar"></i> ' + t.navStats);
    setHtml('#nav-flow', '<i class="fa-solid fa-map-location-dot"></i> ' + t.navFlow);
    setHtml('#nav-personas', '<i class="fa-solid fa-users"></i> ' + t.navPersonas);
    setHtml('#nav-users', '<i class="fa-solid fa-users-gear"></i> ' + t.navUsers);

    setText('#homePageHeading', t.homeHeading);
    setText('#homePageSubheading', t.homeSubheading);
    setHtml('#homePageHeading', '<i class="fa-solid fa-pen-to-square text-blue-500 ml-3"></i>' + t.homeHeading);
    setHtml('#btnDrawMarker', '<i class="fa-solid fa-location-dot"></i><span class="ribbon-btn-text text-gray-700">' + t.btnDrawMarker + '</span>');
    setHtml('#btnDrawLine', '<i class="fa-solid fa-route"></i><span class="ribbon-btn-text text-gray-700">' + t.btnDrawLine + '</span>');
    setHtml('#btnDrawPoly', '<i class="fa-solid fa-draw-polygon"></i><span class="ribbon-btn-text text-gray-700">' + t.btnDrawPoly + '</span>');
    setHtml('#btnDrawRect', '<i class="fa-solid fa-vector-square text-blue-500"></i> ' + t.btnDrawRect);
    setHtml('#btnDrawCircle', '<i class="fa-regular fa-circle text-blue-500"></i> ' + t.btnDrawCircle);
    setHtml('#btnCutMode', '<i class="fa-solid fa-scissors"></i><span class="ribbon-btn-text text-gray-700">' + t.btnCutMode + '</span>');
    setHtml('#btnDragMode', '<i class="fa-solid fa-arrows-up-down-left-right"></i><span class="ribbon-btn-text text-gray-700">' + t.btnDragMode + '</span>');
    if (document.querySelector('#btnDeleteMode')) setHtml('#btnDeleteMode', '<i class="fa-solid fa-eraser"></i><span class="ribbon-btn-text text-gray-700">' + t.btnDeleteMode + '</span>');

    setText('#processPageHeading', t.processHeading);
    setText('#processPageSubheading', t.processSubheading);
    setText('#flowPageHeading', t.flowHeading);
    setText('#flowPageSubheading', t.flowSubheading);
    setText('#usersPageHeading', t.usersHeading);
    setText('#usersPageSubheading', t.usersSubheading);
    setText('#addUserBtnLabel', t.addUser);

    const ths = document.querySelectorAll('#users thead th');
    if (ths.length >= 6) {
      [t.usersTh1, t.usersTh2, t.usersTh3, t.usersTh4, t.usersTh5, t.usersTh6].forEach((label, i) => ths[i].textContent = label);
    }
  }

  function applyLogin(lang) {
    const t = I18N[lang];
    document.title = t.title;
    setText('#loginTitle', t.loginTitle);
    setText('#loginSubtitle', t.loginSubtitle);
    setText('#loginUserLabel', t.loginUserLabel);
    const username = document.querySelector('#username');
    if (username) username.placeholder = t.loginUserPlaceholder;
    setText('#loginPassLabel', t.loginPassLabel);
    const submitSpan = document.querySelector('#submit-btn span');
    if (submitSpan) submitSpan.textContent = t.loginButton;
    const error = document.querySelector('#error-msg');
    if (error && !error.classList.contains('show')) error.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> ' + t.loginError;
    setText('.footer', t.loginFooter);
  }

  function applyLanguage(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.body.classList.toggle('lang-en', lang === 'en');
    document.body.classList.toggle('lang-ar', lang !== 'en');

    // تحديث نص زر التبديل الموحد
    const toggleText = document.getElementById('langToggleText');
    if (toggleText) {
      toggleText.textContent = lang === 'ar' ? 'English' : 'العربية';
    }

    if (document.getElementById('mainNav')) applyIndex(lang);
    if (document.getElementById('login-form')) applyLogin(lang);

    window.dispatchEvent(new CustomEvent('site-language-change', { detail: { lang } }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('globalLangToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const nextLang = currentLang() === 'ar' ? 'en' : 'ar';
        applyLanguage(nextLang);
      });
    }
    applyLanguage(currentLang());
  });

  window.addEventListener('site-language-change', (event) => {
    const lang = event?.detail?.lang === 'en' ? 'en' : 'ar';
    if (lang !== currentLang()) {
      applyLanguage(lang);
    } else {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    }
  });

  window.SiteLanguage = { applyLanguage, currentLang };
})();
