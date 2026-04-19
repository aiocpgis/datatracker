(function () {
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  window.currentUser = currentUser;



  function normalizeArabic(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[أإآا]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ');
  }

  const governorateAliasMap = new Map([
    ['الشمال', 'شمال غزة'],
    ['شمال غزة', 'شمال غزة'],
    ['north gaza', 'شمال غزة'],
    ['northgaza', 'شمال غزة'],
    ['gaza', 'غزة'],
    ['غزه', 'غزة'],
    ['غزة', 'غزة'],
    ['deir al-balah', 'الوسطى'],
    ['deiralbalah', 'الوسطى'],
    ['الوسطي', 'الوسطى'],
    ['الوسطى', 'الوسطى'],
    ['khan yunis', 'خانيونس'],
    ['khanyunis', 'خانيونس'],
    ['خان يونس', 'خانيونس'],
    ['خانيونس', 'خانيونس'],
    ['rafah', 'رفح'],
    ['رفح', 'رفح']
  ]);

  function canonicalGovernorateName(value) {
    const raw = String(value || '').trim();
    const normalized = normalizeArabic(raw);
    return governorateAliasMap.get(raw) || governorateAliasMap.get(normalized) || raw;
  }

  function getDisplayName(user) {
    return user?.name || user?.fullName || user?.username || user?.email || 'مستخدم';
  }

  function getAssignedGovernorateRaw() {
    const u = window.currentUser || currentUser;
    if (!u || u.role === 'admin') return 'all';
    return u.governorate || u.governorates || 'all';
  }

  function getAssignedGovernoratesList() {
    const assigned = getAssignedGovernorateRaw();
    if (!assigned || assigned === 'all') return [];
    if (Array.isArray(assigned)) {
      return assigned.map(canonicalGovernorateName).filter(Boolean);
    }
    return String(assigned)
      .split(/[,،]/)
      .map((item) => canonicalGovernorateName(item))
      .filter(Boolean);
  }

  function extractGovernorate(featureOrProps) {
    const props = featureOrProps && featureOrProps.properties ? featureOrProps.properties : (featureOrProps || {});
    const candidates = [
      props.Gov,
      props.gov,
      props.governorat,
      props.governorate,
      props.Governorate,
      props.Name_Gov,
      props.name,
      props['المحافظة'],
      props['محافظة']
    ];
    for (const candidate of candidates) {
      if (candidate !== undefined && candidate !== null && String(candidate).trim() !== '') {
        return canonicalGovernorateName(candidate);
      }
    }
    return '';
  }

  function isGovAllowed(governorateValue) {
    const assigned = getAssignedGovernorateRaw();
    if (!assigned || assigned === 'all') return true;
    const allowed = getAssignedGovernoratesList();
    return allowed.includes(canonicalGovernorateName(governorateValue));
  }

  function isFeatureAllowed(feature) {
    return isGovAllowed(extractGovernorate(feature));
  }

  function filterGeoJSONByUser(data) {
    const u = window.currentUser || currentUser;
    if (!data || !Array.isArray(data.features) || u.role === 'admin') return data;
    return {
      ...data,
      features: data.features.filter((feature) => isFeatureAllowed(feature))
    };
  }

  function hideElement(selector) {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
      el.classList.add('hidden');
    });
  }

  function showElement(selector) {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.display = '';
      el.removeAttribute('aria-hidden');
      el.classList.remove('hidden', 'display-none');
    });
  }

  function toggleElementVisibility(selector, shouldShow) {
    if (shouldShow) showElement(selector);
    else hideElement(selector);
  }

  function showWelcomeCard() {
    if (sessionStorage.getItem('welcomeShown')) return;

    const u = window.currentUser || currentUser;
    const avatarBg = u.gender === 'female' ? 'from-pink-500 to-pink-600' : 'from-blue-500 to-blue-600';
    const wrapper = document.createElement('div');
    wrapper.id = 'welcomeCard';
    wrapper.className = 'fixed top-6 right-6 md:right-10 z-[100000] glass-panel rounded-2xl shadow-2xl border border-white/70 p-4 min-w-[280px] max-w-[90vw] flex items-center gap-4 transition-all duration-700 transform translate-y-[-150%] opacity-0';
    wrapper.innerHTML = `
      <div class="w-12 h-12 rounded-full bg-gradient-to-br ${avatarBg} flex items-center justify-center text-white text-xl shadow-lg shrink-0">
        <i class="fa-solid fa-hand-sparkles"></i>
      </div>
      <div class="flex-1 text-right" dir="rtl">
        <div class="text-sm text-gray-500 font-bold mb-1">أهلاً بك في منظومة GIS</div>
        <div class="text-lg font-black text-gray-800">${getDisplayName(window.currentUser || currentUser)}</div>
      </div>
      <button id="closeWelcomeBtn" class="text-gray-400 hover:text-red-500 transition-colors self-start">
        <i class="fa-solid fa-xmark text-xl"></i>
      </button>
    `;
    document.body.appendChild(wrapper);

    // ظهور البطاقة بعد 3.8 ثوانٍ لتتزامن مع انتهاء شاشة التحميل الافتتاحية
    setTimeout(() => {
      wrapper.classList.remove('translate-y-[-150%]', 'opacity-0');
      wrapper.classList.add('translate-y-0', 'opacity-100');
    }, 3800); 

    const removeCard = () => {
      wrapper.classList.remove('translate-y-0', 'opacity-100');
      wrapper.classList.add('translate-y-[-150%]', 'opacity-0');
      setTimeout(() => wrapper.remove(), 500);
    };

    wrapper.querySelector('#closeWelcomeBtn').addEventListener('click', removeCard);
    // إخفاء البطاقة تلقائياً بعد 9 ثوانٍ
    setTimeout(() => { if (document.body.contains(wrapper)) removeCard(); }, 9000);

    sessionStorage.setItem('welcomeShown', 'true');
  }

  function ensureSessionCard() {
    let wrapper = document.getElementById('sessionAccessCard');
    const u = window.currentUser || currentUser;
    const assigned = getAssignedGovernorateRaw();
    const govText = u.role === 'admin'
      ? 'كل المحافظات'
      : (Array.isArray(assigned) ? assigned.join('، ') : assigned || 'غير محدد');

    const isFemale = u.gender === 'female';
    const iconBg = isFemale ? 'bg-pink-500/10 text-pink-600' : 'bg-blue-500/10 text-blue-600';
    const cardBg = isFemale ? 'bg-pink-100/40 border-pink-200/50' : 'bg-white/40 border-white/70';

    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'sessionAccessCard';
      document.body.appendChild(wrapper);
    }

    wrapper.className = `fixed bottom-4 left-4 z-[9999] glass-panel rounded-2xl shadow-xl border p-3 min-w-[240px] max-w-[90vw] transition-all duration-500 ${cardBg}`;
    wrapper.innerHTML = `
      <div class="flex items-start gap-3" dir="rtl">
        <div class="w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 transition-colors">
          <i class="fa-solid fa-user-shield"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-extrabold text-gray-800 truncate">${getDisplayName(u)}</div>
          <div class="text-xs text-gray-500 mt-1">${u.role === 'admin' ? 'مسؤول النظام' : 'عرض حسب الصلاحية'}</div>
          <div class="text-xs text-gray-600 mt-1 break-words">المحافظة: ${govText}</div>
        </div>
      </div>
      <button id="logoutBtnFloating" class="mt-3 w-full bg-white/70 hover:bg-white text-red-600 font-bold py-2 rounded-xl transition-all">تسجيل الخروج</button>
    `;
    wrapper.querySelector('#logoutBtnFloating')?.addEventListener('click', window.logout);
  }

  function applyGovernorateSelectorLock(selector) {
    const u = window.currentUser || currentUser;
    if (!selector || u.role === 'admin') return;
    const assignedList = getAssignedGovernoratesList();
    if (!assignedList.length) return;

    selector.innerHTML = '';
    if (assignedList.length > 1) {
      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.textContent = 'كل المحافظات المسموح بها';
      selector.appendChild(allOption);
    }

    assignedList.forEach((gov) => {
      const option = document.createElement('option');
      option.value = gov;
      option.textContent = gov;
      selector.appendChild(option);
    });

    selector.value = assignedList.length === 1 ? assignedList[0] : 'all';
    selector.disabled = true;
    selector.classList.add('opacity-70', 'cursor-not-allowed');
  }

  function setNavVisibility(id, shouldShow) {
    const el = document.getElementById(id);
    if (!el) return;
    if (shouldShow) {
      el.classList.remove('hidden', 'display-none');
      el.style.display = '';
      el.removeAttribute('aria-hidden');
    } else {
      el.style.display = 'none';
      el.classList.add('hidden');
      el.setAttribute('aria-hidden', 'true');
    }
  }

  function isObserverRole() {
    const u = window.currentUser || currentUser;
    const roleValue = normalizeArabic(u?.role || '');
    return ['مراقب', 'observer', 'viewer', 'monitor', 'read only', 'readonly'].includes(roleValue);
  }

  function applyObserverDisplayMode() {
    // تم تعطيل الإخفاء الإجباري بناءً على الدور (مراقب) لكي لا يتعارض مع الصلاحيات المخصصة التي يمنحها المسؤول.
    // الصلاحيات الآن تعتمد حصرياً على ما يتم تحديده في لوحة تحكم المستخدمين.
    /*
    if (!isObserverRole()) return;
    hideElement('#nav-home');
    hideElement('#nav-users');
    hideElement('#toggleEditBtn, #toggleAdminBtn, #toggleExportBtn');
    hideElement('#editPanel, #adminPanel, #exportPanel');
    const attrPanel = document.getElementById('attributesPanel');
    if (attrPanel) attrPanel.classList.add('hidden-panel');
    */
  }

  function applyUIPermissions() {
    if (!window.currentUser) return;

    const u = window.currentUser;
    const isAdmin = u.role === 'admin';
    const permissionValue = (key, defaultValue = true) => {
      if (isAdmin) return true;
      return u[key] === undefined ? defaultValue : u[key] !== false;
    };

    const navMapping = [
      { id: 'nav-home', perm: 'showHome', defaultValue: true },
      { id: 'nav-stats', perm: 'showStats', defaultValue: true },
      { id: 'nav-flow', perm: 'showFlow', defaultValue: true },
      { id: 'nav-style', perm: 'showStyle', defaultValue: true },
      { id: 'nav-personas', perm: 'showPersonas', defaultValue: true },
      { id: 'nav-users', perm: 'canManageUsers', defaultValue: false }
    ];

    navMapping.forEach((item) => {
      setNavVisibility(item.id, permissionValue(item.perm, item.defaultValue));
    });

    // Hide Map Editor tab for restricted users if they have NO map-related permissions at all
    const canSeeMap = isAdmin || permissionValue('canDraw', false) || permissionValue('canEditGeometry', false) || permissionValue('canEditData', false) || permissionValue('canEditStatus', false);
    if (!canSeeMap) {
        setNavVisibility('nav-home', false);
    }

    const mapToolsMapping = [
      {
        selector: '#btnDrawMarker, #btnDrawLine, #btnDrawPoly, #btnDrawRect, #btnDrawCircle, #btnAddCustomMap',
        perm: 'canDraw'
      },
      {
        selector: '#btnCutMode, #btnDragMode',
        perm: 'canEditGeometry'
      },
      {
        selector: '#btnDeleteMode',
        perm: 'canDeleteGeometry'
      }
    ];

    mapToolsMapping.forEach((item) => {
      toggleElementVisibility(item.selector, permissionValue(item.perm, false));
    });

    const canDraw = permissionValue('canDraw', false);
    const canEditGeometry = permissionValue('canEditGeometry', false);
    const canDeleteGeometry = permissionValue('canDeleteGeometry', false);

    const canEditAny = canDraw || canEditGeometry || canDeleteGeometry;
    toggleElementVisibility('#toggleEditBtn', canEditAny);
    toggleElementVisibility('#editPanel', canEditAny);

    const canManage = permissionValue('canManageUsers', false);
    toggleElementVisibility('#toggleAdminBtn', canManage);
    toggleElementVisibility('#adminPanel', canManage);

    const canExport = permissionValue('canExport', false);
    toggleElementVisibility('#toggleExportBtn', canExport);
    toggleElementVisibility('#exportPanel', canExport);
    toggleElementVisibility('#btnExportPDF', canExport);
    toggleElementVisibility('#btnExportExcel', canExport);

    const canEditData = permissionValue('canEditData', false);
    const canEditStatus = permissionValue('canEditStatus', false);

    const anyAttrEdit = canEditData || canEditStatus;
    toggleElementVisibility('#attributesPanel', anyAttrEdit);
    toggleElementVisibility('#mapEditHint', anyAttrEdit);
    
    if (anyAttrEdit) {
      const panel = document.getElementById('attributesPanel');
      if (panel) {
        const inputs = panel.querySelectorAll('input');
        inputs.forEach((input) => {
          if (!canEditData) {
            input.disabled = true;
            input.classList.add('opacity-50', 'cursor-not-allowed');
          } else {
            input.disabled = false;
            input.classList.remove('opacity-50', 'cursor-not-allowed');
          }
        });

        const statusSelect = panel.querySelector('select');
        if (statusSelect) {
          if (!canEditStatus) {
            statusSelect.disabled = true;
            statusSelect.classList.add('opacity-50', 'cursor-not-allowed');
          } else {
            statusSelect.disabled = false;
            statusSelect.classList.remove('opacity-50', 'cursor-not-allowed');
          }
        }

        const saveBtn = panel.querySelector('#saveAttributesBtn');
        if (saveBtn && !canEditData && !canEditStatus) {
          saveBtn.style.display = 'none';
        }
      }
    }

    /* Removed individual PDF/Excel hide as handled above */

    applyObserverDisplayMode();

    const statsCompareBy = document.getElementById('statsCompareBy');
    if (statsCompareBy) applyGovernorateSelectorLock(statsCompareBy);

    showWelcomeCard();
    ensureSessionCard();

    // Apply gender theme to body
    if (u.gender === 'female') {
      document.body.classList.add('theme-female');
    } else {
      document.body.classList.remove('theme-female');
    }
  }

  window.logout = async function logout() {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('welcomeShown');
    if (window.signOutUser) {
      await window.signOutUser();
    }
    window.location.href = 'login.html';
  };

  window.canEditCurrentUser = function () {
    const u = window.currentUser || currentUser;
    return u && (u.role === 'admin' || u.canManageUsers === true || u.canEditData === true || u.canEditStatus === true);
  };
  window.getAssignedGovernorate = function () {
    return getAssignedGovernorateRaw();
  };
  window.getAssignedGovernoratesList = function () {
    return getAssignedGovernoratesList();
  };
  window.normalizeGovernorateName = canonicalGovernorateName;
  window.extractFeatureGovernorate = extractGovernorate;
  window.isGovAllowed = isGovAllowed;
  window.isFeatureAllowed = isFeatureAllowed;
  window.filterGeoJSONByUser = filterGeoJSONByUser;
  window.applyGovernorateSelectorLock = applyGovernorateSelectorLock;
  window.isAdmin = function() {
    return window.currentUser && window.currentUser.role === 'admin';
  };
  window.applyUIPermissions = applyUIPermissions;

  document.addEventListener('DOMContentLoaded', () => {
    applyUIPermissions();
  });
})();
