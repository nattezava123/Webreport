import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// ==========================================
// 1. ฟังก์ชัน Utility และ UI (แปะบน window)
// ==========================================
window.globalTickets = {};
let currentTicketId = null;
let chatUnsubscribe = null;
let isLoginMode = true;
let currentLang = localStorage.getItem('appLang') || 'en';

window.viewFullImage = (url) => {
    Swal.fire({ imageUrl: url, imageAlt: 'Attached Image', width: 'auto', padding: '1rem', showConfirmButton: false, showCloseButton: true, customClass: { image: 'rounded-xl max-h-[80vh] object-contain' } });
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

async function resizeAndConvertToBase64(file, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
        if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/i)) { reject(new Error("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้นครับ")); return; }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width, height = img.height;
                if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
                if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = event.target.result;
        };
    });
}

function timeAgo(date) {
    if(!date) return '-';
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + "m ago";
    interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60; if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
}

const dict = {
    en: {
        page_title: "Factory IT Service Center", app_name: "Factory IT Service Center", app_name_short: "Factory IT", auth_sub: "Enterprise Service Desk",
        email: "Email", password: "Password", btn_signin: "Sign In", no_account: "New here?", btn_register: "Create an account", auth_or: "OR", btn_google: "Continue with Google", role_user: "User",
        menu_group_1: "Workspace", menu_dash: "Dashboard", menu_incidents: "My Tickets", menu_create: "Create Ticket", btn_logout: "Log Out",
        stat_open: "New Tickets", stat_progress: "In Progress", stat_resolved: "Resolved", stat_total: "Total Volume",
        th_subject: "Subject", th_status: "Status", th_date: "Timeline", btn_submit: "Submit Request", search_placeholder: "Search...", btn_new_ticket: "Create",
        form_title: "How can we help?", form_sub: "Fill out the details below to open a new support request.", form_cat: "Category", form_pri: "Priority",
        form_short: "Subject", form_desc: "Description", form_loc_head: "Location & Equipment Details", form_bldg: "Building", form_floor: "Floor", form_dept: "Department", form_line: "Line", form_item: "Broken Part / Item",
        modal_loc: "Location & Item", dash_welcome: "Welcome back,", dash_sub: "Here's what's happening with your IT support tickets today.", dash_recent: "Recent Activity", btn_view_all: "View All",
        dash_status: "System Status", dash_status_sub: "All factory IT systems are running smoothly.", sys_net: "Network", sys_erp: "ERP System",
        cat_hw: "❖ Hardware / PC Issue", cat_sw: "❖ Software / Application", cat_nw: "❖ Network / Internet", filter_all: "All", filter_active: "Active", filter_resolved: "Resolved",
        status_new: "New", status_in_progress: "In Progress", status_resolved: "Resolved", empty_tickets: "No tickets found", empty_recent: "All caught up!"
    },
    th: {
        page_title: "ศูนย์บริการไอทีโรงงาน", app_name: "ศูนย์บริการไอทีโรงงาน", app_name_short: "ศูนย์บริการไอที", auth_sub: "ระบบแจ้งซ่อมไอทีองค์กร",
        email: "อีเมล", password: "รหัสผ่าน", btn_signin: "เข้าสู่ระบบ", no_account: "ยังไม่มีบัญชี?", btn_register: "สมัครสมาชิก", auth_or: "หรือ", btn_google: "ดำเนินการต่อด้วย Google", role_user: "ผู้แจ้ง",
        menu_group_1: "พื้นที่ทำงาน", menu_dash: "ภาพรวมระบบ", menu_incidents: "ตั๋วของฉัน", menu_create: "แจ้งปัญหาใหม่", btn_logout: "ออกจากระบบ",
        stat_open: "รอดำเนินการ", stat_progress: "กำลังแก้ไข", stat_resolved: "ปิดงานแล้ว", stat_total: "จำนวนทั้งหมด",
        th_subject: "หัวข้อ", th_status: "สถานะ", th_date: "อัปเดตล่าสุด", btn_submit: "ส่งเรื่องแจ้งซ่อม", search_placeholder: "ค้นหา...", btn_new_ticket: "สร้างตั๋วใหม่",
        form_title: "มีอะไรให้เราช่วยไหม?", form_sub: "ระบุรายละเอียดเพื่อให้ไอทีช่วยเหลือคุณ", form_cat: "หมวดหมู่", form_pri: "ความเร่งด่วน",
        form_short: "หัวข้อ", form_desc: "รายละเอียดเพิ่มเติม", form_loc_head: "ข้อมูลสถานที่และอุปกรณ์", form_bldg: "ตึก/อาคาร", form_floor: "ชั้น", form_dept: "แผนก", form_line: "ไลน์การผลิต", form_item: "อะไร/ชิ้นไหนเสีย",
        modal_loc: "ข้อมูลสถานที่และอุปกรณ์", dash_welcome: "ยินดีต้อนรับ,", dash_sub: "สรุปภาพรวมการแจ้งซ่อมไอทีของคุณในวันนี้", dash_recent: "รายการอัปเดตล่าสุด", btn_view_all: "ดูทั้งหมด",
        dash_status: "สถานะระบบโรงงาน", dash_status_sub: "ระบบไอทีทั้งหมดทำงานได้อย่างสมบูรณ์", sys_net: "ระบบเครือข่าย", sys_erp: "ระบบ ERP",
        cat_hw: "❖ ฮาร์ดแวร์ / เครื่องคอมพิวเตอร์", cat_sw: "❖ ซอฟต์แวร์ / โปรแกรม", cat_nw: "❖ เครือข่าย / อินเทอร์เน็ต", filter_all: "ทั้งหมด", filter_active: "กำลังดำเนินการ", filter_resolved: "ปิดงานแล้ว",
        status_new: "เปิดใหม่", status_in_progress: "กำลังดำเนินการ", status_resolved: "ปิดงานแล้ว", empty_tickets: "ไม่พบตั๋วแจ้งซ่อม", empty_recent: "จัดการครบหมดแล้ว!"
    }
};

window.toggleMobileMenu = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); };

window.toggleLang = (lang) => {
    currentLang = lang; localStorage.setItem('appLang', lang);
    const titleTag = document.getElementById('page-title-tag');
    if(titleTag) titleTag.innerText = dict[lang].page_title;
    
    document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n'); if(dict[lang][k]) el.innerText = dict[lang][k]; });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { const k = el.getAttribute('data-i18n-placeholder'); if(dict[lang][k]) el.placeholder = dict[lang][k]; });
    
    const optHw = document.getElementById('opt-hw'), optSw = document.getElementById('opt-sw'), optNw = document.getElementById('opt-nw');
    if(optHw) optHw.innerText = dict[lang].cat_hw; if(optSw) optSw.innerText = dict[lang].cat_sw; if(optNw) optNw.innerText = dict[lang].cat_nw;
    window.updatePriorityDesc(); 

    ['auth', 'app'].forEach(view => {
        const btnEn = document.getElementById(`lang-en-${view}`), btnTh = document.getElementById(`lang-th-${view}`);
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
        const tabKey = `menu_${activeTab.id.replace('tab-', '')}`;
        document.getElementById('page-title').innerText = dict[lang][tabKey] || dict[lang].app_name;
    }
};

window.updatePriorityDesc = () => {
    const select = document.getElementById('tk-priority'); if(!select) return;
    const val = select.value;
    const thTexts = { "4 - Low": "● กระทบรายบุคคล - SLA: แก้ไขภายใน 3 วัน", "3 - Moderate": "● กระทบระดับแผนก - SLA: แก้ไขภายใน 24 ชม.", "2 - High": "● กระทบวงกว้าง - SLA: แก้ไขภายใน 4 ชม.", "1 - Critical": "● ระบบหลักล่ม - SLA: แก้ไขภายใน 1 ชม." };
    const enTexts = { "4 - Low": "● Individual impact - SLA: 3 Days", "3 - Moderate": "● Department impact - SLA: 24 Hours", "2 - High": "● Business degraded - SLA: 4 Hours", "1 - Critical": "● Total failure - SLA: 1 Hour" };
    const descColors = { "4 - Low": "bg-emerald-50/50 border-emerald-100 text-emerald-800", "3 - Moderate": "bg-amber-50/50 border-amber-100 text-amber-800", "2 - High": "bg-orange-50/50 border-orange-100 text-orange-800", "1 - Critical": "bg-rose-50/50 border-rose-100 text-rose-800" };
    const iconColors = { "4 - Low": "text-emerald-500", "3 - Moderate": "text-amber-500", "2 - High": "text-orange-500", "1 - Critical": "text-rose-500" };

    const priorityText = document.getElementById('priority-text');
    if(priorityText) priorityText.innerText = currentLang === 'th' ? thTexts[val] : enTexts[val];
    document.getElementById('priority-desc').className = `p-4 rounded-xl border text-xs flex gap-3 items-start transition-colors ${descColors[val]}`;
    document.getElementById('priority-icon').className = `fas fa-info-circle mt-0.5 ${iconColors[val]}`;
};

window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-link').forEach(el => el.classList.remove('active'));
    setTimeout(() => { document.getElementById(`tab-${tabName}`)?.classList.add('active'); }, 10);
    document.querySelector(`.menu-link[onclick*="'${tabName}'"]`)?.classList.add('active');
    document.getElementById('page-title').innerText = dict[currentLang][`menu_${tabName}`] || dict[currentLang].app_name;
    if(window.innerWidth <= 768 && document.getElementById('sidebar').classList.contains('open')) window.toggleMobileMenu();
};

window.toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-submit-btn').innerText = isLoginMode ? dict[currentLang].btn_signin : dict[currentLang].btn_register;
    document.getElementById('auth-switch-text').innerText = isLoginMode ? dict[currentLang].no_account : (currentLang === 'th' ? "มีบัญชีอยู่แล้ว?" : "Already have an account?");
    document.getElementById('auth-switch-btn').innerText = isLoginMode ? dict[currentLang].btn_register : dict[currentLang].btn_signin;
};

// ==========================================
// 2. ระบบ AI Assistant (Serviceman)
// ==========================================
window.openAIModal = () => {
    const modal = document.getElementById('ai-modal'); const box = document.getElementById('ai-box');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    setTimeout(() => { modal.style.opacity = '1'; box.classList.remove('scale-95'); box.classList.add('scale-100'); }, 10);
    if(window.innerWidth <= 768 && document.getElementById('sidebar').classList.contains('open')) window.toggleMobileMenu();
};
window.closeAIModal = () => {
    const modal = document.getElementById('ai-modal'); const box = document.getElementById('ai-box');
    modal.style.opacity = '0'; box.classList.remove('scale-100'); box.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
};

const botDatabase = [
    { keywords: ["ดี", "สวัสดี", "hello", "hi"], answer: "สวัสดีครับ! ผมคือ **Serviceman** 🤖 ผู้ช่วยไอทีประจำโรงงาน วันนี้ระบบไอทีมีปัญหาตรงไหนให้ผมช่วยไหมครับ" },
    { keywords: ["ลืมรหัส", "เปลี่ยนรหัส", "password"], answer: "ปัญหาเข้าสู่ระบบ/ลืมรหัสผ่าน 🔑 รบกวนกด **Create Ticket** แล้วระบุ Username เพื่อให้แอดมินรีเซ็ตรหัสผ่านให้นะครับ" },
    { keywords: ["เน็ต", "อินเทอร์เน็ต", "internet"], answer: "ปัญหาเน็ต/Wi-Fi 📡 ลองกดปิด-เปิด Wi-Fi ดูก่อนครับ หากไม่หาย รบกวนแจ้งพิกัดในหน้า Create Ticket ได้เลยครับ" }
];

window.sendQuickReply = (text) => { document.getElementById('ai-input').value = text; window.sendAIMessage(); };
window.sendAIMessage = async () => {
    const input = document.getElementById('ai-input'); const rawText = input.value.trim(); if (!rawText) return;
    const consoleBox = document.getElementById('ai-chat-box');
    consoleBox.insertAdjacentHTML('beforeend', `<div class="flex items-start gap-4 mb-6 flex-row-reverse chat-user-bubble"><div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0"><i class="fas fa-user text-[10px]"></i></div><div class="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm text-sm shadow-md">${rawText}</div></div>`);
    input.value = ''; consoleBox.scrollTop = consoleBox.scrollHeight;
    
    setTimeout(() => {
        let botReply = "ขออภัยครับ แนะนำให้กดเมนู **Create Ticket** เพื่อแจ้งให้พี่ๆ ช่างไอทีไปตรวจสอบให้นะครับ";
        for (let entry of botDatabase) { if (entry.keywords.some(k => rawText.toLowerCase().includes(k))) { botReply = entry.answer; break; } }
        botReply = botReply.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-600">$1</strong>').replace(/\n/g, '<br>');
        consoleBox.insertAdjacentHTML('beforeend', `<div class="flex items-start gap-4 mb-6 chat-ai-bubble"><div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-md"><i class="fas fa-robot text-[10px]"></i></div><div class="bg-slate-50 border border-slate-100 p-5 rounded-2xl rounded-tl-sm text-sm text-slate-700 leading-relaxed">${botReply}</div></div>`);
        consoleBox.scrollTop = consoleBox.scrollHeight;
    }, 800); 
};

// ==========================================
// 3. ระบบ Database & Auth (User Side)
// ==========================================
function loadDashboardData() {
    const q = query(collection(db, "incidents"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        let userHtml = ""; let recentDashHtml = ""; let counts = { New: 0, "In Progress": 0, Resolved: 0, Total: 0 }; let recentCount = 0;
        const emptyState = `<tr><td colspan="4" class="p-16 text-center text-slate-400"><i class="fas fa-inbox text-5xl mb-4 opacity-20 block"></i><p class="font-medium text-sm" data-i18n="empty_tickets">${dict[currentLang].empty_tickets}</p></td></tr>`;
        
        snapshot.forEach((docSnap) => {
            const t = docSnap.data(), id = docSnap.id, displayId = "TKT-" + id.substring(0, 4).toUpperCase();
            window.globalTickets[id] = t;
            if (t.callerEmail !== auth.currentUser.email) return; 
            
            const safeStatus = t.status || 'New', safePriority = t.priority || '';
            counts[safeStatus] = (counts[safeStatus] || 0) + 1; counts['Total']++;

            const bgColors = { 'New': 'bg-blue-100 text-blue-700', 'In Progress': 'bg-amber-100 text-amber-700', 'Resolved': 'bg-emerald-100 text-emerald-700' };
            let statusKey = 'status_' + safeStatus.toLowerCase().replace(' ', '_');
            let displayStatus = dict[currentLang][statusKey] || safeStatus;
            let badgeBgClass = bgColors[safeStatus] || bgColors['New'];
            let dotBgClass = safeStatus === 'New' ? 'bg-blue-500' : (safeStatus === 'In Progress' ? 'bg-amber-500' : 'bg-emerald-500');
            let statusHtml = `<span class="${badgeBgClass} px-3 py-1.5 rounded-md text-[10px] uppercase font-black tracking-widest flex w-fit gap-1 items-center"><span class="w-1.5 h-1.5 rounded-full ${dotBgClass}"></span><span data-i18n="${statusKey}">${displayStatus}</span></span>`;
            let priIndicator = safePriority.includes('1') ? '<i class="fas fa-fire text-rose-500 mr-2"></i>' : (safePriority.includes('2') ? '<i class="fas fa-exclamation-circle text-orange-500 mr-2"></i>' : '');
            let imgIcon = t.imageUrl ? ' <i class="fas fa-image text-blue-400 ml-1 text-[10px]"></i>' : '';

            userHtml += `<tr class="hover:bg-slate-50 transition border-b border-slate-50 cursor-pointer" onclick="openModal('${id}')">
                <td class="py-4 px-6 font-bold text-slate-500 text-xs">${displayId}</td>
                <td class="py-4 px-6"><div class="font-bold text-slate-800 text-sm">${priIndicator}${t.subject || 'No Subject'}${imgIcon}</div></td>
                <td class="py-4 px-6">${statusHtml}</td>
                <td class="py-4 px-6 text-right text-xs text-slate-500">${timeAgo(t.createdAt?.toDate())}</td>
            </tr>`;

            if (recentCount < 5) {
                recentDashHtml += `<div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition cursor-pointer" onclick="openModal('${id}')">
                    <div class="flex items-center gap-4"><div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500"><i class="fas fa-ticket-alt"></i></div><div><p class="text-sm font-bold text-slate-800">${t.subject || 'No Subject'}</p><p class="text-[10px] text-slate-400 font-bold uppercase">${displayId} • ${timeAgo(t.createdAt?.toDate())}</p></div></div>${statusHtml}</div>`;
                recentCount++;
            }
        });

        document.getElementById('user-ticket-list').innerHTML = userHtml || emptyState;
        document.getElementById('stat-new').innerText = counts['New'] || 0; document.getElementById('stat-progress').innerText = counts['In Progress'] || 0;
        document.getElementById('stat-resolved').innerText = counts['Resolved'] || 0; document.getElementById('stat-total').innerText = counts['Total'] || 0;
        document.getElementById('dash-recent-list').innerHTML = recentDashHtml || `<div class="p-8 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl"><p class="text-xs font-bold uppercase">${dict[currentLang].empty_recent}</p></div>`;
        const user = auth.currentUser;
        const userName = user.displayName ? user.displayName.split(' ')[0] : user.email.split('@')[0];
        document.getElementById('dash-user-name').innerText = userName.charAt(0).toUpperCase() + userName.slice(1);
    }, (error) => console.error("Firebase Error:", error));
}

document.getElementById('create-ticket-form').onsubmit = async (e) => {
    e.preventDefault(); const submitBtn = document.getElementById('btn-create-submit');
    submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Submitting...';
    try {
        let uploadedImageUrl = null; const fileInput = document.getElementById('tk-image');
        if (fileInput.files.length > 0) uploadedImageUrl = await resizeAndConvertToBase64(fileInput.files[0], 800, 800);
        const docRef = await addDoc(collection(db, "incidents"), {
            callerEmail: auth.currentUser.email, category: document.getElementById('tk-category').value, priority: document.getElementById('tk-priority').value,
            building: document.getElementById('tk-building').value, floor: document.getElementById('tk-floor').value, department: document.getElementById('tk-dept').value,
            line: document.getElementById('tk-line').value, brokenItem: document.getElementById('tk-item').value, subject: document.getElementById('tk-subject').value,
            description: document.getElementById('tk-desc').value, imageUrl: uploadedImageUrl, status: 'New', assignedTo: null, createdAt: new Date()
        });
        await addDoc(collection(db, "incidents", docRef.id, "comments"), { senderEmail: "system", text: "Ticket created successfully.", createdAt: new Date() });
        document.getElementById('create-ticket-form').reset(); window.clearCreateImage();
        Toast.fire({ icon: 'success', title: currentLang === 'th' ? 'สร้างตั๋วสำเร็จ!' : 'Ticket Created!' }); window.switchTab('incidents');
    } catch (error) { Swal.fire({ icon: 'error', text: error.message }); } 
    finally { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> <span data-i18n="btn_submit">Submit Request</span>'; }
};

window.openModal = (id) => {
    currentTicketId = id; const t = window.globalTickets[id];
    document.getElementById('modal-id').innerText = "TKT-" + id.substring(0, 4).toUpperCase();
    document.getElementById('modal-subject').innerText = t.subject || 'No Subject'; document.getElementById('modal-category').innerText = t.category || '-'; document.getElementById('modal-priority').innerText = t.priority || '-';
    document.getElementById('modal-location').innerText = `Bldg: ${t.building || '-'}, Floor: ${t.floor || '-'}, Dept: ${t.department || '-'}, Line: ${t.line || '-'}`;
    document.getElementById('modal-broken-item').innerText = t.brokenItem || 'Not specified'; document.getElementById('modal-desc').innerText = t.description || '-';
    const imgContainer = document.getElementById('modal-image-container'), imgTag = document.getElementById('modal-image');
    if(t.imageUrl) { imgTag.src = t.imageUrl; imgContainer.classList.remove('hidden'); } else { imgContainer.classList.add('hidden'); }
    document.getElementById('modal-caller').innerText = t.callerEmail || '-'; document.getElementById('modal-assignee').innerText = t.assignedTo || 'Unassigned';
    document.getElementById('modal-date').innerText = t.createdAt ? t.createdAt.toDate().toLocaleString() : '';
    
    const safeStatus = t.status || 'New'; const bgColors = { 'New': 'bg-blue-100 text-blue-700', 'In Progress': 'bg-amber-100 text-amber-700', 'Resolved': 'bg-emerald-100 text-emerald-700' };
    let statusKey = 'status_' + safeStatus.toLowerCase().replace(' ', '_'); let displayStatus = dict[currentLang][statusKey] || safeStatus;
    let badgeBgClass = bgColors[safeStatus] || bgColors['New']; let dotBgClass = safeStatus === 'New' ? 'bg-blue-500' : (safeStatus === 'In Progress' ? 'bg-amber-500' : 'bg-emerald-500');
    document.getElementById('modal-status-badge').innerHTML = `<span class="${badgeBgClass} px-4 py-1.5 rounded-lg text-xs uppercase font-black tracking-widest flex items-center gap-2"><span class="w-2 h-2 rounded-full ${dotBgClass}"></span><span data-i18n="${statusKey}">${displayStatus}</span></span>`;

    const modal = document.getElementById('ticket-modal'), box = document.getElementById('modal-box');
    modal.classList.remove('hidden'); setTimeout(() => { modal.style.opacity = '1'; box.classList.remove('scale-95'); box.classList.add('scale-100'); }, 10);

    const q = query(collection(db, "incidents", id, "comments"), orderBy("createdAt", "asc"));
    chatUnsubscribe = onSnapshot(q, (snapshot) => {
        let html = "";
        snapshot.forEach(doc => {
            const d = doc.data(), timeStr = d.createdAt ? d.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
            if(d.senderEmail === 'system') { html += `<div class="system-msg-container flex justify-center my-4"><span class="system-msg-pill shadow-sm"><i class="fas fa-cog mr-1 opacity-50"></i> ${d.text}</span></div>`; } 
            else {
                const isMe = d.senderEmail === auth.currentUser.email, align = isMe ? 'items-end' : 'items-start', style = isMe ? 'chat-bubble-me' : 'chat-bubble-other', senderName = isMe ? (currentLang === 'th'?'คุณ':'You') : d.senderEmail.split('@')[0];
                let chatImgHtml = d.imageUrl ? `<img src="${d.imageUrl}" class="mt-2 rounded-lg max-h-40 cursor-pointer border border-white/20" onclick="window.viewFullImage('${d.imageUrl}')">` : '';
                html += `<div class="flex flex-col ${align}"><div class="${style} chat-bubble"><div class="chat-sender-name">${senderName} • ${timeStr}</div>${d.text}${chatImgHtml}</div></div>`;
            }
        });
        document.getElementById('chat-messages').innerHTML = html; document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
    });
};

window.closeModal = () => {
    const modal = document.getElementById('ticket-modal'), box = document.getElementById('modal-box');
    modal.style.opacity = '0'; box.classList.remove('scale-100'); box.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300); if(chatUnsubscribe) chatUnsubscribe();
};

document.getElementById('comment-form').onsubmit = async (e) => {
    e.preventDefault(); const textInput = document.getElementById('comment-text'), imgInput = document.getElementById('comment-image'), text = textInput.value.trim();
    if(!text && imgInput.files.length === 0) return; 
    const btnSubmit = document.getElementById('btn-comment-submit'); btnSubmit.disabled = true; btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i>';
    try {
        let uploadedImageUrl = null; if (imgInput.files.length > 0) uploadedImageUrl = await resizeAndConvertToBase64(imgInput.files[0], 800, 800);
        await addDoc(collection(db, "incidents", currentTicketId, "comments"), { senderEmail: auth.currentUser.email, text: text, imageUrl: uploadedImageUrl, createdAt: new Date() });
        document.getElementById('comment-form').reset(); document.getElementById('comment-img-label').classList.replace('text-blue-500', 'text-slate-500');
    } catch (error) { Swal.fire({ icon: 'error', text: error.message }); } finally { btnSubmit.disabled = false; btnSubmit.innerHTML = '<i class="fas fa-paper-plane text-xs -ml-0.5"></i>'; }
};

document.getElementById('auth-form').onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value, pass = document.getElementById('auth-password').value;
    const action = isLoginMode ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
    action(auth, email, pass).catch(error => Swal.fire({ icon: 'error', text: error.message }));
};

window.loginWithGoogle = () => { signInWithPopup(auth, googleProvider).catch(error => Swal.fire({ icon: 'error', text: error.message })); };

// ==========================================
// 4. การตรวจสอบสิทธิ์ และเปลี่ยนหน้า
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        const safeEmail = user.email ? user.email.toLowerCase().trim() : "";
        const isAdmin = safeEmail === "nattezava1996@gmail.com" || safeEmail.includes("admin");

        if (isAdmin) {
            window.location.href = 'admin.html'; // 🚀 เด้งไปหน้าแอดมิน
            return; 
        }

        document.getElementById('auth-view').classList.remove('active');
        document.getElementById('app-view').classList.add('active');
        document.getElementById('user-email').innerText = user.email;
        
        const roleElement = document.getElementById('user-role');
        if(roleElement) {
            roleElement.setAttribute('data-i18n', 'role_user');
            roleElement.classList.add('text-blue-400'); 
        }
        
        loadDashboardData();
    } else {
        document.getElementById('app-view').classList.remove('active');
        document.getElementById('auth-view').classList.add('active');
    }
    window.toggleLang(currentLang); 
});
