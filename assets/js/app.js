let chartsInitialized = false; 

        // دالة عرض التنبيهات (Toasts)
        function showToast(message, type = 'blue') {
            const container = document.getElementById('toast-container');
            if(!container) return;

            const toast = document.createElement('div');
            toast.className = `animate__animated animate__fadeInUp bg-white/90 backdrop-blur-md border-r-4 ${type === 'red' ? 'border-red-500' : 'border-emerald-500'} p-4 rounded-xl shadow-xl flex items-center gap-3 min-w-[250px] z-[20000]`;
            toast.innerHTML = `
                <div class="w-8 h-8 rounded-full ${type === 'red' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center shrink-0">
                    <i class="fa-solid ${type === 'red' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i>
                </div>
                <div class="flex-1 text-sm font-bold text-gray-800">${message}</div>
            `;
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.replace('animate__fadeInUp', 'animate__fadeOutDown');
                setTimeout(() => toast.remove(), 500);
            }, 4000);
        }
        window.showToast = showToast;

        // دالة نافذة التأكيد المخصصة (Custom Confirm Modal)
        function showCustomConfirm(title, message, onConfirm) {
            let modal = document.getElementById('customConfirmModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'customConfirmModal';
                modal.className = 'fixed inset-0 z-[999999] hidden flex items-center justify-center p-4';
                modal.innerHTML = `
                    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" id="closeConfirmModalBg"></div>
                    <div class="bg-white/95 backdrop-blur-2xl w-full max-w-sm flex flex-col rounded-3xl shadow-2xl relative z-10 overflow-hidden border border-white/40 animate__animated animate__zoomIn animate__faster">
                        <div class="p-6 text-center">
                            <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-blue-100">
                                <i class="fa-solid fa-cloud-arrow-up"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800 mb-2" id="confirmModalTitle"></h3>
                            <p class="text-gray-500 font-medium text-sm mb-6" id="confirmModalMessage"></p>
                            <div class="flex gap-3">
                                <button id="confirmModalYesBtn" class="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md">نعم، احفظ</button>
                                <button id="confirmModalNoBtn" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition-all border border-gray-200 shadow-sm">إلغاء</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }

            document.getElementById('confirmModalTitle').innerText = title;
            document.getElementById('confirmModalMessage').innerText = message;

            const yesBtn = document.getElementById('confirmModalYesBtn');
            const noBtn = document.getElementById('confirmModalNoBtn');
            const bg = document.getElementById('closeConfirmModalBg');

            const newYesBtn = yesBtn.cloneNode(true);
            const newNoBtn = noBtn.cloneNode(true);
            const newBg = bg.cloneNode(true);
            yesBtn.replaceWith(newYesBtn);
            noBtn.replaceWith(newNoBtn);
            bg.replaceWith(newBg);

            const closeModal = () => modal.classList.add('hidden');

            newYesBtn.addEventListener('click', () => {
                closeModal();
                if (onConfirm) onConfirm();
            });

            newNoBtn.addEventListener('click', closeModal);
            newBg.addEventListener('click', closeModal);

            modal.classList.remove('hidden');
        }
        window.showCustomConfirm = showCustomConfirm;

        // دالة تحديث مؤشر المزامنة (Live)
        function updateCloudSyncStatus(state) {
            const statusBox = document.getElementById('cloudSyncStatus');
            const statusDot = document.getElementById('cloudSyncDot');
            const statusText = document.getElementById('cloudSyncText');
            if (!statusBox || !statusDot || !statusText) return;

            if (state === 'syncing') {
                statusDot.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin text-blue-500 text-[12px]"></i>';
                statusText.className = 'text-xs font-bold text-blue-600 tracking-wide';
                statusText.innerText = 'جاري المزامنة...';
            } else if (state === 'error' || state === 'offline') {
                statusDot.innerHTML = '<span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>';
                statusText.className = 'text-xs font-bold text-red-600 tracking-wide';
                statusText.innerText = state === 'offline' ? 'غير متصل بالشبكة' : 'خطأ في المزامنة';
            } else if (state === 'connected') {
                statusDot.innerHTML = '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>';
                statusText.className = 'text-xs font-bold text-emerald-600 tracking-wide';
                statusText.innerText = 'متصل بالخادم (Live)';
            }
        }
        window.addEventListener('online', () => updateCloudSyncStatus('connected'));
        window.addEventListener('offline', () => updateCloudSyncStatus('offline'));
        if (!navigator.onLine) updateCloudSyncStatus('offline');

        function filterFeaturesForCurrentUser(features) {
            if (!Array.isArray(features)) return [];
            if (window.isFeatureAllowed) return features.filter(feature => window.isFeatureAllowed(feature));
            return features;
        }

        function filterGeoJsonDataForCurrentUser(data, layerType = 'zone') {
            if (window.filterGeoJSONByUser) return window.filterGeoJSONByUser(data, layerType);
            return data;
        }

        function canEditMapForCurrentUser() {
            return window.canEditCurrentUser ? window.canEditCurrentUser() : true;
        }

        // دالة موحدة لتنسيق الزونات بناءً على حالة الحصر
        function getZoneStyle(feature) {
            const status = getFeatureStatus(feature?.properties || {});
            let color = getZoneStatusColor(status);

            if (!status || color === '#64748b') {
                if (status.includes('جديدة')) color = '#3b82f6';
                else if (status.includes('الحصر') || status.includes('العمل')) color = '#eab308';
                else if (status.includes('الانتهاء') || status.includes('مكتمل')) color = '#22c55e';
                else color = '#94a3b8';
            }

            return {
                color: color,
                weight: 1.5,
                fillColor: color,
                fillOpacity: 0.35
            };
        }

        function normalizeGovernorateInput(value) {
            if (Array.isArray(value)) {
                return value.map(item => String(item || '').trim()).filter(Boolean);
            }
            const raw = String(value || '').trim();
            if (!raw || raw.toLowerCase() === 'all') return 'all';
            const parts = raw.split(/[,،]/).map(item => item.trim()).filter(Boolean);
            if (!parts.length) return 'all';
            return parts.length === 1 ? parts[0] : parts;
        }

        function formatGovernorateDisplay(value) {
            if (Array.isArray(value)) return value.join('، ');
            return value || 'all';
        }

        const DEFAULT_ZONE_STATUSES = [
            { label: 'مناطق حصر جديدة', color: '#3b82f6', order: 1, active: true },
            { label: 'قيد الحصر', color: '#eab308', order: 2, active: true },
            { label: 'تم الانتهاء', color: '#22c55e', order: 3, active: true }
        ];
        const ZONE_STATUS_COLOR_PALETTE = ['#8b5cf6', '#f97316', '#14b8a6', '#ec4899', '#6366f1', '#84cc16', '#ef4444', '#06b6d4'];
        let zoneStatusOptions = [...DEFAULT_ZONE_STATUSES];
        let zoneStatusesInitialized = false;
        let zoneStatusListenerBound = false;

        function normalizeZoneStatusEntry(item, index = 0) {
            return {
                label: String(item?.label || '').trim(),
                color: item?.color || '#64748b',
                order: Number.isFinite(item?.order) ? item.order : index + 1,
                active: item?.active !== false
            };
        }

        function getOrderedZoneStatuses() {
            return (zoneStatusOptions || [])
                .map((item, index) => normalizeZoneStatusEntry(item, index))
                .filter(item => item.label)
                .sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        function getZoneStatusLabels() {
            return getOrderedZoneStatuses()
                .filter(item => item.active !== false)
                .map(item => item.label);
        }

        function getZoneStatusConfig(label) {
            const normalizedLabel = String(label || '').trim();
            return getOrderedZoneStatuses().find(item => item.label === normalizedLabel) || null;
        }

        function getZoneStatusColor(label) {
            const found = getZoneStatusConfig(label);
            return found?.color || '#64748b';
        }

        function getFeatureStatus(props = {}) {
            return String(props['حالة الحصر'] || props['type_statu'] || props['حالة_الحصر'] || props.Status || '').trim();
        }

        function getAllKnownZoneStatusesFromFeatures(features = []) {
            const labels = new Set(getZoneStatusLabels());
            (features || []).forEach(feature => {
                const status = getFeatureStatus(feature?.properties || {});
                if (status) labels.add(status);
            });
            return Array.from(labels);
        }

        function pickNextZoneStatusColor(items = []) {
            const used = new Set((items || []).map(item => item?.color).filter(Boolean));
            const available = ZONE_STATUS_COLOR_PALETTE.find(color => !used.has(color));
            return available || ZONE_STATUS_COLOR_PALETTE[(items.length || 0) % ZONE_STATUS_COLOR_PALETTE.length];
        }

        function renderZoneStatusFilterOptions() {
            const select = document.getElementById('filterZoneStatus');
            if (!select) return;
            const currentValue = select.value || 'all';
            const labels = getZoneStatusLabels();
            select.innerHTML = '<option value="all">كل الحالات</option>';
            labels.forEach(label => {
                const option = document.createElement('option');
                option.value = label;
                option.textContent = label;
                select.appendChild(option);
            });
            select.value = labels.includes(currentValue) || currentValue === 'all' ? currentValue : 'all';
        }

        function buildMapLegendItemsHtml() {
            const labels = getZoneStatusLabels();
            const items = labels.length ? labels : DEFAULT_ZONE_STATUSES.map(item => item.label);
            return items.map(label => `
                <div class="legend-item">
                    <span class="legend-swatch" style="background: ${getZoneStatusColor(label)};"></span>
                    <span>${label}</span>
                </div>
            `).join('') + `
                <div class="legend-item">
                    <span class="legend-swatch" style="background: #94a3b8;"></span>
                    <span>غير محدد</span>
                </div>
            `;
        }

        async function bootstrapZoneStatuses() {
            if (zoneStatusesInitialized) return;
            zoneStatusesInitialized = true;

            try {
                if (window.loadZoneStatuses) {
                    const remoteItems = await window.loadZoneStatuses();
                    if (Array.isArray(remoteItems) && remoteItems.length) {
                        zoneStatusOptions = remoteItems.map((item, index) => normalizeZoneStatusEntry(item, index)).filter(item => item.label);
                    }
                }
            } catch (error) {
                console.warn('Unable to bootstrap zone statuses:', error);
            }

            renderZoneStatusFilterOptions();
            injectMapLegend('gazaMapWrapper');
            injectMapLegend('viewMapWrapper');

            if (window.listenToZoneStatuses && !zoneStatusListenerBound) {
                zoneStatusListenerBound = true;
                window.listenToZoneStatuses((items) => {
                    zoneStatusOptions = Array.isArray(items) && items.length
                        ? items.map((item, index) => normalizeZoneStatusEntry(item, index)).filter(item => item.label)
                        : [...DEFAULT_ZONE_STATUSES];
                    renderZoneStatusFilterOptions();
                    injectMapLegend('gazaMapWrapper');
                    injectMapLegend('viewMapWrapper');

                    if (geoJsonLayers?.zone) {
                        geoJsonLayers.zone.eachLayer(layer => {
                            if (layer.setStyle && layer.feature) layer.setStyle(getZoneStyle(layer.feature));
                        });
                    }
                    if (window.viewMapInstance && typeof window.viewMapInstance.eachLayer === 'function') {
                        window.viewMapInstance.eachLayer(layer => {
                            if (layer.feature && layer.setStyle) layer.setStyle(getZoneStyle(layer.feature));
                        });
                    }
                    if (window.zoneGeoJsonData?.features) {
                        processZoneStatistics(filterFeaturesForCurrentUser(window.zoneGeoJsonData.features || []));
                    }
                });
            }
        }

        window.getFeatureStatus = getFeatureStatus;
        window.getZoneStatusColor = getZoneStatusColor;
        window.getZoneStatusOptions = () => getOrderedZoneStatuses();

        // دالة لحقن مفتاح الخريطة برمجياً
        function injectMapLegend(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const existingLegend = container.querySelector('.map-legend');
            if (existingLegend) {
                const list = existingLegend.querySelector('.legend-list');
                if (list) list.innerHTML = buildMapLegendItemsHtml();
                return;
            }

            const legendHtml = `
                <div class="map-legend glass-panel p-3 rounded-xl shadow-lg border-white/40">
                    <h5 class="legend-header">مفتاح الخريطة</h5>
                    <div class="legend-list">${buildMapLegendItemsHtml()}</div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', legendHtml);
        }

// 1. نظام التبديل بين الوضع المظلم والفاتح
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        let currentTheme = localStorage.getItem('theme') || 'light';

        window.updateChartsTheme = function(theme) {
            if(typeof Chart === 'undefined') return;
            const isDark = theme === 'dark';
            const textColor = isDark ? '#cbd5e1' : '#64748b';
            const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)';
            
            Chart.defaults.color = textColor;
            for (let id in Chart.instances) {
                let chart = Chart.instances[id];
                if(chart.options.scales) {
                    if(chart.options.scales.x && chart.options.scales.x.grid) chart.options.scales.x.grid.color = gridColor;
                    if(chart.options.scales.y && chart.options.scales.y.grid) chart.options.scales.y.grid.color = gridColor;
                    if(chart.options.scales.r) {
                        if(chart.options.scales.r.grid) chart.options.scales.r.grid.color = gridColor;
                        if(chart.options.scales.r.angleLines) chart.options.scales.r.angleLines.color = gridColor;
                        if(chart.options.scales.r.pointLabels) chart.options.scales.r.pointLabels.color = textColor;
                    }
                }
                chart.update();
            }
        };

        window.switchMapTheme = function(theme) {
            if(!window.mapInstance) return;
            const map = window.mapInstance;
            
            if(!window.baseLayersMap) {
                 window.baseLayersMap = {
                    light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO', maxZoom: 19 }),
                    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO', maxZoom: 19 }),
                    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap', maxZoom: 19 }),
                    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 })
                };
            }
            if(window.currentBaseLayer) map.removeLayer(window.currentBaseLayer);
            
            // theme might be general ('dark'/'light') or specific ('osm'/'satellite'/'dark'/'light') from radio buttons
            window.currentBaseLayer = window.baseLayersMap[theme] || window.baseLayersMap.light;
            window.currentBaseLayer.addTo(map);
            
            // مزامنة أزرار الراديو بعد التغيير 
            const matchingRadio = document.querySelector(`input[name="basemap"][value="${theme}"]`);
            if(matchingRadio) matchingRadio.checked = true;
            
            // إعادة الطبقات الأخرى للأمام
            map.eachLayer(layer => {
               if(layer !== window.currentBaseLayer && !layer.pm) {
                   layer.bringToFront();
               }
            });
        };

        function applyTheme(theme) {
            if (theme === 'dark') {
                document.body.classList.add('dark');
                if(themeIcon) {
                    themeIcon.classList.replace('fa-moon', 'fa-sun');
                    themeIcon.classList.add('text-yellow-400');
                }
            } else {
                document.body.classList.remove('dark');
                if(themeIcon) {
                    themeIcon.classList.replace('fa-sun', 'fa-moon');
                    themeIcon.classList.remove('text-yellow-400');
                }
            }
            if (window.switchMapTheme) window.switchMapTheme(theme);
            if (window.switchViewMapTheme) window.switchViewMapTheme(theme);
            if (window.updateChartsTheme) window.updateChartsTheme(theme);
        }

        applyTheme(currentTheme);

        if(themeToggle) {
            themeToggle.addEventListener('click', () => {
                currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
                localStorage.setItem('theme', currentTheme);
                applyTheme(currentTheme);
            });
        }

        function hideLoader() {
            const loader = document.getElementById('loader');
            if (!loader) return;

            // 1. تشغيل تأثير Flash السينمائي أولاً
            const flash = document.getElementById('entryFlash');
            if (flash) {
                flash.classList.add('flash-active');
                setTimeout(() => flash.classList.remove('flash-active'), 1200);
            }

            // 2. إخفاء الـ Loader بتزامن مع Flash
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
            loader.style.pointerEvents = 'none';
            setTimeout(() => {
                loader.style.display = 'none';
                // Only default to home if no other page is active
                const activePage = document.querySelector('.page.active');
                if (!activePage) {
                    const homePage = document.getElementById('home');
                    if (homePage) homePage.classList.add('active');
                    const activeBtn = document.querySelector('.nav-btn.active');
                    if(activeBtn) updateNavIndicator(activeBtn);
                }
                const topNav = document.getElementById('mainNav');
                if (topNav) topNav.classList.add('animate__animated', 'animate__fadeIn');
                if(window.mapInstance) window.mapInstance.invalidateSize();
            }, 600);
        }

        // إخفاء شاشة التحميل بعد الانتهاء (4 ثوانٍ ثابتة - المسار الوحيد والصحيح)
        window.addEventListener('load', function() {
            const pct  = document.getElementById('loaderPct');
            const circleProgress = document.getElementById('loaderCircleProgress');
            const checks = [
                document.getElementById('chk1'),
                document.getElementById('chk2'),
                document.getElementById('chk3'),
                document.getElementById('chk4')
            ];

            // عداد النسبة المئوية
            let count = 0;
            const totalMs = 3400;
            const step = 100 / (totalMs / 50);
            
            const checkThresholds = [15, 40, 65, 90]; // نسب مئوية لاكتمال المهام
            let currentCheck = 0;

            const counter = setInterval(() => {
                count = Math.min(100, count + step);
                if (pct) pct.textContent = Math.floor(count);
                
                if (circleProgress) {
                    // محيط الدائرة = 2 * pi * 46 ≈ 289
                    const offset = 289 - (289 * count) / 100;
                    circleProgress.style.strokeDashoffset = offset;
                }

                // تفعيل المهام المنجزة (Checklist)
                if (currentCheck < checks.length && count >= checkThresholds[currentCheck]) {
                    const chk = checks[currentCheck];
                    if (chk) {
                        chk.classList.remove('opacity-40', 'translate-y-2');
                        chk.classList.add('opacity-100', 'text-gray-800', 'translate-y-0');
                        const icon = chk.querySelector('.check-icon');
                        if (icon) {
                            icon.classList.remove('bg-gray-200/80', 'text-gray-400', 'border-gray-300/50');
                            icon.classList.add('bg-gradient-to-br', 'from-emerald-400', 'to-emerald-500', 'text-white', 'shadow-lg', 'shadow-emerald-500/40', 'border-transparent');
                        }
                    }
                    currentCheck++;
                }

                if (count >= 100) clearInterval(counter);
            }, 50);

            // الإخفاء النهائي بعد 3.5 ثانية
            setTimeout(() => {
                clearInterval(counter);
                hideLoader();
            }, 3500);
        });

        // في حالة فشل حدث load، نجعله 4.5 ثوانٍ كـ Fallback حتى لا يتعلق
        setTimeout(hideLoader, 4500);

        // 1. التهيئة عند التحميل
        document.addEventListener('DOMContentLoaded', () => {
            try {
                // لا نخفي الـ Loader هنا - ندع الـ Timer يتحكم فقط
                const navButtons = document.querySelectorAll('.nav-btn');
                const navContainer = document.getElementById('mainNav');
                
                if (navButtons.length > 0 && navContainer) {
                    navButtons.forEach(btn => {
                        btn.addEventListener('mouseenter', function() {
                            updateNavIndicator(this);
                        });
                    });

                    navContainer.addEventListener('mouseleave', function() {
                        const activeBtn = document.querySelector('.nav-btn.active');
                        if(activeBtn) updateNavIndicator(activeBtn);
                    });
                }
            } catch(e) { console.error("Nav Indicator Error:", e); }
            
            try {
                if (typeof Chart !== 'undefined') {
                    chartsInitialized = true; // Will be fully updated after data loads
                } else {
                    console.warn("Chart.js not loaded.");
                }
            } catch(e) { console.error("Chart Init Error:", e); }

            try {
                if (typeof L !== 'undefined') {
                    initGazaMap();
                    initViewMap(); // تهيئة خريطة العرض والشرح
                } else {
                    console.warn("Leaflet GL not loaded.");
                }
            } catch(e) { console.error("Map Init Error:", e); }
            
            // تفعيل التحويل المباشر لخرائط الأساس من القائمة
            const basemapRadios = document.querySelectorAll('input[name="basemap"]');
            basemapRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if(e.target.checked && window.switchMapTheme) {
                        window.switchMapTheme(e.target.value);
                    }
                });
            });
            
            // تفعيل التبديل لخريطة العرض أيضاً
            const viewBasemapRadios = document.querySelectorAll('input[name="viewBasemap"]');
            viewBasemapRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if(e.target.checked && window.switchViewMapTheme) {
                        window.switchViewMapTheme(e.target.value);
                    }
                });
            });
            
            // تهيئة موقع المؤشر عند التشغيل الأول
            const activeBtn = document.querySelector('.nav-btn.active');
            if (activeBtn) {
                setTimeout(() => updateNavIndicator(activeBtn), 500);
            }

            // إضافة كلاس الصفحة الافتراضية للجسم لضمان ظهور العناصر الجانبية
            document.body.classList.add('page-home');
        });

        // 2. تحديث موقع المؤشر الزجاجي
        function updateNavIndicator(element) {
            try {
                if(!element) return;
                const indicator = document.getElementById('navIndicator');
                if(!indicator) return;
                
                const container = indicator.parentElement;
                if(!container) return;

                const containerRect = container.getBoundingClientRect();
                const elRect = element.getBoundingClientRect();
                
                const rightPos = containerRect.right - elRect.right;
                
                indicator.style.width = `${element.offsetWidth}px`;
                indicator.style.right = `${rightPos}px`; 
                indicator.style.height = `${element.offsetHeight}px`;
            } catch(e) { console.error("Update Nav Error:", e); }
        }

        // 3. التبديل بين الصفحات
        function switchPage(pageId, btnElement) {
            console.log('switchPage called:', pageId);
            try {
                document.querySelectorAll('.nav-btn').forEach(btn => {
                    btn.classList.remove('text-blue-700', 'font-bold', 'active');
                    btn.classList.add('text-gray-600', 'font-semibold');
                });

                btnElement.classList.remove('text-gray-600', 'font-semibold');
                btnElement.classList.add('text-blue-700', 'font-bold', 'active');
                updateNavIndicator(btnElement);

                document.querySelectorAll('.page').forEach(page => {
                    page.classList.remove('active');
                });

                const targetPage = document.getElementById(pageId);
                console.log('targetPage element:', targetPage);
                if(targetPage) {
                    targetPage.classList.add('active');
                    console.log('Added active class to:', pageId);
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // إضافة كلاس للجسم حسب الصفحة للتحكم في ظهور العناصر الجانبية
                document.body.classList.remove('page-home', 'page-stats', 'page-flow', 'page-users', 'page-personas');
                document.body.classList.add('page-' + pageId);

                // إعادة ضبط حجم الخريطة عند العودة للرئيسية أو التنقل للعرض
                if (pageId === 'home' && window.mapInstance) {
                    setTimeout(() => {
                        window.mapInstance.invalidateSize();
                        if (typeof renderContentsPane === 'function') renderContentsPane();
                    }, 300);
                } else if (pageId === 'flow' && window.viewMapInstance) {
                    setTimeout(() => window.viewMapInstance.invalidateSize(), 300);
                } else if (pageId === 'personas' && window.initPersonasDashboard) {
                    window.initPersonasDashboard();
                } else if (pageId === 'style' && window.initLayoutManager) {
                    window.initLayoutManager();
                }
            } catch(e) { console.error("Switch Page Error:", e); }
        }

        // 4. دالة بناء الرسوم البيانية باستخدام Chart.js
        // 4. (Deprecated) Moved to loadMasterGeoJsonData
        /* function loadStatisticsAndInitCharts() { ... } */

        function processZoneStatistics(features) {
            features = Array.isArray(features) ? features : [];
            
            const govFilt = document.getElementById('analyticsGovFilter');
            const govFilterVal = govFilt ? govFilt.value : 'all';
            
            let filteredFeatures = features;
            if (govFilterVal !== 'all') {
                filteredFeatures = features.filter(f => {
                    const g = (f.properties?.governorat || f.properties?.Gov || "").trim();
                    return g === govFilterVal;
                });
            }

            let totalZones = filteredFeatures.length;
            let totalBldg = 0, totalCompleted = 0, totalUnits = 0, totalTeams = 0, totalEng = 0;
            
            // تصنيفات حسب المحافظة "Gov" وحسب حالة الحصر
            let govStats = {};
            let statusDistribution = {};
            getZoneStatusLabels().forEach(label => {
                statusDistribution[label] = 0;
            });

            filteredFeatures.forEach(f => {
                let p = f.properties || {};
                let bldg = parseInt(p["total_all"]) || parseInt(p["إجمالي_المباني"]) || 0;
                let comp = parseInt(p["complete"]) || parseInt(p["المباني_المنجزة"]) || 0;
                let units = parseInt(p["unit_count"]) || parseInt(p["عدد_الوحدات"]) || 0;
                let teams = parseInt(p["عدد الفرق"]) || parseInt(p["teams_coun"]) || parseInt(p["عدد_الفرق"]) || 0;
                let eng = parseInt(p["عدد المهندسين"]) || parseInt(p["engineers_"]) || parseInt(p["عدد_المهندسين"]) || 0;
                let gov = p["governorat"] || p["Gov"] ? (p["governorat"] || p["Gov"]).trim() : "غير محدد";
                let status = getFeatureStatus(p);
                
                totalBldg += bldg;
                totalCompleted += comp;
                totalUnits += units;
                totalTeams += teams;
                totalEng += eng;

                // تحديث توزيع الحالة
                if (status) {
                    if (!Object.prototype.hasOwnProperty.call(statusDistribution, status)) {
                        statusDistribution[status] = 0;
                    }
                    statusDistribution[status]++;
                }

                if(!govStats[gov]) govStats[gov] = {bldg: 0, completed: 0, units: 0, teams: 0, eng: 0};
                govStats[gov].bldg += bldg;
                govStats[gov].completed += comp;
                govStats[gov].units += units;
                govStats[gov].teams += teams;
                govStats[gov].eng += eng;
            });

            // تحديث بطاقات المجاميع السريعة مع تأثيرات الأرقام
            animateValue("statZones", 0, totalZones, 1500);
            animateValue("statTotalBldg", 0, totalBldg, 2000);
            animateValue("statCompleted", 0, totalCompleted, 2000);
            animateValue("statUnits", 0, totalUnits, 2000);
            animateValue("statTeams", 0, totalTeams, 1500);
            animateValue("statEng", 0, totalEng, 1500);

            // تحديث شريط التقدم الفعلي لعملية الحصر
            const progressPct = totalBldg > 0 ? ((totalCompleted / totalBldg) * 100).toFixed(1) : 0;
            const mainProgressBar = document.getElementById('mainProgressBar');
            const mainProgressText = document.getElementById('mainProgressText');
            
            if (mainProgressBar && mainProgressText) {
                setTimeout(() => {
                    mainProgressBar.style.width = progressPct + '%';
                    animateValue("mainProgressText", 0, Math.floor(progressPct), 2000, true);
                    if (Math.floor(progressPct) !== parseFloat(progressPct)) {
                         setTimeout(() => { mainProgressText.innerText = progressPct + '%'; }, 2100);
                    }
                }, 500);
            }

            // تحضير مصفوفات البيانات للـ Charts
            const govLabels = Object.keys(govStats);
            const bldgData = govLabels.map(g => govStats[g].bldg);
            const compData = govLabels.map(g => govStats[g].completed);
            const unitsData = govLabels.map(g => govStats[g].units);
            const teamsData = govLabels.map(g => govStats[g].teams);
            const engData = govLabels.map(g => govStats[g].eng);

            initCharts({
                labels: govLabels.length ? govLabels : ['بدون بيانات'],
                bldg: bldgData.length ? bldgData : [0],
                completed: compData.length ? compData : [0],
                units: unitsData.length ? unitsData : [0],
                teams: teamsData.length ? teamsData : [0],
                eng: engData.length ? engData : [0],
                status: statusDistribution
            });

            if (typeof generateSmartInsights === 'function') {
                generateSmartInsights(filteredFeatures, govFilterVal);
            }
        }

        function updateAnalyticsDashboard() {
            let features = [];
            if (window.analyticsData && window.analyticsData.features) {
                features = window.analyticsData.features;
            } else if (window.zoneGeoJsonData && window.zoneGeoJsonData.features) {
                features = window.zoneGeoJsonData.features;
            } else if (geoJsonLayers && geoJsonLayers['zone']) {
                geoJsonLayers['zone'].eachLayer(l => features.push(l.feature));
            }
            if (typeof filterFeaturesForCurrentUser === 'function') {
                features = filterFeaturesForCurrentUser(features);
            }
            processZoneStatistics(features);
        }

        function generateSmartInsights(features, filterGov) {
            const el = document.getElementById('aiInsightsContent');
            if(!el) return;
            
            if(!features || features.length === 0) {
                el.innerHTML = '<span class="text-red-500 font-bold"><i class="fa-solid fa-triangle-exclamation ms-1"></i> لا توجد بيانات لتحليلها بناءً على الفلترة الحالية.</span>';
                return;
            }

            let totalBldg = 0, totalComp = 0, totalEng = 0, totalTeams = 0;
            let govStatsMap = {};

            features.forEach(f => {
                let p = f.properties || {};
                let bldg = parseInt(p["total_all"]) || parseInt(p["إجمالي_المباني"]) || 0;
                let comp = parseInt(p["complete"]) || parseInt(p["المباني_المنجزة"]) || 0;
                let eng = parseInt(p["عدد المهندسين"]) || parseInt(p["engineers_"]) || 0;
                let teams = parseInt(p["عدد الفرق"]) || parseInt(p["teams_coun"]) || parseInt(p["عدد_الفرق"]) || 0;
                let gov = p["governorat"] || p["Gov"] || "غير محدد";

                totalBldg+=bldg; totalComp+=comp; totalEng+=eng; totalTeams+=teams;

                if(!govStatsMap[gov]) govStatsMap[gov] = {bldg: 0, comp: 0};
                govStatsMap[gov].bldg += bldg;
                govStatsMap[gov].comp += comp;
            });

            const totalRate = totalBldg > 0 ? ((totalComp/totalBldg)*100).toFixed(1) : 0;
            
            let highestGov = { name: '', rate: -1 };
            let lowestGov = { name: '', rate: 101 };
            
            if(filterGov === 'all' && Object.keys(govStatsMap).length > 1) {
                Object.keys(govStatsMap).forEach(g => {
                    let rate = govStatsMap[g].bldg > 0 ? (govStatsMap[g].comp / govStatsMap[g].bldg) * 100 : 0;
                    if(rate > highestGov.rate) { highestGov = { name: g, rate: rate }; }
                    if(rate < lowestGov.rate) { lowestGov = { name: g, rate: rate }; }
                });
            }

            let html = `<p class="flex items-center"><i class="fa-solid fa-bolt text-amber-500 ml-2 text-lg"></i> إجمالي المباني المنجزة هو <strong class="mx-1 text-black">${totalComp.toLocaleString()}</strong> مبنى بنسبة <strong class="mx-1 text-black">${totalRate}%</strong> من المستهدف البالغ (${totalBldg.toLocaleString()}).</p>`;
            
            if (filterGov === 'all' && highestGov.name !== '') {
                html += `<p class="flex items-center"><i class="fa-solid fa-arrow-trend-up text-emerald-500 ml-2 text-lg"></i> أعلى المحافظات إنجازاً بالمعدل هي <strong class="mx-1 text-black">${highestGov.name}</strong> (${highestGov.rate.toFixed(1)}%)، بينما تتذيل <strong class="mx-1 text-black">${lowestGov.name}</strong> القائمة.</p>`;
            }

            let bldgPerTeam = totalTeams > 0 ? Math.round(totalBldg / totalTeams) : 0;
            let bldgPerEng = totalEng > 0 ? Math.round(totalBldg / totalEng) : 0;
            
            if (bldgPerEng > 1000) {
                html += `<p class="flex items-center"><i class="fa-solid fa-triangle-exclamation text-red-500 ml-2 text-lg"></i> <span class="text-red-600 ml-1">تنبيه:</span> يوجد عبء كبير، بمعدل <strong class="mx-1 text-black">${bldgPerEng}</strong> مبنى لكل مهندس في الميدان.</p>`;
            } else {
                html += `<p class="flex items-center"><i class="fa-solid fa-user-check text-indigo-500 ml-2 text-lg"></i> العبء موزع بمقدار <strong class="mx-1 text-black">${bldgPerTeam}</strong> مبنى إضافي لكل فريق عمل.</p>`;
            }

            el.innerHTML = html;
        }

        // تأثير تحريك الأرقام
        function animateValue(id, start, end, duration, IsPercent = false) {
            if (start === end) {
                document.getElementById(id).innerHTML = end + (IsPercent ? '%' : '');
                return;
            }
            let range = end - start;
            let current = start;
            let increment = end > start ? Math.ceil(range / (duration / 20)) : -1;
            if (increment === 0) increment = 1;

            let stepTime = Math.abs(Math.floor(duration / (range / increment)));
            if (stepTime < 20) stepTime = 20;
            
            let obj = document.getElementById(id);
            if(!obj) return;
            
            let timer = setInterval(function() {
                current += increment;
                if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                    current = end;
                    clearInterval(timer);
                }
                obj.innerHTML = current + (IsPercent ? '%' : '');
            }, stepTime);
        }

        document.addEventListener('DOMContentLoaded', () => {
            const govFilt = document.getElementById('analyticsGovFilter');
            if (govFilt) {
                govFilt.addEventListener('change', updateAnalyticsDashboard);
            }

            const btnPrint = document.getElementById('btnAnalyticsPrint');
            if (btnPrint) {
                btnPrint.addEventListener('click', () => {
                    window.print();
                });
            }

            const btnPdf = document.getElementById('btnAnalyticsPdf');
            if (btnPdf) {
                btnPdf.addEventListener('click', () => {
                    const element = document.getElementById('process');
                    if (element && window.html2pdf) {
                        const opt = {
                            margin:       0.5,
                            filename:     `Analytics_Overview_${new Date().toLocaleDateString('en-GB')}.pdf`,
                            image:        { type: 'jpeg', quality: 0.98 },
                            html2canvas:  { scale: 2, useCORS: true, ignoreElements: el => el.hasAttribute('data-html2canvas-ignore') },
                            jsPDF:        { unit: 'in', format: 'a3', orientation: 'landscape' }
                        };
                        
                        btnPdf.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التصدير...';
                        window.html2pdf().set(opt).from(element).save().then(() => {
                           btnPdf.innerHTML = '<i class="fa-solid fa-file-pdf"></i> <span>تصدير Executive PDF</span>';
                           if(window.showToast) window.showToast('تم تصدير التقرير بنجاح!', 'emerald');
                        });
                    } else {
                        if(window.showToast) window.showToast('المكتبة قيد التحميل، يرجى المحاولة بعد قليل.', 'warning');
                        else alert('المكتبة غير جاهزة للتحميل.');
                    }
                });
            }
        });

        window.analyticsCharts = window.analyticsCharts || {};
        function initCharts(stats) {
            Chart.defaults.font.family = "'Cairo', sans-serif";
            Chart.defaults.color = '#64748b'; 
            
            ['barChart', 'doughnutChart', 'lineChart', 'radarChart', 'polarChart', 'statusChart'].forEach(id => {
                if (window.analyticsCharts[id]) window.analyticsCharts[id].destroy();
            });

            const gridOptions = {
                color: 'rgba(255, 255, 255, 0.4)', 
                borderColor: 'transparent'
            };

            const commonHover = {
                onHover: function(e, elements, chart) {
                    if (elements && elements.length) {
                        const index = elements[0].index;
                        ['barChart', 'doughnutChart', 'radarChart', 'polarChart'].forEach(id => {
                            let wChart = window.analyticsCharts[id];
                            if(wChart && wChart.canvas.id !== chart.canvas.id) {
                                wChart.setActiveElements([{datasetIndex: 0, index: index}]);
                                wChart.update();
                            }
                        });
                    } else {
                        ['barChart', 'doughnutChart', 'radarChart', 'polarChart'].forEach(id => {
                            let wChart = window.analyticsCharts[id];
                            if(wChart && wChart.canvas.id !== chart.canvas.id) {
                                wChart.setActiveElements([]);
                                wChart.update();
                            }
                        });
                    }
                }
            };

            const ctxBar = document.getElementById('barChart').getContext('2d');
            window.analyticsCharts['barChart'] = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: stats.labels,
                    datasets: [{
                        label: 'إجمالي المباني',
                        data: stats.bldg,
                        backgroundColor: 'rgba(74, 144, 226, 0.7)',
                        borderColor: '#4A90E2',
                        borderWidth: 1,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { y: { grid: gridOptions }, x: { grid: {display: false} } },
                    plugins: { legend: { display: false } },
                    onHover: commonHover.onHover
                }
            });

            const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
            window.analyticsCharts['doughnutChart'] = new Chart(ctxDoughnut, {
                type: 'doughnut',
                data: {
                    labels: stats.labels,
                    datasets: [{
                        label: 'عدد الوحدات',
                        data: stats.units,
                        backgroundColor: ['rgba(74, 144, 226, 0.8)', 'rgba(46, 204, 113, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(249, 115, 22, 0.8)', 'rgba(236, 72, 153, 0.8)'],
                        borderWidth: 2,
                        borderColor: '#ffffff',
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    cutout: '70%', 
                    plugins: { legend: { position: 'bottom' } },
                    layout: { padding: { bottom: 20 } },
                    onHover: commonHover.onHover
                }
            });

            const ctxLine = document.getElementById('lineChart').getContext('2d');
            let gradient = ctxLine.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(46, 204, 113, 0.5)'); 
            gradient.addColorStop(1, 'rgba(46, 204, 113, 0.0)');

            let gradientBldg = ctxLine.createLinearGradient(0, 0, 0, 300);
            gradientBldg.addColorStop(0, 'rgba(74, 144, 226, 0.5)'); 
            gradientBldg.addColorStop(1, 'rgba(74, 144, 226, 0.0)');

            window.analyticsCharts['lineChart'] = new Chart(ctxLine, {
                type: 'line',
                data: {
                    labels: stats.labels,
                    datasets: [
                        {
                            label: 'إجمالي المباني',
                            data: stats.bldg,
                            borderColor: '#4A90E2',
                            backgroundColor: gradientBldg,
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4, 
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: '#4A90E2',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'المباني المنجزة',
                            data: stats.completed,
                            borderColor: '#2ECC71',
                            backgroundColor: gradient,
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4, 
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: '#2ECC71',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { y: { grid: gridOptions }, x: { grid: gridOptions } },
                    plugins: { legend: { position: 'top' } }
                }
            });

            const ctxRadar = document.getElementById('radarChart').getContext('2d');
            window.analyticsCharts['radarChart'] = new Chart(ctxRadar, {
                type: 'radar',
                data: {
                    labels: stats.labels,
                    datasets: [{
                        label: 'عدد الفرق',
                        data: stats.teams,
                        backgroundColor: 'rgba(168, 85, 247, 0.3)',
                        borderColor: '#A855F7',
                        pointBackgroundColor: '#A855F7'
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: 'rgba(255, 255, 255, 0.4)' },
                            grid: { color: 'rgba(255, 255, 255, 0.4)' },
                            pointLabels: { font: { family: 'Cairo' }, color: '#334155' },
                            ticks: { display: false }
                        }
                    },
                    onHover: commonHover.onHover
                }
            });

            const ctxPolar = document.getElementById('polarChart').getContext('2d');
            window.analyticsCharts['polarChart'] = new Chart(ctxPolar, {
                type: 'polarArea',
                data: {
                    labels: stats.labels,
                    datasets: [{
                        label: 'عدد المهندسين',
                        data: stats.eng,
                        backgroundColor: [
                            'rgba(74, 144, 226, 0.6)',
                            'rgba(46, 204, 113, 0.6)',
                            'rgba(249, 115, 22, 0.6)',
                            'rgba(168, 85, 247, 0.6)',
                            'rgba(236, 72, 153, 0.6)'
                        ],
                        borderWidth: 1,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { r: { ticks: { display: false }, grid: {color: 'rgba(255,255,255,0.3)'} } },
                    plugins: { legend: { position: 'right' } },
                    onHover: commonHover.onHover
                }
            });

            // Chart 6: Survey Status Breakdown (Doughnut)
            const ctxStatus = document.getElementById('statusChart').getContext('2d');
            const statusEntries = Object.entries(stats.status || {}).filter(([, value]) => Number(value) > 0);
            const finalStatusEntries = statusEntries.length ? statusEntries : Object.entries(stats.status || {});
            window.analyticsCharts['statusChart'] = new Chart(ctxStatus, {
                type: 'pie',
                data: {
                    labels: finalStatusEntries.map(([label]) => label),
                    datasets: [{
                        data: finalStatusEntries.map(([, value]) => value),
                        backgroundColor: finalStatusEntries.map(([label]) => getZoneStatusColor(label) || '#94a3b8'),
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // 5. دالة تهيئة خريطة غزة باستخدام Leaflet (بديل آمن لا يتعارض مع قيود المتصفح)
        function initGazaMap() {
            // تهيئة الخريطة وتوجيهها نحو إحداثيات قطاع غزة
            const map = L.map('gazaMap', {
                center: [31.4167, 34.3333],
                zoom: 11,
                zoomControl: false // إخفاء أزرار التقريب الافتراضية
            });

            // حفظ نسخة عامة للوصول لها عند تغيير الصفحات
            window.mapInstance = map;

            // إضافة أزرار التقريب في الزاوية السفلية
            L.control.zoom({ position: 'bottomleft' }).addTo(map);

            // إضافة خريطة أساسية (Base Map) هادئة لتتناسب مع التصميم الزجاجي والوضع الحالي
            if (window.switchMapTheme) window.switchMapTheme(document.body.classList.contains('dark') ? 'dark' : 'light');

            // إضافة الرابط الثاني (GAZAIMAGERY112025)
            const layer2 = L.esri.dynamicMapLayer({
                url: 'https://giscep.site/gisserver/rest/services/GAZAIMAGERY112025/MapServer',
                opacity: 1
            }); // مخفية افتراضياً لمنع التداخل

            // تفعيل أزرار التحكم بالطبقات من الواجهة الزجاجية
            const toggle2 = document.getElementById('toggleLayer2');
            
            if(toggle2) {
                toggle2.addEventListener('change', function(e) {
                    if (e.target.checked) map.addLayer(layer2);
                    else map.removeLayer(layer2);
                });
            }

            // تحميل وإدارة طبقات GeoJSON المحلية
            const geoJsonLayers = {
                gov: null,
                zone: null,
                road: null
            };
            const canEditMap = canEditMapForCurrentUser();

            // إيقاف وتجاهل أدوات Geoman الافتراضية
            map.pm.removeControls();

            const drawTools = [
                { id: 'btnDrawMarker', mode: 'Marker', ring: 'ring-blue-300' },
                { id: 'btnDrawLine', mode: 'Line', ring: 'ring-blue-300' },
                { id: 'btnDrawPoly', mode: 'Polygon', ring: 'ring-blue-300' },
                { id: 'btnDrawRect', mode: 'Rectangle', ring: 'ring-blue-300' },
                { id: 'btnDrawCircle', mode: 'Circle', ring: 'ring-blue-300' }
            ];

            const toggleTools = [
                { id: 'btnDragMode', check: 'globalDragModeEnabled', method: 'enableGlobalDragMode', disable: 'disableGlobalDragMode', ring: 'ring-purple-300' },
                { id: 'btnDeleteMode', check: 'globalRemovalEnabled', method: 'enableGlobalRemovalMode', disable: 'disableGlobalRemovalMode', ring: 'ring-red-300' },
                { id: 'btnCutMode', check: 'globalCutModeEnabled', method: 'enableGlobalCutMode', disable: 'disableGlobalCutMode', ring: 'ring-orange-300' }
            ];

            const ribbonTools = [
                { id: 'btnSaveEdits', action: () => { if(window.downloadGeoJsonFile) window.downloadGeoJsonFile(); showToast('تم سحب نسخة احتياطية من التعديلات الحالية', 'success'); } },
                { id: 'btnUndoEdits', action: () => { if(window.restorePreviousProperties) window.restorePreviousProperties(); } },
                { id: 'btnSnapMode', action: (btn) => { 
                    const active = btn.classList.toggle('ring-4'); 
                    map.pm.setGlobalSnapping(active);
                    showToast(active ? 'تم تفعيل الالتصاق (Snapping)' : 'تم إيقاف الالتصاق');
                } }
            ];

            const mapTools = [
                { id: 'ribbonAddUrlBtn', action: () => {
                    const url = prompt('أدخل رابط خريطة XYZ (مثال: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png):');
                    if(url) {
                        L.tileLayer(url, { attribution: 'Custom Layer' }).addTo(map);
                        showToast('تم إضافة الطبقة بنجاح');
                    }
                }},
                { id: 'ribbonAddGeoJsonBtn', action: () => {
                    document.getElementById('geoJsonInput').click();
                }},
                { id: 'btnReloadMasterData', action: () => {
                    loadMasterGeoJsonData();
                    showToast('جاري تحديث البيانات الرسمية من السحاب...', 'blue');
                }},
                { id: 'btnUpdateMasterData', action: () => {
                    if (window.currentUser && window.currentUser.role === 'admin') {
                        document.getElementById('geoJsonInput').setAttribute('data-target', 'master');
                        document.getElementById('geoJsonInput').click();
                    } else {
                        showToast('عذراً، هذه الصلاحية للمسؤولين فقط', 'red');
                    }
                }}
            ];

            const editCloudTools = [
                { id: 'btnSyncToCloud', action: async () => {
                    if (!window.newDrawnLayers || window.newDrawnLayers.length === 0) {
                        showToast('لا توجد ملامح جديدة للحفظ حالياً', 'orange');
                        return;
                    }
                    showToast('جاري الحفظ في السحابة...', 'blue');
                    let successCount = 0;
                    for (const layer of window.newDrawnLayers) {
                        const geojson = layer.toGeoJSON();
                        // Generate a unique ID if not exists
                        geojson.id = geojson.id || 'feat_' + Date.now() + '_' + Math.floor(Math.random()*1000);
                        const res = await window.saveDrawnFeature(geojson);
                        if (res.success) {
                            successCount++;
                            layer.feature = geojson; // Mark as saved
                        }
                    }
                    window.newDrawnLayers = []; 
                    showToast(`تم حفظ ${successCount} ملامح بنجاح في السحابة`, 'success');
                }}
            ];

            // دالة محددة لإغلاق جميع التعديلات المفتوحة وتصفير ألوان الأزرار المضيئة
            function disableAllMapTools() {
                map.pm.disableDraw();
                if(map.pm.globalDragModeEnabled()) map.pm.disableGlobalDragMode();
                if(map.pm.globalRemovalEnabled()) map.pm.disableGlobalRemovalMode();
                if(map.pm.globalCutModeEnabled()) map.pm.disableGlobalCutMode();
                
                // تنظيف التأثيرات الضوئية
                const allToolBtns = document.querySelectorAll('.ribbon-btn, .edit-tool-btn, .edit-tool-btn-wide');
                allToolBtns.forEach(btn => btn.classList.remove('ring-4', 'active-tool', 'ring-blue-500', 'ring-emerald-500', 'ring-orange-500', 'ring-purple-500', 'ring-red-500'));
            }

            // ربط أحداث أدوات الرسم
            if (canEditMap) {
                // تعريف الأدوات للربط الثنائي (Ribbon + Sidebar)
                const toolsMapping = [
                    { ribbonId: 'btnDrawPoly', sideId: 'sideBtnDrawPoly', mode: 'Polygon', color: 'emerald' },
                    { ribbonId: 'btnDrawLine', sideId: 'sideBtnDrawLine', mode: 'Line', color: 'blue' },
                    { ribbonId: 'btnDrawMarker', sideId: 'sideBtnDrawMarker', mode: 'Marker', color: 'orange' },
                    { ribbonId: 'btnDrawRect', sideId: 'sideBtnDrawRect', mode: 'Rectangle', color: 'cyan' },
                ];

                toolsMapping.forEach(tool => {
                    const setupTool = (id) => {
                        const btn = document.getElementById(id);
                        if(btn) {
                            btn.addEventListener('click', () => {
                                const isActive = btn.classList.contains('active-tool');
                                disableAllMapTools();
                                if(!isActive) {
                                    map.pm.enableDraw(tool.mode, { snappable: true, snapDistance: 20 });
                                    btn.classList.add('active-tool', `ring-4`, `ring-${tool.color}-500`);
                                    // تمييز الزر المقابل
                                    const otherBtnId = (id === tool.ribbonId) ? tool.sideId : tool.ribbonId;
                                    const otherBtn = document.getElementById(otherBtnId);
                                    if(otherBtn) otherBtn.classList.add('active-tool');
                                }
                            });
                        }
                    };
                    setupTool(tool.ribbonId);
                    setupTool(tool.sideId);
                });

                // أداة القص (Cut)
                const setupCut = (id) => {
                    const btn = document.getElementById(id);
                    if(btn) {
                        btn.addEventListener('click', () => {
                            const isActive = map.pm.globalCutModeEnabled();
                            disableAllMapTools();
                            if(!isActive) {
                                map.pm.enableGlobalCutMode();
                                btn.classList.add('active-tool', 'ring-4', 'ring-orange-500');
                                const other = document.getElementById(id === 'btnCutMode' ? 'sideBtnCutMode' : 'btnCutMode');
                                if(other) other.classList.add('active-tool');
                            }
                        });
                    }
                };
                setupCut('btnCutMode'); setupCut('sideBtnCutMode');

                // أداة التحريك (Drag)
                const setupDrag = (id) => {
                    const btn = document.getElementById(id);
                    if(btn) {
                        btn.addEventListener('click', () => {
                            const isActive = map.pm.globalDragModeEnabled();
                            disableAllMapTools();
                            if(!isActive) {
                                map.pm.enableGlobalDragMode();
                                btn.classList.add('active-tool', 'ring-4', 'ring-purple-500');
                                const other = document.getElementById(id === 'btnDragMode' ? 'sideBtnDragMode' : 'btnDragMode');
                                if(other) other.classList.add('active-tool');
                            }
                        });
                    }
                };
                setupDrag('btnDragMode'); setupDrag('sideBtnDragMode');

                // أداة الحذف (Delete)
                const setupDelete = (id) => {
                    const btn = document.getElementById(id);
                    if(btn) {
                        btn.addEventListener('click', () => {
                            const isActive = map.pm.globalRemovalEnabled();
                            disableAllMapTools();
                            if(!isActive) {
                                map.pm.enableGlobalRemovalMode();
                                btn.classList.add('active-tool', 'ring-4', 'ring-red-500');
                                const other = document.getElementById(id === 'btnDeleteMode' ? 'sideBtnDeleteMode' : 'btnDeleteMode');
                                if(other) other.classList.add('active-tool');
                            }
                        });
                    }
                };
                setupDelete('btnDeleteMode'); setupDelete('sideBtnDeleteMode');

                // أزرار الحفظ وباقي الوظائف
                const actionTools = [
                    { id: 'sideBtnSyncToCloud', action: () => document.getElementById('btnSyncToCloud')?.click() },
                    { id: 'sideBtnUndoEdits', action: () => document.getElementById('btnUndoEdits')?.click() },
                    { id: 'sideBtnSnapMode', action: () => document.getElementById('btnSnapMode')?.click() }
                ];
                actionTools.forEach(t => {
                    const btn = document.getElementById(t.id);
                    if(btn) btn.addEventListener('click', t.action);
                });

                // معالج رفع ملف GeoJSON
                const geoInput = document.getElementById('geoJsonInput');
                if(geoInput) {
                    geoInput.addEventListener('change', async (e) => {
                        const file = e.target.files[0];
                        if(!file) return;
                        const isMasterUpdate = geoInput.getAttribute('data-target') === 'master';
                        geoInput.removeAttribute('data-target'); // Reset

                        const reader = new FileReader();
                        reader.onload = async (event) => {
                            try {
                                const data = JSON.parse(event.target.result);
                                
                                if (isMasterUpdate) {
                                    if (confirm('هل أنت متأكد من اعتماد هذا الملف كمرجع رسمي للجميع؟')) {
                                        const res = await window.saveMasterGeoJson('zone', data);
                                        if (res.success) {
                                            showToast('تم تحديث الملف المعتمد في السحابة بنجاح', 'success');
                                            loadMasterGeoJsonData();
                                        }
                                    }
                                    return;
                                }

                                L.geoJSON(data, {
                                    style: { color: '#f59e0b', weight: 3, fillOpacity: 0.2 },
                                    onEachFeature: bindFeatureEvents
                                }).addTo(map);
                                showToast('تم استيراد البيانات بنجاح', 'success');
                            } catch(err) {
                                showToast('خطأ في تنسيق ملف GeoJSON', 'red');
                            }
                        };
                        reader.readAsText(file);
                    });
                }

                // عند الانتهاء من رسم أي شكل جديد إعادته للحالة الافتراضية وربط الحدث
                window.newDrawnLayers = window.newDrawnLayers || [];
                map.on('pm:create', (e) => {
                    const layer = e.layer;
                    window.newDrawnLayers.push(layer);
                    disableAllMapTools();
                    bindFeatureEvents(layer, { type: "Feature", properties: { created_at: new Date().toISOString() } }); 
                    showToast('تم إضافة الشكل. لا تنسى الحفظ في السحابة.', 'blue');
                });
            }

            // مصفوفة الطبقات المخصصة
            const customFeatureLayer = L.layerGroup().addTo(map);

            // دالة جلب البيانات الرسمية والمخصصة
            async function loadMasterGeoJsonData() {
                await bootstrapZoneStatuses();

                // 1. جلب المحافظات (غالباً ثابتة)
                fetch('gov.geojson').then(r => r.json()).then(data => {
                    if (geoJsonLayers.gov) map.removeLayer(geoJsonLayers.gov);
                    geoJsonLayers.gov = L.geoJSON(data, { 
                        style: { color: '#2c3e50', weight: 4, fillOpacity: 0.05, interactive: false } 
                    });
                    // map.addLayer(geoJsonLayers.gov); // إخفاء طبقة المحافظات افتراضياً
                });

                // 2. جلب الزونات (مع التحقق من وجود نسخة سحابية معتمدة)
                let zoneData = null;
                if (window.loadMasterGeoJson) {
                    zoneData = await window.loadMasterGeoJson('zone');
                }
                
                if (!zoneData) {
                    const res = await fetch('zone.geojson');
                    zoneData = await res.json();
                }

                if (zoneData) {
                    // دمج التحديثات المحفوظة مسبقاً من الفايربيز
                    if (window.loadAllZoneUpdates) {
                        try {
                            const updates = await window.loadAllZoneUpdates();
                            if (updates && typeof updates === 'object') {
                                zoneData.features.forEach(f => {
                                    const code = f.properties.zone_code || f.properties.area_code || f.properties.work_id || f.id;
                                    if (code && updates[code]) {
                                        Object.assign(f.properties, updates[code]);
                                    }
                                });
                            }
                        } catch (err) {
                            console.error("Failed to load zone updates:", err);
                        }
                    }

                    window.zoneGeoJsonData = zoneData;
                    if (geoJsonLayers.zone) map.removeLayer(geoJsonLayers.zone);
                    
                    const scopedFeatures = filterFeaturesForCurrentUser(zoneData.features || []);
                    geoJsonLayers.zone = L.geoJSON({ ...zoneData, features: scopedFeatures }, { 
                        style: getZoneStyle,
                        onEachFeature: (f, l) => bindFeatureEvents(l, f)
                    });
                    
                    // Always add by default or check if it was previously visible
                    map.addLayer(geoJsonLayers.zone);
                    
                    // تحديث الإحصائيات والرسوم البيانية
                    processZoneStatistics(scopedFeatures);
                    if (typeof initDashboardCharts === 'function') {
                        initDashboardCharts(); // Trigger chart redraw
                    }

                    // تفعيل الاستماع الفوري للتحديثات (Real-time)
                    if (window.listenToZoneUpdates && !window.realtimeListenerActive) {
                        window.realtimeListenerActive = true;
                        window.listenToZoneUpdates((updates) => {
                            if (!updates) return;
                            let dataChanged = false;
                            
                            // تحديث خريطة التحرير
                            if (geoJsonLayers.zone) {
                                geoJsonLayers.zone.eachLayer(layer => {
                                    const f = layer.feature;
                                    const code = f.properties.zone_code || f.properties.area_code || f.properties.work_id || f.id;
                                    if (code && updates[code]) {
                                        const oldProps = JSON.stringify(f.properties);
                                        Object.assign(f.properties, updates[code]);
                                        if (oldProps !== JSON.stringify(f.properties)) {
                                            if (layer.setStyle) layer.setStyle(getZoneStyle(f));
                                            dataChanged = true;
                                        }
                                    }
                                });
                            }
                            
                            // تحديث خريطة العرض (إن وجدت)
                            if (window.viewMapInstance) {
                                window.viewMapInstance.eachLayer(layer => {
                                    if (layer.feature && layer.feature.properties) {
                                        const code = layer.feature.properties.zone_code || layer.feature.properties.area_code || layer.feature.properties.work_id || layer.feature.id;
                                        if (code && updates[code]) {
                                            Object.assign(layer.feature.properties, updates[code]);
                                            if (layer.setStyle && typeof getZoneStyle === 'function') {
                                                layer.setStyle(getZoneStyle(layer.feature));
                                            }
                                        }
                                    }
                                });
                            }

                            if (dataChanged && window.zoneGeoJsonData?.features) {
                                window.zoneGeoJsonData.features.forEach(feature => {
                                    const code = feature.properties?.zone_code || feature.properties?.area_code || feature.properties?.work_id || feature.id;
                                    if (code && updates[code]) {
                                        Object.assign(feature.properties, updates[code]);
                                    }
                                });
                            }

                            // تحديث الإحصائيات لو صار في تغيير فعلي
                            if (dataChanged && window.zoneGeoJsonData) {
                                processZoneStatistics(filterFeaturesForCurrentUser(window.zoneGeoJsonData.features || []));
                            }
                        });
                    }
                }

                // 3. جلب الأشكال المرسومة يدوياً من السحاب
                if (window.loadDrawnFeatures) {
                    const cloudFeatures = await window.loadDrawnFeatures();
                    customFeatureLayer.clearLayers();
                    cloudFeatures.forEach(feat => {
                        L.geoJSON(feat, {
                            style: { color: '#3b82f6', weight: 3, dashArray: '5, 5' },
                            onEachFeature: (f, l) => {
                                l.feature = f;
                                bindFeatureEvents(l, f);
                            }
                        }).addTo(customFeatureLayer);
                    });
                }
            }

            // تشغيل التحميل الأولي
            loadMasterGeoJsonData().then(() => {
                if (typeof initHierarchicalDropdowns === 'function') initHierarchicalDropdowns();
                if (typeof renderContentsPane === 'function') renderContentsPane();
            });

            // ================================================================
            // منطق لوحة المحتويات (Contents Pane Logic)
            // ================================================================
            const contentsPanel = document.getElementById('contentsPanel');
            
            // ----------------------------------------------------------------
            // نظام القوائم المنسدلة الهيكلية (Hierarchical Selects)
            // ----------------------------------------------------------------
            window.hierarchyData = {};

            window.initHierarchicalDropdowns = function() {
                if (!geoJsonLayers.zone) return;
                
                const data = {};
                geoJsonLayers.zone.eachLayer(layer => {
                    const p = layer.feature.properties;
                    const gov = p.governorat || 'غير محدد';
                    const muni = p.municipali || 'غير محدد';
                    const neigh = p.neighborho || 'غير محدد';

                    if (!data[gov]) data[gov] = {};
                    if (!data[gov][muni]) data[gov][muni] = new Set();
                    data[gov][muni].add(neigh);
                });

                window.hierarchyData = data;
                populateSelect('filterGov', Object.keys(data).sort());
            };

            function populateSelect(id, items, defaultText = 'الكل') {
                const el = document.getElementById(id);
                if (!el) return;
                el.innerHTML = `<option value="all">${el.previousElementSibling?.innerText || 'الكل'}</option>`;
                items.forEach(item => {
                    const opt = document.createElement('option');
                    opt.value = item;
                    opt.textContent = item;
                    el.appendChild(opt);
                });
            }

            const fGov = document.getElementById('filterGov');
            const fMuni = document.getElementById('filterMuni');
            const fNeigh = document.getElementById('filterNeigh');

            fGov?.addEventListener('change', () => {
                const gov = fGov.value;
                if (gov === 'all') {
                    populateSelect('filterMuni', []);
                    populateSelect('filterNeigh', []);
                } else {
                    const munis = Object.keys(window.hierarchyData[gov] || {}).sort();
                    populateSelect('filterMuni', munis);
                    populateSelect('filterNeigh', []);
                }
                performMapFiltering();
            });

            fMuni?.addEventListener('change', () => {
                const gov = fGov.value;
                const muni = fMuni.value;
                if (muni === 'all') {
                    populateSelect('filterNeigh', []);
                } else {
                    const neighs = Array.from(window.hierarchyData[gov][muni] || []).sort();
                    populateSelect('filterNeigh', neighs);
                }
                performMapFiltering();
            });

            fNeigh?.addEventListener('change', performMapFiltering);



            const toggleContentsBtn = document.getElementById('toggleContentsBtn');
            const closeContentsBtn = document.getElementById('closeContentsBtn');
            const pinContentsBtn = document.getElementById('pinContentsBtn');
            const contentsContainer = document.getElementById('contentsContainer');
            let isContentsPinned = false;

            // تعريف محددات اللوحات والأزرار
            const panels = [
                { id: 'contentsPanel', btn: 'toggleContentsBtn', close: 'closeContentsBtn', pin: 'pinContentsBtn' },
                { id: 'editToolbarPanel', btn: 'toggleEditBtn', close: 'closeEditBtn', pin: 'pinEditBtn' },
                { id: 'searchFilterPanel', btn: 'toggleSearchBtn', close: 'closeSearchBtn', pin: 'pinSearchBtn' },
                { id: 'adminPanel', btn: 'toggleAdminBtn', close: 'closeAdminBtn', pin: 'pinAdminBtn' },
                { id: 'exportPanel', btn: 'toggleExportBtn', close: 'closeExportBtn', pin: 'pinExportBtn' }
            ];

            panels.forEach(p => {
                const panel = document.getElementById(p.id);
                const btn = document.getElementById(p.btn);
                const close = document.getElementById(p.close);
                const pin = document.getElementById(p.pin);

                if (btn && panel) {
                    btn.addEventListener('click', () => {
                        const isOpening = !panel.classList.contains('show-panel');
                        
                        // إغلاق جميع اللوحات الأخرى أولاً
                        panels.forEach(other => {
                            const otherPanel = document.getElementById(other.id);
                            const otherBtn = document.getElementById(other.btn);
                            if (otherPanel) {
                                otherPanel.classList.add('hidden-panel');
                                otherPanel.classList.remove('show-panel');
                            }
                            if (otherBtn) otherBtn.classList.remove('hide-toggle-btn');
                        });

                        if (isOpening) {
                            panel.classList.add('show-panel');
                            panel.classList.remove('hidden-panel');
                            btn.classList.add('hide-toggle-btn');
                        }
                    });
                }

                if (close && panel) {
                    close.addEventListener('click', () => {
                        panel.classList.add('hidden-panel');
                        panel.classList.remove('show-panel');
                        if (btn) btn.classList.remove('hide-toggle-btn');
                    });
                }
            });

            // ----------------------------------------------------------------
            // منطق التحديد المتقدم (Advanced Expression Builder)
            // ----------------------------------------------------------------
            window.switchAdvMode = function(mode) {
                const easy = document.getElementById('advModeEasy');
                const manual = document.getElementById('advModeManual');
                const btnEasy = document.getElementById('modeEasy');
                const btnManual = document.getElementById('modeManual');

                if (mode === 'easy') {
                    easy.classList.remove('hidden');
                    manual.classList.add('hidden');
                    btnEasy.classList.add('bg-white', 'text-amber-900', 'shadow-sm');
                    btnManual.classList.remove('bg-white', 'text-amber-900', 'shadow-sm');
                } else {
                    easy.classList.add('hidden');
                    manual.classList.remove('hidden');
                    btnManual.classList.add('bg-white', 'text-amber-900', 'shadow-sm');
                    btnEasy.classList.remove('bg-white', 'text-amber-900', 'shadow-sm');
                }
                window.currentAdvMode = mode;
            };
            window.currentAdvMode = 'easy';

            const toggleAdvBtn = document.getElementById('toggleAdvancedFilterBtn');
            const advSection = document.getElementById('advancedFilterSection');
            const advFoldIcon = document.getElementById('advFoldIcon');

            if (toggleAdvBtn) {
                toggleAdvBtn.addEventListener('click', () => {
                    const isHidden = advSection.classList.toggle('hidden');
                    advFoldIcon.classList.toggle('rotate-180', !isHidden);
                });
            }

            const btnApplyAdv = document.getElementById('btnApplyAdvFilter');
            const btnClearAdv = document.getElementById('btnClearAdvFilter');
            
            function applyAdvancedSelection() {
                if (!geoJsonLayers.zone) return;

                let filterFn;
                if (window.currentAdvMode === 'easy') {
                    const field = document.getElementById('advField').value;
                    const op = document.getElementById('advOp').value;
                    const rawVal = document.getElementById('advValue').value;
                    const val = isNaN(rawVal) ? rawVal : parseFloat(rawVal);

                    filterFn = (props) => {
                        const target = props[field];
                        if (op === '>') return target > val;
                        if (op === '<') return target < val;
                        if (op === '==') return target == val;
                        if (op === '!=') return target != val;
                        if (op === 'includes') return String(target).toLowerCase().includes(String(val).toLowerCase());
                        return false;
                    };
                } else {
                    const script = document.getElementById('advManualScript').value;
                    try {
                        filterFn = new Function('props', `return ${script}`);
                    } catch (e) {
                        showToast('خطأ في كتابة المعادلة', 'error');
                        return;
                    }
                }

                let matchCount = 0;
                geoJsonLayers.zone.eachLayer(layer => {
                    const isMatch = filterFn(layer.feature.properties);
                    if (isMatch) {
                        layer.setStyle({
                            color: '#fbbf24', // Highlight color
                            weight: 3,
                            fillOpacity: 0.9,
                            fillColor: '#fbbf24'
                        });
                        matchCount++;
                    } else {
                        layer.setStyle({
                            fillOpacity: 0.1,
                            opacity: 0.2,
                            interactive: false
                        });
                    }
                });
                showToast(`تم تحديد ${matchCount} مربع مطابق`);
            }

            if (btnApplyAdv) btnApplyAdv.addEventListener('click', applyAdvancedSelection);
            if (btnClearAdv) {
                btnClearAdv.addEventListener('click', () => {
                   if(geoJsonLayers.zone) {
                       geoJsonLayers.zone.eachLayer(layer => {
                           const style = (typeof getZoneStyle === 'function') ? getZoneStyle(layer.feature) : { fillOpacity: 0.7 };
                           layer.setStyle({ ...style, interactive: true });
                       });
                   }
                });
            }

            // ----------------------------------------------------------------
            // نظام نتائج البحث وتصدير البيانات (Results & Export)
            // ----------------------------------------------------------------
            const resultsPanel = document.getElementById('leftResultsPanel');
            const resultsList = document.getElementById('resultsList');
            const resultsHeader = document.getElementById('resultsHeader');

            window.zoomToZone = function(layerId) {
                if (!geoJsonLayers.zone) return;
                geoJsonLayers.zone.eachLayer(layer => {
                    if (layer._leaflet_id == layerId || layer.feature.properties.objectid == layerId) {
                        map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 17 });
                        layer.openPopup();
                        // تمييز البطاقة
                        document.querySelectorAll('.result-card').forEach(c => c.classList.remove('active'));
                        document.querySelector(`[onclick*="${layerId}"]`)?.classList.add('active');
                    }
                });
            };

            window.clearResultsList = function() {
                if(resultsList) resultsList.innerHTML = '';
                resultsHeader?.classList.add('hidden');
                resultsPanel?.classList.add('hide');
                resultsPanel?.classList.remove('show');
            };

            function updateResultsUI(matches) {
                if (!resultsList) return;
                resultsList.innerHTML = '';
                
                if (matches.length > 0) {
                    resultsHeader?.classList.remove('hidden');
                    resultsPanel?.classList.remove('hide');
                    resultsPanel?.classList.add('show');
                    
                    matches.forEach(layer => {
                        const p = layer.feature.properties;
                        const card = document.createElement('div');
                        card.className = 'result-card animate__animated animate__fadeInLeft';
                        card.onclick = () => zoomToZone(layer._leaflet_id);
                        
                        card.innerHTML = `
                            <div class="flex justify-between items-start">
                                <span class="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">${p.zone_code || 'N/A'}</span>
                                <span class="text-[9px] text-gray-400 font-mono">#${p.objectid}</span>
                            </div>
                            <h5 class="text-xs font-bold text-gray-800">${p.name_1 || 'بدون اسم'}</h5>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="flex-grow h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div class="h-full bg-emerald-500" style="width: ${p.completion_rate || 0}%"></div>
                                </div>
                                <span class="text-[9px] font-bold text-gray-500">${Math.round(p.completion_rate || 0)}%</span>
                            </div>
                            <p class="text-[9px] text-gray-500 italic"><i class="fa-solid fa-location-dot mr-1"></i> ${p.neighborho || ''}</p>
                        `;
                        resultsList.appendChild(card);
                    });
                } else {
                    clearResultsList();
                }
            }

            // وظائف تصدير البيانات من اللوحة الجانبية
            const getVisibleFeatures = () => {
                if (!geoJsonLayers.zone) return [];
                const visibleData = [];
                geoJsonLayers.zone.eachLayer(layer => {
                    if (map.hasLayer(layer) && layer.options.interactive !== false) {
                        visibleData.push(layer.feature.properties);
                    }
                });
                return visibleData;
            };

            const getVisibleGeoJSON = () => {
                if (!geoJsonLayers.zone) return null;
                const visibleFeatures = [];
                geoJsonLayers.zone.eachLayer(layer => {
                    if (map.hasLayer(layer) && layer.options.interactive !== false) {
                        visibleFeatures.push(layer.feature);
                    }
                });
                return { type: "FeatureCollection", features: visibleFeatures };
            };

            const sidebarExportCsvBtn = document.getElementById('sidebarExportCsvBtn');
            if (sidebarExportCsvBtn) {
                sidebarExportCsvBtn.addEventListener('click', () => {
                    const visibleData = getVisibleFeatures();
                    if (visibleData.length === 0) {
                        showToast('لا توجد بيانات مطابقة لتصديرها', 'warning');
                        return;
                    }
                    const headers = Object.keys(visibleData[0]).join(',');
                    const rows = visibleData.map(obj => 
                        Object.values(obj).map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',')
                    );
                    const csvContent = "\uFEFF" + [headers, ...rows].join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.setAttribute('href', URL.createObjectURL(blob));
                    link.setAttribute('download', `Gaza_GIS_Selection_${new Date().toLocaleDateString()}.csv`);
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast(`تم تصدير ${visibleData.length} سجل بنجاح`);
                });
            }

            const sidebarExportGeojsonBtn = document.getElementById('sidebarExportGeojsonBtn');
            if (sidebarExportGeojsonBtn) {
                sidebarExportGeojsonBtn.addEventListener('click', () => {
                    const visibleGeoJSON = getVisibleGeoJSON();
                    if (!visibleGeoJSON || visibleGeoJSON.features.length === 0) {
                        showToast('لا توجد بيانات مطابقة لتصديرها', 'warning');
                        return;
                    }
                    const blob = new Blob([JSON.stringify(visibleGeoJSON)], { type: 'application/geo+json;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.setAttribute('href', URL.createObjectURL(blob));
                    link.setAttribute('download', `Gaza_GIS_Selection_${new Date().toLocaleDateString()}.geojson`);
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast(`تم تصدير ${visibleGeoJSON.features.length} شكل جغرافي بنجاح`);
                });
            }
            
            const searchInput = document.getElementById('mapMainSearchInput');
            const statusFilter = document.getElementById('filterZoneStatus');

            function performMapFiltering() {
                const query = searchInput?.value.toLowerCase().trim() || '';
                const status = statusFilter?.value || 'all';
                
                const govVal = fGov?.value || 'all';
                const muniVal = fMuni?.value || 'all';
                const neighVal = fNeigh?.value || 'all';

                if (!geoJsonLayers.zone) return;

                const matches = [];
                const isFilterActive = query !== '' || status !== 'all' || govVal !== 'all' || muniVal !== 'all' || neighVal !== 'all';

                geoJsonLayers.zone.eachLayer(layer => {
                    const props = layer.feature.properties;
                    let mSearch = !query || 
                        String(props.zone_code || '').toLowerCase().includes(query) ||
                        String(props.work_id || '').toLowerCase().includes(query) ||
                        String(props.area_code || '').toLowerCase().includes(query);
                    let mStatus = status === 'all' || getFeatureStatus(props) === status;
                    let mGov = govVal === 'all' || props.governorat === govVal;
                    let mMuni = muniVal === 'all' || props.municipali === muniVal;
                    let mNeigh = neighVal === 'all' || props.neighborho === neighVal;

                    if (mSearch && mStatus && mGov && mMuni && mNeigh) {
                        matches.push(layer);
                        if (!map.hasLayer(layer)) {
                            map.addLayer(layer);
                        }
                        
                        const baseStyle = (typeof getZoneStyle === 'function') ? getZoneStyle(layer.feature) : { fillOpacity: 0.7 };
                        
                        if (isFilterActive) {
                            layer.setStyle({
                                ...baseStyle,
                                weight: 2,
                                opacity: 1,
                                fillOpacity: Math.max(0.6, baseStyle.fillOpacity || 0),
                                interactive: true
                            });
                            layer.bringToFront();
                        } else {
                            layer.setStyle({
                                ...baseStyle,
                                weight: 1.5,
                                opacity: 0.8,
                                fillOpacity: 0.35,
                                interactive: true
                            });
                        }
                    } else {
                        if (isFilterActive) {
                            if (!map.hasLayer(layer)) {
                                map.addLayer(layer);
                            }
                            const baseStyle = (typeof getZoneStyle === 'function') ? getZoneStyle(layer.feature) : {};
                            
                            layer.setStyle({
                                ...baseStyle,
                                weight: 1,
                                opacity: 0.2,
                                fillOpacity: 0.1,
                                interactive: false
                            });
                        } else {
                            if (!map.hasLayer(layer)) {
                                map.addLayer(layer);
                            }
                            const baseStyle = (typeof getZoneStyle === 'function') ? getZoneStyle(layer.feature) : { fillOpacity: 0.35 };
                            layer.setStyle({
                                ...baseStyle,
                                weight: 1.5,
                                opacity: 0.8,
                                fillOpacity: 0.35,
                                interactive: true
                            });
                        }
                    }
                });

                // الزووم الذكي لمجموع النتائج
                if (isFilterActive) {
                    updateResultsUI(matches);
                    if (matches.length > 0) {
                        const bounds = L.latLngBounds(matches.map(l => l.getBounds()));
                        map.fitBounds(bounds, { padding: [100, 100], maxZoom: 16 });
                    }
                } else {
                    clearResultsList();
                }
            }

            if (searchInput) searchInput.addEventListener('input', performMapFiltering);
            if (statusFilter) statusFilter.addEventListener('change', performMapFiltering);

            // ربط أدوات إضافة البيانات من لوحة الطبقات
            const sideGeoInput = document.getElementById('sideGeoJsonInput');
            const sideAddGeoJsonBtn = document.getElementById('sideAddGeoJsonBtn');
            const sideAddUrlBtn = document.getElementById('sideAddUrlBtn');

            if (sideAddGeoJsonBtn && sideGeoInput) {
                sideAddGeoJsonBtn.addEventListener('click', () => sideGeoInput.click());
            }
            if (sideAddUrlBtn) {
                sideAddUrlBtn.addEventListener('click', () => {
                   const url = prompt('أدخل رابط الـ Layer (ArcGIS/GeoJSON):');
                   if(url && window.addLayerFromUrl) window.addLayerFromUrl(url);
                });
            }
            if (sideGeoInput) {
                sideGeoInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if(!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const data = JSON.parse(event.target.result);
                        L.geoJSON(data, { 
                            style: { color: '#f59e0b', weight: 2 },
                            onEachFeature: bindFeatureEvents 
                        }).addTo(map);
                        showToast('تم استيراد البيانات بنجزاج');
                    };
                    reader.readAsText(file);
                });
            }

            // ربط أدوات المطور من لوحة الإدارة
            const sideBtnReload = document.getElementById('sideBtnReloadMasterData');
            const sideBtnUpdate = document.getElementById('sideBtnUpdateMasterData');
            const sideBtnClearCache = document.getElementById('sideBtnClearCache');
            
            if (sideBtnReload) {
                sideBtnReload.addEventListener('click', async () => {
                    showToast('جاري تحديث البيانات الرسمية...');
                    await loadMasterGeoJsonData();
                    if (typeof renderContentsPane === 'function') renderContentsPane();
                });
            }
            if (sideBtnUpdate) {
                sideBtnUpdate.addEventListener('click', () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.geojson,.json';
                    input.onchange = async (e) => {
                        const file = e.target.files[0];
                        if(!file) return;
                        if(confirm('هل تريد فعلاً اعتماد هذا الملف كمرجع رسمي؟')) {
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                                const data = JSON.parse(event.target.result);
                                const res = await window.saveMasterGeoJson('zone', data);
                                if(res.success) {
                                    showToast('تم اعتماد الملف بنجاح', 'success');
                                    loadMasterGeoJsonData();
                                }
                            };
                            reader.readAsText(file);
                        }
                    };
                    input.click();
                });
            }
            if (sideBtnClearCache) {
                sideBtnClearCache.addEventListener('click', () => {
                    localStorage.clear();
                    showToast('تم مسح التخزين المؤقت، سيتم إعادة التحميل...');
                    setTimeout(() => location.reload(), 1500);
                });
            }

            // دالة بناء عناصر القائمة الجانبية
            window.renderContentsPane = function() {
                if (!contentsContainer) return;
                contentsContainer.innerHTML = '';

                // 1. مجموعة خرائط الأساس
                const basemapGroup = createLayerGroupHeader('خرائط الأساس');
                contentsContainer.appendChild(basemapGroup);
                
                const basemaps = [
                    { id: 'light', name: 'الخريطة الفاتحة', icon: 'fa-sun' },
                    { id: 'dark', name: 'الخريطة الداكنة', icon: 'fa-moon' },
                    { id: 'satellite', name: 'صور الأقمار الصناعية', icon: 'fa-earth-africa' }
                ];

                basemaps.forEach(bm => {
                    const isActive = document.body.classList.contains(bm.id) || 
                                     (bm.id === 'light' && !document.body.classList.contains('dark') && !document.body.classList.contains('satellite'));
                    
                    const item = createLayerItem({
                        id: `bm-${bm.id}`,
                        name: bm.name,
                        icon: bm.icon,
                        checked: isActive,
                        type: 'radio',
                        onToggle: () => {
                            if (window.switchMapTheme) window.switchMapTheme(bm.id);
                            setTimeout(renderContentsPane, 100);
                        }
                    });
                    contentsContainer.appendChild(item);
                });

                // 2. الطبقات الرسمية
                const officialGroup = createLayerGroupHeader('الطبقات الرسمية');
                contentsContainer.appendChild(officialGroup);

                const layers = [
                    { key: 'gov', name: 'حدود المحافظات', icon: 'fa-map-location-dot', color: '#2c3e50' },
                    { key: 'zone', name: 'زونات المشاريع', icon: 'fa-vector-square', color: '#3b82f6' }
                ];

                layers.forEach(layer => {
                    const mapLayer = geoJsonLayers[layer.key];
                    const isVisible = mapLayer && map.hasLayer(mapLayer);

                    const item = createLayerItem({
                        id: `layer-${layer.key}`,
                        name: layer.name,
                        icon: layer.icon,
                        color: layer.color,
                        checked: isVisible,
                        opacity: mapLayer ? (mapLayer.options.opacity || 1) : 1,
                        onToggle: (checked) => {
                            if (mapLayer) {
                                if (checked) map.addLayer(mapLayer);
                                else map.removeLayer(mapLayer);
                            }
                        },
                        onOpacity: (val) => {
                            if (mapLayer) {
                                if (mapLayer.setStyle) mapLayer.setStyle({ opacity: val, fillOpacity: val * 0.2 });
                                else if (mapLayer.setOpacity) mapLayer.setOpacity(val);
                            }
                        },
                        onZoom: () => {
                            if (mapLayer) map.fitBounds(mapLayer.getBounds());
                        }
                    });
                    contentsContainer.appendChild(item);
                });

                // 3. الرسوم السحابية والمضافة
                const customGroup = createLayerGroupHeader('الرسومات والبيانات المضافة');
                contentsContainer.appendChild(customGroup);

                // ملامح مضافة (Cloud Drawn)
                const isCloudVisible = true; // For now
                const cloudItem = createLayerItem({
                    id: 'layer-cloud',
                    name: 'الرسومات السحابية',
                    icon: 'fa-cloud-meatball',
                    color: '#6366f1',
                    checked: map.hasLayer(customFeatureLayer),
                    onToggle: (checked) => {
                        if (checked) map.addLayer(customFeatureLayer);
                        else map.removeLayer(customFeatureLayer);
                    },
                    onZoom: () => {
                        const bounds = L.featureGroup(customFeatureLayer.getLayers()).getBounds();
                        if (bounds.isValid()) map.fitBounds(bounds);
                    }
                });
                contentsContainer.appendChild(cloudItem);

                updateActiveLayerCount();
            };

            function createLayerGroupHeader(title) {
                const div = document.createElement('div');
                div.className = 'layer-group-header';
                div.innerText = title;
                return div;
            }

            function createLayerItem(options) {
                const div = document.createElement('div');
                div.className = 'layer-item animate-fade-in';
                div.innerHTML = `
                    <div class="layer-item-main">
                        <div class="layer-info" id="zoom-${options.id}">
                            <div class="layer-icon" style="color: ${options.color || '#3b82f6'}">
                                <i class="fa-solid ${options.icon || 'fa-layer-group'}"></i>
                            </div>
                            <span class="layer-name">${options.name}</span>
                        </div>
                        <div class="layer-actions">
                            ${options.onZoom ? `<button class="layer-action-btn zoom-btn" title="تركيز"><i class="fa-solid fa-expand"></i></button>` : ''}
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="${options.type || 'checkbox'}" name="${options.type === 'radio' ? 'toc-basemap' : ''}" 
                                       class="sr-only peer" ${options.checked ? 'checked' : ''}>
                                <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                    ${options.onOpacity ? `
                        <div class="px-2">
                             <input type="range" class="layer-opacity-slider" min="0" max="1" step="0.1" value="${options.opacity || 1}">
                        </div>
                    ` : ''}
                `;

                const checkbox = div.querySelector('input');
                checkbox.addEventListener('change', (e) => options.onToggle(e.target.checked));

                if (options.onOpacity) {
                    const slider = div.querySelector('.layer-opacity-slider');
                    slider.addEventListener('input', (e) => options.onOpacity(parseFloat(e.target.value)));
                }

                if (options.onZoom) {
                    div.querySelector('.zoom-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        options.onZoom();
                    });
                    div.querySelector('.layer-info').addEventListener('dblclick', options.onZoom);
                }

                return div;
            }

            function updateActiveLayerCount() {
                const count = document.querySelectorAll('.layer-item input:checked').length;
                const badge = document.getElementById('activeLayerCount');
                if (badge) badge.innerText = count;
            }

            // لوحة البيانات الجانبية
            const attributesPanel = document.getElementById('attributesPanel');
            const closeAttrPanel = document.getElementById('closeAttrPanel');
            const attributesContainer = document.getElementById('attributesContainer');
            const attributeControls = document.getElementById('attributeControls');
            const addPropertyBtn = document.getElementById('addPropertyBtn');
            const undoBtn = document.getElementById('undoBtn');
            const downloadGeoJsonBtn = document.getElementById('downloadGeoJsonBtn');
            const saveAttributesBtn = document.getElementById('saveAttributesBtn');

            // Hide/Show controls based on user role
            if (addPropertyBtn) {
                if (window.currentUser && window.currentUser.role === 'admin') {
                    addPropertyBtn.classList.remove('hidden');
                } else {
                    addPropertyBtn.classList.add('hidden');
                }
            }
            let currentSelectedLayer = null;
            let lastSavedProperties = null;
            let lastSelectedFeatureKey = null;

            const statusFieldNames = ['حالة الحصر', 'type_statu', 'حالة_الحصر', 'Status'];
            const reservedFields = ['OBJECTID', 'OBJECTID_1', 'Shape_Area', 'Shape_Length'];

            function isStatusField(key) {
                return statusFieldNames.includes(key);
            }

            function showToast(message, type = 'info') {
                const toast = document.createElement('div');
                toast.className = 'fixed top-6 left-6 z-[99999] rounded-2xl px-5 py-3 text-sm shadow-2xl text-white animate-fade-in';
                toast.style.backgroundColor = type === 'success' ? '#22c55e' : type === 'warning' ? '#f59e0b' : type === 'red' ? '#ef4444' : '#2563eb';
                toast.innerText = message;
                document.body.appendChild(toast);
                setTimeout(() => {
                    toast.classList.add('opacity-0');
                    setTimeout(() => toast.remove(), 400);
                }, 2500);
            }

            function updateUndoButtonVisibility() {
                if (!undoBtn) return;
                if (window.currentUser && window.currentUser.role === 'admin') {
                    undoBtn.classList.remove('hidden');
                } else {
                    undoBtn.classList.add('hidden');
                }
            }

            function copyProperties(props) {
                return props ? JSON.parse(JSON.stringify(props)) : {};
            }

            function updateZoneGeoJsonFeatureProperties(feature) {
                if (!feature || !feature.properties || !window.zoneGeoJsonData || !Array.isArray(window.zoneGeoJsonData.features)) return;
                const featureId = feature.id;
                const zoneCode = feature.properties.zone_code || feature.properties.area_code || feature.properties.work_id;
                window.zoneGeoJsonData.features.forEach(f => {
                    if (!f.properties) return;
                    if (featureId !== undefined && f.id === featureId) {
                        f.properties = copyProperties(feature.properties);
                    } else if (zoneCode && (f.properties.zone_code === zoneCode || f.properties.area_code === zoneCode || f.properties.work_id === zoneCode)) {
                        f.properties = copyProperties(feature.properties);
                    }
                });
            }

            function restorePreviousProperties() {
                if (!currentSelectedLayer || !lastSavedProperties) {
                    showToast('لا يوجد ما يمكن التراجع عنه', 'warning');
                    return;
                }
                if (!currentSelectedLayer.feature) return;
                currentSelectedLayer.feature.properties = copyProperties(lastSavedProperties);
                updateZoneGeoJsonFeatureProperties(currentSelectedLayer.feature);
                openAttributesPanel(currentSelectedLayer);
                if (currentSelectedLayer.setStyle) currentSelectedLayer.setStyle(getZoneStyle(currentSelectedLayer.feature));
                showToast('تم التراجع عن التغييرات', 'success');
            }


            function createAttributeRow(key, value, isNew = false) {
                const row = document.createElement('div');
                row.className = 'attribute-row flex flex-col gap-2 p-4 rounded-3xl bg-white/70 border border-gray-200/70 shadow-sm relative';
                if (!isNew) row.dataset.fieldKey = key;

                const keyWrapper = document.createElement('div');
                keyWrapper.className = 'flex items-center justify-between gap-3';

                const keyInput = document.createElement('input');
                keyInput.type = 'text';
                keyInput.value = key || '';
                keyInput.placeholder = 'اسم الحقل';
                keyInput.className = 'w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all';
                if (!isNew) {
                    keyInput.readOnly = true;
                    keyInput.classList.add('bg-white');
                }
                keyInput.dataset.fieldKeyInput = 'true';

                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.className = 'text-red-500 hover:text-red-600 transition-colors text-sm font-bold';
                removeButton.innerHTML = '<i class="fa-solid fa-trash"></i> حذف';
                removeButton.title = 'حذف هذا الحقل';
                removeButton.addEventListener('click', () => {
                    const fieldKey = keyInput.value.trim();
                    if (!fieldKey) return;
                    if (!confirm(`هل أنت متأكد من حذف الحقل '${fieldKey}'؟`)) return;
                    removePropertyFromAllFeatures(fieldKey);
                    row.remove();
                    showToast(`تم حذف الحقل '${fieldKey}'`, 'warning');
                });

                keyWrapper.appendChild(keyInput);
                keyWrapper.appendChild(removeButton);
                row.appendChild(keyWrapper);

                function createStatusControl(fieldValue) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'flex items-center gap-2';
                    wrapper.dataset.fieldValueInput = 'true';

                    const select = document.createElement('select');
                    select.className = 'w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all';
                    select.dataset.fieldValueInput = 'true';

                    const labels = getZoneStatusLabels();
                    if (fieldValue && !labels.includes(fieldValue)) {
                        labels.push(fieldValue);
                    }

                    labels.forEach(option => {
                        const opt = document.createElement('option');
                        opt.value = option;
                        opt.textContent = option;
                        if (option === fieldValue) opt.selected = true;
                        select.appendChild(opt);
                    });

                    const addBtn = document.createElement('button');
                    addBtn.type = 'button';
                    addBtn.className = 'px-3 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold whitespace-nowrap hover:bg-blue-700 transition-colors';
                    addBtn.innerHTML = '<i class="fa-solid fa-plus ml-1"></i>نوع جديد';

                    addBtn.addEventListener('click', async () => {
                        const newLabel = String(prompt('أدخل اسم نوع الحصر الجديد') || '').trim();
                        if (!newLabel) return;

                        const exists = getOrderedZoneStatuses().some(item => item.label === newLabel);
                        if (!exists) {
                            const nextStatuses = [
                                ...getOrderedZoneStatuses(),
                                {
                                    label: newLabel,
                                    color: pickNextZoneStatusColor(zoneStatusOptions),
                                    order: getOrderedZoneStatuses().length + 1,
                                    active: true
                                }
                            ];

                            if (window.saveZoneStatuses) {
                                const result = await window.saveZoneStatuses(nextStatuses);
                                if (!result?.success) {
                                    showToast('فشل حفظ نوع الحصر الجديد', 'red');
                                    return;
                                }
                                zoneStatusOptions = (result.items || nextStatuses).map((item, index) => normalizeZoneStatusEntry(item, index)).filter(item => item.label);
                                if (result.localOnly) {
                                    showToast('تمت إضافة النوع محلياً فقط، افحص قواعد Firebase', 'warning');
                                } else {
                                    showToast('تمت إضافة نوع الحصر وربطه بالنظام', 'success');
                                }
                            } else {
                                zoneStatusOptions = nextStatuses;
                                showToast('تمت إضافة نوع الحصر محلياً', 'warning');
                            }
                        }

                        renderZoneStatusFilterOptions();
                        injectMapLegend('gazaMapWrapper');
                        injectMapLegend('viewMapWrapper');

                        if (!Array.from(select.options).some(opt => opt.value === newLabel)) {
                            const opt = document.createElement('option');
                            opt.value = newLabel;
                            opt.textContent = newLabel;
                            select.appendChild(opt);
                        }
                        select.value = newLabel;
                    });

                    wrapper.appendChild(select);
                    wrapper.appendChild(addBtn);
                    return wrapper;
                }

                function createValueControl(fieldKey, fieldValue) {
                    if (isStatusField(fieldKey)) {
                        return createStatusControl(fieldValue);
                    }
                    const valueInput = document.createElement('input');
                    valueInput.type = 'text';
                    valueInput.value = fieldValue !== null && fieldValue !== undefined ? fieldValue : '';
                    valueInput.placeholder = 'قيمة الحقل';
                    valueInput.className = 'w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all';
                    valueInput.dataset.fieldValueInput = 'true';
                    return valueInput;
                }

                let valueControl = createValueControl(key, value);
                keyInput.addEventListener('change', () => {
                    const fieldKey = keyInput.value.trim();
                    const previousSelect = valueControl.matches?.('select') ? valueControl : valueControl.querySelector?.('select');
                    const previousValue = previousSelect ? previousSelect.value : (valueControl.value || '');
                    const nextControl = createValueControl(fieldKey, previousValue);
                    const currentTag = valueControl.matches?.('select') ? 'select' : valueControl.tagName.toLowerCase();
                    const nextTag = nextControl.matches?.('select') ? 'select' : nextControl.tagName.toLowerCase();
                    if (nextTag !== currentTag || isStatusField(fieldKey)) {
                        row.replaceChild(nextControl, valueControl);
                        valueControl = nextControl;
                    }
                });

                row.appendChild(valueControl);
                return row;
            }

            function removePropertyFromAllFeatures(key) {
                if (!key) return;
                if (window.zoneGeoJsonData && Array.isArray(window.zoneGeoJsonData.features)) {
                    window.zoneGeoJsonData.features.forEach(feature => {
                        if (feature.properties && feature.properties.hasOwnProperty(key)) {
                            delete feature.properties[key];
                        }
                    });
                }
                if (currentSelectedLayer && currentSelectedLayer.feature && currentSelectedLayer.feature.properties) {
                    delete currentSelectedLayer.feature.properties[key];
                }
            }

            function downloadGeoJsonFile() {
                const data = window.zoneGeoJsonData || { type: 'FeatureCollection', features: [] };
                const json = JSON.stringify(data, null, 2);
                const blob = new Blob([json], { type: 'application/geo+json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'zone-updated.geojson';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }

            if(closeAttrPanel) {
                closeAttrPanel.addEventListener('click', () => {
                    attributesPanel.classList.remove('show-panel');
                    setTimeout(() => attributesPanel.classList.add('hidden-panel'), 500);
                });
            }

            function openAttributesPanel(layer) {
                currentSelectedLayer = layer;
                attributesContainer.innerHTML = '';
                
                const props = layer.feature && layer.feature.properties ? layer.feature.properties : {};
                
                if (Object.keys(props).length === 0) {
                    attributesContainer.innerHTML = '<p class="text-gray-500 text-sm font-semibold bg-white/50 p-4 rounded-xl border border-white/60">لا توجد بيانات وصفية مرفقة بهذا الشكل، سيتم إضافة بيانات جديدة تلقائياً إذا قمت بإدخالها لاحقاً.</p>';
                    props.Name = '';
                }

                lastSavedProperties = copyProperties(props);
                lastSelectedFeatureKey = props.zone_code || props.area_code || props.work_id || currentSelectedLayer.feature?.id || null;
                updateUndoButtonVisibility();

                const isAdmin = window.currentUser && window.currentUser.role === 'admin';
                const restrictedFields = ['type_statu', 'حالة الحصر', 'حالة_الحصر', 'Status', 'engineers_', 'عدد المهندسين', 'عدد_المهندسين', 'teams_coun', 'عدد الفرق', 'عدد_الفرق', 'unit_count', 'عدد الوحدات', 'عدد_الوحدات'];

                Object.keys(props).forEach(key => {
                    if (reservedFields.includes(key)) return;
                    
                    // Apply field restriction for non-admins
                    if (!isAdmin && !restrictedFields.includes(key)) {
                        return;
                    }

                    const val = props[key];
                    const row = createAttributeRow(key, val, false);
                    attributesContainer.appendChild(row);
                });

                attributesPanel.classList.remove('hidden-panel');
                setTimeout(() => attributesPanel.classList.add('show-panel'), 10);
            }

            if(addPropertyBtn) {
                addPropertyBtn.addEventListener('click', () => {
                    const row = createAttributeRow('', '', true);
                    attributesContainer.appendChild(row);
                    const keyInput = row.querySelector('input[data-field-key-input]');
                    if(keyInput) keyInput.focus();
                });
            }

            if(undoBtn) {
                undoBtn.addEventListener('click', () => {
                    restorePreviousProperties();
                });
            }

            if(downloadGeoJsonBtn) {
                downloadGeoJsonBtn.addEventListener('click', downloadGeoJsonFile);
            }

            if(saveAttributesBtn && canEditMap) {
                saveAttributesBtn.addEventListener('click', () => {
                    if(!currentSelectedLayer) return;
                    if(!currentSelectedLayer.feature) {
                        currentSelectedLayer.feature = { type: "Feature", properties: {} };
                    }
                    if(!currentSelectedLayer.feature.properties) {
                        currentSelectedLayer.feature.properties = {};
                    }
                    
                    window.showCustomConfirm('تأكيد الحفظ', 'هل أنت متأكد أنك تريد حفظ التعديلات على هذا الشكل؟', () => {
                    const rows = attributesContainer.querySelectorAll('.attribute-row');
                    rows.forEach(row => {
                        const keyInput = row.querySelector('input[data-field-key-input]');
                        const valueControl = row.querySelector('[data-field-value-input]');
                        if (!keyInput || !valueControl) return;

                        const fieldKey = keyInput.value.trim();
                        if (!fieldKey) return;

                        const nestedSelect = valueControl.matches?.('select')
                            ? valueControl
                            : valueControl.querySelector?.('select');

                        let fieldValue = '';
                        if (nestedSelect) {
                            fieldValue = nestedSelect.value;
                        } else {
                            fieldValue = valueControl.value;
                        }

                        currentSelectedLayer.feature.properties[fieldKey] = fieldValue;
                    });

                    updateZoneGeoJsonFeatureProperties(currentSelectedLayer.feature);
                    lastSavedProperties = copyProperties(currentSelectedLayer.feature.properties);
                    
                    // Save to Firebase (Granular Update)
                    if (window.saveZoneUpdate) {
                        const zoneCode = currentSelectedLayer.feature.properties.zone_code || 
                                       currentSelectedLayer.feature.properties.area_code || 
                                       currentSelectedLayer.feature.properties.work_id || 
                                       currentSelectedLayer.feature.id;
                        
                        if (zoneCode) {
                            // Prepare data object with new field names as shown in user screenshot
                            const updateData = {
                                "حالة الحصر": currentSelectedLayer.feature.properties["حالة الحصر"] || currentSelectedLayer.feature.properties["type_statu"] || currentSelectedLayer.feature.properties["حالة_الحصر"] || "",
                                "عدد الفرق": parseInt(currentSelectedLayer.feature.properties["عدد الفرق"] || currentSelectedLayer.feature.properties["teams_coun"]) || 0,
                                "عدد المهندسين": parseInt(currentSelectedLayer.feature.properties["عدد المهندسين"] || currentSelectedLayer.feature.properties["engineers_"]) || 0
                            };

                            updateCloudSyncStatus('syncing');

                            window.saveZoneUpdate(zoneCode, updateData).then(result => {
                                if (result && result.success) {
                                    console.log('Individual zone update saved to Firestore');
                                    updateCloudSyncStatus('connected');
                                    showToast('تم مزامنة التعديلات مع قاعدة البيانات (Live) بنجاح', 'success');
                                } else {
                                    console.warn('Firestore update failed:', result.message);
                                    updateCloudSyncStatus('error');
                                    showToast('حدث خطأ في المزامنة، تم الحفظ محلياً فقط', 'warning');
                                }
                            }).catch(err => {
                                console.error('Firestore save error:', err);
                                updateCloudSyncStatus('error');
                                showToast('خطأ في الاتصال بالخادم، تم الحفظ محلياً فقط', 'red');
                            });
                        } else {
                            console.warn('Could not determine zoneCode for Firestore update');
                            showToast('تم حفظ التعديلات محلياً بنجاح', 'success');
                        }
                    } else {
                        showToast('تم حفظ التعديلات محلياً بنجاح', 'success');
                    }

                    if (currentSelectedLayer.setStyle) {
                        currentSelectedLayer.setStyle(getZoneStyle(currentSelectedLayer.feature));
                    }
                    renderZoneStatusFilterOptions();
                    injectMapLegend('gazaMapWrapper');
                    injectMapLegend('viewMapWrapper');
                    if (window.zoneGeoJsonData && Array.isArray(window.zoneGeoJsonData.features)) {
                        try {
                            processZoneStatistics(filterFeaturesForCurrentUser(window.zoneGeoJsonData.features || []));
                        } catch (err) {
                            console.warn('Unable to refresh stats after save', err);
                        }
                    }
                    
                    const originalText = saveAttributesBtn.innerHTML;
                    saveAttributesBtn.innerHTML = 'تم حفظ البيانات بنجاح <i class="fa-solid fa-check-double ml-2"></i>';
                    saveAttributesBtn.classList.replace('from-blue-500', 'from-emerald-500');
                    saveAttributesBtn.classList.replace('to-blue-600', 'to-emerald-600');
                    
                    setTimeout(() => {
                        saveAttributesBtn.innerHTML = originalText;
                        saveAttributesBtn.classList.replace('from-emerald-500', 'from-blue-500');
                        saveAttributesBtn.classList.replace('to-emerald-600', 'to-blue-600');
                        attributesPanel.classList.remove('show-panel');
                        setTimeout(() => attributesPanel.classList.add('hidden-panel'), 500);
                    }, 1500);
                    });
                });
            }

            // التعامل مع أحداث الشيب الواحد (شكل أو مضلع)
            function bindFeatureEvents(layer, feature) {
                if(feature) layer.feature = feature;
                
                layer.on('click', function(e) {
                    L.DomEvent.stopPropagation(e);
                    if (!canEditMap) return;
                    
                    if(map.pm.globalRemovalEnabled()) return;

                    map.eachLayer(function(otherLayer) {
                        if (otherLayer.pm && otherLayer.pm.enabled() && otherLayer !== layer) {
                            otherLayer.pm.disable();
                        }
                    });

                    if (layer.pm) {
                        if (!layer.pm.enabled()) {
                            layer.pm.enable({ allowSelfIntersection: false });
                        }
                    }

                    openAttributesPanel(layer);
                });
            }

            map.on('click', function() {
                if (!canEditMap) return;
                map.eachLayer(function(layer) {
                    if (layer.pm && layer.pm.enabled()) {
                        layer.pm.disable();
                    }
                });
                attributesPanel.classList.remove('show-panel');
                setTimeout(() => attributesPanel.classList.add('hidden-panel'), 500);
            });

            function loadLocalGeoJson(filename, key, style) {
                fetch(filename)
                    .then(res => res.json())
                    .then(data => {
                        const scopedData = filterGeoJsonDataForCurrentUser(data, key);
                        geoJsonLayers[key] = L.geoJSON(scopedData, { 
                            style: style,
                            onEachFeature: function(feature, layer) {
                                bindFeatureEvents(layer, feature);
                            }
                        });
                        const checkbox = document.getElementById('toggle' + key.charAt(0).toUpperCase() + key.slice(1));
                        if(checkbox && checkbox.checked) {
                            map.addLayer(geoJsonLayers[key]);
                        }
                    })
                    .catch(err => console.error("Could not load " + filename, err));
            }

            // جلب ملفات الخرائط المحلية بصيغة GeoJSON
            loadLocalGeoJson('gov.geojson', 'gov', { color: '#2c3e50', weight: 4, fillOpacity: 0.05, interactive: false });
            
            // تحديث تحميل الزونات لاستخدام التنسيق الديناميكي
            fetch('zone.geojson')
                .then(res => res.json())
                .then(data => {
                    window.zoneGeoJsonData = data;
                    const scopedData = filterGeoJsonDataForCurrentUser(data, 'zone');
                    geoJsonLayers['zone'] = L.geoJSON(scopedData, { 
                        style: getZoneStyle,
                        onEachFeature: function(feature, layer) {
                            bindFeatureEvents(layer, feature);
                        }
                    });
                    const checkbox = document.getElementById('toggleZone');
                    if(checkbox && checkbox.checked) {
                        map.addLayer(geoJsonLayers['zone']);
                    }
                    
                    // حقن مفتاح الخريطة بعد تحميل البيانات
                    injectMapLegend('gazaMapWrapper'); 

                    // تهيئة القوائم المنسدلة الهيكلية
                    if (window.initHierarchicalDropdowns) window.initHierarchicalDropdowns();
                })
                .catch(err => console.error("Could not load zone.geojson", err));

            // إضافة مستمعي الأحداث لأزرار التحكم بالطبقات المحلية
            ['gov', 'zone'].forEach(key => {
                const toggle = document.getElementById('toggle' + key.charAt(0).toUpperCase() + key.slice(1));
                if(toggle) {
                    toggle.addEventListener('change', function(e) {
                        if(geoJsonLayers[key]) {
                            if(e.target.checked) map.addLayer(geoJsonLayers[key]);
                            else map.removeLayer(geoJsonLayers[key]);
                        }
                    });
                }
            });

            // تحديث أبعاد الخريطة بعد التحميل لضمان العرض السليم
            setTimeout(() => { map.invalidateSize(); }, 500);
        }

        // ================= خريطة العرض والشرح (View Only Map) ================= //
        window.switchViewMapTheme = function(theme) {
            if(!window.viewMapInstance) return;
            const map = window.viewMapInstance;
            
            // Note: We use dedicated independent basemap instances for viewMap explicitly in initViewMap
            // Therefore, we only switch the baseLayer for the view map here if it was already setup
            if(!window.viewBaseLayersMap) return;
            if(window.currentViewBaseLayer) map.removeLayer(window.currentViewBaseLayer);
            
            window.currentViewBaseLayer = window.viewBaseLayersMap[theme] || window.viewBaseLayersMap.light;
            window.currentViewBaseLayer.addTo(map);
            
            const matchingRadio = document.querySelector(`input[name="viewBasemap"][value="${theme}"]`);
            if(matchingRadio) matchingRadio.checked = true;
            
            map.eachLayer(layer => {
               if(layer !== window.currentViewBaseLayer && !layer._url) layer.bringToFront();
            });
        };

        function initViewMap() {
            const map = L.map('viewMap', {
                center: [31.4167, 34.3333],
                zoom: 11,
                zoomControl: false,
                attributionControl: false
            });
            window.viewMapInstance = map;

            L.control.zoom({ position: 'bottomleft' }).addTo(map);

            // إنشاء خرائط أساس مستقلة لهذه الخريطة لكي لا تتضارب مع خريطة التعديل الأساسية
            window.viewBaseLayersMap = {
                light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
                }),
                dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
                }),
                satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Tiles &copy; Esri'
                })
            };
            
            // تعيين خريطة الأساس الافتراضية بشكل صريح ومباشر
            window.currentViewBaseLayer = window.viewBaseLayersMap.light;
            window.currentViewBaseLayer.addTo(map);

            const geoJsonLayers = { gov: null, zone: null };
            const canEditMap = canEditMapForCurrentUser();
            let popupFields = []; // المتغير الذي يخزن مفاتيح الخصائص ديناميكياً

            // وظيفة توليد محتوى البوب أب / التولتيب ديناميكياً وقت الحاجة
            function buildDynamicContent(feature) {
                // جمع الخيارات المحددة في صندوق הפلاتر
                const checkedBoxes = Array.from(document.querySelectorAll('#popupFieldsFilter input[type="checkbox"]:checked'));
                const activeFields = checkedBoxes.map(cb => cb.value);

                let content = `<div dir="rtl" class="text-right p-1 font-arabic min-w-[150px]">
                    <h4 class="font-bold text-base text-blue-700 mb-2 border-b border-gray-200 pb-1">${feature.properties.Name || feature.properties.name || 'المنطقة'}</h4>
                    <div class="max-h-48 overflow-y-auto pr-1">`;
                
                let hasFields = false;
                // في حالة التشغيل الأول ولم تتشكل الفلاتر بعد
                let fieldsToShow = activeFields.length > 0 ? activeFields : Object.keys(feature.properties);

                const excludeViewKeys = ['Name', 'name', 'OBJECTID', 'OBJECTID_1', 'Shape_Area', 'Shape_Length'];
                fieldsToShow.forEach(key => {
                     if(!excludeViewKeys.includes(key) && feature.properties[key] !== undefined) {
                         hasFields = true;
                         content += `<div class="mb-1 bg-gray-50/50 p-1 rounded border border-gray-100/50 flex flex-col">
                             <span class="font-bold text-gray-800 text-xs">${key}:</span> 
                             <span class="text-sm text-gray-700 mt-0.5">${feature.properties[key]}</span>
                         </div>`;
                     }
                });
                
                if(!hasFields) {
                     content += `<div class="text-xs text-center text-gray-400 py-4 italic">لا توجد حقول محددة للعرض</div>`;
                }
                content += `</div></div>`;
                return content;
            }

            // توليد الـ Checkboxes لحقول البوب أب تلقائياً من الملف
            function generateFieldFilters(properties) {
                const container = document.getElementById('popupFieldsFilter');
                if(!container || popupFields.length > 0) return; // تم الإنشاء مسبقاً
                
                container.innerHTML = '';
                const excludeFilterKeys = ['Name', 'name', 'OBJECTID', 'OBJECTID_1', 'Shape_Area', 'Shape_Length'];
                Object.keys(properties).forEach(key => {
                    if (!excludeFilterKeys.includes(key)) {
                        popupFields.push(key);
                        const label = document.createElement('label');
                        label.className = 'flex items-center space-x-2 space-x-reverse cursor-pointer p-2 hover:bg-white/40 rounded-lg transition-colors border border-transparent hover:border-gray-200';
                        label.innerHTML = `
                            <input type="checkbox" value="${key}" class="form-checkbox text-blue-500 rounded w-4 h-4" checked>
                            <span class="text-xs font-semibold text-gray-700">${key.length > 30 ? key.substring(0,30) + '...' : key}</span>
                        `;
                        container.appendChild(label);
                    }
                });
            }

            function loadViewGeoJson(filename, key, isGovLayer) {
                fetch(filename)
                    .then(res => res.json())
                    .then(data => {
                        if (filename === 'zone.geojson') {
                            window.zoneGeoJsonData = data;
                        }
                        const scopedData = filterGeoJsonDataForCurrentUser(data, key);
                        geoJsonLayers[key] = L.geoJSON(scopedData, { 
                            style: function(feature) {
                                if (isGovLayer) {
                                    // المحافظات صامتة ومجرد حدود شفافة بدون تفاعل
                                    return { color: '#2c3e50', weight: 4, fillOpacity: 0.05, interactive: false };
                                } else {
                                    // استخدام التنسيق الموحد بناءً على حالة الحصر
                                    return getZoneStyle(feature);
                                }
                            },
                            onEachFeature: function(feature, layer) {
                                if (!isGovLayer) {
                                    // إنشاء الفلاتر بناءً على خصائص هذا الزون
                                    generateFieldFilters(feature.properties);
                                    
                                    // ربط الأحداث المبدئية للزونات الحضرية
                                    layer.bindTooltip(buildDynamicContent(feature), { sticky: true, direction: 'auto', opacity: 0.95 });
                                    layer.bindPopup(buildDynamicContent(feature), { closeButton: true, autoPan: true });
                                    
                                    // تحديث المحتوى في كل مرة قبل الفتح، ليتوافق مع الفلاتر المختارة
                                    layer.on('mouseover', function(e) {
                                        var l = e.target;
                                        l.setStyle({ weight: 3, fillOpacity: 0.4 });
                                        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) { l.bringToFront(); }
                                        l.setTooltipContent(buildDynamicContent(feature));
                                    });
                                    layer.on('mouseout', function(e) {
                                        geoJsonLayers[key].resetStyle(e.target);
                                    });
                                    layer.on('popupopen', function(e) {
                                        e.target.setPopupContent(buildDynamicContent(feature));
                                    });
                                }
                            }
                        });
                        const checkbox = document.getElementById('toggleView' + key.charAt(0).toUpperCase() + key.slice(1));
                        if(checkbox && checkbox.checked) map.addLayer(geoJsonLayers[key]);
                    })
                    .catch(err => console.error("Could not load " + filename, err));
            }

            // تحميل المضلعات مع تحديد أن المحافظات هي (GovLayer = true)
            loadViewGeoJson('gov.geojson', 'gov', true);
            loadViewGeoJson('zone.geojson', 'zone', false);

            // حقن مفتاح الخريطة في صفحة العرض
            injectMapLegend('viewMapWrapper');

            // تشغيل أدوات العرض والاخفاء القديمة للطبقات
            ['gov', 'zone'].forEach(key => {
                const toggle = document.getElementById('toggleView' + key.charAt(0).toUpperCase() + key.slice(1));
                if(toggle) {
                    toggle.addEventListener('change', function(e) {
                        if(geoJsonLayers[key]) {
                            if(e.target.checked) map.addLayer(geoJsonLayers[key]);
                            else map.removeLayer(geoJsonLayers[key]);
                        }
                    });
                }
            });
            
            // ربط أحداث الأزرار الجديدة في شريط التحكم
            const btnToggleLegend = document.getElementById('btnToggleLegend');
            const viewLegend = document.getElementById('viewLegend');
            if (btnToggleLegend && viewLegend) {
                // اجعل الزر مضاء افتراضياً بما أن المفتاح ظاهر افتراضياً
                btnToggleLegend.classList.add('ring-2', 'ring-blue-300');
                btnToggleLegend.addEventListener('click', () => {
                   if (viewLegend.classList.contains('opacity-0')) {
                       viewLegend.classList.remove('opacity-0', 'invisible');
                       viewLegend.classList.add('opacity-100', 'visible');
                       btnToggleLegend.classList.add('ring-2', 'ring-blue-300');
                   } else {
                       viewLegend.classList.add('opacity-0', 'invisible');
                       viewLegend.classList.remove('opacity-100', 'visible');
                       btnToggleLegend.classList.remove('ring-2', 'ring-blue-300');
                   }
                });
            }

            const btnAddCustomMap = document.getElementById('btnAddCustomMap');
            const addMapModal = document.getElementById('addMapModal');
            if (btnAddCustomMap && addMapModal) {
                btnAddCustomMap.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (addMapModal.classList.contains('invisible')) {
                        addMapModal.classList.remove('invisible', 'opacity-0', '-translate-y-4');
                        addMapModal.classList.add('visible', 'opacity-100', 'translate-y-0');
                    } else {
                        addMapModal.classList.add('invisible', 'opacity-0', '-translate-y-4');
                        addMapModal.classList.remove('visible', 'opacity-100', 'translate-y-0');
                    }
                });
                
                // إغلاق النافذة عند الضغط في أي مكان خارجها
                document.addEventListener('click', (e) => {
                    if (!addMapModal.contains(e.target) && !btnAddCustomMap.contains(e.target)) {
                        addMapModal.classList.add('invisible', 'opacity-0', '-translate-y-4');
                        addMapModal.classList.remove('visible', 'opacity-100', 'translate-y-0');
                    }
                });
            }

            // ربط زر الشاشة الكاملة (Fullscreen)
            const btnMapFullscreen = document.getElementById('btnMapFullscreen');
            const viewMapWrapper = document.getElementById('viewMapWrapper');
            const iconFullscreen = document.getElementById('iconFullscreen');
            
            if (btnMapFullscreen && viewMapWrapper) {
                btnMapFullscreen.addEventListener('click', () => {
                    if (!document.fullscreenElement) {
                        viewMapWrapper.requestFullscreen().catch(err => {
                            console.log(`Error attempting to enable fullscreen: ${err.message}`);
                        });
                    } else {
                        document.exitFullscreen();
                    }
                });
                
                document.addEventListener('fullscreenchange', () => {
                    if (document.fullscreenElement === viewMapWrapper) {
                        iconFullscreen.classList.replace('fa-expand', 'fa-compress');
                        viewMapWrapper.classList.remove('rounded-3xl', 'h-[700px]', 'p-4', 'md:p-6');
                        viewMapWrapper.classList.add('p-2', 'h-screen');
                        setTimeout(() => map.invalidateSize(), 150);
                    } else {
                        iconFullscreen.classList.replace('fa-compress', 'fa-expand');
                        viewMapWrapper.classList.add('rounded-3xl', 'h-[700px]', 'p-4', 'md:p-6');
                        viewMapWrapper.classList.remove('p-2', 'h-screen');
                        setTimeout(() => map.invalidateSize(), 150);
                    }
                });
            }

            // منطق السحب (Drag Resizer) لتحجيم الخريطة
            const mapResizerHandle = document.getElementById('mapResizerHandle');
            let isResizing = false;
            let startY = 0;
            let startHeight = 0;

            if (mapResizerHandle && viewMapWrapper) {
                mapResizerHandle.addEventListener('mousedown', (e) => {
                    isResizing = true;
                    startY = e.clientY;
                    startHeight = viewMapWrapper.offsetHeight;
                    document.body.style.cursor = 'row-resize';
                    e.preventDefault();
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isResizing) return;
                    const newHeight = startHeight + (e.clientY - startY);
                    if (newHeight >= 400 && newHeight <= 1200) {
                        viewMapWrapper.style.height = `${newHeight}px`;
                    }
                });

                document.addEventListener('mouseup', () => {
                    if (isResizing) {
                        isResizing = false;
                        document.body.style.cursor = 'default';
                        setTimeout(() => { map.invalidateSize(); }, 300);
                    }
                });
            }

            // ربط فتح وإغلاق لوحة الإحصائيات الجانبية
            const btnOpenMapStats = document.getElementById('btnOpenMapStats');
            const mapStatsPanel = document.getElementById('mapStatsPanel');
            const closeStatsPanel = document.getElementById('closeStatsPanel');
            const btnCloseStats = document.getElementById('btnCloseStats');

            function toggleStatsPanel() {
                if(mapStatsPanel.classList.contains('hidden-panel')) {
                    mapStatsPanel.classList.remove('hidden-panel');
                    mapStatsPanel.classList.add('show-panel');
                    generateMapStats();
                } else {
                    mapStatsPanel.classList.remove('show-panel');
                    mapStatsPanel.classList.add('hidden-panel');
                }
            }

            if(btnOpenMapStats) btnOpenMapStats.addEventListener('click', toggleStatsPanel);
            if(closeStatsPanel) closeStatsPanel.addEventListener('click', toggleStatsPanel);
            if(btnCloseStats) btnCloseStats.addEventListener('click', toggleStatsPanel);
            
                const statsCompareBy = document.getElementById('statsCompareBy');
                if(statsCompareBy) {
                    statsCompareBy.addEventListener('change', generateMapStats);
                }

                // للبحث عن اسم الحقل المعبر عن المحافظة من البيانات
                function findGovernorateField(properties) {
                    const possibleFields = ['governorat', 'Gov', 'gov', 'Governorate', 'governorate', 'Gov_Name', 'المحافظة', 'محافظة', 'Name_Ar_1', 'Name_1'];
                    for (let f of possibleFields) {
                        if (properties[f] !== undefined) return f;
                    }
                    return null;
                }

                // دالة لتحريك الأرقام (تأثير العد التصاعدي)
                function animateCount(el, target) {
                    if (!el) return;
                    const duration = 1000; // 1 ثانية
                    const start = parseInt(el.innerText.replace(/[^0-9]/g, '')) || 0;
                    const startTime = performance.now();

                    function update(currentTime) {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const easeOutQuad = t => t * (2 - t);
                        const current = Math.floor(easeOutQuad(progress) * (target - start) + start);
                        
                        // الحفاظ على المحتوى النصي الآخر إن وجد (مثل كلمة زون)
                        if (el.id === 'stat-pct') {
                            el.innerText = `${current}%`;
                        } else {
                            el.innerText = current;
                        }

                        if (progress < 1) {
                            requestAnimationFrame(update);
                        } else {
                            if (el.id === 'stat-pct') el.innerText = `${target}%`;
                            else el.innerText = target;
                        }
                    }
                    requestAnimationFrame(update);
                }

                function generateMapStats() {
                   const container = document.getElementById('mapStatsContainer');
                   const compareSelector = document.getElementById('statsCompareBy');
                   const selectedGov = compareSelector ? compareSelector.value : 'all';
                   
                   if(!container) return;
    
                   if(!geoJsonLayers['zone']) {
                       container.innerHTML = `<div class="text-center text-gray-500 mt-10"><p>يرجى تفعيل أو تحميل طبقة الزونات أولاً.</p></div>`;
                       return;
                   }
    
                   let completed = 0, inProgress = 0, notStarted = 0;
                   let totalZones = 0;
                   let uniqueGovs = new Set();
                   let govField = null;

                   const layers = geoJsonLayers['zone'].getLayers();
                   
                   if(layers.length > 0) {
                       govField = findGovernorateField(layers[0].feature.properties);
                   }

                   layers.forEach((l) => {
                       const props = l.feature.properties;
                       const currentGov = govField ? props[govField] : 'غير مصنف';
                       
                       if (currentGov) uniqueGovs.add(currentGov);
                       if (selectedGov !== 'all' && currentGov !== selectedGov) return;

                       totalZones++;
                       const status = getFeatureStatus(props);
                       if (status.includes('الانتهاء') || status.includes('مكتمل')) completed++;
                       else if (status.includes('الحصر') || status.includes('العمل')) inProgress++;
                       else notStarted++;
                   });
                   
                   if (compareSelector && compareSelector.options.length <= 1 && uniqueGovs.size > 0) {
                       uniqueGovs.forEach(gov => {
                           const opt = document.createElement('option');
                           opt.value = gov;
                           opt.textContent = gov;
                           compareSelector.appendChild(opt);
                       });
                   }

                   if (compareSelector && window.applyGovernorateSelectorLock) {
                       window.applyGovernorateSelectorLock(compareSelector);
                   }
    
                   const pctComplete = totalZones > 0 ? Math.round((completed / totalZones) * 100) : 0;
                   
                   // تحقق مما إذا كانت الهيكلية موجودة بالفعل لمنع إعادة الوميض وتفعيل الانيميشن
                   if (!document.getElementById('stat-total-zones')) {
                       container.innerHTML = `
                           <div class="glass-panel p-4 rounded-2xl border-white/60 shadow-md transform hover:scale-105 transition-transform">
                               <h4 class="text-gray-500 font-semibold mb-1 text-sm"><i class="fa-solid fa-map-location-dot text-blue-500 ml-1"></i> <span id="stat-gov-title">إجمالي زونات الحصر</span></h4>
                               <div class="text-3xl font-bold text-blue-700"><span id="stat-total-zones">0</span> <span class="text-sm font-normal text-gray-400">زون</span></div>
                           </div>
                           
                           <div class="glass-panel p-6 rounded-2xl border-white/60 shadow-md">
                               <h4 class="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">تفاصيل الإنجاز للزونات المعروضة</h4>
                               <div class="flex flex-col gap-4">
                                   <div>
                                       <div class="flex justify-between text-sm mb-1 font-semibold text-gray-700"><span>مكتمل</span> <span id="stat-v-comp">0 زون</span></div>
                                       <div class="w-full bg-gray-200 rounded-full h-2.5 shadow-inner overflow-hidden"><div id="bar-comp" class="bg-gradient-to-l from-green-400 to-green-600 h-full rounded-full transition-all duration-1000 ease-out relative" style="width: 0%"><div class="progress-bar-stripes rounded-full opacity-70"></div></div></div>
                                   </div>
                                   <div>
                                       <div class="flex justify-between text-sm mb-1 font-semibold text-gray-700"><span>قيد العمل</span> <span id="stat-v-prog">0 زون</span></div>
                                       <div class="w-full bg-gray-200 rounded-full h-2.5 shadow-inner overflow-hidden"><div id="bar-prog" class="bg-gradient-to-l from-orange-400 to-orange-500 h-full rounded-full transition-all duration-1000 ease-out relative" style="width: 0%"><div class="progress-bar-stripes rounded-full opacity-70"></div></div></div>
                                   </div>
                                   <div>
                                       <div class="flex justify-between text-sm mb-1 font-semibold text-gray-700"><span>لم يبدأ</span> <span id="stat-v-none">0 زون</span></div>
                                       <div class="w-full bg-gray-200 rounded-full h-2.5 shadow-inner overflow-hidden"><div id="bar-none" class="bg-gradient-to-l from-red-400 to-red-600 h-full rounded-full transition-all duration-1000 ease-out relative" style="width: 0%"><div class="progress-bar-stripes rounded-full opacity-70"></div></div></div>
                                   </div>
                               </div>
                           </div>
                           
                           <div class="glass-panel p-6 rounded-2xl border-white/60 shadow-md bg-gradient-to-br from-white/40 to-indigo-50/40">
                               <div class="flex justify-between items-end mb-3">
                                   <h4 class="font-bold text-gray-800">نسبة الإنجاز (زونات منجزة ٪)</h4>
                                   <span id="stat-pct" class="text-3xl font-bold text-indigo-600 drop-shadow-sm">0%</span>
                               </div>
                               <div class="w-full bg-indigo-100/50 rounded-full h-4 shadow-inner overflow-hidden border border-indigo-200">
                                   <div id="bar-total" class="bg-gradient-to-l from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)] relative" style="width: 0%">
                                 <div class="progress-bar-stripes rounded-full opacity-80"></div>
                                   </div>
                               </div>
                               <p class="text-xs text-gray-500 mt-3 text-center">تعكس النسبة الفرق الرياضي الفعلي بين الزونات المنجزة مقارنة بالباقي.</p>
                           </div>
                       `;
                   }

                   // تحديث القيم مع الانيميشن
                   document.getElementById('stat-gov-title').innerText = `إجمالي زونات الحصر (${selectedGov === 'all' ? 'جميع المحافظات' : selectedGov})`;
                   
                   animateCount(document.getElementById('stat-total-zones'), totalZones);
                   animateCount(document.getElementById('stat-v-comp'), completed);
                   animateCount(document.getElementById('stat-v-prog'), inProgress);
                   animateCount(document.getElementById('stat-v-none'), notStarted);
                   animateCount(document.getElementById('stat-pct'), pctComplete);

                   // تحديث الأشرطة
                   setTimeout(() => {
                       document.getElementById('bar-comp').style.width = (totalZones > 0 ? (completed / totalZones) * 100 : 0) + '%';
                       document.getElementById('bar-prog').style.width = (totalZones > 0 ? (inProgress / totalZones) * 100 : 0) + '%';
                       document.getElementById('bar-none').style.width = (totalZones > 0 ? (notStarted / totalZones) * 100 : 0) + '%';
                       document.getElementById('bar-total').style.width = pctComplete + '%';
                   }, 50);
                }

            setTimeout(() => { map.invalidateSize(); }, 500);
            
            // إضافة مستمعي أحداث تغيير خريطة الأساس من المنسدلة
            document.querySelectorAll('input[name="viewBasemap"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (window.switchViewMapTheme) {
                        window.switchViewMapTheme(e.target.value);
                    }
                });
            });

            // -------------------------------------------------------------
            // منطقة أكواد قسم الإخراج الفني (Layout)
            // Smart layout handled in assets/js/smart-analysis.js
            // تم تعطيل الكود القديم لتجنب التعارض مع الصفحة الجديدة متعددة اللغات.
            // -------------------------------------------------------------

// ================= إدارة المستخدمين (User Management) ================= //
            function initUserManagement() {
                const navUsers = document.getElementById('nav-users');
                if (!window.currentUser || (window.currentUser.role !== 'admin' && window.currentUser.canManageUsers !== true)) return;

                const usersTableBody = document.getElementById('usersTableBody');
                const addUserBtn = document.getElementById('addUserBtn');
                const userModal = document.getElementById('userModal');
                const userForm = document.getElementById('userForm');
                const closeUserModal = document.getElementById('closeUserModal');
                const cancelUserBtn = document.getElementById('cancelUserBtn');

                let isEditing = false;
                let currentEditEmail = null;

                async function loadUsers() {
                    if (!usersTableBody) return;
                    
                    // Defense against deferred module loading
                    if (!window.getAllUsers) {
                        const retryCount = (usersTableBody.dataset.retries || 0);
                        if (retryCount > 10) {
                             usersTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-12 text-center text-red-400 font-medium"><i class="fa-solid fa-triangle-exclamation ml-2"></i> فشل الاتصال بقاعدة البيانات. يرجى تحديث الصفحة.</td></tr>';
                             return;
                        }
                        usersTableBody.dataset.retries = parseInt(retryCount) + 1;
                        setTimeout(loadUsers, 500);
                        return;
                    }

                    usersTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-12 text-center text-gray-400 font-medium"><i class="fa-solid fa-spinner fa-spin ml-2"></i> جاري مزامنة القائمة...</td></tr>';
                    
                    try {
                        const users = await window.getAllUsers();
                        renderUsersTable(users);
                    } catch (err) {
                        console.error("Failed to load users:", err);
                        usersTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-12 text-center text-red-400 font-medium"><i class="fa-solid fa-triangle-exclamation ml-2"></i> حدث خطأ أثناء جلب البيانات</td></tr>';
                    }
                }

                function renderUsersTable(users) {
                    if (!usersTableBody) return;
                    if (users.length === 0) {
                        usersTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-12 text-center text-gray-400 font-medium">لا يوجد مستخدمون لعرضهم</td></tr>';
                        return;
                    }

                    usersTableBody.innerHTML = users.map(user => `
                        <tr class="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">${user.name ? user.name[0] : (user.email ? user.email[0].toUpperCase() : 'U')}</div>
                                    <div class="flex flex-col text-right"><span class="font-bold text-gray-800">${user.name || 'مراقب'}</span><span class="text-xs text-gray-400" dir="ltr">@${user.username || 'user'}</span></div>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-gray-500 font-medium truncate max-w-[200px]">${user.email}</td>
                            <td class="px-6 py-4">
                                <span class="px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">${user.role === 'admin' ? 'مدير' : 'مراقب'}</span>
                            </td>
                            <td class="px-6 py-4 text-gray-600 font-medium">${formatGovernorateDisplay(user.governorate)}</td>
                            <td class="px-6 py-4 text-center">
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer status-toggle" ${user.active !== false ? 'checked' : ''} data-email="${user.email}">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </td>
                            <td class="px-6 py-4 text-center space-x-2 space-x-reverse">
                                <button class="edit-user-btn text-blue-500 hover:text-blue-700 transition-colors p-2" data-email="${user.email}">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </button>
                                <button class="delete-user-btn text-red-500 hover:text-red-700 transition-colors p-2" data-email="${user.email}" title="حذف">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('');

                    // Attach event listeners for edit and toggle
                    document.querySelectorAll('.edit-user-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const email = btn.dataset.email;
                            const user = users.find(u => u.email === email);
                            if (user) openModal(user);
                        });
                    });

                    document.querySelectorAll('.delete-user-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const email = btn.dataset.email;
                            if(confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) {
                                if (window.deleteUserFromFirestore) {
                                    try {
                                        const result = await window.deleteUserFromFirestore(email);
                                        if(result.success) {
                                            showToast('تم حذف المستخدم بنجاح', 'success');
                                            await loadUsers();
                                        } else {
                                            showToast(result.message || 'حدث خطأ أثناء الحذف', 'red');
                                        }
                                    } catch(err) {
                                        console.error("Deletion error:", err);
                                        showToast('فشل الاتصال بقاعدة البيانات', 'red');
                                    }
                                }
                            }
                        });
                    });

                    document.querySelectorAll('.status-toggle').forEach(toggle => {
                        toggle.addEventListener('change', async () => {
                            const email = toggle.dataset.email;
                            const active = toggle.checked;
                            const user = users.find(u => u.email === email);
                            if (user && window.saveUserToFirestore) {
                                try {
                                    const result = await window.saveUserToFirestore({ ...user, active });
                                    if(result && result.success) {
                                        showToast(active ? 'تم تفعيل الحساب' : 'تم تعطيل الحساب', 'success');
                                    } else {
                                        showToast(result ? result.message : 'فشل في تحديث الحالة', 'red');
                                        toggle.checked = !active; // التراجع في حالة الفشل
                                    }
                                } catch (err) {
                                    showToast('فشل في تحديث الحالة', 'red');
                                    toggle.checked = !active; // Revert
                                }
                            }
                        });
                    });
                }

                const permissionIds = [
                    'perm_showHome', 'perm_showStats', 'perm_showFlow', 'perm_showStyle', 'perm_showPersonas',
                    'perm_canDraw', 'perm_canEditData', 'perm_canEditStatus', 'perm_canExport', 'perm_canManageUsers'
                ];

                function openModal(user = null) {
                    isEditing = !!user;
                    currentEditEmail = user ? user.email : null;
                    document.getElementById('userModalTitle').innerText = isEditing ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد';
                    
                    document.getElementById('userName').value = user ? (user.name || '') : '';
                    document.getElementById('userUsername').value = user ? (user.username || '') : '';
                    document.getElementById('userEmail').value = user ? user.email : '';
                    document.getElementById('userEmail').readOnly = isEditing;
                    document.getElementById('userPassword').value = '';
                    document.getElementById('userPassword').required = !isEditing;
                    document.getElementById('userRole').value = user ? (user.role || 'viewer') : 'viewer';
                    document.getElementById('userGov').value = user ? formatGovernorateDisplay(user.governorate) : 'all';
                    document.getElementById('userActive').checked = user ? (user.active !== false) : true;

                    // تعبئة الصلاحيات
                    permissionIds.forEach(id => {
                        const cb = document.getElementById(id);
                        if(cb) {
                            // If isEditing, use user data, otherwise default to true for pages, false for actions
                            if (user) {
                                cb.checked = user[id.replace('perm_', '')] !== false;
                            } else {
                                if (id.startsWith('perm_show')) {
                                    cb.checked = true;
                                } else {
                                    cb.checked = false;
                                }
                            }
                        }
                    });

                    userModal.classList.remove('hidden');
                }

                function closeModal() {
                    userModal.classList.add('hidden');
                    userForm.reset();
                }

                if(addUserBtn) addUserBtn.addEventListener('click', () => openModal());
                if(cancelUserBtn) cancelUserBtn.addEventListener('click', closeModal);
                if(closeUserModal) closeUserModal.addEventListener('click', closeModal);

                if(userForm) {
                    userForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        
                        // Check if save function is ready
                        if (!window.saveUserToFirestore) {
                            showToast('جاري تهيئة النظام، يرجى المحاولة بعد قليل', 'red');
                            return;
                        }

                        const userData = {
                            name: document.getElementById('userName').value.trim(),
                            username: document.getElementById('userUsername').value.trim().toLowerCase(),
                            email: document.getElementById('userEmail').value.trim().toLowerCase(),
                            role: document.getElementById('userRole').value,
                            governorate: normalizeGovernorateInput(document.getElementById('userGov').value),
                            active: document.getElementById('userActive').checked
                        };

                        // جمع الصلاحيات
                        permissionIds.forEach(id => {
                            const cb = document.getElementById(id);
                            if(cb) {
                                userData[id.replace('perm_', '')] = cb.checked;
                            }
                        });

                        const password = document.getElementById('userPassword').value;
                        if (password) userData.password = password;

                        try {
                            const result = await window.saveUserToFirestore(userData);
                            if (result.success) {
                                showToast('تم حفظ بيانات المستخدم بنجاح', 'success');
                                closeModal();
                                loadUsers();
                            } else {
                                showToast(`خطأ: ${result.message}`, 'red');
                            }
                        } catch (err) {
                            showToast('خطأ غير متوقع في الحفظ', 'red');
                        }
                    });
                }

                // Initial load effort
                loadUsers();

                // Override switchPage to refresh users when Navigated to this page
                const originalSwitchPage = window.switchPage;
                window.switchPage = function(pageId, btnElement) {
                    if (pageId === 'users') {
                        loadUsers();
                    }
                    if (originalSwitchPage) originalSwitchPage(pageId, btnElement);
                };
            }

            // Call initialization if admin
            if (window.currentUser && (window.currentUser.role === 'admin' || window.currentUser.canManageUsers === true)) {
                initUserManagement();
            }
        }
