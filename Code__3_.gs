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
  // *** ستون‌های مجوز — TRUE = دسترسی دارد ***
  PERMISSIONS:  [
    'نام', 'شماره_پرسنلی', 'وضعیت_حساب',
    'عدم_انطباق', 'شبه_حادثه', 'حادثه',
    'احضار_اخطار', 'تشویقی', 'کوییز',
    'TBM', 'آنومالی', 'گارودنه',
    'تشویق_ماهیانه', 'همیار_ایمنی', 'یادداشت'
  ]
};

// کلیدهای مجوز ← نام صفحه
var PERMISSION_KEYS = [
  'عدم_انطباق', 'شبه_حادثه', 'حادثه',
  'احضار_اخطار', 'تشویقی', 'کوییز',
  'TBM', 'آنومالی', 'گارودنه',
  'تشویق_ماهیانه', 'همیار_ایمنی'
];

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

/* ---- مسیریابی ---- */
function doGet(e)  { return handleRequest(e); }
function doPost(e) { return handleRequest({ parameter: e.parameter || {} }); }

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
function actionGetPermissions(p) {
  var personnel = (p.personnel || '').toString().trim();
  if (!personnel) {
    return jsonOut({ success: false, msg: 'پرسنلی ارسال نشده' });
  }

  var sheet = getSheet('PERMISSIONS');
  var data = sheet.getDataRange().getValues();
  var headers = data[0]; // ردیف اول = هدر

  // پیدا کردن ستون‌ها
  var colPersonnel = headers.indexOf('شماره_پرسنلی');
  var colStatus    = headers.indexOf('وضعیت_حساب');

  if (colPersonnel === -1) {
    return jsonOut({ success: false, msg: 'ستون پرسنلی در شیت مجوز یافت نشد' });
  }

  var found = null;
  for (var i = 1; i < data.length; i++) {
    if ((data[i][colPersonnel] || '').toString().trim() === personnel) {
      found = data[i];
      break;
    }
  }

  if (!found) {
    // اگر ردیفی نبود: هیچ دسترسی‌ای ندارد
    return jsonOut({
      success: true,
      found: false,
      active: false,
      permissions: buildEmptyPermissions()
    });
  }

  var status = (colStatus >= 0 ? found[colStatus] : 'active').toString().trim().toLowerCase();
  var isActive = (status === 'active' || status === 'فعال' || status === '');

  // خواندن مجوزهای هر ستون
  var perms = {};
  PERMISSION_KEYS.forEach(function(key) {
    var col = headers.indexOf(key);
    if (col >= 0) {
      var val = (found[col] || '').toString().trim().toLowerCase();
      perms[key] = (val === 'true' || val === 'yes' || val === 'بله' || val === '✓' || val === 'TRUE');
    } else {
      perms[key] = false;
    }
  });

  return jsonOut({
    success: true,
    found: true,
    active: isActive,
    permissions: perms
  });
}

function buildEmptyPermissions() {
  var perms = {};
  PERMISSION_KEYS.forEach(function(k) { perms[k] = false; });
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

  return jsonOut({
    success: true,
    active: isActive,
    msg: isActive ? 'فعال' : 'دسترسی مسدود شده است',
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
    var permSheet = getSheet('PERMISSIONS');
    var permData  = permSheet.getDataRange().getValues();
    var pHeaders  = permData[0];
    var colP      = pHeaders.indexOf('شماره_پرسنلی');
    var alreadyIn = false;
    for (var j = 1; j < permData.length; j++) {
      if ((permData[j][colP] || '').toString().trim() === personnel) { alreadyIn = true; break; }
    }
    if (!alreadyIn) {
      // ردیف پیش‌فرض: نام، پرسنلی، وضعیت=active، همه مجوزها FALSE
      var newRow = [fullname, personnel, 'active'];
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
  SpreadsheetApp.getUi()
    .createMenu('🔐 مدیریت HSE')
    .addItem('🏗️ ساخت همه شیت‌ها (راه‌اندازی اولیه)', 'setupAllSheets')
    .addSeparator()
    .addItem('➕ ساخت کد فعالسازی (دسته‌ای)', 'generateActivationCodesBatch')
    .addSeparator()
    .addItem('📅 ثبت/صفر کردن روزهای بدون حادثه', 'setIncidentStartDate')
    .addSeparator()
    .addItem('👤 مدیریت مجوزهای کاربران', 'openPermissionsManager')
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
function openPermissionsManager() {
  var ui = SpreadsheetApp.getUi();
  ui.alert(
    '👤 مدیریت مجوزها',
    'شیت «مجوزهای_کاربران» را باز کنید.\n\n' +
    '📋 ستون‌ها:\n' +
    '• نام | شماره_پرسنلی | وضعیت_حساب\n' +
    '• عدم_انطباق | شبه_حادثه | حادثه\n' +
    '• احضار_اخطار | تشویقی | کوییز\n' +
    '• TBM | آنومالی | گارودنه\n' +
    '• تشویق_ماهیانه | همیار_ایمنی\n\n' +
    '✅ برای دادن دسترسی: مقدار TRUE بنویسید\n' +
    '❌ برای قطع دسترسی: مقدار FALSE یا خالی\n' +
    '🔒 برای مسدود کردن کل حساب: وضعیت_حساب را «blocked» کنید\n\n' +
    '⚡ تغییرات بلافاصله اعمال می‌شوند.',
    ui.ButtonSet.OK
  );
  // باز کردن شیت مجوزها
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var permSheet = ss.getSheetByName(SHEET_NAMES.PERMISSIONS);
  if (!permSheet) permSheet = getSheet('PERMISSIONS');
  ss.setActiveSheet(permSheet);
}
