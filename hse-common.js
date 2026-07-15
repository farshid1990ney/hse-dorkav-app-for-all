/* ============================================================
   hse-common.js
   فایل مشترک ظاهر و تنظیمات سامانه ایمنی آژند همت توس
   این فایل را در انتهای <head> یا قبل از بسته‌شدن </body>
   هر صفحه با خط زیر اضافه کنید:
   <script src="hse-common.js"></script>
   ============================================================ */
(function () {
    'use strict';

    /* ============================================================
       0. جلوگیری از Pull-to-Refresh (برای حس اپ بومی در APK/WebView)
       ============================================================ */
    (function preventPullToRefresh() {
        var lastTouchY = 0;
        var maybePreventPullToRefresh = false;

        document.addEventListener('touchstart', function (e) {
            if (e.touches.length !== 1) return;
            lastTouchY = e.touches[0].clientY;
            maybePreventPullToRefresh = (window.pageYOffset === 0);
        }, { passive: false });

        document.addEventListener('touchmove', function (e) {
            var touchY = e.touches[0].clientY;
            var touchYDelta = touchY - lastTouchY;
            lastTouchY = touchY;

            if (maybePreventPullToRefresh) {
                maybePreventPullToRefresh = false;
                if (touchYDelta > 0) {
                    e.preventDefault();
                    return;
                }
            }
        }, { passive: false });
    })();

    /* ============================================================
       1. تزریق CSS مشترک (متغیرها، تم تیره/روشن، فونت، مودال تنظیمات)
       ============================================================ */
    var commonCSS = `
        /* ===== جلوگیری از رفتار وب (pull-to-refresh / overscroll) برای حس اپ بومی (APK) ===== */
        html, body {
            overscroll-behavior: none !important;
            -webkit-overflow-scrolling: touch;
        }
        body {
            overscroll-behavior-y: contain !important;
        }
        :root {
            --primary: #ff6208;
            --primary-hover: #e05300;
            --secondary: #f39c12;
            --success: #27ae60;
            --safety: #2c6e4e;
            --danger: #c0392b;
            --dark-blue: #1e3c5c;
            --bg-gradient: linear-gradient(145deg, #eef2f7 0%, #dfe7f0 100%);
            --card-bg: rgba(255, 255, 255, 0.98);
            --text-main: #1e2a2e;
            --text-muted: #64748b;
            --border-radius-lg: 24px;
            --border-radius-md: 16px;
            --border-radius-sm: 12px;
            --shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            --font-family: 'Vazir', 'Yekan Bakh', Tahoma, sans-serif;
        }

        body { font-family: var(--font-family) !important; transition: background 0.3s ease; }
        .header, .card-title, h1, h2, h3 { font-family: var(--font-family) !important; }

        /* ===== فونت‌ها ===== */
        body.font-vazir   { --font-family: 'Vazir', Tahoma, sans-serif; }
        body.font-yekan   { --font-family: 'Yekan Bakh', Tahoma, sans-serif; }
        body.font-nazanin { --font-family: 'B Nazanin', Tahoma, sans-serif; }
        body.font-roya    { --font-family: 'B Roya', Tahoma, sans-serif; }
        body.font-comic   { --font-family: 'Comic Sans MS', Tahoma, sans-serif; }
        body.font-tahoma  { --font-family: 'Tahoma', Tahoma, sans-serif; }

        /* ===== اندازه‌ها ===== */
        body.size-small  { font-size: 0.85rem; }
        body.size-normal { font-size: 1rem; }
        body.size-medium { font-size: 1.15rem; }
        body.size-large  { font-size: 1.3rem; }
        body.size-xlarge { font-size: 1.5rem; }

        /* ===== رنگ‌های سفارشی ===== */
        body.custom-primary { --primary: var(--user-primary, #ff6208); --primary-hover: var(--user-primary-hover, #e05300); }
        body.custom-text    { --text-main: var(--user-text, #1e2a2e); }

        /* ===== پوسته روشن/تیره ===== */
        body.white-theme { --card-bg: rgba(255,255,255,0.98); --text-main: #1e2a2e; }
        body.black-theme {
            background: #0f172a !important;
            --card-bg: #1e293b !important;
            --text-main: #f8fafc !important;
            --text-muted: #94a3b8 !important;
            --dark-blue: #93c5fd !important;
            --shadow: 0 8px 25px rgba(0,0,0,0.35) !important;
        }
        body.black-theme .card,
        body.black-theme .main-container,
        body.black-theme .grid-item,
        body.black-theme .contact-item,
        body.black-theme .table-wrap,
        body.black-theme .form-control,
        body.black-theme .modal-card { background: #1e293b !important; border-color: rgba(255,255,255,0.08) !important; color: #f8fafc; }
        body.black-theme .form-control { background: #0f172a !important; }
        body.black-theme .note-box,
        body.black-theme .instructions { background: rgba(255,255,255,0.04) !important; }
        body.black-theme .setting-group { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.06); }
        body.black-theme .modal-card select,
        body.black-theme .modal-card input { background: #0f172a; color: #f8fafc; border-color: rgba(255,255,255,0.1); }
        body.black-theme .footer { color: #94a3b8 !important; border-top-color: rgba(255,255,255,0.06) !important; }

        @keyframes hseSlideDown {
            from { opacity: 0; transform: translateY(-12px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        /* ===== دکمه شناور تنظیمات (روی صفحات داخلی) ===== */
        .hse-float-settings {
            position: fixed;
            left: 18px;
            bottom: 18px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--dark-blue, #1e3c5c);
            color: white;
            border: none;
            font-size: 1.3rem;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(0,0,0,0.25);
            z-index: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        .hse-float-settings:hover { transform: scale(1.08) rotate(20deg); }

        /* ===== مودال تنظیمات (مشترک) ===== */
        .hse-modal {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            backdrop-filter: blur(6px);
            padding: 15px;
        }
        .hse-modal-card {
            background: var(--card-bg);
            border-radius: 24px;
            padding: 30px 25px;
            width: 100%;
            max-width: 420px;
            max-height: 92vh;
            overflow-y: auto;
            box-shadow: 0 30px 60px rgba(0,0,0,0.3);
            font-family: var(--font-family);
            color: var(--text-main);
        }
        .hse-modal-card::-webkit-scrollbar { width: 4px; }
        .hse-modal-card::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 10px; }
        .hse-modal-header { text-align: center; border-bottom: 3px solid var(--primary); padding-bottom: 14px; margin-bottom: 22px; }
        .hse-modal-header h3 { font-size: 1.3rem; color: var(--dark-blue); display: flex; align-items: center; justify-content: center; gap: 10px; }
        .hse-modal-header p { font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; }
        .hse-setting-group { background: rgba(0,0,0,0.02); border-radius: 14px; padding: 16px 18px; margin-bottom: 14px; border: 1px solid rgba(0,0,0,0.04); }
        .hse-setting-group .group-title { font-size: 0.8rem; font-weight: 700; color: var(--primary); margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .hse-setting-group label { display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 4px; color: var(--text-main); }
        .hse-setting-group .hint { font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 6px; }
        .hse-setting-group select {
            width: 100%; padding: 10px 14px; border-radius: 10px; border: 2px solid rgba(0,0,0,0.06);
            background: var(--card-bg); color: var(--text-main); font-size: 0.9rem; appearance: none; font-family: var(--font-family);
        }
        .hse-setting-group select:focus { border-color: var(--primary); outline: none; }
        .hse-color-picker-row { display: flex; align-items: center; gap: 14px; margin-top: 6px; }
        .hse-color-circle {
            width: 52px; height: 52px; border-radius: 50%; border: 3px solid rgba(0,0,0,0.1);
            cursor: pointer; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;
        }
        .hse-color-circle:hover { transform: scale(1.08); border-color: var(--primary); }
        .hse-color-circle input[type="color"] { width: 200%; height: 200%; border: none; cursor: pointer; background: none; transform: translate(-25%, -25%); }
        .hse-color-info { display: flex; flex-direction: column; gap: 2px; }
        .hse-color-label { font-size: 0.8rem; font-weight: 600; color: var(--text-main); }
        .hse-color-value { font-family: monospace; font-size: 0.72rem; color: var(--text-muted); background: rgba(0,0,0,0.04); padding: 2px 8px; border-radius: 6px; }
        .hse-preview-box { margin: 14px 0; padding: 14px; border-radius: 12px; border: 2px solid; text-align: center; font-size: 0.85rem; font-weight: 600; }
        .hse-preview-title { font-size: 0.7rem; color: var(--text-muted); display: block; margin-bottom: 6px; }
        .hse-preview-sample { display: inline-block; color: white; padding: 4px 16px; border-radius: 20px; font-size: 0.78rem; margin-top: 8px; }
        .hse-btn-row { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
        .hse-modal-btn {
            background: var(--primary); color: white; border: none; padding: 13px; border-radius: 12px;
            font-weight: bold; cursor: pointer; width: 100%; font-size: 0.92rem; font-family: var(--font-family);
            transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .hse-modal-btn:hover { background: var(--primary-hover); }
        .hse-modal-btn.secondary { background: #cbd5e1; color: #334155; }
        .hse-modal-btn.secondary:hover { background: #b0bec5; }
        .hse-modal-btn.default-btn { background: #f59e0b; color: white; }
        .hse-modal-btn.default-btn:hover { background: #d97706; }

        /* ===== Toast مشترک ===== */
        #hseToastContainer {
            position: fixed; top: 15px; left: 50%; transform: translateX(-50%);
            z-index: 2100; width: 90%; max-width: 400px;
            display: flex; flex-direction: column; gap: 8px; pointer-events: none;
        }
        .hse-toast {
            background: var(--card-bg, #fff);
            padding: 12px 18px;
            border-radius: 14px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
            border-right: 4px solid var(--primary);
            font-weight: 500;
            font-size: 0.9rem;
            pointer-events: auto;
            animation: hseSlideDown 0.3s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: var(--text-main);
            font-family: var(--font-family);
        }
    `;

    var styleTag = document.createElement('style');
    styleTag.setAttribute('data-hse-common', 'true');
    styleTag.textContent = commonCSS;
    document.head.appendChild(styleTag);

    /* ============================================================
       2. مدیریت تنظیمات (ذخیره/خوانش از localStorage)
       ============================================================ */
    var DEFAULTS = {
        theme: 'white',
        font: 'vazir',
        size: 'normal',
        primaryColor: '#ff6208',
        textColor: '#1e2a2e',
        bgColor: '#eef2f7'
    };

    function getSettings() {
        try {
            var saved = localStorage.getItem('hse_settings');
            if (saved) return Object.assign({}, DEFAULTS, JSON.parse(saved));
        } catch (e) {}
        return Object.assign({}, DEFAULTS);
    }

    function saveSettings(s) {
        try { localStorage.setItem('hse_settings', JSON.stringify(s)); } catch (e) {}
    }

    function applySettings(s) {
        var body = document.body;

        body.classList.remove('white-theme', 'black-theme');
        body.classList.add(s.theme === 'black' ? 'black-theme' : 'white-theme');

        body.classList.remove('font-vazir', 'font-yekan', 'font-nazanin', 'font-roya', 'font-comic', 'font-tahoma');
        body.classList.add('font-' + s.font);

        body.classList.remove('size-small', 'size-normal', 'size-medium', 'size-large', 'size-xlarge');
        body.classList.add('size-' + s.size);

        body.classList.add('custom-primary');
        document.documentElement.style.setProperty('--user-primary', s.primaryColor);
        document.documentElement.style.setProperty('--user-primary-hover', s.primaryColor);

        body.classList.add('custom-text');
        document.documentElement.style.setProperty('--user-text', s.textColor);

        if (s.theme !== 'black') {
            if (s.bgColor && s.bgColor !== DEFAULTS.bgColor) {
                body.style.background = s.bgColor;
            } else {
                body.style.background = '';
            }
        }

        saveSettings(s);
    }

    function resetToDefault(modal) {
        var d = DEFAULTS;
        modal.querySelector('#hseSetTheme').value = d.theme;
        modal.querySelector('#hseSetFont').value = d.font;
        modal.querySelector('#hseSetSize').value = d.size;
        modal.querySelector('#hseSetPrimary').value = d.primaryColor;
        modal.querySelector('#hseSetText').value = d.textColor;
        modal.querySelector('#hseSetBg').value = d.bgColor;
        updatePreview(modal);
        showToast('🔄 تنظیمات به حالت پیش‌فرض برگشت.', 'success', 2500);
    }

    function updatePreview(modal) {
        var pColor = modal.querySelector('#hseSetPrimary').value;
        var tColor = modal.querySelector('#hseSetText').value;
        var bColor = modal.querySelector('#hseSetBg').value;
        modal.querySelector('#hsePrimaryHex').textContent = pColor;
        modal.querySelector('#hseTextHex').textContent = tColor;
        modal.querySelector('#hseBgHex').textContent = bColor;
        modal.querySelector('#hsePrimaryCircle').style.background = pColor;
        modal.querySelector('#hseTextCircle').style.background = tColor;
        modal.querySelector('#hseBgCircle').style.background = bColor;
        var preview = modal.querySelector('.hse-preview-box');
        preview.style.borderColor = pColor;
        preview.style.color = tColor;
        preview.style.background = bColor;
        preview.querySelector('.hse-preview-sample').style.background = pColor;
    }

    /* ============================================================
       3. Toast مشترک
       ============================================================ */
    function ensureToastContainer() {
        var c = document.getElementById('hseToastContainer');
        if (!c) {
            c = document.createElement('div');
            c.id = 'hseToastContainer';
            document.body.appendChild(c);
        }
        return c;
    }

    function showToast(message, type, duration) {
        type = type || 'info';
        duration = duration || 3000;
        var colors = { info: 'var(--primary)', success: '#27ae60', danger: '#c0392b' };
        var container = ensureToastContainer();
        var toast = document.createElement('div');
        toast.className = 'hse-toast';
        toast.style.borderRightColor = colors[type] || colors.info;
        toast.innerHTML = '<span>' + message + '</span>' +
            '<button onclick="this.parentElement.remove()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#94a3b8;">✕</button>';
        container.appendChild(toast);
        setTimeout(function () { if (toast.parentElement) toast.remove(); }, duration);
    }
    window.hseShowToast = showToast;

    /* ============================================================
       4. مودال تنظیمات (قابل فراخوانی از هر صفحه)
       ============================================================ */
    function openSettingsModal() {
        var s = getSettings();
        var modal = document.createElement('div');
        modal.className = 'hse-modal';
        modal.innerHTML =
            '<div class="hse-modal-card">' +
                '<div class="hse-modal-header"><h3>⚙️ تنظیمات ظاهری</h3><p>شخصی‌سازی کامل ظاهر سامانه</p></div>' +

                '<div class="hse-setting-group">' +
                    '<div class="group-title">🎨 ظاهر کلی</div>' +
                    '<label>🌓 پوسته (Theme)</label>' +
                    '<span class="hint">انتخاب بین پوسته روشن یا تیره</span>' +
                    '<select id="hseSetTheme">' +
                        '<option value="white" ' + (s.theme === 'white' ? 'selected' : '') + '>☀️ روشن (Light)</option>' +
                        '<option value="black" ' + (s.theme === 'black' ? 'selected' : '') + '>🌙 تیره (Dark)</option>' +
                    '</select>' +

                    '<label style="margin-top:12px;">🖋️ فونت (Font)</label>' +
                    '<span class="hint">انتخاب فونت مناسب برای خوانایی بهتر</span>' +
                    '<select id="hseSetFont">' +
                        '<option value="vazir" '   + (s.font === 'vazir'   ? 'selected' : '') + '>وزیر — خوانایی بالا</option>' +
                        '<option value="yekan" '   + (s.font === 'yekan'   ? 'selected' : '') + '>یکان باخ — مدرن</option>' +
                        '<option value="nazanin" ' + (s.font === 'nazanin' ? 'selected' : '') + '>بی نازنین — کلاسیک</option>' +
                        '<option value="roya" '    + (s.font === 'roya'    ? 'selected' : '') + '>بی رویا — نرم و زیبا</option>' +
                        '<option value="comic" '   + (s.font === 'comic'   ? 'selected' : '') + '>Comic Sans — غیررسمی</option>' +
                        '<option value="tahoma" '  + (s.font === 'tahoma'  ? 'selected' : '') + '>Tahoma — ساده</option>' +
                    '</select>' +

                    '<label style="margin-top:12px;">📏 سایز متن</label>' +
                    '<span class="hint">افزایش یا کاهش اندازه متن</span>' +
                    '<select id="hseSetSize">' +
                        '<option value="small" '  + (s.size === 'small'  ? 'selected' : '') + '>کوچک</option>' +
                        '<option value="normal" ' + (s.size === 'normal' ? 'selected' : '') + '>معمولی</option>' +
                        '<option value="medium" ' + (s.size === 'medium' ? 'selected' : '') + '>متوسط</option>' +
                        '<option value="large" '  + (s.size === 'large'  ? 'selected' : '') + '>بزرگ</option>' +
                        '<option value="xlarge" ' + (s.size === 'xlarge' ? 'selected' : '') + '>خیلی بزرگ</option>' +
                    '</select>' +
                '</div>' +

                '<div class="hse-setting-group">' +
                    '<div class="group-title">🎨 رنگ‌بندی</div>' +
                    '<label>🔶 رنگ اصلی</label>' +
                    '<span class="hint">رنگ دکمه‌ها، هدر و المان‌های اصلی</span>' +
                    '<div class="hse-color-picker-row">' +
                        '<div class="hse-color-circle" id="hsePrimaryCircle" style="background:' + s.primaryColor + ';">' +
                            '<input type="color" id="hseSetPrimary" value="' + s.primaryColor + '" />' +
                        '</div>' +
                        '<div class="hse-color-info"><span class="hse-color-label">رنگ اصلی</span><span class="hse-color-value" id="hsePrimaryHex">' + s.primaryColor + '</span></div>' +
                    '</div>' +

                    '<label style="margin-top:14px;">📝 رنگ متن</label>' +
                    '<span class="hint">رنگ نوشته‌ها و عنوان‌های اصلی</span>' +
                    '<div class="hse-color-picker-row">' +
                        '<div class="hse-color-circle" id="hseTextCircle" style="background:' + s.textColor + ';">' +
                            '<input type="color" id="hseSetText" value="' + s.textColor + '" />' +
                        '</div>' +
                        '<div class="hse-color-info"><span class="hse-color-label">رنگ متن</span><span class="hse-color-value" id="hseTextHex">' + s.textColor + '</span></div>' +
                    '</div>' +

                    '<label style="margin-top:14px;">🖼️ رنگ پس‌زمینه</label>' +
                    '<span class="hint">رنگ زمینه کلی صفحه</span>' +
                    '<div class="hse-color-picker-row">' +
                        '<div class="hse-color-circle" id="hseBgCircle" style="background:' + s.bgColor + ';">' +
                            '<input type="color" id="hseSetBg" value="' + s.bgColor + '" />' +
                        '</div>' +
                        '<div class="hse-color-info"><span class="hse-color-label">رنگ پس‌زمینه</span><span class="hse-color-value" id="hseBgHex">' + s.bgColor + '</span></div>' +
                    '</div>' +
                '</div>' +

                '<div class="hse-preview-box" style="background:' + s.bgColor + '; color:' + s.textColor + '; border-color:' + s.primaryColor + ';">' +
                    '<span class="hse-preview-title">🔍 پیش‌نمایش تغییرات</span>' +
                    '<div>متن نمونه</div>' +
                    '<span class="hse-preview-sample" style="background:' + s.primaryColor + ';">دکمه نمونه</span>' +
                '</div>' +

                '<div class="hse-btn-row">' +
                    '<button class="hse-modal-btn" id="hseSaveSettings">💾 ذخیره تنظیمات</button>' +
                    '<button class="hse-modal-btn default-btn" id="hseDefaultSettings">↩️ بازگشت به پیش‌فرض</button>' +
                    '<button class="hse-modal-btn secondary" id="hseCloseSettings">🔙 بازگشت</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(modal);

        modal.querySelector('#hseSetPrimary').addEventListener('input', function () { updatePreview(modal); });
        modal.querySelector('#hseSetText').addEventListener('input', function () { updatePreview(modal); });
        modal.querySelector('#hseSetBg').addEventListener('input', function () { updatePreview(modal); });
        modal.querySelector('#hseDefaultSettings').onclick = function () { resetToDefault(modal); };

        modal.querySelector('#hseSaveSettings').onclick = function () {
            var ns = {
                theme: modal.querySelector('#hseSetTheme').value,
                font: modal.querySelector('#hseSetFont').value,
                size: modal.querySelector('#hseSetSize').value,
                primaryColor: modal.querySelector('#hseSetPrimary').value,
                textColor: modal.querySelector('#hseSetText').value,
                bgColor: modal.querySelector('#hseSetBg').value
            };
            applySettings(ns);
            modal.remove();
            showToast('✅ تنظیمات با موفقیت ذخیره شد.', 'success');
        };

        modal.querySelector('#hseCloseSettings').onclick = function () { modal.remove(); };
        modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
    }
    window.hseOpenSettings = openSettingsModal;

    /* ============================================================
       5. دکمه شناور تنظیمات (فقط در صفحاتی که دکمه تنظیمات داخلی ندارند)
       ============================================================ */
    function addFloatingSettingsButton() {
        if (document.getElementById('settingsBtn')) {
            // صفحه (مثل index) دکمه تنظیمات داخلی خودش را دارد
            document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);
            return;
        }
        if (document.querySelector('.hse-float-settings')) return;
        var btn = document.createElement('button');
        btn.className = 'hse-float-settings';
        btn.title = 'تنظیمات ظاهری';
        btn.innerHTML = '⚙️';
        btn.onclick = openSettingsModal;
        document.body.appendChild(btn);
    }

    /* ============================================================
       6. اجرای خودکار هنگام بارگذاری
       ============================================================ */
    function init() {
        applySettings(getSettings());
        addFloatingSettingsButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.hseApplySettings = applySettings;
    window.hseGetSettings = getSettings;
})();
