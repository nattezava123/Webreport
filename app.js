import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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

window.globalTickets = {};
let currentTicketId = null;
let chatUnsubscribe = null;
let isLoginMode = true;
let currentLang = localStorage.getItem('appLang') || 'en';

const dict = {
    en: { page_title: "Factory IT Service Center", app_name: "Factory IT Service Center", title_register: "Create an Account", sub_register: "Fill in your details to get started.", app_name_short: "Factory IT", auth_sub: "Enterprise Service Desk", name: "Full Name", email: "Email", password: "Password", confirm_password: "Confirm Password", btn_signin: "Sign In", no_account: "New here?", btn_register: "Create an account", auth_or: "OR", btn_google: "Continue with Google", role_user: "User", menu_group_1: "Workspace", menu_dash: "Dashboard", menu_incidents: "My Tickets", menu_create: "Create Ticket", btn_logout: "Log Out", stat_open: "New Tickets", stat_progress: "In Progress", stat_resolved: "Resolved", stat_total: "Total Volume", th_subject: "Subject", th_status: "Status", th_date: "Timeline", btn_submit: "Submit Request", search_placeholder: "Search...", btn_new_ticket: "Create", form_title: "How can we help?", form_sub: "Support request details.", form_cat: "Category", form_pri: "Priority", form_short: "Subject", form_desc: "Description", form_loc_head: "Location", form_bldg: "Bldg", form_floor: "Floor", form_dept: "Dept", form_line: "Line", form_item: "Item", modal_loc: "Loc & Item", dash_welcome: "Welcome,", dash_sub: "IT support summary.", dash_recent: "Activity", btn_view_all: "All", dash_status: "Status", dash_status_sub: "Running smoothly.", sys_net: "Network", sys_erp: "ERP", cat_hw: "❖ Hardware / PC Issue", cat_sw: "❖ Software / Application", cat_nw: "❖ Network / Internet", filter_all: "All", filter_active: "Active", filter_resolved: "Resolved", status_new: "New", status_in_progress: "In Progress", status_resolved: "Resolved", empty_tickets: "None", empty_recent: "Clear!" },
    th: { page_title: "ศูนย์บริการไอทีโรงงาน", app_name: "ศูนย์บริการไอทีโรงงาน", title_register: "สร้างบัญชีใหม่", sub_register: "กรอกข้อมูลด้านล่างเพื่อสมัครสมาชิก", app_name_short: "ศูนย์บริการไอที", auth_sub: "ระบบแจ้งซ่อมไอที", name: "ชื่อ-นามสกุล", email: "อีเมล", password: "รหัสผ่าน", confirm_password: "ยืนยันรหัสผ่าน", btn_signin: "เข้าสู่ระบบ", no_account: "ยังไม่มีบัญชี?", btn_register: "สมัครสมาชิก", auth_or: "หรือ", btn_google: "ด้วย Google", role_user: "ผู้แจ้ง", menu_group_1: "พื้นที่ทำงาน", menu_dash: "ภาพรวมระบบ", menu_incidents: "ตั๋วของฉัน", menu_create: "แจ้งปัญหาใหม่", btn_logout: "ออกจากระบบ", stat_open: "รอดำเนินการ", stat_progress: "กำลังแก้ไข", stat_resolved: "ปิดงานแล้ว", stat_total: "ทั้งหมด", th_subject: "หัวข้อ", th_status: "สถานะ", th_date: "ล่าสุด", btn_submit: "ส่งเรื่องแจ้งซ่อม", search_placeholder: "ค้นหา...", btn_new_ticket: "สร้างใหม่", form_title: "มีอะไรให้ช่วยไหม?", form_sub: "ระบุรายละเอียดเพื่อแจ้งซ่อม", form_cat: "หมวดหมู่", form_pri: "ความเร่งด่วน", form_short: "หัวข้อ", form_desc: "รายละเอียด", form_loc_head: "สถานที่", form_bldg: "ตึก", form_floor: "ชั้น", form_dept: "แผนก", form_line: "ไลน์", form_item: "ของที่เสีย", modal_loc: "สถานที่และของ", dash_welcome: "ยินดีต้อนรับ,", dash_sub: "สรุปภาพรวมวันนี้", dash_recent: "อัปเดตล่าสุด", btn_view_all: "ดูทั้งหมด", dash_status: "สถานะระบบ", dash_status_sub: "ทำงานปกติ", sys_net: "เครือข่าย", sys_erp: "ระบบ ERP", cat_hw: "❖ ฮาร์ดแวร์ / เครื่องคอมพิวเตอร์", cat_sw: "❖ ซอฟต์แวร์ / โปรแกรม", cat_nw: "❖ เครือข่าย / อินเทอร์เน็ต", filter_all: "ทั้งหมด", filter_active: "กำลังดำเนินการ", filter_resolved: "ปิดงานแล้ว", status_new: "เปิดใหม่", status_in_progress: "กำลังทำ", status_resolved: "ปิดงานแล้ว", empty_tickets: "ไม่พบข้อมูล", empty_recent: "จัดการครบแล้ว!" }
};

window.viewFullImage = (url) => { Swal.fire({ imageUrl: url, imageAlt: 'Attached Image', width: 'auto', padding: '1rem', showConfirmButton: false, showCloseButton: true, customClass: { image: 'rounded-xl max-h-[80vh] object-contain' } }); };
window.previewCreateImage = (input) => { if (input.files && input.files[0]) { const reader = new FileReader(); reader.onload = (e) => { document.getElementById('create-image-preview').src = e.target.result; document.getElementById('create-image-preview-container').classList.remove('hidden'); }; reader.readAsDataURL(input.files[0]); } };
window.clearCreateImage = () => { document.getElementById('tk-image').value = ''; document.getElementById('create-image-preview').src = ''; document.getElementById('create-image-preview-container').classList.add('hidden'); };

async function resizeAndConvertToBase64(file, maxWidth, maxHeight) {
    return new Promise((resolve) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image(); img.src = event.target.result;
            img.onload = () => {
                let width = img.width, height = img.height;
                if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
                const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
}

function timeAgo(date) {
    if(!date) return '-'; const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return Math.floor(seconds/60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds/3600) + "h ago";
    return Math.floor(seconds/86400) + "d ago";
}

window.toggleMobileMenu = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); };

window.toggleLang = (lang) => {
    currentLang = lang; localStorage.setItem('appLang', lang);
    const titleTag = document.getElementById('page-title-tag'); if(titleTag) titleTag.innerText = dict[lang].page_title;
    document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n'); if(dict[lang][k]) el.innerText = dict[lang][k]; });
    
    const optHw = document.getElementById('opt-hw'), optSw = document.getElementById('opt-sw'), optNw = document.getElementById('opt-nw');
    if(optHw) optHw.innerText = dict[lang].cat_hw; if(optSw) optSw.innerText = dict[lang].cat_sw; if(optNw) optNw.innerText = dict[lang].cat_nw;

    window.updatePriorityDesc(); 
    ['auth', 'app'].forEach(v => {
        const en = document.getElementById(`lang-en-${v}`), th = document.getElementById(`lang-th-${v}`);
        if(en && th) { en.className = (lang==='en' && v==='app') ? "px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold shadow-sm" : (lang==='en'?"px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold shadow-lg":"px-4 py-1.5 text-slate-500 rounded-full text-xs font-bold"); th.className = (lang==='th' && v==='app') ? "px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold shadow-sm" : (lang==='th'?"px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold shadow-lg":"px-4 py-1.5 text-slate-500 rounded-full text-xs font-bold"); }
    });
};

window.updatePriorityDesc = () => {
    const s = document.getElementById('tk-priority'); if(!s) return; const val = s.value;
    const thTexts = { "4 - Low": "● กระทบรายบุคคล - SLA: แก้ไขภายใน 3 วัน", "3 - Moderate": "● กระทบระดับแผนก - SLA: แก้ไขภายใน 24 ชม.", "2 - High": "● กระทบวงกว้าง - SLA: แก้ไขภายใน 4 ชม.", "1 - Critical": "● ระบบหลักล่ม - SLA: แก้ไขภายใน 1 ชม." };
    const enTexts = { "4 - Low": "● Individual impact - SLA: 3 Days", "3 - Moderate": "● Department impact - SLA: 24 Hours", "2 - High": "● Business degraded - SLA: 4 Hours", "1 - Critical": "● Total failure - SLA: 1 Hour" };
    const descColors = { "4 - Low": "bg-emerald-50/50 border-emerald-100 text-emerald-800", "3 - Moderate": "bg-amber-50/50 border-amber-100 text-amber-800", "2 - High": "bg-orange-50/50 border-orange-100 text-orange-800", "1 - Critical": "bg-rose-50/50 border-rose-100 text-rose-800" };
    const iconColors = { "4 - Low": "text-emerald-500", "3 - Moderate": "text-amber-500", "2 - High": "text-orange-500", "1 - Critical": "text-rose-500" };

    const priorityText = document.getElementById('priority-text');
    if(priorityText) priorityText.innerText = currentLang === 'th' ? thTexts[val] : enTexts[val];
    const priorityDesc = document.getElementById('priority-desc');
    if(priorityDesc) priorityDesc.className = `p-4 rounded-xl border text-xs flex gap-3 items-start transition-colors ${descColors[val]}`;
    const priorityIcon = document.getElementById('priority-icon');
    if(priorityIcon) priorityIcon.className = `fas fa-info-circle mt-0.5 ${iconColors[val]}`;
};

window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-link').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`tab-${tabName}`); if(target) target.classList.add('active');
    document.querySelector(`.menu-link[onclick*="'${tabName}'"]`)?.classList.add('active');
    if(window.innerWidth <= 768 && document.getElementById('sidebar').classList.contains('open')) window.toggleMobileMenu();
};

// 🔥 อัปเดต UX/UI การสลับโหมด Login / Register อย่างมืออาชีพ
window.toggleAuthMode = () => { 
    isLoginMode = !isLoginMode; 
    const titleEl = document.getElementById('auth-title');
    const subEl = document.getElementById('auth-subtitle');
    const nameField = document.getElementById('field-name');
    const confirmField = document.getElementById('field-confirm');
    
    if (isLoginMode) {
        titleEl.innerText = dict[currentLang].app_name; titleEl.setAttribute('data-i18n', 'app_name');
        subEl.innerText = dict[currentLang].auth_sub; subEl.setAttribute('data-i18n', 'auth_sub');
        nameField.style.display = 'none'; confirmField.style.display = 'none';
        document.getElementById('auth-name').required = false; document.getElementById('auth-confirm-password').required = false;
    } else {
        titleEl.innerText = dict[currentLang].title_register; titleEl.setAttribute('data-i18n', 'title_register');
        subEl.innerText = dict[currentLang].sub_register; subEl.setAttribute('data-i18n', 'sub_register');
        nameField.style.display = 'block'; confirmField.style.display = 'block';
        document.getElementById('auth-name').required = true; document.getElementById('auth-confirm-password').required = true;
    }

    document.getElementById('auth-submit-btn').innerText = isLoginMode ? dict[currentLang].btn_signin : dict[currentLang].btn_register; 
    document.getElementById('auth-switch-text').innerText = isLoginMode ? dict[currentLang].no_account : (currentLang === 'th' ? "มีบัญชีอยู่แล้ว?" : "Already have an account?");
    document.getElementById('auth-switch-btn').innerText = isLoginMode ? dict[currentLang].btn_register : dict[currentLang].btn_signin; 
};

// ==========================================
// 🤖 AI Assistant
// ==========================================
window.openAIModal = () => { document.getElementById('ai-modal').classList.replace('hidden', 'flex'); setTimeout(() => { document.getElementById('ai-modal').style.opacity = '1'; document.getElementById('ai-box').classList.replace('scale-95', 'scale-100'); }, 10); };
window.closeAIModal = () => { document.getElementById('ai-modal').style.opacity = '0'; document.getElementById('ai-box').classList.replace('scale-100', 'scale-95'); setTimeout(() => document.getElementById('ai-modal').classList.replace('flex', 'hidden'), 300); };
window.sendQuickReply = (text) => { document.getElementById('ai-input').value = text; window.sendAIMessage(); };

const botDatabase = [
    { keywords: ["ดี", "สวัสดี", "hello", "hi"], answer: "สวัสดีครับ! ผมคือ **Serviceman** 🤖 วันนี้มีปัญหาไอทีตรงไหนให้ผมช่วยตรวจสอบไหมครับ พิมพ์อาการมาได้เลย" },
    { keywords: ["ลืมรหัส", "เปลี่ยนรหัส", "password"], answer: "ปัญหาเข้าสู่ระบบ/ลืมรหัสผ่าน 🔑 รบกวนกด **Create Ticket** แล้วระบุ Username เพื่อให้แอดมินรีเซ็ตรหัสผ่านให้นะครับ" },
    { keywords: ["เน็ต", "internet", "wifi"], answer: "ปัญหาเน็ต/Wi-Fi 📡 ลองกดปิด-เปิด Wi-Fi ดูก่อนครับ หากไม่หาย รบกวนเปิดตั๋วแจ้งซ่อมเลยครับ" },
    { keywords: ["เปิดไม่ติด", "ดับ"], answer: "คอมเปิดไม่ติด 🔌 รบกวนเช็คปลั๊กไฟใต้โต๊ะดูครับ หากไฟเข้าแต่เครื่องเงียบ รบกวนเปิดตั๋วแจ้งซ่อมด่วนเลยครับ!" }
];

window.sendAIMessage = async () => {
    const input = document.getElementById('ai-input'); const rawText = input.value.trim(); if (!rawText) return;
    const consoleBox = document.getElementById('ai-chat-box');
    consoleBox.insertAdjacentHTML('beforeend', `<div class="flex items-start gap-4 mb-6 flex-row-reverse chat-user-bubble"><div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0"><i class="fas fa-user text-[10px]"></i></div><div class="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-md text-sm leading-relaxed max-w-[85%]">${rawText}</div></div>`);
    input.value = ''; consoleBox.scrollTop = consoleBox.scrollHeight;
    const thinkingId = 'think-' + Date.now();
    consoleBox.insertAdjacentHTML('beforeend', `<div id="${thinkingId}" class="flex items-start gap-4 mb-6 chat-ai-bubble"><div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0"><i class="fas fa-robot text-[10px]"></i></div><div class="bg-white border p-4 rounded-2xl text-sm text-slate-400">กำลังค้นหา...</div></div>`);
    setTimeout(() => {
        document.getElementById(thinkingId)?.remove();
        let botReply = ""; for (let entry of botDatabase) { if (entry.keywords.some(k => rawText.toLowerCase().includes(k))) { botReply = entry.answer; break; } }
        if (botReply === "") botReply = `ขออภัยครับ แนะนำให้กดเมนู **Create Ticket** เพื่อแจ้งเรื่องครับ<br><br>หรือเลือกด้านล่าง 👇<br><div class="flex flex-wrap gap-2 mt-2"><button onclick="window.sendQuickReply('คอมเปิดไม่ติด')" class="px-3 py-1.5 bg-indigo-50 text-indigo-600 border rounded-full text-xs font-bold">💻 คอมเสีย</button><button onclick="window.sendQuickReply('เน็ตหลุด')" class="px-3 py-1.5 bg-indigo-50 text-indigo-600 border rounded-full text-xs font-bold">📡 เน็ตหลุด</button></div>`;
        botReply = botReply.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-600">$1</strong>').replace(/\n/g, '<br>');
        consoleBox.insertAdjacentHTML('beforeend', `<div class="flex items-start gap-4 mb-6 chat-ai-bubble"><div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-md"><i class="fas fa-robot text-[10px]"></i></div><div class="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-sm text-slate-700 leading-relaxed max-w-[85%]">${botReply}</div></div>`);
        consoleBox.scrollTop = consoleBox.scrollHeight;
    }, 800); 
};

// ==========================================

function loadDashboardData() {
    onSnapshot(query(collection(db, "incidents"), orderBy("createdAt", "desc")), (snapshot) => {
        let userHtml = "", recentHtml = "", counts = { New: 0, "In Progress": 0, Resolved: 0, Total: 0 }, recentCount=0;
        snapshot.forEach((docSnap) => {
            const t = docSnap.data(), id = docSnap.id; window.globalTickets[id] = t;
            if (t.callerEmail !== auth.currentUser.email) return;
            counts[t.status]++; counts.Total++;
            userHtml += `<tr class="border-b cursor-pointer hover:bg-slate-50 transition" onclick="window.openModal('${id}')"><td class="p-4 font-bold text-xs text-slate-500">${id.substring(0,4).toUpperCase()}</td><td class="p-4 font-bold text-sm text-slate-800">${t.subject}</td><td class="p-4 text-xs">${t.status}</td><td class="p-4 text-right text-xs text-slate-500">${timeAgo(t.createdAt?.toDate())}</td></tr>`;
            if(recentCount<5){ recentHtml+=`<div class="p-4 bg-white border rounded-xl mb-2 text-sm cursor-pointer hover:bg-slate-50 transition" onclick="window.openModal('${id}')"><b>${t.subject}</b> - ${t.status}</div>`; recentCount++;}
        });
        document.getElementById('user-ticket-list').innerHTML = userHtml || '<tr><td colspan="4" class="p-8 text-center text-slate-400">No tickets found</td></tr>';
        document.getElementById('stat-new').innerText = counts.New || 0; document.getElementById('stat-progress').innerText = counts["In Progress"] || 0;
        document.getElementById('stat-resolved').innerText = counts.Resolved || 0; document.getElementById('stat-total').innerText = counts.Total || 0;
        document.getElementById('dash-recent-list').innerHTML = recentHtml || '<p class="text-center text-slate-400 text-xs py-10">Clear!</p>';
        const u = auth.currentUser.displayName || auth.currentUser.email.split('@')[0]; document.getElementById('dash-user-name').innerText = u.charAt(0).toUpperCase() + u.slice(1);
    });
}

document.getElementById('create-ticket-form').onsubmit = async (e) => {
    e.preventDefault(); const b = document.getElementById('btn-create-submit'); b.disabled = true;
    try {
        let img = null; if(document.getElementById('tk-image').files[0]) img = await resizeAndConvertToBase64(document.getElementById('tk-image').files[0], 800, 800);
        const docRef = await addDoc(collection(db, "incidents"), { callerEmail: auth.currentUser.email, category: document.getElementById('tk-category').value, priority: document.getElementById('tk-priority').value, building: document.getElementById('tk-building').value, floor: document.getElementById('tk-floor').value, department: document.getElementById('tk-dept').value, line: document.getElementById('tk-line').value, brokenItem: document.getElementById('tk-item').value, subject: document.getElementById('tk-subject').value, description: document.getElementById('tk-desc').value, imageUrl: img, status: 'New', createdAt: new Date() });
        await addDoc(collection(db, "incidents", docRef.id, "comments"), { senderEmail: "system", text: "Ticket created.", createdAt: new Date() });
        document.getElementById('create-ticket-form').reset(); window.clearCreateImage(); window.updatePriorityDesc(); Toast.fire({ icon: 'success', title: 'Success!' }); window.switchTab('incidents');
    } catch (e) { Swal.fire({ icon: 'error', text: e.message }); } finally { b.disabled = false; }
};

window.openModal = (id) => {
    currentTicketId = id; const t = window.globalTickets[id];
    document.getElementById('modal-id').innerText = "TKT-" + id.substring(0,4).toUpperCase(); document.getElementById('modal-subject').innerText = t.subject;
    document.getElementById('modal-location').innerText = `Bldg: ${t.building}, Floor: ${t.floor}, Dept: ${t.department}`;
    document.getElementById('modal-broken-item').innerText = t.brokenItem; document.getElementById('modal-desc').innerText = t.description;
    document.getElementById('modal-caller').innerText = t.callerEmail; document.getElementById('modal-date').innerText = t.createdAt?.toDate().toLocaleString();
    if(t.imageUrl) { document.getElementById('modal-image').src = t.imageUrl; document.getElementById('modal-image-container').classList.remove('hidden'); } else { document.getElementById('modal-image-container').classList.add('hidden'); }
    document.getElementById('ticket-modal').classList.replace('hidden', 'flex'); setTimeout(() => { document.getElementById('ticket-modal').style.opacity = '1'; document.getElementById('modal-box').classList.replace('scale-95', 'scale-100'); }, 10);
    if(chatUnsubscribe) chatUnsubscribe();
    chatUnsubscribe = onSnapshot(query(collection(db, "incidents", id, "comments"), orderBy("createdAt", "asc")), (snap) => {
        let h = ""; snap.forEach(doc => { 
            const d = doc.data(); const isMe = d.senderEmail === auth.currentUser.email;
            if(d.senderEmail === 'system') h += `<div class="flex justify-center my-4"><span class="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold">${d.text}</span></div>`; 
            else { let cImg = d.imageUrl ? `<img src="${d.imageUrl}" class="mt-2 rounded-lg max-h-40 cursor-pointer" onclick="window.viewFullImage('${d.imageUrl}')">` : ''; h += `<div class="flex flex-col ${isMe?'items-end':'items-start'} mb-4"><div class="${isMe?'bg-blue-600 text-white':'bg-white border'} p-3 rounded-xl max-w-[85%] shadow-sm text-sm">${d.text}${cImg}</div></div>`; }
        });
        document.getElementById('chat-messages').innerHTML = h; document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
    });
};

window.closeModal = () => { document.getElementById('ticket-modal').style.opacity = '0'; document.getElementById('modal-box').classList.replace('scale-100', 'scale-95'); setTimeout(() => { document.getElementById('ticket-modal').classList.replace('flex', 'hidden'); if(chatUnsubscribe) chatUnsubscribe(); }, 300); };

document.getElementById('comment-text').addEventListener('paste', function(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let i of items) { if (i.kind === 'file' && i.type.includes('image')) { const dt = new DataTransfer(); dt.items.add(i.getAsFile()); document.getElementById('comment-image').files = dt.files; document.getElementById('comment-img-label').classList.replace('text-slate-500', 'text-blue-500'); Toast.fire({ icon: 'success', title: 'Image attached' }); e.preventDefault(); } }
});

document.getElementById('comment-form').onsubmit = async (e) => {
    e.preventDefault(); const txt = document.getElementById('comment-text'), imgIn = document.getElementById('comment-image'), btn = document.getElementById('btn-comment-submit');
    if(!txt.value.trim() && imgIn.files.length === 0) return; btn.disabled = true;
    try { let uImg = null; if (imgIn.files.length > 0) uImg = await resizeAndConvertToBase64(imgIn.files[0], 800, 800);
        await addDoc(collection(db, "incidents", currentTicketId, "comments"), { senderEmail: auth.currentUser.email, text: txt.value, imageUrl: uImg, createdAt: new Date() });
        document.getElementById('comment-form').reset(); document.getElementById('comment-img-label').classList.replace('text-blue-500', 'text-slate-500');
    } catch (e) { Swal.fire({ icon: 'error', text: e.message }); } finally { btn.disabled = false; }
};

// 🔥 ระบบ Login / Register ใหม่ (รวมอัปเดตชื่อผู้ใช้)
document.getElementById('auth-form').onsubmit = async (e) => {
    e.preventDefault(); 
    const em = document.getElementById('auth-email').value;
    const ps = document.getElementById('auth-password').value;
    const btn = document.getElementById('auth-submit-btn');
    const originalText = btn.innerText;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, em, ps);
        } else {
            const name = document.getElementById('auth-name').value;
            const confirmPs = document.getElementById('auth-confirm-password').value;
            if (ps !== confirmPs) throw new Error(currentLang === 'th' ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match");
            if (ps.length < 6) throw new Error(currentLang === 'th' ? "รหัสผ่านต้องมี 6 ตัวอักษรขึ้นไป" : "Password must be at least 6 characters");
            const userCredential = await createUserWithEmailAndPassword(auth, em, ps);
            await updateProfile(userCredential.user, { displayName: name });
        }
    } catch (error) { 
        Swal.fire({ icon: 'error', text: error.message, confirmButtonColor: '#3b82f6' }); 
    } finally { 
        btn.disabled = false; btn.innerText = originalText; 
    }
};

window.loginWithGoogle = () => signInWithPopup(auth, googleProvider).catch(e => Swal.fire({ icon: 'error', text: e.message }));

// 🔥 ปุ่ม Log Out
document.getElementById('btn-logout').onclick = () => {
    Swal.fire({ title: currentLang === 'th' ? 'ออกจากระบบ?' : 'Sign Out?', icon: 'question', showCancelButton: true, confirmButtonColor: '#e11d48' })
    .then((result) => { if (result.isConfirmed) signOut(auth).then(() => window.location.reload()); });
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        const em = user.email.toLowerCase(); const isAdmin = em === "nattezava1996@gmail.com" || em.includes("admin");
        if (isAdmin) { window.location.href = 'admin.html'; return; }
        document.getElementById('auth-view').classList.remove('active'); document.getElementById('app-view').classList.add('active');
        document.getElementById('user-email').innerText = user.email; loadDashboardData();
    } else { document.getElementById('app-view').classList.remove('active'); document.getElementById('auth-view').classList.add('active'); }
    window.toggleLang(currentLang);
});
