// ============================================
// ระบบเช็คระเบียบนักเรียน - Backend (Code.gs)
// ============================================
// บัญชีเริ่มต้น: username=admin / password=admin123
// ============================================

const SPREADSHEET_ID = '1AG_ulCVsRGFAyrjvSk4cYHneHYwPLmj5-BGo-SJuxlc'; //ไอดี sheet 

// ============================================
// CONFIG — แก้ไขได้ที่นี่ (ใช้ทั้งระบบ)
// ============================================
const CONFIG = {
  school_name: "โรงเรียนธัญบุรี",
  academic_year: "2569",
  max_score: 100,
  violation_points: 5,
  months: [
  //  { id: "may2569", name: "พฤษภาคม 2569" },
  //  { id: "jun2569", name: "มิถุนายน 2569" },
    { id: "jul2569", name: "กรกฏาคม 2569" },
    { id: "aug2569", name: "สิงหาคม 2569" }, 
    { id: "sep2569", name: "กันยายน 2569" },
  ],
  violations: [
    { key: "uniform",       label: "เครื่องแบบ",       points: 5 },
    { key: "undershirt",    label: "เสื้อด้านใน",       points: 5 },
    { key: "collar",        label: "ทำสีผม",          points: 5 },
    { key: "belt",          label: "เข็มขัด",          points: 5 },
    { key: "hairbow",       label: "โบว์ผม",          points: 5 },
    { key: "hairstyle",     label: "ทรงผม",          points: 5 },
    { key: "facial",        label: "แต่งหน้า",         points: 5 },
    { key: "hairaccessory", label: "เครื่องประดับผม",    points: 5 },
    { key: "socks",         label: "ถุงเท้า",           points: 5 },
    { key: "shoes",         label: "รองเท้า",          points: 5 },
    { key: "jewelry",       label: "เครื่องประดับ",       points: 5 },
    { key: "nails",         label: "เล็บ",             points: 5 },
  ]
};

// ============================================
// Helper Functions
// ============================================
function getThaiDateTime() {
  const now = new Date();
  const thai = new Date(now.getTime() + 7 * 3600000);
  const y  = thai.getUTCFullYear();
  const m  = String(thai.getUTCMonth() + 1).padStart(2, '0');
  const d  = String(thai.getUTCDate()).padStart(2, '0');
  const h  = String(thai.getUTCHours()).padStart(2, '0');
  const mi = String(thai.getUTCMinutes()).padStart(2, '0');
  const s  = String(thai.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${mi}:${s}`;
}

function toBoolean(val) {
  return val === true || val === 'TRUE' || val === 1 || val === '1';
}

function cleanNumber(val) {
  return String(val || '').replace(/'/g, '').trim();
}

// ============================================
// Web App Entry Point
// ============================================
function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    return handleApiRequest(e.parameter.action, e.parameter);
  }
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ระบบเช็คระเบียบนักเรียน ม.6 โรงเรียนธัญบุรี')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================
// AUTHENTICATION — ปลอดภัย ตรวจสอบที่หลังบ้านเท่านั้น
// ============================================
function authenticateUser(username, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName('Teachers');
    if (!sh) return { success: false, message: 'ไม่พบตารางข้อมูลครู' };
    
    const rows = sh.getDataRange().getValues();
    const u = String(username || '').trim().toLowerCase();
    const p = String(password || '').trim();

    for (let i = 1; i < rows.length; i++) {
      const rowU = String(rows[i][2] || '').trim().toLowerCase();
      const rowP = String(rows[i][3] || '').trim();
      if (rowU === u && rowP === p) {
        return {
          success: true,
          user: {
            id: String(rows[i][0]),
            type: 'teacher',
            teacher_username: String(rows[i][2] || '').trim(),
            teacher_name: String(rows[i][4] || ''),
            classroom: String(rows[i][5] || ''),
            created_at: String(rows[i][6] || '')
          }
        };
      }
    }
    return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  } catch(e) {
    Logger.log('authenticateUser error: ' + e);
    return { success: false, message: e.toString() };
  }
}

function handleApiRequest(action, dataArg) {
  let result = { success: false, message: 'Invalid action: ' + action };
  try {
    let parsedData = dataArg;
    if (typeof dataArg === 'string') {
      try { parsedData = JSON.parse(dataArg); } catch(e) {}
    } else if (dataArg && dataArg.payload) {
      try { parsedData = typeof dataArg.payload === 'string' ? JSON.parse(dataArg.payload) : dataArg.payload; } catch(e) {}
    }

    if (action === 'authenticateUser' || action === 'login') {
      result = authenticateUser(parsedData.username || parsedData.u, parsedData.password || parsedData.p);
    } else if (action === 'getInitData') {
      result = getInitData();
    } else if (action === 'getData') {
      result = getData();
    } else if (action === 'getConfig') {
      result = getConfig();
    } else if (action === 'saveConfig') {
      result = saveConfig(parsedData);
    } else if (action === 'initializeData') {
      result = initializeSheets();
    } else if (action === 'createRecord') {
      result = createRecord(parsedData);
    } else if (action === 'updateRecord') {
      result = updateRecord(parsedData);
    } else if (action === 'deleteRecord') {
      result = deleteRecord(parsedData);
    } else if (action === 'replaceChecks') {
      result = replaceChecks(parsedData);
    } else if (action === 'logLogin') {
      result = logLogin(parsedData);
    }
  } catch(e) {
    result = { success: false, message: e.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// Web App API Entry Point (สำหรับ GitHub Pages & External)
// ============================================
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try { payload = JSON.parse(e.postData.contents); } catch(err) {}
    }
    const action = payload.action || (e && e.parameter && e.parameter.action);
    let dataArg = payload.payload !== undefined ? payload.payload : (payload.data !== undefined ? payload.data : payload.config);
    if (dataArg === undefined) dataArg = payload;
    return handleApiRequest(action, dataArg);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// getConfig / saveConfig — ส่งและบันทึก CONFIG
// ============================================
function getConfig() {
  try {
    const props = PropertiesService.getScriptProperties().getProperty('APP_CONFIG');
    if (props) {
      const parsed = JSON.parse(props);
      return { ...CONFIG, ...parsed };
    }
  } catch(e) {
    Logger.log('getConfig error: ' + e);
  }
  return CONFIG;
}

function saveConfig(newConfig) {
  try {
    if (newConfig.school_name) CONFIG.school_name = newConfig.school_name;
    if (newConfig.academic_year) CONFIG.academic_year = newConfig.academic_year;
    if (newConfig.max_score) CONFIG.max_score = Number(newConfig.max_score);
    if (newConfig.violation_points) CONFIG.violation_points = Number(newConfig.violation_points);

    PropertiesService.getScriptProperties().setProperty('APP_CONFIG', JSON.stringify({
      school_name: CONFIG.school_name,
      academic_year: CONFIG.academic_year,
      max_score: CONFIG.max_score,
      violation_points: CONFIG.violation_points
    }));
    return { success: true };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function getInitData() {
  try {
    return {
      config: CONFIG,
      data: getData()
    };
  } catch(e) {
    Logger.log('getInitData error: ' + e);
    return { config: CONFIG, data: [] };
  }
}

// ============================================
// Sheet Initialization
// ============================================
function initializeSheets() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    let tSheet = ss.getSheetByName('Teachers');
    if (!tSheet) {
      tSheet = ss.insertSheet('Teachers');
      tSheet.getRange('A1:G1').setValues([['ID','Type','Username','Password','Name','Classroom','Created At']]);
      tSheet.getRange('A1:G1').setFontWeight('bold').setBackground('#1e293b').setFontColor('#f8fafc');
      tSheet.setFrozenRows(1);
      tSheet.appendRow(['teacher_admin','teacher','admin','admin123','ผู้ดูแลระบบ','',getThaiDateTime()]);
    }

    let sSheet = ss.getSheetByName('Students');
    if (!sSheet) {
      sSheet = ss.insertSheet('Students');
      sSheet.getRange('A1:G1').setValues([['ID','Type','Name','Number','Classroom','Total Score','Created At']]);
      sSheet.getRange('A1:G1').setFontWeight('bold').setBackground('#1e293b').setFontColor('#f8fafc');
      sSheet.setFrozenRows(1);
    }

    let cSheet = ss.getSheetByName('Checks');
    if (!cSheet) {
      cSheet = ss.insertSheet('Checks');
      const headers = ['ID','Type','Classroom','Student Number','Month','Round',
        'Uniform','Undershirt','Collar','Belt','Hairbow',
        'Hairstyle','Facial','HairAccessory','Socks','Shoes',
        'Jewelry','Nails','All Correct','Created At'];
      cSheet.getRange(1,1,1,headers.length).setValues([headers]);
      cSheet.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#f8fafc');
      cSheet.setFrozenRows(1);
    }

    let bSheet = ss.getSheetByName('Bonuses');
    if (!bSheet) {
      bSheet = ss.insertSheet('Bonuses');
      bSheet.getRange('A1:G1').setValues([['ID','Type','Classroom','Student Number','Bonus Points','Reason','Created At']]);
      bSheet.getRange('A1:G1').setFontWeight('bold').setBackground('#065f46').setFontColor('#f8fafc');
      bSheet.setFrozenRows(1);
    }

    let lSheet = ss.getSheetByName('Logs');
    if (!lSheet) {
      lSheet = ss.insertSheet('Logs');
      lSheet.getRange('A1:F1').setValues([['ID','Username','Name','Classroom','Action','Timestamp']]);
      lSheet.getRange('A1:F1').setFontWeight('bold').setBackground('#374151').setFontColor('#f8fafc');
      lSheet.setFrozenRows(1);
    }

    return { success: true, message: 'สร้างชีตสำเร็จ' };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

// alias ที่ index.html เรียก
function initializeData() {
  return initializeSheets();
}

// ============================================
// READ — getData (ฟังก์ชันเดียว ไม่ซ้ำ)
// ============================================
function getData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const result = [];

    function readSheet(name) {
      const sh = ss.getSheetByName(name);
      if (!sh) return [];
      const vals = sh.getDataRange().getValues();
      return vals.length > 1 ? vals.slice(1) : [];
    }

    // Teachers (ตัด teacher_password ออกเพื่อความปลอดภัย ไม่ส่งไปหน้าเว็บ)
    readSheet('Teachers').forEach(r => {
      if (!r[0]) return;
      result.push({
        id: String(r[0]),
        type: 'teacher',
        teacher_username: String(r[2]||'').trim(),
        teacher_name:     String(r[4]||''),
        classroom:        String(r[5]||''),
        created_at:       String(r[6]||'')
      });
    });

    // Students
    readSheet('Students').forEach(r => {
      if (!r[0]) return;
      result.push({
        id:             String(r[0]),
        type:           'student',
        student_name:   String(r[2]||''),
        student_number: cleanNumber(r[3]),
        classroom:      String(r[4]||''),
        total_score:    Number(r[5])||100,
        created_at:     String(r[6]||'')
      });
    });

    // Checks — round เก็บเป็น Number เพื่อให้ตรงกับ selectedRound ใน frontend
    readSheet('Checks').forEach(r => {
      if (!r[0]) return;
      result.push({
        id:                      String(r[0]),
        type:                    'check',
        classroom:               String(r[2]||''),
        student_number:          cleanNumber(r[3]),
        month:                   String(r[4]||''),
        round:                   Number(r[5])||1,
        violation_uniform:       toBoolean(r[6]),
        violation_undershirt:    toBoolean(r[7]),
        violation_collar:        toBoolean(r[8]),
        violation_belt:          toBoolean(r[9]),
        violation_hairbow:       toBoolean(r[10]),
        violation_hairstyle:     toBoolean(r[11]),
        violation_facial:        toBoolean(r[12]),
        violation_hairaccessory: toBoolean(r[13]),
        violation_socks:         toBoolean(r[14]),
        violation_shoes:         toBoolean(r[15]),
        violation_jewelry:       toBoolean(r[16]),
        violation_nails:         toBoolean(r[17]),
        all_correct:             toBoolean(r[18]),
        created_at:              String(r[19]||'')
      });
    });

    // Bonuses
    readSheet('Bonuses').forEach(r => {
      if (!r[0]) return;
      result.push({
        id:             String(r[0]),
        type:           'bonus',
        classroom:      String(r[2]||''),
        student_number: cleanNumber(r[3]),
        points:         Number(r[4])||0,
        reason:         String(r[5]||''),
        created_at:     String(r[6]||'')
      });
    });

    return result;
  } catch(e) {
    Logger.log('getData error: ' + e);
    return [];
  }
}

// ============================================
// CREATE
// ============================================
function createRecord(data) {
  try {
    const ss  = SpreadsheetApp.openById(SPREADSHEET_ID);
    const now = getThaiDateTime();

    if (data.type === 'teacher') {
      ss.getSheetByName('Teachers').appendRow([
        data.id, 'teacher',
        data.teacher_username, data.teacher_password,
        data.teacher_name, data.classroom||'', now
      ]);
    }
    else if (data.type === 'student') {
      ss.getSheetByName('Students').appendRow([
        data.id, 'student',
        data.student_name, "'" + data.student_number,
        data.classroom, data.total_score||100, now
      ]);
    }
    else if (data.type === 'bonus') {
      ss.getSheetByName('Bonuses').appendRow([
        data.id, 'bonus', data.classroom, "'" + data.student_number,
        data.points, data.reason||'', now
      ]);
      _recalcScore(ss, data.classroom, data.student_number);
    }

    return { success: true, id: data.id };
  } catch(e) {
    Logger.log('createRecord error: ' + e);
    return { success: false, message: e.toString() };
  }
}

// ============================================
// UPDATE
// ============================================
function updateRecord(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetMap = { teacher:'Teachers', student:'Students', bonus:'Bonuses' };
    const sheet = ss.getSheetByName(sheetMap[data.type]);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const rows = sheet.getDataRange().getValues();
    let rowIdx = -1;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(data.id)) { rowIdx = i + 1; break; }
    }
    if (rowIdx === -1) return createRecord(data);

    const now = getThaiDateTime();
    const existingCreatedAt = rows[rowIdx - 1][6] || getThaiDateTime();
    if (data.type === 'teacher') {
      sheet.getRange(rowIdx, 1, 1, 7).setValues([[
        data.id, 'teacher',
        data.teacher_username, data.teacher_password,
        data.teacher_name, data.classroom||'', existingCreatedAt
      ]]);
    } else if (data.type === 'student') {
      sheet.getRange(rowIdx, 1, 1, 7).setValues([[
        data.id, 'student',
        data.student_name, "'" + data.student_number,
        data.classroom, data.total_score||100, existingCreatedAt
      ]]);
    }

    return { success: true };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

// ============================================
// DELETE
// ============================================
function deleteRecord(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetMap = { teacher:'Teachers', student:'Students', check:'Checks', bonus:'Bonuses' };
    const sheet = ss.getSheetByName(sheetMap[data.type]);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const rows = sheet.getDataRange().getValues();
    let rowIdx = -1;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(data.id)) { rowIdx = i + 1; break; }
    }
    if (rowIdx === -1) return { success: false, message: 'Not found' };

    sheet.deleteRow(rowIdx);

    if (data.type === 'check' || data.type === 'bonus') {
      _recalcScore(ss, data.classroom, data.student_number);
    }
    return { success: true };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

// ============================================
// Log Login
// ============================================
function logLogin(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName('Logs');
    if (!sh) return;
    sh.appendRow(['log_'+Date.now(), data.username, data.name, data.classroom||'—', 'Login', getThaiDateTime()]);
    return { success: true };
  } catch(e) {
    return { success: false };
  }
}

// ============================================
// REPLACE CHECKS — หัวใจหลัก: ลบเก่า + append ใหม่
// แก้ปัญหาข้อมูลซ้ำ ทำให้คะแนนไม่หัก
// ============================================
function replaceChecks(payload) {
  // payload = { classroom, month, round, checks: [...] }
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Checks');
    const now   = getThaiDateTime();

    const CHECKS_HEADERS = [
      'ID', 'Type', 'Classroom', 'Student Number', 'Month', 'Round',
      'Uniform', 'Undershirt', 'Collar', 'Belt', 'Hairbow', 'Hairstyle',
      'Facial', 'HairAccessory', 'Socks', 'Shoes', 'Jewelry', 'Nails',
      'All Correct', 'Created At'
    ]; // 20 columns
    const TARGET_COLS = CHECKS_HEADERS.length; // 20

    // 1. Memory-based batch filtering: read all rows, filter out target classroom+month+round
    const allRows = sheet.getDataRange().getValues();
    const remainingRows = allRows.slice(1).filter(row => {
      const match = String(row[2]) === String(payload.classroom) &&
                    String(row[4]) === String(payload.month) &&
                    Number(row[5]) === Number(payload.round);
      return !match; // Keep rows that do not match
    });

    // Normalize remaining rows to exactly 20 columns (trim extra columns if original sheet had 22 columns)
    const cleanRemainingRows = remainingRows.map(row => {
      let r = row.slice(0, TARGET_COLS);
      if (r[3] !== undefined && r[3] !== null) {
        r[3] = "'" + String(r[3]).replace(/'/g, '');
      }
      while (r.length < TARGET_COLS) r.push('');
      return r;
    });

    // 2. Build the new rows to append (exactly 20 columns)
    const newRows = (payload.checks || []).map(data => [
      data.id,
      'check',
      data.classroom,
      "'" + String(data.student_number).replace(/'/g, ''),
      data.month,
      Number(data.round),
      data.violation_uniform       === true,
      data.violation_undershirt    === true,
      data.violation_collar        === true,
      data.violation_belt          === true,
      data.violation_hairbow       === true,
      data.violation_hairstyle     === true,
      data.violation_facial        === true,
      data.violation_hairaccessory === true,
      data.violation_socks         === true,
      data.violation_shoes         === true,
      data.violation_jewelry       === true,
      data.violation_nails         === true,
      data.all_correct             === true,
      now
    ]);

    // Combine headers, clean remaining rows, and new rows
    const updatedRows = [CHECKS_HEADERS, ...cleanRemainingRows, ...newRows];

    // Clear entire sheet contents to remove obsolete columns
    sheet.clearContents();
    sheet.getRange(1, 1, updatedRows.length, TARGET_COLS).setValues(updatedRows);
    SpreadsheetApp.flush();

    // 3. Batch recalculate scores for everyone in this classroom
    _recalcClassroomScores(ss, payload.classroom);

    return { success: true, count: (payload.checks || []).length };
  } catch(e) {
    Logger.log('replaceChecks error: ' + e);
    return { success: false, message: e.toString() };
  }
}

// ============================================
// RECALC SCORE — คำนวณคะแนนนักเรียนจาก Checks + Bonuses
// ============================================
function _recalcScore(ss, classroom, studentNumber) {
  try {
    const sSheet = ss.getSheetByName('Students');
    const cSheet = ss.getSheetByName('Checks');
    const bSheet = ss.getSheetByName('Bonuses');
    if (!sSheet) return;

    // หาแถวนักเรียน
    const sData = sSheet.getDataRange().getValues();
    let sRow = -1;
    for (let i = 1; i < sData.length; i++) {
      if (cleanNumber(sData[i][3]) === cleanNumber(studentNumber) && sData[i][4] === classroom) {
        sRow = i + 1; break;
      }
    }
    if (sRow === -1) return;

    let score = CONFIG.max_score;

    // หักจากการฝ่าฝืน
    if (cSheet) {
      const cd = cSheet.getDataRange().getValues();
      for (let i = 1; i < cd.length; i++) {
        if (cd[i][2] === classroom && cleanNumber(cd[i][3]) === cleanNumber(studentNumber)) {
          // col 6-17 คือ violations (12 ข้อ)
          for (let j = 6; j <= 17; j++) {
            if (toBoolean(cd[i][j])) score -= CONFIG.violation_points;
          }
        }
      }
    }

    // บวกโบนัส
    if (bSheet) {
      const bd = bSheet.getDataRange().getValues();
      for (let i = 1; i < bd.length; i++) {
        if (bd[i][2] === classroom && cleanNumber(bd[i][3]) === cleanNumber(studentNumber)) {
          score += Number(bd[i][4]) || 0;
        }
      }
    }

    score = Math.max(0, Math.min(CONFIG.max_score, score));
    sSheet.getRange(sRow, 6).setValue(score);
    return score;
  } catch(e) {
    Logger.log('_recalcScore error: ' + e);
  }
}

//คำนวณคะแนนนักเรียนทั้งห้องเรียนแบบกลุ่ม (Batch recalculation)
function _recalcClassroomScores(ss, classroom) {
  try {
    const sSheet = ss.getSheetByName('Students');
    const cSheet = ss.getSheetByName('Checks');
    const bSheet = ss.getSheetByName('Bonuses');
    if (!sSheet) return;

    const sRange = sSheet.getDataRange();
    const sRows = sRange.getValues();
    
    // ดึงประวัติการหักคะแนนและโบนัสขึ้นมาครั้งเดียว
    const cRows = cSheet ? cSheet.getDataRange().getValues().slice(1) : [];
    const bRows = bSheet ? bSheet.getDataRange().getValues().slice(1) : [];

    // แมปคะแนนหักและโบนัสด้วยเลขประจำตัวนักเรียน
    const checkDeductions = {};
    const bonusPoints = {};

    cRows.forEach(row => {
      const cls = String(row[2]);
      const sNum = cleanNumber(row[3]);
      if (cls === classroom) {
        let deduct = 0;
        // คอลัมน์ 6-17 คือจุดหักคะแนน (12 ข้อ)
        for (let j = 6; j <= 17; j++) {
          if (toBoolean(row[j])) {
            deduct += CONFIG.violation_points;
          }
        }
        checkDeductions[sNum] = (checkDeductions[sNum] || 0) + deduct;
      }
    });

    bRows.forEach(row => {
      const cls = String(row[2]);
      const sNum = cleanNumber(row[3]);
      if (cls === classroom) {
        const pts = Number(row[4]) || 0;
        bonusPoints[sNum] = (bonusPoints[sNum] || 0) + pts;
      }
    });

    // คำนวณคะแนนใหม่ทุกคนในห้องในเมมโมรี่
    for (let i = 1; i < sRows.length; i++) {
      const sNum = cleanNumber(sRows[i][3]);
      const cls = String(sRows[i][4]);
      if (cls === classroom) {
        const deduct = checkDeductions[sNum] || 0;
        const bonus = bonusPoints[sNum] || 0;
        let score = CONFIG.max_score - deduct + bonus;
        score = Math.max(0, Math.min(CONFIG.max_score, score));
        sRows[i][5] = score; // ดัชนีที่ 5 คือ Total Score
      }
      // เคล็ดลับสำคัญ: ป้องกันไม่ให้ Google Sheets แปลงรหัสเป็นตัวเลขและสูญเสียศูนย์นำหน้า (เช่น 01 เป็น 1)
      if (sRows[i][3] !== undefined && sRows[i][3] !== null) {
        sRows[i][3] = "'" + String(sRows[i][3]).replace(/'/g, '');
      }
    }

    // เขียนข้อมูลคะแนนใหม่กลับสู่ชีตในรอบเดียว
    sRange.setValues(sRows);
    SpreadsheetApp.flush();
  } catch(e) {
    Logger.log('_recalcClassroomScores error: ' + e);
  }
}

function updateStudentScore(classroom, studentNumber) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const score = _recalcScore(ss, classroom, studentNumber);
  return { success: true, score };
}

// ============================================
// UTILITIES — รันครั้งเดียวเพื่อแก้ข้อมูลเก่า
// ============================================

// ล้างข้อมูล Checks ที่ซ้ำกัน (รันครั้งเดียวใน Apps Script Editor)
function deduplicateChecks() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Checks');
  const rows  = sheet.getDataRange().getValues();
  const seen  = new Set();
  // key = classroom_studentNumber_month_round
  for (let i = rows.length - 1; i >= 1; i--) {
    const key = `${rows[i][2]}_${cleanNumber(rows[i][3])}_${rows[i][4]}_${rows[i][5]}`;
    if (seen.has(key)) {
      sheet.deleteRow(i + 1);
    } else {
      seen.add(key);
    }
  }
  Logger.log('deduplicateChecks: Done');
}

// คำนวณคะแนนนักเรียนทั้งหมดใหม่ (รันหลัง deduplicateChecks)
function recalculateAllScores() {
  const ss          = SpreadsheetApp.openById(SPREADSHEET_ID);
  const studentSheet = ss.getSheetByName('Students');
  if (!studentSheet) return { success: false };

  const studentData = studentSheet.getDataRange().getValues();
  let updated = 0;
  for (let i = 1; i < studentData.length; i++) {
    const classroom     = studentData[i][4];
    const studentNumber = cleanNumber(studentData[i][3]);
    if (classroom && studentNumber) {
      _recalcScore(ss, classroom, studentNumber);
      updated++;
    }
  }
  Logger.log('recalculateAllScores: updated ' + updated);
  return { success: true, updated };
}