import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDHMRKJovs43b4CWdJOUbUlO5BEekqCmBI",
    authDomain: "servicenow-2b0cd.firebaseapp.com",
    projectId: "servicenow-2b0cd",
    storageBucket: "servicenow-2b0cd.firebasestorage.app",
    messagingSenderId: "1050981111123",
    appId: "1:1050981111123:web:e6adfe818b041d26fbbda6",
    measurementId: "G-YJQS2G1S64"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });

window.viewFullImage = (url) => {
    Swal.fire({
        imageUrl: url,
        imageAlt: 'Attached Image',
        width: 'auto',
        padding: '1rem',
        showConfirmButton: false,
        showCloseButton: true,
        customClass: { image: 'rounded-xl max-h-[80vh] object-contain' }
    });
};

window.previewCreateImage = (input) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('create-image-preview').src = e.target.result;
            document.getElementById('create-image-preview-container').classList.remove('hidden');
        }
        reader.readAsDataURL(input.files[0]);
    }
};

window.clearCreateImage = () => {
    document.getElementById('tk-image').value = '';
    document.getElementById('create-image-preview').src = '';
    document.getElementById('create-image-preview-container').classList.add('hidden');
};

function resizeAndConvertToBase64(file, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
        if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/i)) {
            reject(new Error("กรุณาอัปโหลดไฟล์รูปภาพ (JPG, PNG) เท่านั้นครับ"));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error("ไม่สามารถประมวลผลรูปภาพนี้ได้ (ไฟล์อาจเสีย)"));
            img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error("อ่านไฟล์ล้มเหลว"));
    });
}

function timeAgo(date) {
    if(!date) return '-';
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
}

const dict = {
    en: {
        page_title: "Factory IT Service Center",
        app_name: "Factory IT Service Center",
        app_name_short: "Factory IT",
        auth_sub: "Enterprise Service Desk",
        email: "Email",
        password: "Password",
        btn_signin: "Sign In",
        no_account: "New here?",
        btn_register: "Create an account",
        auth_or: "OR",
        btn_google: "Continue with Google",
        role_user: "User",
        role_admin: "IT Admin",
        menu_group_1: "Workspace",
        menu_group_2: "Admin",
        menu_dash: "Dashboard",
        menu_incidents: "My Tickets",
        menu_create: "Create Ticket",
        menu_admin: "Command Center",
        btn_logout: "Log Out",
        stat_open: "New Tickets",
        stat_progress: "In Progress",
        stat_resolved: "Resolved",
        stat_total: "Total Volume",
        admin_my_resolved: "My Resolved Tickets",
        th_subject: "Subject",
        th_status: "Status",
        th_date: "Timeline",
        btn_submit: "Submit Request",
        search_placeholder: "Search...",
        btn_new_ticket: "Create",
        form_title: "How can we help?",
        form_sub: "Fill out the details below to open a new support request.",
        form_cat: "Category",
        form_pri: "Priority",
        form_short: "Subject",
        form_desc: "Description",
        form_loc_head: "Location & Equipment Details",
        form_bldg: "Building",
        form_floor: "Floor",
        form_dept: "Department",
        form_line: "Line",
        form_item: "Broken Part / Item",
        modal_loc: "Location & Item",
        btn_export: "Export CSV",
        dash_welcome: "Welcome back,",
        dash_sub: "Here's what's happening with your IT support tickets today.",
        dash_recent: "Recent Activity",
        btn_view_all: "View All",
        dash_status: "System Status",
        dash_status_sub: "All factory IT systems are running smoothly.",
        sys_net: "Network",
        sys_erp: "ERP System",
        cat_hw: "❖ Hardware / PC Issue",
        cat_sw: "❖ Software / Application",
        cat_nw: "❖ Network / Internet",
        filter_all: "All",
        filter_active: "Active",
        filter_resolved: "Resolved",
        status_new: "New",
        status_in_progress: "In Progress",
        status_resolved: "Resolved",
        empty_tickets: "No tickets found",
        empty_recent: "All caught up!"
    },
    th: {
        page_title: "ศูนย์บริการไอทีโรงงาน",
        app_name: "ศูนย์บริการไอทีโรงงาน",
        app_name_short: "ศูนย์บริการไอที",
        auth_sub: "ระบบแจ้งซ่อมไอทีองค์กร",
        email: "อีเมล",
        password: "รหัสผ่าน",
        btn_signin: "เข้าสู่ระบบ",
        no_account: "ยังไม่มีบัญชี?",
        btn_register: "สมัครสมาชิก",
        auth_or: "หรือ",
        btn_google: "ดำเนินการต่อด้วย Google",
        role_user: "ผู้แจ้ง",
        role_admin: "เจ้าหน้าที่ไอที",
        menu_group_1: "พื้นที่ทำงาน",
        menu_group_2: "ผู้ดูแลระบบ",
        menu_dash: "ภาพรวมระบบ",
        menu_incidents: "ตั๋วของฉัน",
        menu_create: "แจ้งปัญหาใหม่",
        menu_admin: "ศูนย์จัดการงาน",
        btn_logout: "ออกจากระบบ",
        stat_open: "รอดำเนินการ",
        stat_progress: "กำลังแก้ไข",
        stat_resolved: "ปิดงานแล้ว",
        stat_total: "จำนวนทั้งหมด",
        admin_my_resolved: "งานที่ฉันปิดแล้ว",
        th_subject: "หัวข้อ",
        th_status: "สถานะ",
        th_date: "อัปเดตล่าสุด",
        btn_submit: "ส่งเรื่องแจ้งซ่อม",
        search_placeholder: "ค้นหา...",
        btn_new_ticket: "สร้างตั๋วใหม่",
        form_title: "มีอะไรให้เราช่วยไหม?",
        form_sub: "ระบุรายละเอียดเพื่อให้ไอทีช่วยเหลือคุณ",
        form_cat: "หมวดหมู่",
        form_pri: "ความเร่งด่วน",
        form_short: "หัวข้อ",
        form_desc: "รายละเอียดเพิ่มเติม",
        form_loc_head: "ข้อมูลสถานที่และอุปกรณ์",
        form_bldg: "ตึก/อาคาร",
        form_floor: "ชั้น",
        form_dept: "แผนก",
        form_line: "ไลน์การผลิต",
        form_item: "อะไร/ชิ้นไหนเสีย",
        modal_loc: "ข้อมูลสถานที่และอุปกรณ์",
        btn_export: "ดาวน์โหลด CSV",
        dash_welcome: "ยินดีต้อนรับ,",
        dash_sub: "สรุปภาพรวมการแจ้งซ่อมไอทีของคุณในวันนี้",
        dash_recent: "รายการอัปเดตล่าสุด",
        btn_view_all: "ดูทั้งหมด",
        dash_status: "สถานะระบบโรงงาน",
        dash_status_sub: "ระบบไอทีทั้งหมดทำงานได้อย่างสมบูรณ์",
        sys_net: "ระบบเครือข่าย",
        sys_erp: "ระบบ ERP",
        cat_hw: "❖ ฮาร์ดแวร์ / เครื่องคอมพิวเตอร์",
        cat_sw: "❖ ซอฟต์แวร์ / โปรแกรม",
        cat_nw: "❖ เครือข่าย / อินเทอร์เน็ต",
        filter_all: "ทั้งหมด",
        filter_active: "กำลังดำเนินการ",
        filter_resolved: "ปิดงานแล้ว",
        status_new: "เปิดใหม่",
        status_in_progress: "กำลังดำเนินการ",
        status_resolved: "ปิดงานแล้ว",
        empty_tickets: "ไม่พบตั๋วแจ้งซ่อม",
        empty_recent: "จัดการครบหมดแล้ว!"
    }
};

let currentLang = localStorage.getItem('appLang') || 'en';
let isAdmin = false;
let isLoginMode = true;
let currentAdminFilter = 'All';
window.globalTickets = {};
let currentTicketId = null;
let chatUnsubscribe = null;

window.toggleMobileMenu = () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
};

window.toggleLang = (lang) => {
    currentLang = lang;
    localStorage.setItem('appLang', lang);
    
    document.getElementById('page-title-tag').innerText = dict[lang].page_title;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        if(dict[lang][k]) el.innerText = dict[lang][k];
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const k = el.getAttribute('data-i18n-placeholder');
        if(dict[lang][k]) el.placeholder = dict[lang][k];
    });

    const optHw = document.getElementById('opt-hw');
    const optSw = document.getElementById('opt-sw');
    const optNw = document.getElementById('opt-nw');
    if(optHw) optHw.innerText = dict[lang].cat_hw;
    if(optSw) optSw.innerText = dict[lang].cat_sw;
    if(optNw) optNw.innerText = dict[lang].cat_nw;

    if(typeof window.updatePriorityDesc === 'function') window.updatePriorityDesc(); 

    ['auth', 'app'].forEach(view => {
        const btnEn = document.getElementById(`lang-en-${view}`);
        const btnTh = document.getElementById(`lang-th-${view}`);
        if (btnEn && btnTh) {
            if (lang === 'en') {
                btnEn.className = view === 'app' ? "px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold shadow-sm transition" : "px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold shadow-lg shadow-blue-500/30 transition transform hover:scale-105";
                btnTh.className = view === 'app' ? "px-4 py-1.5 text-slate-500 hover:text-slate-700 rounded-full text-xs font-bold transition" : "px-4 py-1.5 bg-white/10 text-white backdrop-blur rounded-full border border-white/20 text-xs font-bold hover:bg-white/20 transition transform hover:scale-105";
            } else {
                btnTh.className = view === 'app' ? "px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold shadow-sm transition" : "px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold shadow-lg shadow-blue-500/30 transition transform hover:scale-105";
                btnEn.className = view === 'app' ? "px-4 py-1.5 text-slate-500 hover:text-slate-700 rounded-full text-xs font-bold transition" : "px-4 py-1.5 bg-white/10 text-white backdrop-blur rounded-full border border-white/20 text-xs font-bold hover:bg-white/20 transition transform hover:scale-105";
            }
        }
    });

    let activeTab = document.querySelector('.tab-content.active');
    if(activeTab) {
        let tabId = activeTab.id.replace('tab-', '');
        document.getElementById('page-title').innerText = dict[lang][`menu_${tabId}`] || dict[lang].app_name;
    }
};

window.updatePriorityDesc = () => {
    const select = document.getElementById('tk-priority');
    if(!select) return;
    const val = select.value;
    
    const thTexts = {
        "4 - Low": "● กระทบรายบุคคล - SLA: แก้ไขภายใน 3 วัน",
        "3 - Moderate": "● กระทบระดับแผนก - SLA: แก้ไขภายใน 24 ชม.",
        "2 - High": "● กระทบวงกว้าง - SLA: แก้ไขภายใน 4 ชม.",
        "1 - Critical": "● ระบบหลักล่ม - SLA: แก้ไขภายใน 1 ชม."
    };
    const enTexts = {
        "4 - Low": "● Individual impact - SLA: 3 Days",
        "3 - Moderate": "● Department impact - SLA: 24 Hours",
        "2 - High": "● Business degraded - SLA: 4 Hours",
        "1 - Critical": "● Total failure - SLA: 1 Hour"
    };

    const descColors = {
        "4 - Low": "bg-emerald-50/50 border-emerald-100 text-emerald-800",
        "3 - Moderate": "bg-amber-50/50 border-amber-100 text-amber-800",
        "2 - High": "bg-orange-50/50 border-orange-100 text-orange-800",
        "1 - Critical": "bg-rose-50/50 border-rose-100 text-rose-800"
    };
    const iconColors = {
        "4 - Low": "text-emerald-500",
        "3 - Moderate": "text-amber-500",
        "2 - High": "text-orange-500",
        "1 - Critical": "text-rose-500"
    };

    document.getElementById('priority-text').innerText = currentLang === 'th' ? thTexts[val] : enTexts[val];
    document.getElementById('priority-desc').className = `p-4 rounded-xl border text-xs flex gap-3 items-start transition-colors ${descColors[val]}`;
    document.getElementById('priority-icon').className = `fas fa-info-circle mt-0.5 ${iconColors[val]}`;
};

window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-link').forEach(el => el.classList.remove('active'));
    
    setTimeout(() => { 
        const targetTab = document.getElementById(`tab-${tabName}`);
        if(targetTab) targetTab.classList.add('active'); 
    }, 10);
    
    const activeLink = document.querySelector(`.menu-link[onclick*="'${tabName}'"]`);
    if(activeLink) activeLink.classList.add('active');

    document.getElementById('page-title').innerText = dict[currentLang][`menu_${tabName}`] || dict[currentLang].app_name;
    if(window.innerWidth <= 768 && document.getElementById('sidebar').classList.contains('open')) toggleMobileMenu();
};

window.toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-submit-btn').innerText = isLoginMode ? dict[currentLang].btn_signin : dict[currentLang].btn_register;
    document.getElementById('auth-switch-text').innerText = isLoginMode ? dict[currentLang].no_account : (currentLang === 'th' ? "มีบัญชีอยู่แล้ว?" : "Already have an account?");
    document.getElementById('auth-switch-btn').innerText = isLoginMode ? dict[currentLang].btn_register : dict[currentLang].btn_signin;
};

window.openAIModal = () => {
    const modal = document.getElementById('ai-modal');
    const box = document.getElementById('ai-box');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => { modal.style.opacity = '1'; box.classList.remove('scale-95'); box.classList.add('scale-100'); }, 10);
    if(window.innerWidth <= 768 && document.getElementById('sidebar').classList.contains('open')) toggleMobileMenu();
};

window.closeAIModal = () => {
    const modal = document.getElementById('ai-modal');
    const box = document.getElementById('ai-box');
    modal.style.opacity = '0';
    box.classList.remove('scale-100');
    box.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
};

// 🧠 ฐานข้อมูลสมองบอท (Ultimate IT Helpdesk Database)
const botDatabase = [
    { keywords: ["ดี", "ทัก", "เทส", "test", "สวัสดี", "หวัดดี", "ดีครับ", "ดีค่ะ", "hello", "hi", "ทักทาย", "ทำอะไรได้บ้าง", "ช่วยด้วย", "มีใครอยู่ไหม", "แอดมิน"], answer: "สวัสดีครับ! ผมคือ **Serviceman** 🤖 ผู้ช่วยไอทีประจำโรงงาน วันนี้ระบบไอทีมีปัญหาตรงไหนให้ผมช่วยตรวจสอบไหมครับ พิมพ์อาการเสียสั้นๆ มาได้เลยครับ" },
    { keywords: ["ขอบคุณ", "แต้งกิ้ว", "thank", "thx", "เยี่ยม", "ดีมาก", "ok", "โอเค", "ได้แล้ว", "หายแล้ว", "ขอบใจ", "อืม"], answer: "ยินดีให้บริการเสมอครับ! 🎉 ถ้ามีปัญหาการใช้งานอื่นๆ แจ้งเข้ามา หรือเปิดตั๋วในระบบได้ตลอด 24 ชม. นะครับ" },
    { keywords: ["ใครสร้าง", "เจ้าของ", "ผู้สร้าง", "ใครทำ", "แอดมินคือใคร", "ชื่ออะไร"], answer: "ผมคือ Serviceman AI ครับ ถูกพัฒนาขึ้นโดยทีมงาน IT Support เพื่อช่วยดูแลและรับเรื่องแจ้งซ่อมให้พนักงานทุกคนครับ 👨‍💻" },
    { keywords: ["ลาก่อน", "ไปละ", "บาย", "bye", "goodbye", "ฝันดี"], answer: "รับทราบครับ! ขอให้วันนี้เป็นวันที่ราบรื่นในการทำงานนะครับ 🫡" },
    { keywords: ["โง่", "ไม่รู้เรื่อง", "บอทกาก", "ไม่ได้เรื่อง"], answer: "ขออภัยที่ยังไม่ค่อยฉลาดเท่าไหร่นะครับ 😅 ผมกำลังเรียนรู้ทุกวัน ถ้าผมตอบไม่ได้ รบกวนกดปุ่ม **Create Ticket** เพื่อให้พี่ๆ ช่างไอทีตัวจริงมาช่วยแก้ปัญหานะครับ 🙏" },
    { keywords: ["ลืมรหัส", "เปลี่ยนรหัส", "password", "พาสเวิร์ด", "ล็อค", "lock", "เข้าไม่ได้", "login", "ล็อกอินไม่ได้", "รหัสหมดอายุ", "expire"], answer: "ปัญหาเข้าสู่ระบบ/ลืมรหัสผ่าน 🔑 รบกวนกด **Create Ticket** แล้วระบุ **ชื่อผู้ใช้ (Username) หรืออีเมล** ที่ติดปัญหา เพื่อให้แอดมินทำการปลดล็อคหรือรีเซ็ตรหัสผ่านให้นะครับ" },
    { keywords: ["สร้างยูสเซอร์", "พนักงานใหม่", "new user", "พนักงานเข้าใหม่", "ขอสิทธิ์", "เพิ่มสิทธิ์"], answer: "การขอสิทธิ์เข้าถึงหรือสร้าง User พนักงานใหม่ 👤 รบกวนหัวหน้างานเปิดตั๋วแจ้ง **ชื่อ-สกุล, แผนก, ตำแหน่ง และสิทธิ์ที่ต้องการ** เพื่อเป็นหลักฐานให้ฝ่ายไอทีดำเนินการครับ" },
    { keywords: ["ลาออก", "พนักงานลาออก", "ปิดยูส", "resign"], answer: "แจ้งพนักงานลาออก/ระงับสิทธิ์ 🚫 รบกวนฝ่าย HR หรือหัวหน้างาน เปิดตั๋วแจ้ง **ชื่อพนักงาน และวันที่มีผล** เพื่อให้ IT ระงับสิทธิ์การเข้าถึงระบบข้อมูลทั้งหมดครับ" },
    { keywords: ["เข้าโฟลเดอร์ไม่ได้", "แชร์ไฟล์", "share file", "map drive", "แมพไดร์ฟ", "เข้าไดร์ฟไม่ได้", "ไดร์ฟหาย"], answer: "ปัญหาเข้าโฟลเดอร์แชร์/Map Drive ไม่ได้ 📁 รบกวนเช็คว่าเชื่อมต่อเครือข่ายของบริษัทอยู่หรือไม่ หากปกติแต่เข้าไม่ได้ ให้เปิดตั๋วแจ้ง **ชื่อโฟลเดอร์ หรือ IP Address** ที่ต้องการเข้าถึงครับ" },
    { keywords: ["อีเมล", "email", "mail", "เมล์", "ส่งเมลไม่ออก", "รับเมลไม่ได้", "outlook", "เมล์เด้ง", "เมลเต็ม", "mailbox full"], answer: "ปัญหาอีเมล (Email) ✉️ หากกล่องจดหมายเต็มให้ลองลบเมลเก่าๆ ทิ้งก่อนครับ แต่ถ้าเป็นปัญหา Error รับส่งไม่ได้ รบกวนแคปหน้าจอ Error นั้นแนบส่งมาในตั๋วแจ้งซ่อมได้เลยครับ" },
    { keywords: ["เน็ต", "อินเทอร์เน็ต", "internet", "wifi", "ไวไฟ", "เน็ตหลุด", "ต่อเน็ตไม่ได้", "ไม่มีเน็ต", "no internet", "เน็ตพัง"], answer: "ปัญหาอินเทอร์เน็ต/Wi-Fi 📡 ลองกดปิด-เปิด Wi-Fi ที่เครื่องดูก่อนนะครับ หากยังใช้งานไม่ได้ รบกวนแจ้ง **อาคาร ชั้น และจุดที่นั่ง** ในหน้า Create Ticket เพื่อให้ช่าง Network เข้าไปตรวจสอบครับ" },
    { keywords: ["ช้า", "โหลดไม่ขึ้น", "lag", "แลค", "ปิงสูง", "หมุนๆ", "ค้างๆ", "เน็ตอืด"], answer: "ถ้าระบบหรือเน็ตช้า 🐢 อาจเกิดจากเครือข่ายบางจุด หรือเครื่องมีการรันอัปเดตซ่อนอยู่ ลองรีสตาร์ทเครื่อง 1 รอบครับ ถ้าไม่ดีขึ้น เปิดตั๋วแจ้งซ่อมให้ช่างรีโมทไปเช็คได้เลยครับ" },
    { keywords: ["เข้าเว็บไม่ได้", "บล็อกเว็บ", "block", "เว็บโดนบล็อค", "ขอเปิดเว็บ"], answer: "เข้าเว็บไซต์ไม่ได้/โดนบล็อก ⛔ หากเว็บนั้นจำเป็นต่อการทำงาน รบกวนหัวหน้างานเปิดตั๋วแจ้ง **URL เว็บไซต์ และเหตุผลการใช้งาน** เพื่อขออนุมัติปลดบล็อกในระบบ Firewall ครับ" },
    { keywords: ["vpn", "วีพีเอ็น", "work from home", "wfh", "รีโมท", "remote", "anydesk", "teamviewer"], answer: "ปัญหาการเชื่อมต่อ VPN หรือ Remote 🌍 รบกวนเช็คอินเทอร์เน็ตฝั่งต้นทางก่อนนะครับ หากเน็ตปกติแต่ Error โปรดเปิดตั๋วพร้อมแนบรูป Error ให้ทีมเช็ค Server และ User ให้ครับ" },
    { keywords: ["สายแลน", "lan", "สายหลุด", "กากบาทสีแดง", "ลูกโลก", "สายขาด", "หัวหัก", "พอร์ตแลน", "ไม่มีสัญญาณ"], answer: "ไอคอนเน็ตขึ้นกากบาทสีแดง/ลูกโลก 🔌 ลองถอดสาย LAN (สายสีฟ้า/เหลือง/ขาว) ด้านหลังคอมแล้วเสียบใหม่ให้ดัง 'คลิก' ดูก่อนนะครับ หากสายขาดหรือหัวหัก แจ้งพิกัดในตั๋วขอเบิกสายเส้นใหม่ได้เลยครับ" },
    { keywords: ["เปิดไม่ติด", "เครื่องดับ", "ดับเอง", "ไฟไม่เข้า", "กดปุ่มเปิดไม่ได้", "เปิดคอมไม่ขึ้น"], answer: "คอมพิวเตอร์เปิดไม่ติด 🔌 รบกวนตรวจเช็คปลั๊กไฟใต้โต๊ะ ปลั๊กพ่วง และหลังเคสคอมพิวเตอร์ว่าหลวมหรือไม่ หากเช็คแล้วไฟเข้าแต่เครื่องยังเงียบ รบกวนเปิดตั๋วแจ้งซ่อมด่วนครับ" },
    { keywords: ["จอฟ้า", "blue screen", "รีสตาร์ทเอง", "ค้าง", "จอค้าง", "แฮงค์", "ขยับไม่ได้"], answer: "คอมพิวเตอร์จอฟ้า/ค้าง 💻 อาจเกิดจาก Windows รวน หรือ Hardware มีปัญหา รบกวน **ถ่ายรูปหน้าจอ Error (รูปจอฟ้า)** แล้วแนบรูปตอนเปิดตั๋วแจ้งซ่อม ทีมไอทีจะได้วิเคราะห์ถูกจุดครับ" },
    { keywords: ["หน้าจอ", "จอคอม", "monitor", "มอนิเตอร์", "ไม่มีภาพ", "no signal", "จอมืด", "จอกะพริบ", "ภาพลาย", "จอแตก", "จอเป็นเส้น"], answer: "ปัญหาหน้าจอไม่มีภาพ/No Signal 🖥️ ลองขยับสายสัญญาณ (สายหัวสีน้ำเงิน/ขาว/ดำ) ทั้งด้านหลังจอและหลังคอมพิวเตอร์ให้แน่น และเช็คว่าไฟที่จอสว่างไหม ถ้าไม่หายหรือจอแตก เปิดตั๋วเคลมได้เลยครับ" },
    { keywords: ["เมาส์", "mouse", "คีย์บอร์ด", "keyboard", "แป้นพิมพ์", "พิมพ์ไม่ได้", "คลิกไม่ได้", "ปุ่มค้าง", "เมาส์พัง", "เม้า", "เม้าส์", "เลื่อนไม่ไป"], answer: "เมาส์/คีย์บอร์ดมีปัญหา 🖱️ ลองถอดสาย USB แล้วย้ายไปเสียบช่องอื่นดูก่อนครับ ถ้ารุ่นไร้สายให้ลองเปลี่ยนถ่านดู หากเสียจริง เปิดตั๋วแจ้งขอเบิกอุปกรณ์ทดแทนใหม่ได้ครับ" },
    { keywords: ["เสียง", "ลำโพง", "หูฟัง", "ไมค์", "headset", "speaker", "ไม่ได้ยิน", "ไม่มีเสียง", "เสียงไม่ออก", "เสียงแตก"], answer: "ปัญหาเรื่องเสียง 🎧 ลองตรวจสอบ Volume ที่มุมขวาล่างของจอ และเช็คว่าเสียบสายแจ็คถูกช่องหรือไม่ (สีเขียว=หูฟัง/ลำโพง, สีชมพู/แดง=ไมค์) หากหูฟังชำรุด เปิดตั๋วขอเบิกใหม่ได้ครับ" },
    { keywords: ["กล้อง", "webcam", "เว็บแคม", "กล้องไม่ติด", "ภาพมืด", "กล้องเสีย"], answer: "ปัญหากล้อง/Webcam 📷 ลองเช็คว่ามีฝาปิดหน้ากล้อง (Privacy shutter) เลื่อนปิดอยู่หรือไม่ และตรวจเช็คการอนุญาต (Permissions) ให้แอปเข้าถึงกล้องในการตั้งค่า Windows ดูก่อนนะครับ" },
    { keywords: ["ร้อน", "เสียงดัง", "พัดลมดัง", "ควัน", "ไฟดูด", "ไฟช็อต", "upsร้อง", "เครื่องสำรองไฟร้อง", "แบตเสื่อม", "แบตบวม", "ระเบิด", "ไหม้"], answer: "⚠️ **ฉุกเฉิน:** หากอุปกรณ์มีเสียงร้องเตือนดังยาวๆ มีกลิ่นไหม้ แบตบวม หรือไฟช็อต แนะนำให้ **รีบถอดปลั๊กไฟออกทันที** และรีบเปิดตั๋วแจ้งความด่วนระดับ **Critical** หรือโทรแจ้ง 1111 ด่วนครับ!" },
    { keywords: ["ปริ้น", "ปริ้นเตอร์", "เครื่องปริ้น", "print", "printer", "ไม่ออก", "สั่งปริ้นไม่ได้", "offline", "ออฟไลน์", "หาปริ้นเตอร์ไม่เจอ", "แอดปริ้นเตอร์"], answer: "ปัญหาเครื่องพิมพ์ (Printer) 🖨️ หากสั่งพิมพ์ไม่ออก ให้ลองรีสตาร์ทคอมพิวเตอร์ 1 รอบดูก่อนครับ ถ้ายืนยันว่ายังพิมพ์ไม่ได้ รบกวนแจ้ง **แผนก และ ชื่อรุ่น/IP ของเครื่องพิมพ์** ลงในตั๋วแจ้งซ่อมครับ" },
    { keywords: ["กระดาษติด", "paper jam", "ติดเครื่องปริ้น", "ยับ", "ดึงกระดาษไม่ออก"], answer: "เครื่องพิมพ์กระดาษติด (Paper Jam) 📄 **กรุณาอย่าดึงกระดาษออกเองแรงๆ เพราะเซ็นเซอร์อาจหักได้** รบกวนเปิดตั๋วแจ้งจุดตั้งเครื่อง เดี๋ยวช่างจะเดินไปถอดประกอบเคลียร์กระดาษให้ครับ" },
    { keywords: ["หมึก", "หมึกหมด", "toner", "หมึกจาง", "เลอะ", "หมึกหยด", "โทนเนอร์", "สีเพี้ยน", "สีไม่ออก", "ดรัม"], answer: "หมึกหมด/สีเพี้ยน/เลอะ 🖨️ รบกวนเปิดตั๋วแจ้งขอเปลี่ยนหมึก โดยระบุ **ยี่ห้อและรุ่นเครื่องพิมพ์ (เช่น HP LaserJet 1020)** มาได้เลยครับ ช่างจะนำ Toner ตลับใหม่ไปเปลี่ยนให้" },
    { keywords: ["สแกนเนอร์", "scan", "เครื่องสแกน", "barcode", "บาร์โค้ด", "ยิงไม่ออก", "แสกน", "ตัวยิง", "สแกนไม่เข้า"], answer: "ตัวอ่านบาร์โค้ด/เครื่องสแกน 📠 ลองเช็คสาย USB ว่าเสียบแน่นหรือไม่ หากกดยิงแล้วไม่มีแสงเลเซอร์สีแดงออกเลย รบกวนเปิดตั๋วแจ้งให้ช่างนำเครื่องสำรองไปเทสเปลี่ยนให้ครับ" },
    { keywords: ["zebra", "สติ๊กเกอร์", "sticker", "ปริ้นสติ๊กเกอร์", "เครื่องยิงสติ๊กเกอร์", "เครื่องพิมพ์บาร์โค้ด", "ริบบอน"], answer: "ปัญหาเครื่องปริ้นบาร์โค้ด/Zebra 🏷️ หากพิมพ์ไม่ออก, กระดาษรันไม่ตรงรอยปรุ หรือริบบอนขาด แนะนำให้เปิดตั๋วแจ้งซ่อม เพื่อให้ทีมช่างไปทำ Calibrate เครื่องหรือเปลี่ยนอะไหล่ให้ครับ" },
    { keywords: ["ลงโปรแกรม", "ขอโปรแกรม", "install", "ติดตั้งโปรแกรม", "ขอลงโปรแกรม", "autocad", "photoshop", "สิทธิ์ admin"], answer: "การขอติดตั้งโปรแกรม 💿 หากโปรแกรมนั้นมีลิขสิทธิ์ รบกวนให้ระดับผู้จัดการเปิดตั๋วแจ้งขออนุมัติใช้งาน หากเป็นโปรแกรมฟรี แจ้งพิกัดให้ไอทีรีโมทไปติดตั้งให้ได้เลยครับ" },
    { keywords: ["word", "excel", "powerpoint", "office", "ออฟฟิศ", "not responding", "สูตรพัง", "เซฟไม่ได้", "ค้างตอนเซฟ", "ไฟล์พัง"], answer: "โปรแกรม MS Office รวน 📊 เบื้องต้นลองกด Task Manager (Ctrl+Shift+Esc) ปิดโปรแกรมแล้วเปิดใหม่ครับ หากโปรแกรมค้างบ่อย เปิดตั๋วแจ้งให้ไอทีรีโมทไป Repair ให้ได้ครับ" },
    { keywords: ["pdf", "acrobat", "adobe", "อ่านไฟล์ไม่ได้", "เปิดไฟล์ไม่ได้", "รวมไฟล์ pdf"], answer: "โปรแกรม PDF มีปัญหา 📑 หากเปิดไฟล์ไม่ได้ ลองคลิกขวาที่ไฟล์ เลือก Open with -> Google Chrome ดูก่อนนะครับ หรือเปิดตั๋วแจ้งให้ไอทีลงโปรแกรมอ่าน PDF ให้ครับ" },
    { keywords: ["windows", "วินโดว์", "update", "อัปเดต", "จอดำ", "อัพเดท", "activate windows", "หมดอายุ"], answer: "ปัญหา Windows ⚙️ หากเครื่องกำลังขึ้นหน้าจอ Updating **ห้ามปิดเครื่องหรือถอดปลั๊กเด็ดขาด** ให้รอจนเสร็จครับ แต่ถ้าขึ้นแจ้งเตือน Activate Windows เปิดตั๋วให้ไอทีแอคทีฟคีย์ให้ใหม่ได้ครับ" },
    { keywords: ["ไลน์", "line", "ซูม", "zoom", "teams", "ไมโครซอฟทีม", "แชท", "โทรไม่ได้", "แชร์หน้าจอไม่ได้"], answer: "ปัญหาโปรแกรมแชท/ประชุมออนไลน์ 💬 ลองเช็คสัญญาณเน็ต หรือลอง Log out แล้ว Log in เข้าโปรแกรมใหม่ หากยังแชร์หน้าจอหรือเปิดกล้อง/ไมค์ไม่ได้ แจ้งไอทีรีโมทตรวจสอบได้ครับ" },
    { keywords: ["ไวรัส", "virus", "antivirus", "มัลแวร์", "แฮก", "hack", "โฟลเดอร์แปลก", "โดนเรียกค่าไถ่", "ransomware", "ไฟล์หาย", "ป๊อปอัพเด้ง"], answer: "🚨 **ความปลอดภัย (Security):** หากพบไฟล์เปลี่ยนนามสกุลแปลกๆ หรือสงสัยว่าติดไวรัส ให้ **หยุดใช้งาน และ ถอดสาย LAN / ปิด Wi-Fi ทันที!!** จากนั้นเปิดตั๋วระดับ Critical ด่วนครับ!" },
    { keywords: ["erp", "sap", "ระบบโรงงาน", "ตัดสต็อกไม่ได้", "สต็อก", "อนุมัติไม่ได้", "ข้อมูลไม่ขึ้น", "ระบบล่ม", "ระบบค้าง"], answer: "ปัญหาระบบ ERP/SAP 🏭 รบกวนแจ้ง **หน้าจอเมนูที่กำลังทำรายการ, Error Code** แนบส่งมาในตั๋วแจ้งซ่อม เพื่อให้ทีม System Admin นำไปตรวจสอบครับ" },
    { keywords: ["สแกนนิ้ว", "สแกนหน้า", "เข้างาน", "เครื่องทาบบัตร", "ประตูล็อค", "เปิดประตูไม่ได้", "door access", "fingerprint", "บัตรทาบไม่ติด"], answer: "ปัญหา Access Control / สแกนเข้างาน ⏱️ รบกวนเปิดตั๋วแจ้งซ่อม ระบุ **อาคาร, ชั้น, และพิกัดประตู** ที่มีปัญหา หากประตูล็อคค้างออกไม่ได้ ให้กดปุ่มฉุกเฉิน (Break Glass) ก่อนครับ" },
    { keywords: ["กล้องวงจรปิด", "cctv", "ขอดูภาพ", "ดูกล้องไม่ได้", "ขอดูกล้อง", "กล้องดับ"], answer: "เกี่ยวกับกล้อง CCTV 📹 หากต้องการขอดูย้อนหลังหรือดึงไฟล์ภาพ ต้องให้ระดับผู้จัดการหรือ HR เซ็นอนุมัติใบคำร้องก่อนนะครับ หากแจ้งกล้องเสีย ระบุจุดที่กล้องตั้งอยู่ลงในตั๋วได้เลยครับ" },
    { keywords: ["ย้ายโต๊ะ", "ย้ายแผนก", "ย้ายคอม", "move", "ย้ายเครื่อง"], answer: "การขอย้ายโต๊ะ/ย้ายคอมพิวเตอร์ 🪑 รบกวนเปิดตั๋วแจ้งล่วงหน้า 1-2 วันครับ ระบุ **จุดเดิม และ จุดใหม่** ที่จะไปนั่งให้ชัดเจน เพื่อให้ทีมไอทีเตรียมเรื่องการเดินสาย LAN และปลั๊กไฟให้พร้อมครับ" },
    { keywords: ["ยืมคอม", "ขอยืม", "ยืมโปรเจคเตอร์", "โปรเจคเตอร์", "projector", "อุปกรณ์ประชุม"], answer: "การขอยืมอุปกรณ์ไอทีส่วนกลาง (เช่น โปรเจคเตอร์, โน้ตบุ๊กชั่วคราว, สายแปลง) 🎒 รบกวนเปิดตั๋วจองคิวล่วงหน้า ระบุ **วันที่ยืม และวันที่คืน** ให้ชัดเจนครับ" },
    { keywords: ["สร้างตั๋ว", "เปิดตั๋ว", "แจ้งซ่อมยังไง", "ทำไง", "ใช้งานยังไง", "how to use", "คู่มือ", "สอนหน่อย", "วิธีแจ้งซ่อม"], answer: "การแจ้งปัญหา 📝 ให้กดที่เมนู **Create Ticket** ด้านซ้ายมือ เลือกหมวดหมู่, ความเร่งด่วน, ระบุสถานที่ตั้ง และเขียนรายละเอียดอาการให้ครบถ้วน (ถ้ามีรูปแนบมาด้วยจะเยี่ยมมาก) แล้วกด Submit ครับ" },
    { keywords: ["ตั๋วของฉัน", "ดูตั๋ว", "ตามงาน", "สเตตัส", "สถานะงาน", "status", "ถึงไหนแล้ว", "เสร็จยัง", "ยังไม่มาซ่อม"], answer: "การติดตามสถานะ 🔍 ไปที่เมนู **My Tickets** คุณจะเห็นตั๋วของคุณทั้งหมด\n🔵 New = รอรับงาน\n🟡 In Progress = กำลังดำเนินการ\n🟢 Resolved = แก้ไขเสร็จสิ้นแล้วครับ" },
    { keywords: ["sla", "ใช้เวลากี่วัน", "รอนาน", "ความเร่งด่วน", "กี่วันเสร็จ", "พรุ่งนี้ได้ไหม"], answer: "ระยะเวลามาตรฐานในการแก้ไข (SLA) ขึ้นอยู่กับ Priority ตอนเปิดตั๋วครับ ⏳\n🔴 Critical = ภายใน 1 ชม.\n🟠 High = ภายใน 4 ชม.\n🟡 Moderate = ภายใน 24 ชม.\n🟢 Low = ภายใน 3 วันทำงานครับ" }
];

// 🔴 ฟังก์ชันสำหรับปุ่ม Quick Reply
window.sendQuickReply = (text) => {
    document.getElementById('ai-input').value = text;
    window.sendAIMessage();
};

window.sendAIMessage = async () => {
    const input = document.getElementById('ai-input');
    const rawText = input.value.trim();
    if (!rawText) return;
    
    const consoleBox = document.getElementById('ai-chat-box');
    
    consoleBox.insertAdjacentHTML('beforeend', `<div class="flex items-start gap-4 mb-6 flex-row-reverse chat-user-bubble"><div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-sm"><i class="fas fa-user text-[10px]"></i></div><div class="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-md text-sm leading-relaxed max-w-[85%]">${rawText}</div></div>`);
    input.value = '';
    consoleBox.scrollTop = consoleBox.scrollHeight;

    const thinkingId = 'think-' + Date.now();
    consoleBox.insertAdjacentHTML('beforeend', `<div id="${thinkingId}" class="flex items-start gap-4 mb-6 chat-ai-bubble"><div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0"><i class="fas fa-robot text-[10px]"></i></div><div class="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm text-slate-400 flex gap-1"><span class="animate-bounce">●</span><span class="animate-bounce" style="animation-delay: 0.2s">●</span><span class="animate-bounce" style="animation-delay: 0.4s">●</span></div></div>`);
    consoleBox.scrollTop = consoleBox.scrollHeight;

    setTimeout(() => {
        document.getElementById(thinkingId)?.remove();

        const cleanText = rawText.toLowerCase().replace(/\s+/g, '');
        let botReply = "";

        for (let i = 0; i < botDatabase.length; i++) {
            const entry = botDatabase[i];
            for (let j = 0; j < entry.keywords.length; j++) {
                const keyword = entry.keywords[j].toLowerCase();
                if (cleanText.includes(keyword) || rawText.toLowerCase().includes(keyword)) {
                    botReply = entry.answer;
                    break;
                }
            }
            if (botReply !== "") break; 
        }

        // 🔴 ถ้าหาคำตอบไม่เจอ ให้บอทเด้งปุ่ม Quick Reply ให้เลือกอีกรอบ
        if (botReply === "") {
            botReply = `ขออภัยครับ คำถามนี้อาจจะลึกซึ้งเกินกว่าข้อมูลที่ผมมีในระบบ 😅 แนะนำให้กดเมนู **Create Ticket (แจ้งปัญหาใหม่)** เพื่อระบุรายละเอียดอาการให้พี่ๆ ทีมช่างไอทีไปตรวจสอบให้นะครับ ชัวร์ที่สุดครับ!<br><br>หรือลองเลือกหัวข้อปัญหาด้านล่างนี้ดูครับ 👇<br>
            <div class="flex flex-wrap gap-2 mt-3">
                <button onclick="sendQuickReply('คอมเปิดไม่ติด')" class="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-full text-xs font-bold transition-colors">💻 คอมพิวเตอร์</button>
                <button onclick="sendQuickReply('ปริ้นไม่ออก')" class="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-full text-xs font-bold transition-colors">🖨️ เครื่องปริ้น</button>
                <button onclick="sendQuickReply('เข้าเน็ตไม่ได้')" class="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-full text-xs font-bold transition-colors">📡 อินเทอร์เน็ต</button>
            </div>`;
        }

        botReply = botReply.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-600">$1</strong>');
        botReply = botReply.replace(/\n/g, '<br>');

        consoleBox.insertAdjacentHTML('beforeend', `<div class="flex items-start gap-4 mb-6 chat-ai-bubble"><div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-md"><i class="fas fa-robot text-[10px]"></i></div><div class="bg-slate-50 border border-slate-100 p-5 rounded-2xl rounded-tl-sm shadow-sm text-sm text-slate-700 leading-relaxed max-w-[85%]">${botReply}</div></div>`);
        consoleBox.scrollTop = consoleBox.scrollHeight;

    }, 800); 
};

document.getElementById('auth-form').onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    const action = isLoginMode ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
    action(auth, email, pass).catch(error => {
        Swal.fire({ icon: 'error', text: error.message, confirmButtonColor: '#3b82f6' });
    });
};

window.loginWithGoogle = () => {
    signInWithPopup(auth, googleProvider).catch(error => {
        Swal.fire({ icon: 'error', text: error.message, confirmButtonColor: '#3b82f6' });
    });
};

document.getElementById('btn-logout').onclick = () => {
    Swal.fire({
        title: currentLang === 'th' ? 'ออกจากระบบ?' : 'Sign Out?',
        icon: 'question', showCancelButton: true, confirmButtonColor: '#e11d48',
        confirmButtonText: currentLang === 'th' ? 'ยืนยัน' : 'Yes',
        cancelButtonText: currentLang === 'th' ? 'ยกเลิก' : 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) signOut(auth).then(() => window.location.reload());
    });
};

function loadDashboardData() {
    const q = query(collection(db, "incidents"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        let userHtml = "";
        let adminHtml = "";
        let recentDashHtml = "";
        let counts = { New: 0, "In Progress": 0, Resolved: 0, Total: 0 };
        let myResolved = 0;
        let recentCount = 0;
        
        const emptyState = `<tr><td colspan="4" class="p-16 text-center text-slate-400"><i class="fas fa-inbox text-5xl mb-4 opacity-20 block"></i><p class="font-medium text-sm" data-i18n="empty_tickets">${dict[currentLang].empty_tickets}</p></td></tr>`;
        const emptyRecent = `<div class="p-8 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl"><i class="fas fa-check-circle text-4xl mb-3 opacity-20 block"></i><p class="text-xs font-bold uppercase tracking-widest" data-i18n="empty_recent">${dict[currentLang].empty_recent}</p></div>`;
        
        snapshot.forEach((docSnap) => {
            const t = docSnap.data();
            const id = docSnap.id;
            const displayId = "TKT-" + id.substring(0, 4).toUpperCase();
            window.globalTickets[id] = t;
            
            const isMyTicket = t.callerEmail === auth.currentUser.email;
            if (!isAdmin && !isMyTicket) return;
            
            if(t.status === 'Resolved' && t.assignedTo === auth.currentUser.email) myResolved++;
            
            counts[t.status] = (counts[t.status] || 0) + 1;
            counts['Total']++;

            const bgColors = { 'New': 'bg-blue-100 text-blue-700', 'In Progress': 'bg-amber-100 text-amber-700', 'Resolved': 'bg-emerald-100 text-emerald-700' };
            let statusKey = 'status_' + t.status.toLowerCase().replace(' ', '_');
            let displayStatus = dict[currentLang][statusKey] || t.status;
            let statusHtml = `<span class="${bgColors[t.status]} px-3 py-1.5 rounded-md text-[10px] uppercase font-black tracking-widest flex w-fit gap-1 items-center"><span class="w-1.5 h-1.5 rounded-full ${t.status==='New'?'bg-blue-500':(t.status==='In Progress'?'bg-amber-500':'bg-emerald-500')}"></span><span data-i18n="${statusKey}">${displayStatus}</span></span>`;

            let priIndicator = t.priority.includes('1') ? '<i class="fas fa-fire text-rose-500 mr-2"></i>' : (t.priority.includes('2') ? '<i class="fas fa-exclamation-circle text-orange-500 mr-2"></i>' : '');
            let imgIcon = t.imageUrl ? ' <i class="fas fa-image text-blue-400 ml-1 text-[10px]"></i>' : '';

            if (isMyTicket) {
                userHtml += `<tr class="hover:bg-slate-50 transition group border-b border-slate-50 cursor-pointer" onclick="openModal('${id}')">
                    <td class="py-4 px-6 font-bold text-slate-500 text-xs">${displayId}</td>
                    <td class="py-4 px-6"><div class="font-bold text-slate-800 text-sm">${priIndicator}${t.subject}${imgIcon}</div></td>
                    <td class="py-4 px-6">${statusHtml}</td>
                    <td class="py-4 px-6 text-right text-xs text-slate-500">${timeAgo(t.createdAt?.toDate())}</td>
                </tr>`;
            }

            if (isAdmin) {
                adminHtml += `<tr class="hover:bg-slate-50 transition group border-b border-slate-50 cursor-pointer" data-status="${t.status}" onclick="openModal('${id}')">
                    <td class="py-4 px-4 font-bold text-slate-500 text-xs">${displayId}</td>
                    <td class="py-4 px-4"><div class="font-bold text-slate-800 text-sm">${priIndicator}${t.subject}${imgIcon}</div><div class="text-[10px] text-slate-400 mt-0.5">${t.callerEmail}</div></td>
                    <td class="py-4 px-4 text-xs font-bold text-slate-600">${t.assignedTo ? t.assignedTo.split('@')[0].toUpperCase() : '-'}</td>
                    <td class="py-4 px-4">${statusHtml}</td>
                    <td class="py-4 px-4 text-right opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        <button onclick="event.stopPropagation(); editTicket('${id}')" class="w-8 h-8 bg-white border border-blue-200 text-blue-500 rounded-lg hover:bg-blue-50 transition shadow-sm mr-1"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="event.stopPropagation(); updateTicket('${id}', 'In Progress')" class="w-8 h-8 bg-white border border-amber-200 text-amber-500 rounded-lg hover:bg-amber-50 transition shadow-sm mr-1"><i class="fas fa-play text-xs"></i></button>
                        <button onclick="event.stopPropagation(); updateTicket('${id}', 'Resolved')" class="w-8 h-8 bg-white border border-emerald-200 text-emerald-500 rounded-lg hover:bg-emerald-50 transition shadow-sm mr-2"><i class="fas fa-check text-xs"></i></button>
                        <button onclick="event.stopPropagation(); deleteTicket('${id}')" class="w-8 h-8 bg-white border border-rose-200 text-rose-500 rounded-lg hover:bg-rose-50 transition shadow-sm"><i class="fas fa-trash text-xs"></i></button>
                    </td></tr>`;
            }

            if (recentCount < 5) {
                recentDashHtml += `
                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition cursor-pointer" onclick="openModal('${id}')">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500"><i class="fas fa-ticket-alt"></i></div>
                        <div>
                            <p class="text-sm font-bold text-slate-800">${t.subject}</p>
                            <p class="text-[10px] text-slate-400 font-bold uppercase">${displayId} • ${timeAgo(t.createdAt?.toDate())}</p>
                        </div>
                    </div>
                    ${statusHtml}
                </div>`;
                recentCount++;
            }
        });

        document.getElementById('user-ticket-list').innerHTML = userHtml || emptyState;
        if(isAdmin) document.getElementById('admin-ticket-list').innerHTML = adminHtml || emptyState;
        
        document.getElementById('stat-new').innerText = counts['New'];
        document.getElementById('stat-progress').innerText = counts['In Progress'];
        document.getElementById('stat-resolved').innerText = counts['Resolved'];
        document.getElementById('stat-total').innerText = counts['Total'];
        document.getElementById('stat-admin-my-resolved').innerText = myResolved;
        document.getElementById('dash-recent-list').innerHTML = recentDashHtml || emptyRecent;

        const userName = auth.currentUser.displayName ? auth.currentUser.displayName.split(' ')[0] : auth.currentUser.email.split('@')[0];
        document.getElementById('dash-user-name').innerText = userName.charAt(0).toUpperCase() + userName.slice(1);
        
        if(isAdmin) setAdminFilter(currentAdminFilter);
    });
}

document.getElementById('create-ticket-form').onsubmit = async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('btn-create-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Submitting...';

    try {
        let uploadedImageUrl = null;
        
        const fileInput = document.getElementById('tk-image');
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            uploadedImageUrl = await resizeAndConvertToBase64(file, 800, 800);
        }

        const docRef = await addDoc(collection(db, "incidents"), {
            callerEmail: auth.currentUser.email,
            category: document.getElementById('tk-category').value,
            priority: document.getElementById('tk-priority').value,
            building: document.getElementById('tk-building').value,
            floor: document.getElementById('tk-floor').value,
            department: document.getElementById('tk-dept').value,
            line: document.getElementById('tk-line').value,
            brokenItem: document.getElementById('tk-item').value,
            subject: document.getElementById('tk-subject').value,
            description: document.getElementById('tk-desc').value,
            imageUrl: uploadedImageUrl,
            status: 'New',
            assignedTo: null,
            createdAt: new Date()
        });
        
        await addDoc(collection(db, "incidents", docRef.id, "comments"), {
            senderEmail: "system", text: "Ticket created and sent to IT Queue.", createdAt: new Date()
        });
        
        document.getElementById('create-ticket-form').reset();
        window.clearCreateImage(); 
        window.updatePriorityDesc();
        Toast.fire({ icon: 'success', title: currentLang === 'th' ? 'สร้างตั๋วสำเร็จ!' : 'Ticket Created!' });
        switchTab('incidents');
        
    } catch (error) {
        console.error(error);
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message, confirmButtonColor: '#e11d48' });
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> <span data-i18n="btn_submit">Submit Request</span>';
        if(currentLang === 'th') document.querySelector('#btn-create-submit span').innerText = 'ส่งเรื่องแจ้งซ่อม';
    }
};

window.updateTicket = (id, newStatus) => {
    updateDoc(doc(db, "incidents", id), { status: newStatus, assignedTo: auth.currentUser.email }).then(() => {
        addDoc(collection(db, "incidents", id, "comments"), { senderEmail: "system", text: `Status updated to ${newStatus} by ${auth.currentUser.email.split('@')[0]}`, createdAt: new Date() });
        Toast.fire({ icon: 'success', title: currentLang === 'th' ? 'อัปเดตสถานะแล้ว' : 'Status Updated' });
    });
};

window.deleteTicket = (id) => {
    Swal.fire({ title: currentLang === 'th' ? 'ลบตั๋วนี้?' : 'Delete Ticket?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48', confirmButtonText: currentLang === 'th' ? 'ลบเลย' : 'Delete', cancelButtonText: currentLang === 'th' ? 'ยกเลิก' : 'Cancel' }).then((result) => {
        if (result.isConfirmed) { deleteDoc(doc(db, "incidents", id)); Toast.fire({ icon: 'success', title: currentLang === 'th' ? 'ลบสำเร็จ' : 'Deleted' }); }
    });
};

window.editTicket = (id) => {
    const t = window.globalTickets[id];
    Swal.fire({
        title: currentLang === 'th' ? 'แก้ไขตั๋ว' : 'Edit Ticket Details',
        width: '600px',
        html: `
        <div class="space-y-4 text-left mt-4">
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Subject</label>
                <input id="edit-sub" class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" value="${t.subject || ''}">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category</label>
                    <select id="edit-cat" class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none">
                        <option value="Hardware" ${t.category==='Hardware'?'selected':''}>Hardware</option>
                        <option value="Software" ${t.category==='Software'?'selected':''}>Software</option>
                        <option value="Network" ${t.category==='Network'?'selected':''}>Network</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Priority</label>
                    <select id="edit-pri" class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none">
                        <option value="4 - Low" ${t.priority==='4 - Low'?'selected':''}>Low</option>
                        <option value="3 - Moderate" ${t.priority==='3 - Moderate'?'selected':''}>Moderate</option>
                        <option value="2 - High" ${t.priority==='2 - High'?'selected':''}>High</option>
                        <option value="1 - Critical" ${t.priority==='1 - Critical'?'selected':''}>Critical</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Building</label>
                    <input id="edit-bldg" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" value="${t.building || ''}">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Department</label>
                    <input id="edit-dept" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" value="${t.department || ''}">
                </div>
                <div class="col-span-2">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Broken Item</label>
                    <input id="edit-item" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" value="${t.brokenItem || ''}">
                </div>
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description</label>
                <textarea id="edit-desc" rows="4" class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-500/20 outline-none">${t.description || ''}</textarea>
            </div>
        </div>`,
        focusConfirm: false, showCancelButton: true, confirmButtonColor: '#3b82f6', 
        confirmButtonText: currentLang === 'th' ? 'บันทึกข้อมูล' : 'Save Changes', cancelButtonText: currentLang === 'th' ? 'ยกเลิก' : 'Cancel',
        preConfirm: () => {
            return {
                subject: document.getElementById('edit-sub').value,
                category: document.getElementById('edit-cat').value,
                priority: document.getElementById('edit-pri').value,
                building: document.getElementById('edit-bldg').value,
                department: document.getElementById('edit-dept').value,
                brokenItem: document.getElementById('edit-item').value,
                description: document.getElementById('edit-desc').value
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            updateDoc(doc(db, "incidents", id), result.value);
            Toast.fire({ icon: 'success', title: currentLang === 'th' ? 'อัปเดตข้อมูลสำเร็จ' : 'Updated' });
        }
    });
};

window.exportCSV = () => {
    let csv = "ID,Subject,Status,Priority,Category,Building,Floor,Department,Line,BrokenItem,Caller,AssignedTo,Date\n";
    for(let id in window.globalTickets) {
        let t = window.globalTickets[id];
        let dateStr = t.createdAt ? t.createdAt.toDate().toISOString() : "";
        csv += `${id},"${t.subject}",${t.status},"${t.priority}",${t.category},"${t.building||'-'}","${t.floor||'-'}","${t.department||'-'}","${t.line||'-'}","${t.brokenItem||'-'}",${t.callerEmail},${t.assignedTo||''},${dateStr}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `FactoryIT_Tickets_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
};

window.filterTickets = (tableId, inputId) => {
    const input = document.getElementById(inputId).value.toUpperCase();
    const trs = document.getElementById(tableId).getElementsByTagName("tr");
    for (let i=1; i<trs.length; i++) { 
        trs[i].style.display = trs[i].innerText.toUpperCase().includes(input) ? "" : "none"; 
    }
};

window.setAdminFilter = (f) => {
    currentAdminFilter = f;
    const act = "px-5 py-2 rounded-lg text-xs font-bold bg-white shadow-sm text-slate-800 transition";
    const inact = "px-5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition";
    ['All', 'Active', 'Resolved'].forEach(btn => { document.getElementById(`btn-filter-${btn}`).className = btn === f ? act : inact; });
    
    let trs = document.getElementById('admin-ticket-list').getElementsByTagName('tr');
    for(let tr of trs) { 
        let s = tr.getAttribute('data-status'); 
        if(f === 'All') tr.style.display = '';
        else if(f === 'Active' && s !== 'Resolved') tr.style.display = '';
        else if(f === 'Resolved' && s === 'Resolved') tr.style.display = ''; 
        else tr.style.display = 'none'; 
    }
};

window.openModal = (id) => {
    currentTicketId = id;
    const t = window.globalTickets[id];
    
    if (!isAdmin && t.callerEmail !== auth.currentUser.email) {
        Swal.fire({ icon: 'error', title: 'Access Denied', text: 'คุณไม่มีสิทธิ์เข้าถึงตั๋วแจ้งซ่อมของผู้อื่นครับ' });
        return;
    }

    document.getElementById('modal-id').innerText = "TKT-" + id.substring(0, 4).toUpperCase();
    document.getElementById('modal-subject').innerText = t.subject;
    document.getElementById('modal-category').innerText = t.category;
    document.getElementById('modal-priority').innerText = t.priority;
    
    let bldg = t.building || '-';
    let fl = t.floor || '-';
    let dept = t.department || '-';
    let line = t.line || '-';
    document.getElementById('modal-location').innerText = `Bldg: ${bldg}, Floor: ${fl}, Dept: ${dept}, Line: ${line}`;
    document.getElementById('modal-broken-item').innerText = t.brokenItem || 'Not specified';
    document.getElementById('modal-desc').innerText = t.description;

    const imgContainer = document.getElementById('modal-image-container');
    const imgTag = document.getElementById('modal-image');
    if(t.imageUrl) {
        imgTag.src = t.imageUrl;
        imgContainer.classList.remove('hidden');
    } else {
        imgContainer.classList.add('hidden');
    }

    document.getElementById('modal-caller').innerText = t.callerEmail;
    document.getElementById('modal-assignee').innerText = t.assignedTo || 'Unassigned';
    document.getElementById('modal-date').innerText = t.createdAt ? t.createdAt.toDate().toLocaleString() : '';
    
    if(isAdmin) document.getElementById('btn-modal-edit').classList.remove('hidden');

    const bgColors = { 'New': 'bg-blue-100 text-blue-700', 'In Progress': 'bg-amber-100 text-amber-700', 'Resolved': 'bg-emerald-100 text-emerald-700' };
    let statusKey = 'status_' + t.status.toLowerCase().replace(' ', '_');
    let displayStatus = dict[currentLang][statusKey] || t.status;
    document.getElementById('modal-status-badge').innerHTML = `<span class="${bgColors[t.status]} px-4 py-1.5 rounded-lg text-xs uppercase font-black tracking-widest flex items-center gap-2"><span class="w-2 h-2 rounded-full ${t.status==='New'?'bg-blue-500':(t.status==='In Progress'?'bg-amber-500':'bg-emerald-500')}"></span><span data-i18n="${statusKey}">${displayStatus}</span></span>`;

    const modal = document.getElementById('ticket-modal');
    const box = document.getElementById('modal-box');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.style.opacity = '1'; box.classList.remove('scale-95'); box.classList.add('scale-100'); }, 10);

    const q = query(collection(db, "incidents", id, "comments"), orderBy("createdAt", "asc"));
    chatUnsubscribe = onSnapshot(q, (snapshot) => {
        let html = "";
        snapshot.forEach(doc => {
            const d = doc.data();
            const timeStr = d.createdAt ? d.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
            if(d.senderEmail === 'system') {
                html += `<div class="system-msg-container flex justify-center my-4"><span class="system-msg-pill shadow-sm"><i class="fas fa-cog mr-1 opacity-50"></i> ${d.text}</span></div>`;
            } else {
                const isMe = d.senderEmail === auth.currentUser.email;
                const align = isMe ? 'items-end' : 'items-start';
                const style = isMe ? 'chat-bubble-me' : 'chat-bubble-other';
                const senderName = isMe ? (currentLang === 'th'?'คุณ':'You') : d.senderEmail.split('@')[0];
                
                let chatImgHtml = d.imageUrl ? `<img src="${d.imageUrl}" class="mt-2 rounded-lg max-h-40 cursor-pointer border border-white/20 hover:opacity-90" onclick="viewFullImage('${d.imageUrl}')">` : '';
                
                html += `<div class="flex flex-col ${align}"><div class="${style} chat-bubble"><div class="chat-sender-name">${senderName} • ${timeStr}</div>${d.text}${chatImgHtml}</div></div>`;
            }
        });
        document.getElementById('chat-messages').innerHTML = html;
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
    });
};

window.closeModal = () => {
    const modal = document.getElementById('ticket-modal');
    const box = document.getElementById('modal-box');
    modal.style.opacity = '0';
    box.classList.remove('scale-100');
    box.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
    if(chatUnsubscribe) chatUnsubscribe();
};

document.getElementById('comment-text').addEventListener('paste', function(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
        const item = items[index];
        if (item.kind === 'file' && item.type.includes('image')) {
            const blob = item.getAsFile();
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(blob);
            document.getElementById('comment-image').files = dataTransfer.files;
            
            document.getElementById('comment-img-label').classList.replace('text-slate-500', 'text-blue-500');
            Toast.fire({ icon: 'success', title: currentLang === 'th' ? 'แนบรูปภาพจากหน้าจอแล้ว' : 'Image attached from Clipboard' });
            e.preventDefault(); 
        }
    }
});

document.getElementById('comment-form').onsubmit = async (e) => {
    e.preventDefault();
    const textInput = document.getElementById('comment-text');
    const imgInput = document.getElementById('comment-image');
    const text = textInput.value.trim();
    
    if(!text && imgInput.files.length === 0) return; 

    const btnSubmit = document.getElementById('btn-comment-submit');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i>';

    try {
        let uploadedImageUrl = null;
        if (imgInput.files.length > 0) {
            const file = imgInput.files[0];
            uploadedImageUrl = await resizeAndConvertToBase64(file, 800, 800);
        }

        await addDoc(collection(db, "incidents", currentTicketId, "comments"), {
            senderEmail: auth.currentUser.email, 
            text: text, 
            imageUrl: uploadedImageUrl,
            createdAt: new Date()
        });

        document.getElementById('comment-form').reset();
        document.getElementById('comment-img-label').classList.replace('text-blue-500', 'text-slate-500');
    } catch (error) {
        console.error(error);
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message });
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-paper-plane text-xs -ml-0.5"></i>';
    }
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-view').classList.remove('active');
        document.getElementById('app-view').classList.add('active');
        document.getElementById('user-email').innerText = user.email;
        
        const safeEmail = user.email ? user.email.toLowerCase().trim() : "";
        isAdmin = safeEmail === "nattezava1996@gmail.com" || safeEmail.includes("admin");
        
        const roleElement = document.getElementById('user-role');
        if (isAdmin) {
            roleElement.setAttribute('data-i18n', 'role_admin');
            roleElement.classList.remove('text-blue-400');
            roleElement.classList.add('text-rose-400'); 
        } else {
            roleElement.setAttribute('data-i18n', 'role_user');
            roleElement.classList.remove('text-rose-400');
            roleElement.classList.add('text-blue-400'); 
        }
        
        if(isAdmin) {
            document.getElementById('admin-menu').classList.remove('hidden');
        } else {
            document.getElementById('admin-menu').classList.add('hidden');
        }
        
        loadDashboardData();
        window.updatePriorityDesc();
    } else {
        document.getElementById('app-view').classList.remove('active');
        document.getElementById('auth-view').classList.add('active');
    }
    toggleLang(currentLang); 
});