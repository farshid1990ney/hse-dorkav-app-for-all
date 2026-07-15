/* ============================================================
   سامانه ایمنی آژند همت توس — Apps Script مرکزی (نسخه یکپارچه + سیستم مجوز)
   ------------------------------------------------------------
   © تهیه شده توسط مهندس فرشید نگهداری — 09178680173
   هرگونه کپی، فروش یا استفاده تجاری بدون اجازه کتبی صاحب اثر
   حرام و ممنوع است. این نرم‌افزار دارای علامت‌گذاری منحصربه‌فرد است.
   ============================================================ */

// نام شیت‌ها (تب‌ها)
var SHEET_NAMES = {
  ANOMALI:      'گزارش_عدم_انطباق',
  NEARMISS:     'گزارش_شبه_حادثه',
  INCIDENT:     'گزارش_حادثه',
  TBM:          'TBM',
  QUIZ:         'نتایج_آزمون',
  GARDOONEH:    'گردونه_شانس',
  EHZAR:        'احضار_و_اخطار',
  TASHVIGHI:    'تشویق_و_تنبیه',
  CODES:        'کدهای_فعالسازی',
  USERS:        'کاربران_ثبت‌شده',
  INCIDENTDAYS: 'روزهای_بدون_حادثه',
  MONTHLYBONUS: 'تشویق_ماهیانه',
  PERMISSIONS:  'مجوزهای_کاربران'   // *** شیت جدید ***
};

// تعریف مرکزی ماژول‌هایی که فقط با تیک مدیر نمایش داده می‌شوند.
// «شماره‌های اضطراری» و «معرفی شرکت» عمومی‌اند و عمداً در این فهرست نیستند.
var PERMISSION_DEFS = [
  { key: 'training',            header: 'آموزش تخصصی',             aliases: ['آموزش_تخصصی'] },
  { key: 'near_miss',           header: 'گزارش شبه‌حادثه',         aliases: ['شبه_حادثه'] },
  { key: 'nonconformity',       header: 'گزارش عدم انطباق',        aliases: ['عدم_انطباق', 'آنومالی'] },
  { key: 'quiz',                header: 'QUIZ آزمون',               aliases: ['کوییز'] },
  { key: 'tbm',                 header: 'TBM',                      aliases: ['TBM'] },
  { key: 'specialist_software', header: 'نرم‌افزارهای تخصصی',      aliases: ['نرم_افزارهای_تخصصی'] },
  { key: 'ptw',                 header: 'PTW مجوز کار',             aliases: ['PTW'] },
  { key: 'summons_warning',     header: 'احضار و اخطار',            aliases: ['احضار_اخطار'] },
  { key: 'reward_discipline',   header: 'تشویق و تنبیه',            aliases: ['تشویقی'] },
  { key: 'safety_assistant',    header: 'همیار ایمنی',              aliases: ['همیار_ایمنی'] },
  { key: 'lucky_wheel',         header: 'گردونه شانس',              aliases: ['گارودنه', 'گردونه_شانس'] },
  { key: 'safety_culture',      header: 'فرهنگ ایمنی',              aliases: ['فرهنگ_ایمنی'] },
  { key: 'procedures',          header: 'دستورالعمل‌ها',            aliases: ['دستورالعمل_ها'] },
  { key: 'sds',                 header: 'SDS برگه ایمنی مواد',      aliases: ['SDS'] }
];

var PERMISSION_KEYS = PERMISSION_DEFS.map(function(def) { return def.key; });

// اطلاعات هویتی از شیت «کاربران_ثبت‌شده» به‌صورت خودکار همگام می‌شوند.
var PERMISSION_IDENTITY_HEADERS = [
  'نام و نام‌خانوادگی', 'شماره_پرسنلی', 'تلفن', 'کد ملی', 'تاریخ ثبت', 'وضعیت_حساب'
];
var PERMISSION_CHECKBOX_START_COLUMN = PERMISSION_IDENTITY_HEADERS.length + 1; // ستون 7

// هدر هر شیت
var SHEET_HEADERS = {
  ANOMALI:      ['تاریخ ثبت', 'نام و نام‌خانوادگی', 'سمت', 'واحد', 'تاریخ مشاهده', 'شرح', 'محل', 'شدت', 'نوع', 'اقدام اولیه', 'نام ضمیمه', 'حجم ضمیمه'],
  NEARMISS:     ['تاریخ ثبت', 'محل', 'نوع ریسک', 'شرح', 'گزارش‌دهنده', 'تاریخ/ساعت'],
  INCIDENT:     ['تاریخ ثبت', 'نام', 'پرسنلی', 'تاریخ/ساعت حادثه', 'محل', 'شرح', 'نوع', 'شدت', 'اقدام'],
  TBM:          ['تاریخ ثبت', 'نام', 'پرسنلی', 'تلفن', 'کد ملی', 'موضوع', 'تعداد کل موارد', 'موارد تیک‌خورده', 'تاریخ/ساعت'],
  QUIZ:         ['تاریخ ثبت', 'نام', 'پرسنلی', 'تلفن', 'کد ملی', 'موضوع آزمون', 'نمره', 'از', 'تاریخ/ساعت'],
  GARDOONEH:    ['تاریخ ثبت', 'نام', 'پرسنلی', 'کد ملی', 'جایزه (مقدار)', 'نتیجه', 'نوع سهمیه'],
  EHZAR:        ['تاریخ ثبت', 'نام', 'پرسنلی', 'موضوع احضار/اخطار', 'وضعیت', 'توضیحات'],
  TASHVIGHI:    ['تاریخ ثبت', 'نام', 'پرسنلی', 'نوع (تشویق/تنبیه)', 'امتیاز', 'توضیحات'],
  CODES:        ['کد', 'وضعیت', 'زمان_ساخت', 'زمان_انقضا'],
  USERS:        ['تاریخ_ثبت', 'نام', 'پرسنلی', 'تلفن', 'کدملی', 'کد_استفاده‌شده', 'وضعیت'],
  INCIDENTDAYS: ['تاریخ شروع (شمسی)', 'تاریخ شروع (میلادی)', 'هدف (روز)', 'توضیحات', 'تاریخ ثبت/صفر شدن'],
  MONTHLYBONUS: ['ردیف', 'نام و نام‌خانوادگی', 'شماره پرسنلی', 'مقدار تشویقی'],
  // ستون‌های مجوز در شیت به‌صورت Checkbox واقعی ساخته می‌شوند.
  PERMISSIONS: PERMISSION_IDENTITY_HEADERS
    .concat(PERMISSION_DEFS.map(function(def) { return def.header; }))
    .concat(['یادداشت'])
};

var CODE_VALID_MINUTES = 60;

/* ---- ابزارهای مشترک ---- */
function getSheet(key) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = SHEET_NAMES[key];
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var headers = SHEET_HEADERS[key];
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
           .setFontWeight('bold')
           .setBackground('#1e3c5c')
           .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function nowStr() {
  return new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---- مسیریابی یکپارچه HSE + PTW ---- */
function doGet(e) {
  return routeHttpRequest_(e || {}, 'GET');
}

function doPost(e) {
  return routeHttpRequest_(e || {}, 'POST');
}

/**
 * پارامترهای Query/Form و بدنه JSON را یکپارچه می‌کند.
 * فرانت PTW برای ورود از JSON با Content-Type=text/plain استفاده می‌کند؛
 * فرم‌های قدیمی HSE نیز همچنان با query string کار می‌کنند.
 */
function routeHttpRequest_(e, method) {
  var p = {};
  var ep = (e && e.parameter) || {};
  Object.keys(ep).forEach(function(k) { p[k] = ep[k]; });

  if (method === 'POST' && e && e.postData && e.postData.contents) {
    var raw = String(e.postData.contents || '').trim();
    if (raw) {
      try {
        var body = JSON.parse(raw);
        if (body && typeof body === 'object') {
          Object.keys(body).forEach(function(k) { p[k] = body[k]; });
        }
      } catch (ignoreJson) {
        // اگر JSON نبود، پارامترهای فرم e.parameter استفاده می‌شوند.
      }
    }
  }

  var action = String(p.action || '').trim().toLowerCase();
  if (isPtwAction_(action)) {
    return handlePtwAction_(p, method);
  }
  return handleRequest({ parameter: p });
}

function handleRequest(e) {
  try {
    var p = e.parameter || {};
    var action = p.action || '';
    switch (action) {
      case 'save_report':               return actionAnomali(p);
      case 'near_miss_report':          return actionNearMiss(p);
      case 'incident_report':           return actionIncident(p);
      case 'tbm_check':                 return actionTBM(p);
      case 'submit_grade':              return actionQuiz(p);
      case 'record_spin':               return actionGardoonehSpin(p);
      case 'monthly':                   return actionGardoonehMonthly(p);
      case 'check_spin_eligibility':    return actionGardoonehEligibility(p);
      case 'ehzar_add':                 return actionEhzarAdd(p);
      case 'ehzar_list':                return actionEhzarList(p);        // *** جدید ***
      case 'tashvighi_add':             return actionTashvighiAdd(p);
      case 'tashvighi_list':            return actionTashvighiList(p);    // *** جدید ***
      case 'register_user':             return actionRegisterUser(p);
      case 'check_status':              return actionCheckStatus(p);
      case 'get_permissions':           return actionGetPermissions(p);
      case 'ask_ai':                    return actionAskAI(p);
      case 'incident_days':             return actionIncidentDays(p);
      case 'set_incident_days':         return actionSetIncidentDays(p);  // *** جدید ***
      case 'monthly_bonus_list':        return actionMonthlyBonusList(p);
      default:
        return jsonOut({ success: false, error: 'action نامعتبر: ' + action });
    }
  } catch (err) {
    return jsonOut({ success: false, error: 'خطای سرور: ' + err.message });
  }
}

/* ============================================================
   *** سیستم مجوز — action جدید ***
   دریافت: personnel (شماره پرسنلی)
   خروجی: آبجکت permissions با کلیدهای true/false
   ============================================================ */
function permissionHeaders_() {
  return PERMISSION_IDENTITY_HEADERS
    .concat(PERMISSION_DEFS.map(function(def) { return def.header; }))
    .concat(['یادداشت']);
}

function permissionValueIsTrue_(value) {
  if (value === true) return true;
  var s = String(value == null ? '' : value).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'بله' || s === '✓';
}

/**
 * شیت مجوز را به ساختار استاندارد تبدیل می‌کند.
 * اگر ساختار قدیمی باشد، نام/پرسنلی/وضعیت/یادداشت حفظ و تمام مجوزها خاموش می‌شوند.
 */
function permissionColumnIndex_(headers, names) {
  for (var i = 0; i < names.length; i++) {
    var index = headers.indexOf(names[i]);
    if (index >= 0) return index;
  }
  return -1;
}

var PERMISSION_SCHEMA_VERSION = 'permissions-v4-clean-users';

/** ردیف‌های واقعی را از ساختار قدیمی/جدید می‌خواند و ردیف‌های خالی FALSE را کنار می‌گذارد. */
function readRealPermissionRows_(sheet, forceReset) {
  var range = sheet.getDataRange();
  var data = range.getValues();
  var display = range.getDisplayValues();
  if (!data.length) return [];

  var headers = display[0];
  var nameCol = permissionColumnIndex_(headers, ['نام و نام‌خانوادگی', 'نام']);
  var personnelCol = permissionColumnIndex_(headers, ['شماره_پرسنلی', 'پرسنلی']);
  var phoneCol = permissionColumnIndex_(headers, ['تلفن']);
  var nationalCol = permissionColumnIndex_(headers, ['کد ملی', 'کدملی']);
  var registeredCol = permissionColumnIndex_(headers, ['تاریخ ثبت', 'تاریخ_ثبت']);
  var statusCol = permissionColumnIndex_(headers, ['وضعیت_حساب']);
  var noteCol = permissionColumnIndex_(headers, ['یادداشت']);
  var byKey = {};
  var order = [];

  for (var r = 1; r < data.length; r++) {
    var fullname = nameCol >= 0 ? String(display[r][nameCol] || '').trim() : '';
    var personnel = personnelCol >= 0 ? String(display[r][personnelCol] || '').trim() : '';
    // ردیف‌هایی که فقط FALSE دارند، کاربر نیستند و کاملاً حذف می‌شوند.
    if (!fullname && !personnel) continue;

    var key = personnel ? ('p:' + personnel) : ('n:' + fullname + ':' + r);
    var row = byKey[key];
    if (!row) {
      row = [
        fullname,
        personnel,
        phoneCol >= 0 ? (display[r][phoneCol] || '') : '',
        nationalCol >= 0 ? (display[r][nationalCol] || '') : '',
        registeredCol >= 0 ? (data[r][registeredCol] || display[r][registeredCol] || '') : '',
        statusCol >= 0 ? (display[r][statusCol] || 'فعال') : 'فعال'
      ];
      PERMISSION_DEFS.forEach(function() { row.push(false); });
      row.push(noteCol >= 0 ? (display[r][noteCol] || '') : '');
      byKey[key] = row;
      order.push(key);
    } else {
      if (!row[0] && fullname) row[0] = fullname;
      if (!row[2] && phoneCol >= 0) row[2] = display[r][phoneCol] || '';
      if (!row[3] && nationalCol >= 0) row[3] = display[r][nationalCol] || '';
      if (!row[4] && registeredCol >= 0) row[4] = data[r][registeredCol] || display[r][registeredCol] || '';
    }

    if (forceReset !== true) {
      PERMISSION_DEFS.forEach(function(def, defIndex) {
        var col = headers.indexOf(def.header);
        if (col < 0 && def.aliases) col = permissionColumnIndex_(headers, def.aliases);
        if (col >= 0 && permissionValueIsTrue_(data[r][col])) {
          row[PERMISSION_CHECKBOX_START_COLUMN - 1 + defIndex] = true;
        }
      });
    }
  }

  return order.map(function(key) { return byKey[key]; });
}

function permissionStatusRule_() {
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(['فعال', 'مسدود'], true)
    .setAllowInvalid(true)
    .build();
}

function applyPermissionRowControls_(sheet, startRow, rowCount) {
  if (!rowCount || rowCount < 1) return;
  // Checkbox فقط برای ردیف کاربر واقعی ساخته می‌شود، نه تمام ردیف‌های خالی شیت.
  sheet.getRange(startRow, PERMISSION_CHECKBOX_START_COLUMN, rowCount, PERMISSION_DEFS.length)
    .insertCheckboxes();
  sheet.getRange(startRow, 6, rowCount, 1).setDataValidation(permissionStatusRule_());
}

function formatPermissionSheet_(sheet) {
  var expected = permissionHeaders_();
  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true);
  sheet.getRange(1, 1, 1, expected.length)
    .setBackground('#1e3c5c')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setWrap(true);
  sheet.setRowHeight(1, 48);
  sheet.setColumnWidth(1, 190);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 125);
  sheet.setColumnWidth(4, 125);
  sheet.setColumnWidth(5, 150);
  sheet.setColumnWidth(6, 110);
  for (var c = PERMISSION_CHECKBOX_START_COLUMN; c < expected.length; c++) sheet.setColumnWidth(c, 145);
  sheet.setColumnWidth(expected.length, 200);
}

function rewritePermissionSheet_(sheet, rows) {
  var expected = permissionHeaders_();
  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet.clear();
  sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
  if (rows.length) {
    applyPermissionRowControls_(sheet, 2, rows.length);
    sheet.getRange(2, 1, rows.length, expected.length).setValues(rows);
  }
  formatPermissionSheet_(sheet);
}

function upsertPermissionUser_(sheet, identity) {
  var personnel = String(identity.personnel || '').trim();
  var fullname = String(identity.fullname || '').trim();
  if (!personnel) return { added: false, updated: false, skipped: true };

  var last = sheet.getLastRow();
  var rowNumber = 0;
  if (last >= 2) {
    var personnels = sheet.getRange(2, 2, last - 1, 1).getDisplayValues();
    for (var i = 0; i < personnels.length; i++) {
      if (String(personnels[i][0] || '').trim() === personnel) {
        rowNumber = i + 2;
        break;
      }
    }
  }

  var accountStatus = normalizePermissionAccountStatus_(identity.status);
  if (rowNumber) {
    var current = sheet.getRange(rowNumber, 1, 1, PERMISSION_IDENTITY_HEADERS.length).getValues()[0];
    var next = [
      fullname || current[0] || '',
      personnel,
      identity.phone || current[2] || '',
      identity.national || current[3] || '',
      identity.registeredAt || current[4] || '',
      current[5] || accountStatus
    ];
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      sheet.getRange(rowNumber, 1, 1, PERMISSION_IDENTITY_HEADERS.length).setValues([next]);
      return { added: false, updated: true, row: rowNumber };
    }
    return { added: false, updated: false, row: rowNumber };
  }

  var newRow = [
    fullname,
    personnel,
    identity.phone || '',
    identity.national || '',
    identity.registeredAt || new Date(),
    accountStatus
  ];
  PERMISSION_DEFS.forEach(function() { newRow.push(false); });
  newRow.push(identity.note || '');

  rowNumber = Math.max(sheet.getLastRow() + 1, 2);
  applyPermissionRowControls_(sheet, rowNumber, 1);
  sheet.getRange(rowNumber, 1, 1, permissionHeaders_().length).setValues([newRow]);
  return { added: true, updated: false, row: rowNumber };
}

function normalizePermissionAccountStatus_(status) {
  var s = String(status == null ? '' : status).trim().toLowerCase();
  if (s === 'blocked' || s === 'غیرفعال' || s === 'مسدود' || s === 'false') return 'مسدود';
  return 'فعال';
}

function syncRegisteredUsersToPermissions_(permissionSheet) {
  permissionSheet = permissionSheet || getSheet('PERMISSIONS');
  var usersSheet = getSheet('USERS');
  var userRange = usersSheet.getDataRange();
  var values = userRange.getValues();
  var display = userRange.getDisplayValues();
  var added = 0, updated = 0, seen = {};

  for (var i = values.length - 1; i >= 1; i--) {
    var personnel = String(display[i][2] || values[i][2] || '').trim();
    if (!personnel || seen[personnel]) continue;
    seen[personnel] = true;
    var result = upsertPermissionUser_(permissionSheet, {
      fullname: display[i][1] || values[i][1] || '',
      personnel: personnel,
      phone: display[i][3] || values[i][3] || '',
      national: display[i][4] || values[i][4] || '',
      registeredAt: values[i][0] || display[i][0] || '',
      status: display[i][6] || values[i][6] || 'فعال',
      note: 'منبع: سامانه اصلی HSE'
    });
    if (result.added) added++;
    if (result.updated) updated++;
  }
  return { added: added, updated: updated };
}

function syncPtwUsersToPermissions_(permissionSheet) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ptwSheet = ss.getSheetByName(PTW_USER_SHEET);
  if (!ptwSheet || ptwSheet.getLastRow() < 2) return { added: 0, updated: 0 };
  var range = ptwSheet.getDataRange();
  var values = range.getValues();
  var display = range.getDisplayValues();
  var headers = display[0];
  var cCode = headers.indexOf('کد');
  var cFirst = headers.indexOf('نام');
  var cLast = headers.indexOf('نام‌خانوادگی');
  var cPersonnel = headers.indexOf('شماره پرسنلی');
  var cPhone = headers.indexOf('تلفن');
  var cNational = headers.indexOf('کد ملی');
  var cStatus = headers.indexOf('وضعیت');
  var cLogin = headers.indexOf('آخرین ورود');
  if (cPersonnel < 0) return { added: 0, updated: 0 };

  var added = 0, updated = 0, seen = {};
  for (var i = values.length - 1; i >= 1; i--) {
    var personnel = String(display[i][cPersonnel] || '').trim();
    if (!personnel || seen[personnel]) continue;
    seen[personnel] = true;
    var fullname = [display[i][cFirst] || '', display[i][cLast] || ''].join(' ').trim();
    var result = upsertPermissionUser_(permissionSheet, {
      fullname: fullname,
      personnel: personnel,
      phone: cPhone >= 0 ? display[i][cPhone] : '',
      national: cNational >= 0 ? display[i][cNational] : '',
      registeredAt: cLogin >= 0 ? (values[i][cLogin] || display[i][cLogin]) : '',
      status: cStatus >= 0 ? display[i][cStatus] : 'فعال',
      note: 'منبع: PTW؛ کد ' + (cCode >= 0 ? display[i][cCode] : '')
    });
    if (result.added) added++;
    if (result.updated) updated++;
  }
  return { added: added, updated: updated };
}

function ensurePermissionCheckboxSheet_(forceReset) {
  var sheet = getSheet('PERMISSIONS');
  var expected = permissionHeaders_();
  var display = sheet.getDataRange().getDisplayValues();
  var headers = display.length ? display[0].slice(0, expected.length) : [];
  var schemaMatches = headers.length === expected.length;
  if (schemaMatches) {
    for (var i = 0; i < expected.length; i++) {
      if (String(headers[i] || '').trim() !== expected[i]) { schemaMatches = false; break; }
    }
  }

  var props = PropertiesService.getScriptProperties();
  var versionMatches = props.getProperty('HSE_PERMISSION_SCHEMA') === PERMISSION_SCHEMA_VERSION;
  if (forceReset === true || !schemaMatches || !versionMatches) {
    var rows = readRealPermissionRows_(sheet, forceReset === true);
    rewritePermissionSheet_(sheet, rows);
    props.setProperty('HSE_PERMISSION_SCHEMA', PERMISSION_SCHEMA_VERSION);
  } else {
    formatPermissionSheet_(sheet);
  }

  syncRegisteredUsersToPermissions_(sheet);
  syncPtwUsersToPermissions_(sheet);
  SpreadsheetApp.flush();
  return sheet;
}

function syncUsersToPermissions() {
  var sheet = ensurePermissionCheckboxSheet_(false);
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
  SpreadsheetApp.getUi().alert(
    '✅ همگام‌سازی انجام شد',
    'ردیف‌های خالی FALSE حذف شدند و کاربران واقعی HSE و PTW به جدول مجوزها منتقل/به‌روزرسانی شدند.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


function actionGetPermissions(p) {
  var personnel = String(p.personnel || '').trim();
  if (!personnel) {
    return jsonOut({ success: false, msg: 'پرسنلی ارسال نشده' });
  }

  var sheet = ensurePermissionCheckboxSheet_(false);
  var data = sheet.getDataRange().getValues();
  var headers = data[0] || [];
  var colPersonnel = headers.indexOf('شماره_پرسنلی');
  var colStatus = headers.indexOf('وضعیت_حساب');
  var found = null;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colPersonnel] || '').trim() === personnel) {
      found = data[i];
      break;
    }
  }

  // نبودن ردیف مجوز، حساب را مسدود نمی‌کند؛ فقط همه ماژول‌ها مخفی می‌مانند.
  if (!found) {
    return jsonOut({
      success: true,
      found: false,
      active: true,
      permissions: buildEmptyPermissions(),
      catalog: PERMISSION_DEFS
    });
  }

  var status = colStatus >= 0 ? String(found[colStatus] || '').trim().toLowerCase() : 'فعال';
  var isActive = !(status === 'blocked' || status === 'مسدود' || status === 'غیرفعال' || status === 'false');
  var perms = {};

  PERMISSION_DEFS.forEach(function(def) {
    var col = headers.indexOf(def.header);
    perms[def.key] = col >= 0 ? permissionValueIsTrue_(found[col]) : false;
  });

  return jsonOut({
    success: true,
    found: true,
    active: isActive,
    permissions: perms,
    catalog: PERMISSION_DEFS
  });
}

function buildEmptyPermissions() {
  var perms = {};
  PERMISSION_DEFS.forEach(function(def) { perms[def.key] = false; });
  return perms;
}

/* ============================================================
   بررسی وضعیت کاربر (check_status) — حالا مجوزها را هم برمی‌گرداند
   ============================================================ */
function actionCheckStatus(p) {
  var personnel = (p.personnel || '').toString().trim();
  if (!personnel) {
    return jsonOut({ success: false, active: false, msg: 'شماره پرسنلی ارسال نشده' });
  }

  // ابتدا وضعیت کلی کاربر از شیت USERS
  var usersSheet = getSheet('USERS');
  var data = usersSheet.getDataRange().getValues();
  var found = null;
  for (var i = 1; i < data.length; i++) {
    if ((data[i][2] || '').toString().trim() === personnel) found = data[i];
  }
  if (!found) {
    return jsonOut({ success: true, active: false, msg: 'کاربر یافت نشد' });
  }
  var status = (found[6] || 'active').toString().trim().toLowerCase();
  var isActive = (status === 'active' || status === '');

  // مجوزها را هم اضافه کن
  var permResult = actionGetPermissions(p);
  var permData = JSON.parse(permResult.getContent());

  var finalActive = isActive && permData.active !== false;
  return jsonOut({
    success: true,
    active: finalActive,
    msg: finalActive ? 'فعال' : 'دسترسی مسدود شده است',
    permissions: permData.permissions || buildEmptyPermissions()
  });
}

/* ============================================================
   ثبت کاربر جدید
   ============================================================ */
function actionRegisterUser(p) {
  var fullname  = (p.fullname    || '').toString().trim();
  var personnel = (p.personnel   || '').toString().trim();
  var phone     = (p.phone       || '').toString().trim();
  var national  = (p.national_id || '').toString().trim();
  var code      = (p.code        || '').toString().trim().toUpperCase();
  // اگر کاربر فقط رقم‌های کد را وارد کرده باشد (بدون پیشوند HSE-)، پیشوند اضافه می‌شود
  if (code && /^\d+$/.test(code)) {
    code = 'HSE-' + code;
  }

  if (!fullname || !personnel || !phone || !national || !code) {
    return jsonOut({ success: false, msg: 'اطلاعات ناقص ارسال شده است' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var codesSheet = getSheet('CODES');
    var usersSheet = getSheet('USERS');
    var cData = codesSheet.getDataRange().getValues();
    var rowIndex = -1, rowData = null;

    for (var i = 1; i < cData.length; i++) {
      if ((cData[i][0] || '').toString().trim().toUpperCase() === code) {
        rowIndex = i + 1;
        rowData = cData[i];
        break;
      }
    }
    if (rowIndex === -1) return jsonOut({ success: false, msg: 'کد فعالسازی یافت نشد' });

    var cStatus = (rowData[1] || '').toString().trim().toLowerCase();
    var expiry  = rowData[3];

    if (cStatus === 'used')    return jsonOut({ success: false, msg: 'این کد قبلاً مصرف شده است' });
    if (cStatus !== 'active')  return jsonOut({ success: false, msg: 'این کد غیرفعال است' });

    if (expiry instanceof Date && new Date().getTime() > expiry.getTime()) {
      codesSheet.getRange(rowIndex, 2).setValue('expired');
      return jsonOut({ success: false, msg: 'مدت اعتبار کد به پایان رسیده است' });
    }

    codesSheet.getRange(rowIndex, 2).setValue('used');
    usersSheet.appendRow([new Date(), fullname, personnel, phone, national, code, 'active']);

    // اگر ردیفی در شیت مجوز نداشت، یک ردیف پیش‌فرض (همه FALSE) بساز
    var permSheet = ensurePermissionCheckboxSheet_(false);
    var permData  = permSheet.getDataRange().getValues();
    var pHeaders  = permData[0];
    var colP      = pHeaders.indexOf('شماره_پرسنلی');
    var alreadyIn = false;
    for (var j = 1; j < permData.length; j++) {
      if ((permData[j][colP] || '').toString().trim() === personnel) { alreadyIn = true; break; }
    }
    if (!alreadyIn) {
      // ردیف پیش‌فرض با مشخصات کامل؛ همه مجوزها تا تیک مدیر خاموش‌اند.
      var newRow = [fullname, personnel, phone, national, new Date(), 'فعال'];
      PERMISSION_KEYS.forEach(function() { newRow.push(false); });
      newRow.push(''); // یادداشت
      permSheet.appendRow(newRow);
    }

    // مجوزها را بازگردان تا فرانت‌اند بلافاصله اعمال کند
    var permResult = actionGetPermissions({ personnel: personnel });
    var permObj    = JSON.parse(permResult.getContent());

    return jsonOut({
      success: true,
      msg: 'فعالسازی با موفقیت انجام شد',
      permissions: permObj.permissions || buildEmptyPermissions()
    });

  } catch (err) {
    return jsonOut({ success: false, msg: 'خطای داخلی: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

/* ============================================================
   گزارش عدم انطباق
   ============================================================ */
function actionAnomali(p) {
  var sheet = getSheet('ANOMALI');
  sheet.appendRow([
    nowStr(), p.name||'', p.position||'', p.department||'',
    p.date||'', p.description||'', p.location||'', p.severity||'',
    p.type||'', p.initialAction||'', p.attachment_name||'', p.attachment_size||''
  ]);
  return jsonOut({ success: true, ok: true });
}

/* ============================================================
   شبه‌حادثه
   ============================================================ */
function actionNearMiss(p) {
  var sheet = getSheet('NEARMISS');
  sheet.appendRow([nowStr(), p.location||'', p.riskType||'', p.description||'', p.reporter||'', p.datetime||'']);
  return jsonOut({ success: true, ok: true });
}

/* ============================================================
   گزارش حادثه (شیت جدید)
   ============================================================ */
function actionIncident(p) {
  var sheet = getSheet('INCIDENT');
  sheet.appendRow([
    nowStr(), p.name||'', p.personnel||'', p.datetime||'',
    p.location||'', p.description||'', p.type||'', p.severity||'', p.action||''
  ]);
  return jsonOut({ success: true, ok: true });
}

/* ============================================================
   TBM
   ============================================================ */
function actionTBM(p) {
  var sheet = getSheet('TBM');
  sheet.appendRow([
    nowStr(), p.name||'', p.personnel||'', p.phone||'', p.nationalId||'',
    p.topic||'', p.totalItems||'', p.checkedItems||'', p.datetime||''
  ]);
  return jsonOut({ ok: true, success: true });
}

/* ============================================================
   کوییز
   ============================================================ */
function actionQuiz(p) {
  var sheet = getSheet('QUIZ');
  sheet.appendRow([
    nowStr(), p.name||'', p.personnel||'', p.phone||'', p.nationalId||'',
    p.topic||'', p.score||'', p.total||'', p.datetime||''
  ]);
  return jsonOut({ ok: true, success: true });
}

/* ============================================================
   گردونه شانس
   ============================================================ */
function actionGardoonehSpin(p) {
  var sheet = getSheet('GARDOONEH');
  sheet.appendRow([nowStr(), p.name||'', p.personnel||'', p.nationalId||'', p.prize||'', p.result||'', p.slotType||'']);
  return jsonOut({ ok: true, success: true });
}

function actionGardoonehMonthly(p) {
  var sheet = getSheet('GARDOONEH');
  var data  = sheet.getDataRange().getValues();
  var c200=0, c300=0, c500=0;
  for (var i=1;i<data.length;i++) {
    var prize = String(data[i][4]);
    if (prize==='200000') c200++;
    else if (prize==='300000') c300++;
    else if (prize==='500000') c500++;
  }
  return jsonOut({ ok:true, c200:c200, c300:c300, c500:c500 });
}

function actionGardoonehEligibility(p) {
  var personnel = p.personnel||'';
  var sheet = getSheet('GARDOONEH');
  var data  = sheet.getDataRange().getValues();
  var today = new Date().toLocaleDateString('fa-IR');
  var usedBase = false;
  for (var i=1;i<data.length;i++) {
    if (String(data[i][2])===personnel && String(data[i][0]).indexOf(today)!==-1) usedBase=true;
  }
  return jsonOut({ ok:true, usedToday:{base:usedBase,tbm:false,exam:false}, eligibleToday:{base:!usedBase,tbm:false,exam:false}, spinCountTotal:data.length-1 });
}

/* ============================================================
   احضار و اخطار
   ============================================================ */
function actionEhzarAdd(p) {
  var sheet = getSheet('EHZAR');
  sheet.appendRow([nowStr(), p.name||'', p.personnel||'', p.subject||'', p.status||'', p.description||'']);
  return jsonOut({ ok:true, success:true });
}

/* ============================================================
   لیست احضار و اخطار — برای نمایش جدول در ehzar.html
   ============================================================ */
function actionEhzarList(p) {
  var sheet = getSheet('EHZAR');
  var data  = sheet.getDataRange().getValues();
  var rows  = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[1] && !row[2] && !row[3]) continue; // ردیف خالی را رد کن
    rows.push([
      row[0] || '', // تاریخ ثبت
      row[1] || '', // نام
      row[2] || '', // پرسنلی
      row[3] || '', // موضوع
      row[4] || '', // وضعیت
      row[5] || ''  // توضیحات
    ]);
  }
  // جدیدترین‌ها اول نمایش داده شوند
  rows.reverse();
  return jsonOut({ ok: true, success: true, items: rows });
}

/* ============================================================
   تشویق و تنبیه
   ============================================================ */
function actionTashvighiAdd(p) {
  var sheet = getSheet('TASHVIGHI');
  sheet.appendRow([nowStr(), p.name||'', p.personnel||'', p.type||'', p.score||'', p.description||'']);
  return jsonOut({ ok:true, success:true });
}

/* ============================================================
   لیست تشویق و تنبیه — برای نمایش جدول (در صورت نیاز)
   ============================================================ */
function actionTashvighiList(p) {
  var sheet = getSheet('TASHVIGHI');
  var data  = sheet.getDataRange().getValues();
  var rows  = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[1] && !row[2]) continue;
    rows.push([row[0]||'', row[1]||'', row[2]||'', row[3]||'', row[4]||'', row[5]||'']);
  }
  rows.reverse();
  return jsonOut({ ok: true, success: true, items: rows });
}

/* ============================================================
   روزهای بدون حادثه
   ============================================================ */
function jalaliToGregorian(jy,jm,jd){
  jy=parseInt(jy,10);jm=parseInt(jm,10);jd=parseInt(jd,10);
  var jy1=jy+1595;
  var days=-355668+(365*jy1)+(Math.floor(jy1/33)*8)+Math.floor(((jy1%33)+3)/4)+jd+((jm<7)?(jm-1)*31:((jm-7)*30)+186);
  var gy=400*Math.floor(days/146097);
  days%=146097;
  if(days>36524){gy+=100*Math.floor(--days/36524);days%=36524;if(days>=365)days++;}
  gy+=4*Math.floor(days/1461);days%=1461;
  if(days>365){gy+=Math.floor((days-1)/365);days=(days-1)%365;}
  var gd=days+1;
  var gMonthDays=[0,31,((gy%4===0&&gy%100!==0)||gy%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];
  var gm;for(gm=1;gm<=12;gm++){if(gd<=gMonthDays[gm])break;gd-=gMonthDays[gm];}
  return new Date(gy,gm-1,gd);
}

function parsePersianDateString(str){
  if(!str)return null;
  var parts=String(str).trim().split(/[\/\-]/);
  if(parts.length!==3)return null;
  return jalaliToGregorian(parts[0],parts[1],parts[2]);
}

function actionIncidentDays(p) {
  var sheet = getSheet('INCIDENTDAYS');
  var data  = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return jsonOut({ ok:true, success:true, startDatePersian:'', days:0, goal:366, note:'هنوز تاریخ شروع ثبت نشده است' });
  }
  var last = data[data.length-1];
  var startPersian   = last[0];
  var startGregorian = last[1];
  var goal = last[2]||366;
  var note = last[3]||'';
  var startDate = (startGregorian instanceof Date) ? startGregorian : parsePersianDateString(startPersian);
  var days = 0;
  if (startDate) {
    var s = new Date(startDate.getFullYear(),startDate.getMonth(),startDate.getDate());
    var t = new Date(); t = new Date(t.getFullYear(),t.getMonth(),t.getDate());
    days = Math.max(0, Math.floor((t-s)/(864e5)));
  }
  return jsonOut({ ok:true, success:true, startDatePersian:startPersian, days:days, goal:goal, note:note });
}

/* ============================================================
   ثبت/صفر کردن روزهای بدون حادثه — از طریق API (بدون رمز)
   ------------------------------------------------------------
   ورودی: startDate (شمسی مثل 1403/04/10), goal (عدد), note (اختیاری)
   ============================================================ */
function actionSetIncidentDays(p) {
  var startPersian = (p.startDate || '').toString().trim();
  var goal = parseInt(p.goal, 10);
  var note = (p.note || '').toString().trim();

  if (!startPersian) {
    return jsonOut({ success: false, msg: 'تاریخ شروع ارسال نشده است' });
  }
  var gDate = parsePersianDateString(startPersian);
  if (!gDate) {
    return jsonOut({ success: false, msg: 'فرمت تاریخ نامعتبر است. مثال صحیح: 1403/04/10' });
  }
  if (!goal || goal < 1) goal = 366;

  var sheet = getSheet('INCIDENTDAYS');
  sheet.appendRow([startPersian, gDate, goal, note, nowStr()]);

  return jsonOut({
    success: true,
    msg: 'تاریخ شروع با موفقیت ثبت شد',
    startDatePersian: startPersian,
    goal: goal,
    note: note
  });
}

/* ============================================================
   تشویق ماهیانه
   ============================================================ */
function actionMonthlyBonusList(p) {
  var sheet = getSheet('MONTHLYBONUS');
  var data  = sheet.getDataRange().getValues();
  var rows  = [];
  for (var i=1;i<data.length;i++) {
    var row=data[i];
    if(!row[1]&&!row[2]&&!row[3])continue;
    rows.push({ row:row[0]||(i), fullname:row[1]||'', personnel:row[2]||'', amount:row[3]||'' });
  }
  return jsonOut({ ok:true, success:true, items:rows });
}

/* ============================================================
   همیار ایمنی (AI)
   ============================================================ */
function actionAskAI(p) {
  var question = p.question||'';
  if (!question) return jsonOut({ success:false, msg:'سوال خالی است.' });
  // کلید API را در Script Properties ذخیره کنید
  // var apiKey = PropertiesService.getScriptProperties().getProperty('AI_API_KEY');
  return jsonOut({ success:false, msg:'اتصال هوش مصنوعی هنوز تنظیم نشده است.' });
}

/* ============================================================
   منوی ادمین — منوی سفارشی گوگل شیت
   ============================================================ */
function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu('🔐 مدیریت HSE')
    .addItem('🏗️ ساخت همه شیت‌های HSE', 'setupAllSheets')
    .addSeparator()
    .addItem('➕ ساخت کد فعالسازی (دسته‌ای)', 'generateActivationCodesBatch')
    .addSeparator()
    .addItem('📅 ثبت/صفر کردن روزهای بدون حادثه', 'setIncidentStartDate')
    .addSeparator()
    .addItem('☑️ ساخت چک‌باکس‌ها و صفر کردن مجوزها', 'setupPermissionCheckboxes')
    .addItem('🔄 همگام‌سازی کاربران با مجوزها', 'syncUsersToPermissions')
    .addItem('👤 باز کردن مدیریت مجوزها', 'openPermissionsManager')
    .addToUi();

  ui.createMenu('🛂 مدیریت PTW')
    .addItem('🧱 ساخت/تعمیر شیت‌های PTW', 'setupPtwSheets')
    .addItem('♻️ بازسازی ۱۲ کاربر پیش‌فرض', 'resetPtwUsers')
    .addSeparator()
    .addItem('ℹ️ راهنمای ستون‌های پرمیت', 'showPtwHelp')
    .addToUi();
}
/* ============================================================
   ساخت همه شیت‌های لازم با یک کلیک
   ------------------------------------------------------------
   این تابع تمام شیت‌های تعریف‌شده در SHEET_NAMES را با هدر
   درست (رنگی و بولد) می‌سازد. اگر شیتی از قبل وجود داشته باشد
   دست‌نخورده باقی می‌ماند (داده‌هایش پاک نمی‌شود).
   ============================================================ */
function setupAllSheets() {
  var ui = SpreadsheetApp.getUi();
  var created = [];
  var existed = [];

  Object.keys(SHEET_NAMES).forEach(function(key) {
    var name = SHEET_NAMES[key];
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var already = ss.getSheetByName(name);
    if (already) {
      existed.push(name);
    } else {
      getSheet(key); // می‌سازد و هدر را تنظیم می‌کند
      created.push(name);
    }
  });

  var msg = '';
  if (created.length > 0) {
    msg += '✅ شیت‌های زیر ساخته شدند:\n' + created.join('\n') + '\n\n';
  }
  if (existed.length > 0) {
    msg += 'ℹ️ شیت‌های زیر از قبل وجود داشتند (دست‌نخورده ماندند):\n' + existed.join('\n');
  }
  if (!msg) msg = 'هیچ شیتی برای ساخت یافت نشد.';

  ui.alert('🏗️ راه‌اندازی شیت‌ها', msg, ui.ButtonSet.OK);
}

/* ============================================================
   ساخت کد فعالسازی دسته‌ای
   ============================================================ */
function generateActivationCodesBatch() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('🔐 ساخت کد فعالسازی','چند کد می‌خواهید؟ (مثلاً 10)',ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton()!==ui.Button.OK) return;
  var count = parseInt(response.getResponseText().trim(),10);
  if (!count||count<1) { ui.alert('❌ عدد نامعتبر'); return; }
  if (count>200) { ui.alert('❌ حداکثر ۲۰۰ کد'); return; }
  var codesSheet = getSheet('CODES');
  var now = new Date();
  var expiry = new Date(now.getTime()+CODE_VALID_MINUTES*60*1000);
  var rows=[], codesList=[], usedCodes={};
  while (codesList.length<count) {
    var code='HSE-'+Math.floor(1000+Math.random()*9000);
    if(usedCodes[code])continue;
    usedCodes[code]=true;
    codesList.push(code);
    rows.push([code,'active',now,expiry]);
  }
  var startRow=codesSheet.getLastRow()+1;
  codesSheet.getRange(startRow,1,rows.length,4).setValues(rows);
  ui.alert('✅ '+count+' کد ساخته شد:\n\n'+codesList.join('\n')+'\n\n⏱ اعتبار: '+CODE_VALID_MINUTES+' دقیقه');
}

/* ============================================================
   صفر کردن روزهای بدون حادثه
   ============================================================ */
function setIncidentStartDate() {
  var ui = SpreadsheetApp.getUi();
  var dateResp = ui.prompt('📅 ثبت تاریخ شروع','تاریخ شمسی به فرمت 1403/04/10:',ui.ButtonSet.OK_CANCEL);
  if (dateResp.getSelectedButton()!==ui.Button.OK) return;
  var persianDateStr = dateResp.getResponseText().trim();
  var gDate = parsePersianDateString(persianDateStr);
  if (!gDate) { ui.alert('❌ فرمت نامعتبر. مثال: 1403/04/10'); return; }
  var goalResp = ui.prompt('🎯 هدف (روز)','تعداد روز هدف (مثلاً 366):',ui.ButtonSet.OK_CANCEL);
  if (goalResp.getSelectedButton()!==ui.Button.OK) return;
  var goal = parseInt(goalResp.getResponseText().trim(),10)||366;
  var noteResp = ui.prompt('📝 توضیحات (اختیاری)','',ui.ButtonSet.OK_CANCEL);
  var note = noteResp.getSelectedButton()===ui.Button.OK ? noteResp.getResponseText().trim() : '';
  getSheet('INCIDENTDAYS').appendRow([persianDateStr, gDate, goal, note, nowStr()]);
  ui.alert('✅ تاریخ شروع ثبت شد:\n'+persianDateStr+'\nهدف: '+goal+' روز');
}

/* ============================================================
   مدیریت مجوزهای کاربران — راهنمای استفاده
   ============================================================ */
function setupPermissionCheckboxes() {
  var ui = SpreadsheetApp.getUi();
  var answer = ui.alert(
    'ساخت چک‌باکس‌های مجوز',
    'طبق تنظیم تأییدشده، تمام مجوزهای فعلی خاموش می‌شوند و فقط «معرفی شرکت» و «شماره‌های اضطراری» برای همه قابل مشاهده خواهند بود. ادامه می‌دهید؟',
    ui.ButtonSet.YES_NO
  );
  if (answer !== ui.Button.YES) return;

  var sheet = ensurePermissionCheckboxSheet_(true);
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
  ui.alert(
    '✅ انجام شد',
    'همه ستون‌های ماژول‌ها به Checkbox تبدیل و تمام تیک‌ها خاموش شدند.\n\nاز این پس هر ماژول فقط با تیک همان ستون برای کاربر نمایش داده می‌شود.',
    ui.ButtonSet.OK
  );
}

function openPermissionsManager() {
  var sheet = ensurePermissionCheckboxSheet_(false);
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
  SpreadsheetApp.getUi().alert(
    '👤 مدیریت مجوزها',
    'برای نمایش هر ماژول، Checkbox همان ستون را برای کاربر تیک بزنید.\n\n' +
    'همیشه قابل مشاهده:\n' +
    '• شماره‌های اضطراری\n' +
    '• معرفی شرکت\n\n' +
    'بدون تیک، آیتم مربوطه در گرید و منوی سامانه کاملاً مخفی است.\n' +
    'برای مسدود کردن کل حساب، ستون «وضعیت حساب» را روی «مسدود» قرار دهید.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/* ============================================================
   ماژول یکپارچه PTW — مشاهده پرمیت و پایش کاربران
   ------------------------------------------------------------
   قواعد:
   - ثبت/ویرایش/حذف پرمیت فقط در شیت «پرمیت» انجام می‌شود.
   - صفحه ptw-list.html فقط داده را می‌خواند.
   - اعتبارسنجی کد و قطع/وصل دسترسی فقط سمت سرور است.
   ============================================================ */

var PTW_PERMIT_SHEET = 'پرمیت';
var PTW_USER_SHEET   = 'کاربران ptw';
var PTW_LEGACY_USER_SHEETS = ['کاربران', 'کاربران PTW', 'کاربران_ptw'];

var PTW_DEFAULT_CODES = [
  '13619873', '15459515', '25502866', '31163860',
  '35732010', '47488794', '56738018', '58989085',
  '64614684', '66724517', '75013123', '96792582'
];

var PTW_ADMIN_CODES = ['96792582'];

var PTW_PERMIT_HEADERS = [
  'ردیف', 'تاریخ شروع', 'ساعت شروع', 'محل انجام کار', 'نوع کار', 'شرح کار',
  'واحد درخواست‌کننده', 'تاریخ اتمام', 'ساعت اتمام', 'رد تایید فنی', 'تایید فنی',
  'علت توقف', 'شماره پرمیت', 'پیمانکار', 'وضعیت پرمیت'
];

var PTW_USER_HEADERS = [
  'کد', 'نام', 'نام‌خانوادگی', 'شماره پرسنلی', 'تلفن', 'کد ملی',
  'وضعیت', 'آخرین ورود', 'آخرین فعالیت', 'تعداد ورود', 'زمان قطع دسترسی', 'یادداشت'
];

/** اکشن‌های PTW؛ نسخه‌های ptw_دار نیز پذیرفته می‌شوند. */
function isPtwAction_(action) {
  action = String(action || '').toLowerCase();
  if (action.indexOf('ptw_') === 0) action = action.substring(4);
  return [
    'login', 'permits', 'users', 'check',
    'revoke', 'activate', 'setup', 'ping'
  ].indexOf(action) !== -1;
}

function normalizePtwAction_(action) {
  action = String(action || '').trim().toLowerCase();
  return action.indexOf('ptw_') === 0 ? action.substring(4) : action;
}

/** مسیریاب API ماژول PTW. */
function handlePtwAction_(p, method) {
  try {
    p = p || {};
    var action = normalizePtwAction_(p.action || 'permits');
    var code = String(p.code || '').trim();

    if (action === 'ping') {
      return jsonOut({
        ok: true,
        success: true,
        service: 'PTW',
        version: 'ptw-unified-v5.3',
        time: ptwNow_(),
        userSheet: PTW_USER_SHEET
      });
    }

    if (action === 'login') {
      return ptwLogin_(code, p.firstName, p.lastName, p.personnel, p.phone, p.national);
    }

    if (action === 'setup') {
      if (!ptwIsAdmin_(code)) {
        return jsonOut({ ok: false, success: false, error: 'فقط مدیر PTW مجاز است' });
      }
      return jsonOut(ptwSetup_(String(p.reset || '') === '1' || p.resetUsers === true));
    }

    if (!code) {
      return jsonOut({ ok: false, success: false, active: false, error: 'کد کاربری لازم است' });
    }

    // اگر هنوز شیت کاربران ساخته نشده، راه‌اندازی اولیه انجام شود.
    if (!ptwExistingUserSheet_(true)) {
      ptwSetup_(false);
    }

    var user = ptwFindUser_(code);
    if (!user) {
      return jsonOut({ ok: false, success: false, active: false, error: 'کد مجاز نیست' });
    }
    if (!ptwIsActive_(user.status)) {
      return jsonOut({
        ok: false,
        success: false,
        active: false,
        error: 'دسترسی این کاربر قطع شده است',
        revokedAt: user.revokedAt || ''
      });
    }

    // نشست‌های ذخیره‌شده قدیمی نیز نام کاربر را در شیت «کاربران ptw» تکمیل می‌کنند.
    ptwSyncUserIdentity_(user, p.firstName, p.lastName, p.personnel, p.phone, p.national);

    if (action === 'check') {
      ptwTouchSeen_(user.row);
      return jsonOut({ ok: true, success: true, active: true, user: ptwPublicUser_(user) });
    }

    if (action === 'users') {
      if (!ptwIsAdmin_(code)) {
        return jsonOut({ ok: false, success: false, error: 'فقط مدیر مجاز است' });
      }
      ptwTouchSeen_(user.row);
      return jsonOut({
        ok: true,
        success: true,
        active: true,
        isAdmin: true,
        users: ptwAllUsers_()
      });
    }

    if (action === 'revoke' || action === 'activate') {
      if (!ptwIsAdmin_(code)) {
        return jsonOut({ ok: false, success: false, error: 'فقط مدیر مجاز است' });
      }
      return ptwSetUserAccess_(action, p.targetCode, p.note);
    }

    // permits — حالت پیش‌فرض خواندن لیست
    ptwTouchSeen_(user.row);
    var rows = ptwPermitRows_();
    return jsonOut({
      ok: true,
      success: true,
      active: true,
      rows: rows,
      count: rows.length,
      me: ptwPublicUser_(user)
    });
  } catch (err) {
    return jsonOut({ ok: false, success: false, error: 'خطای PTW: ' + err.message });
  }
}

function ptwNow_() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'Asia/Tehran',
    'yyyy/MM/dd HH:mm:ss'
  );
}

function ptwIsAdmin_(code) {
  return PTW_ADMIN_CODES.indexOf(String(code || '').trim()) !== -1;
}

function ptwIsActive_(status) {
  var s = String(status == null ? '' : status).trim().toLowerCase();
  return s === '' || s === 'فعال' || s === 'active' || s === 'true' || s === '1';
}

function ptwPublicUser_(u) {
  return {
    code: u.code,
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    personnel: u.personnel || '',
    phone: u.phone || '',
    national: u.national || '',
    status: u.status || 'فعال',
    loginCount: u.loginCount || 0,
    isAdmin: ptwIsAdmin_(u.code)
  };
}

function ptwGetOrCreateSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function ptwExistingUserSheet_(renameLegacy) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(PTW_USER_SHEET);
  if (sh) return sh;

  for (var i = 0; i < PTW_LEGACY_USER_SHEETS.length; i++) {
    var legacyName = PTW_LEGACY_USER_SHEETS[i];
    if (legacyName === PTW_USER_SHEET) continue;
    var legacy = ss.getSheetByName(legacyName);
    if (!legacy) continue;
    if (renameLegacy) legacy.setName(PTW_USER_SHEET);
    return legacy;
  }
  return null;
}

function ptwUserSheet_() {
  var sh = ptwExistingUserSheet_(true);
  if (!sh) return ptwEnsureUserSchema_(false);
  var headers = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), PTW_USER_HEADERS.length)).getDisplayValues()[0];
  var matches = true;
  for (var i = 0; i < PTW_USER_HEADERS.length; i++) {
    if (String(headers[i] || '').trim() !== PTW_USER_HEADERS[i]) { matches = false; break; }
  }
  return matches ? sh : ptwEnsureUserSchema_(false);
}

function ptwPermitSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(PTW_PERMIT_SHEET);
  if (!sh) {
    ptwSetup_(false);
    sh = ss.getSheetByName(PTW_PERMIT_SHEET);
  }
  return sh;
}

/**
 * ساخت یا تعمیر دو شیت PTW بدون پاک کردن پرمیت‌ها.
 * resetUsers=true فقط برای بازسازی کامل جدول کاربران است.
 */
function ptwEnsureUserSchema_(resetUsers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var users = ptwExistingUserSheet_(true) || ss.insertSheet(PTW_USER_SHEET);
  var range = users.getDataRange();
  var values = range.getValues();
  var display = range.getDisplayValues();
  var oldHeaders = display.length ? display[0] : [];
  var rowsByCode = {};
  var order = [];

  function col(name, fallback) {
    var i = oldHeaders.indexOf(name);
    return i >= 0 ? i : fallback;
  }

  if (!resetUsers && values.length > 1) {
    var cCode = col('کد', 0);
    var cFirst = col('نام', 1);
    var cLast = col('نام‌خانوادگی', 2);
    var cPersonnel = oldHeaders.indexOf('شماره پرسنلی');
    var cPhone = oldHeaders.indexOf('تلفن');
    var cNational = oldHeaders.indexOf('کد ملی');
    var cStatus = col('وضعیت', 3);
    var cLastLogin = col('آخرین ورود', 4);
    var cLastSeen = col('آخرین فعالیت', 5);
    var cCount = col('تعداد ورود', 6);
    var cRevoked = col('زمان قطع دسترسی', 7);
    var cNote = col('یادداشت', 8);

    for (var r = 1; r < values.length; r++) {
      var code = String(display[r][cCode] || '').trim();
      if (!code) continue;
      var canonical = [
        code,
        display[r][cFirst] || '',
        display[r][cLast] || '',
        cPersonnel >= 0 ? (display[r][cPersonnel] || '') : '',
        cPhone >= 0 ? (display[r][cPhone] || '') : '',
        cNational >= 0 ? (display[r][cNational] || '') : '',
        display[r][cStatus] || 'فعال',
        values[r][cLastLogin] || display[r][cLastLogin] || '',
        values[r][cLastSeen] || display[r][cLastSeen] || '',
        parseInt(display[r][cCount] || values[r][cCount], 10) || 0,
        values[r][cRevoked] || display[r][cRevoked] || '',
        display[r][cNote] || ''
      ];
      if (!rowsByCode[code]) order.push(code);
      rowsByCode[code] = canonical;
    }
  }

  PTW_DEFAULT_CODES.forEach(function(code) {
    if (!rowsByCode[code]) {
      rowsByCode[code] = [code, '', '', '', '', '', 'فعال', '', '', 0, '', ''];
      order.push(code);
    }
  });

  var rows = order.map(function(code) { return rowsByCode[code]; });
  if (users.getFilter()) users.getFilter().remove();
  users.clear();
  users.getRange(1, 1, 1, PTW_USER_HEADERS.length).setValues([PTW_USER_HEADERS]);
  if (rows.length) users.getRange(2, 1, rows.length, PTW_USER_HEADERS.length).setValues(rows);

  users.setRightToLeft(true);
  users.setFrozenRows(1);
  users.getRange(1, 1, 1, PTW_USER_HEADERS.length)
    .setBackground('#1e3c5c')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setWrap(true);
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['فعال', 'غیرفعال'], true)
    .setAllowInvalid(true)
    .build();
  if (rows.length) users.getRange(2, 7, rows.length, 1).setDataValidation(statusRule);

  for (var c = 1; c <= PTW_USER_HEADERS.length; c++) {
    var width = 130;
    if (c === 1) width = 110;
    if (c === 2 || c === 3) width = 140;
    if (c === 12) width = 220;
    users.setColumnWidth(c, width);
  }
  if (rows.length) users.getRange(1, 1, rows.length + 1, PTW_USER_HEADERS.length).createFilter();
  return users;
}

function ptwSetup_(resetUsers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var permit = ss.getSheetByName(PTW_PERMIT_SHEET);

  if (!permit) {
    var first = ss.getSheets()[0];
    var firstName = first.getName();
    var isEmptyDefault =
      (firstName === 'Sheet1' || firstName === 'برگه1') && first.getLastRow() <= 1;
    if (isEmptyDefault) {
      first.setName(PTW_PERMIT_SHEET);
      permit = first;
    } else {
      permit = ss.insertSheet(PTW_PERMIT_SHEET);
    }
  }

  permit.getRange(1, 1, 1, PTW_PERMIT_HEADERS.length).setValues([PTW_PERMIT_HEADERS]);
  permit.setFrozenRows(1);
  permit.setRightToLeft(true);
  permit.getRange(1, 1, 1, PTW_PERMIT_HEADERS.length)
    .setBackground('#f97316')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  for (var c = 1; c <= PTW_PERMIT_HEADERS.length; c++) {
    var wide = (c === 4 || c === 6 || c === 12 || c === 14);
    permit.setColumnWidth(c, wide ? 180 : 115);
  }

  // وضعیت پرمیت فقط «فعال» یا «بسته»؛ ردیف‌های بعدی آماده ورود هستند.
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['فعال', 'بسته'], true)
    .setAllowInvalid(true)
    .build();
  permit.getRange(2, 15, Math.max(permit.getMaxRows() - 1, 1), 1).setDataValidation(statusRule);

  try {
    if (permit.getFilter()) permit.getFilter().remove();
    permit.getRange(1, 1, Math.max(permit.getLastRow(), 2), PTW_PERMIT_HEADERS.length).createFilter();
  } catch (ignorePermitFilter) {}

  var users = ptwEnsureUserSchema_(!!resetUsers);

  ss.setActiveSheet(permit);
  return {
    ok: true,
    success: true,
    message: 'شیت‌های PTW ساخته/تعمیر شدند',
    sheets: [PTW_PERMIT_SHEET, PTW_USER_SHEET],
    userCount: users.getLastRow() - 1
  };
}

function ptwFindUser_(code) {
  code = String(code || '').trim();
  if (!code) return null;
  var sh = ptwUserSheet_();
  var last = sh.getLastRow();
  if (last < 2) return null;

  var vals = sh.getRange(2, 1, last - 1, PTW_USER_HEADERS.length).getDisplayValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0] || '').trim() === code) {
      return {
        row: i + 2,
        code: vals[i][0],
        firstName: vals[i][1],
        lastName: vals[i][2],
        personnel: vals[i][3],
        phone: vals[i][4],
        national: vals[i][5],
        status: vals[i][6],
        lastLogin: vals[i][7],
        lastSeen: vals[i][8],
        loginCount: vals[i][9],
        revokedAt: vals[i][10],
        note: vals[i][11]
      };
    }
  }
  return null;
}

function ptwAllUsers_() {
  var sh = ptwUserSheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, PTW_USER_HEADERS.length).getDisplayValues();
  return vals.filter(function(r) {
    return String(r[0] || '').trim() !== '';
  }).map(function(r) {
    return {
      code: r[0], firstName: r[1], lastName: r[2], personnel: r[3],
      phone: r[4], national: r[5], status: r[6] || 'فعال', active: ptwIsActive_(r[6]),
      lastLogin: r[7], lastSeen: r[8], loginCount: r[9], revokedAt: r[10], note: r[11]
    };
  });
}

function ptwPermitRows_() {
  var values = ptwPermitSheet_().getDataRange().getDisplayValues();
  if (!values || values.length < 2) return [];

  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r.join('').trim()) continue;
    rows.push({
      radif: r[0] || '',
      startDate: r[1] || '',
      startTime: r[2] || '',
      place: r[3] || '',
      type: r[4] || '',
      desc: r[5] || '',
      unit: r[6] || '',
      endDate: r[7] || '',
      endTime: r[8] || '',
      techReject: r[9] || '',
      tech: r[10] || '',
      stopReason: r[11] || '',
      permitNo: r[12] || '',
      contractor: r[13] || '',
      permitStatus: r[14] || ''
    });
  }
  return rows;
}

function ptwTouchSeen_(row) {
  if (row) ptwUserSheet_().getRange(row, 9).setValue(ptwNow_());
}

function ptwUpsertPermissionForUser_(user) {
  if (!user || !String(user.personnel || '').trim()) return;
  var permissionSheet = ensurePermissionCheckboxSheet_(false);
  upsertPermissionUser_(permissionSheet, {
    fullname: [user.firstName || '', user.lastName || ''].join(' ').trim(),
    personnel: user.personnel,
    phone: user.phone || '',
    national: user.national || '',
    registeredAt: new Date(),
    status: user.status || 'فعال',
    note: 'منبع: ورود PTW؛ کد ' + (user.code || '')
  });
}

function ptwSyncUserIdentity_(user, firstName, lastName, personnel, phone, national) {
  if (!user || !user.row) return;
  firstName = String(firstName || user.firstName || '').trim();
  lastName = String(lastName || user.lastName || '').trim();
  personnel = String(personnel || user.personnel || '').trim();
  phone = String(phone || user.phone || '').trim();
  national = String(national || user.national || '').trim();

  ptwUserSheet_().getRange(user.row, 2, 1, 5)
    .setValues([[firstName, lastName, personnel, phone, national]]);
  user.firstName = firstName;
  user.lastName = lastName;
  user.personnel = personnel;
  user.phone = phone;
  user.national = national;
  ptwUpsertPermissionForUser_(user);
}

function ptwLogin_(code, firstName, lastName, personnel, phone, national) {
  code = String(code || '').trim();
  firstName = String(firstName || '').trim();
  lastName = String(lastName || '').trim();
  personnel = String(personnel || '').trim();
  phone = String(phone || '').trim();
  national = String(national || '').trim();

  if (!/^\d{8}$/.test(code)) {
    return jsonOut({ ok: false, success: false, error: 'کد ۸ رقمی نامعتبر است' });
  }
  if (!firstName || !lastName) {
    return jsonOut({ ok: false, success: false, error: 'نام و نام‌خانوادگی لازم است' });
  }
  if (!personnel) {
    return jsonOut({ ok: false, success: false, error: 'شماره پرسنلی برای اتصال مجوزها لازم است' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = ptwUserSheet_();
    var user = ptwFindUser_(code);

    if (!user) {
      if (PTW_DEFAULT_CODES.indexOf(code) === -1) {
        return jsonOut({ ok: false, success: false, active: false, error: 'کد مجاز نیست' });
      }
      sh.appendRow([code, firstName, lastName, personnel, phone, national, 'فعال', '', '', 0, '', '']);
      user = ptwFindUser_(code);
    }

    if (!ptwIsActive_(user.status)) {
      return jsonOut({
        ok: false,
        success: false,
        active: false,
        error: 'دسترسی این کد قطع شده است',
        revokedAt: user.revokedAt || ''
      });
    }

    var count = parseInt(user.loginCount, 10);
    if (isNaN(count)) count = 0;
    var stamp = ptwNow_();

    sh.getRange(user.row, 2, 1, 5).setValues([[firstName, lastName, personnel, phone, national]]);
    sh.getRange(user.row, 8, 1, 3).setValues([[stamp, stamp, count + 1]]);

    user.firstName = firstName;
    user.lastName = lastName;
    user.personnel = personnel;
    user.phone = phone;
    user.national = national;
    user.loginCount = count + 1;
    ptwUpsertPermissionForUser_(user);
    SpreadsheetApp.flush();

    return jsonOut({
      ok: true,
      success: true,
      active: true,
      savedToSheet: true,
      savedToPermissions: true,
      userSheet: PTW_USER_SHEET,
      user: ptwPublicUser_(user)
    });
  } catch (err) {
    return jsonOut({ ok: false, success: false, error: 'خطای ورود PTW: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

function ptwSetUserAccess_(action, targetCode, note) {
  targetCode = String(targetCode || '').trim();
  if (!targetCode) {
    return jsonOut({ ok: false, success: false, error: 'کد کاربر هدف لازم است' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var target = ptwFindUser_(targetCode);
    if (!target) {
      return jsonOut({ ok: false, success: false, error: 'کاربر هدف یافت نشد' });
    }

    var sh = ptwUserSheet_();
    if (action === 'revoke') {
      sh.getRange(target.row, 7).setValue('غیرفعال');
      sh.getRange(target.row, 11).setValue(ptwNow_());
      if (note != null && String(note).trim()) {
        sh.getRange(target.row, 12).setValue(String(note).trim());
      }
      return jsonOut({
        ok: true,
        success: true,
        active: false,
        revoked: targetCode,
        users: ptwAllUsers_()
      });
    }

    sh.getRange(target.row, 7).setValue('فعال');
    sh.getRange(target.row, 11).setValue('');
    return jsonOut({
      ok: true,
      success: true,
      active: true,
      activated: targetCode,
      users: ptwAllUsers_()
    });
  } catch (err) {
    return jsonOut({ ok: false, success: false, error: 'خطای تغییر دسترسی: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- منوهای گوگل‌شیت برای PTW ---------- */
function setupPtwSheets() {
  var ui = SpreadsheetApp.getUi();
  try {
    var result = ptwSetup_(false);
    ui.alert(
      '✅ PTW آماده شد',
      result.message + '\n\n' +
      '• ثبت پرمیت فقط در شیت «' + PTW_PERMIT_SHEET + '»\n' +
      '• قطع/وصل دسترسی در شیت «' + PTW_USER_SHEET + '»\n' +
      '• صفحه HTML فقط خواندنی است.',
      ui.ButtonSet.OK
    );
  } catch (err) {
    ui.alert('❌ خطا', String(err), ui.ButtonSet.OK);
  }
}

function resetPtwUsers() {
  var ui = SpreadsheetApp.getUi();
  var answer = ui.alert(
    'بازسازی کاربران PTW',
    'نام‌ها، وضعیت‌ها و آمار ورود کاربران PTW پاک و ۱۲ کد پیش‌فرض از نو ساخته شود؟',
    ui.ButtonSet.YES_NO
  );
  if (answer !== ui.Button.YES) return;

  try {
    ptwSetup_(true);
    ui.alert('✅ انجام شد', 'جدول کاربران PTW بازسازی شد.', ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('❌ خطا', String(err), ui.ButtonSet.OK);
  }
}

function showPtwHelp() {
  SpreadsheetApp.getUi().alert(
    'راهنمای PTW',
    'ستون‌های شیت «پرمیت»:\n\n' +
    PTW_PERMIT_HEADERS.join(' | ') + '\n\n' +
    'وضعیت پرمیت را «فعال» یا «بسته» قرار دهید.\n' +
    'اپ در شروع فقط پرمیت‌های فعال را نمایش می‌دهد.\n' +
    'ثبت، ویرایش و حذف ردیف‌ها فقط از خود گوگل‌شیت انجام می‌شود.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
