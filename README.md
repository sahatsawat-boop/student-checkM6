# ระบบเช็คระเบียบนักเรียน โรงเรียนธัญบุรี (GitHub Pages & Apps Script)

ระบบเช็คระเบียบนักเรียน ม.6 รองรับการทำงานทั้งบน **Google Apps Script** และ **GitHub Pages** (หรือโฮสต์บนเว็บทั่วไป)

---

### 🚀 วิธีการนำขึ้นใช้งานบน GitHub Pages

#### **ขั้นตอนที่ 1: Deploy Web App ใน Google Apps Script**
1. เข้าไปที่หน้า Google Apps Script ของคุณ (`script.google.com`)
2. กด **การทำให้ใช้งานได้ (Deploy)** > **การทำให้ใช้งานได้ใหม่ (New deployment)**
3. เลือกประเภท **เว็บแอป (Web app)**
   - **Execute as (รันในนาม):** Me (ฉัน)
   - **Who has access (ผู้มีสิทธิ์เข้าถึง):** Anyone (ทุกคน)
4. กด **Deploy** และคัดลอก **Web App URL** (ที่ขึ้นต้นด้วย `https://script.google.com/macros/s/AKfycb.../exec`)

#### **ขั้นตอนที่ 2: ใส่ Web App URL ใน index.html**
1. เปิดไฟล์ `index.html` (บรรทัดที่ 331)
2. นำ Web App URL มาใส่ในตัวแปร `WEB_APP_URL`:
   ```javascript
   let WEB_APP_URL = "https://script.google.com/macros/s/YOUR_DEPLOYED_WEB_APP_ID/exec";
   ```

#### **ขั้นตอนที่ 3: อัปโหลดขึ้น GitHub & เปิดใช้งาน GitHub Pages**
1. สร้าง Repository ใหม่บน GitHub (เช่น `student-check`)
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้น GitHub
3. ไปที่เมนู **Settings** > **Pages**
4. ตรงส่วน **Source** เลือก **Deploy from a branch**
5. เลือก Branch **main** (หรือ `master`) / โฟลเดอร์ `/ (root)` แล้วกด **Save**
6. เว็บไซต์ของคุณจะพร้อมใช้งานผ่าน URL ของ GitHub Pages ทันที! (เช่น `https://<your-username>.github.io/student-check/`)

---

### 📂 รายสร้างโครงสร้างไฟล์
- `index.html` — หน้าเว็บ Frontend (รองรับทั้ง GitHub Pages และ Apps Script)
- `รหัส.js` — โค้ด Backend ใน Google Apps Script (มี `doPost` รับส่ง API)
- `logo.png` — ไฟล์รูปโลโก้โรงเรียนธัญบุรี
