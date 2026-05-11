import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });

window.globalTickets = {};
let currentTicketId = null;
let currentAdminFilter = 'All';
let chatUnsubscribe = null;
let currentLang = localStorage.getItem('appLang') || 'en';

const dict = {
    en: { app_name: "Factory IT Service Center", title_register: "Create an Account", sub_register: "Fill in your details to get started.", name: "Full Name", email: "Email", password: "Password", confirm_password: "Confirm Password", btn_signin: "Sign In", no_account: "New here?", btn_register: "Create an account", auth_or: "OR", btn_google: "Continue with Google", menu_group_1: "Workspace", menu_group_2: "Admin", menu_dash: "Dashboard", menu_incidents: "My Tickets", menu_create: "Create Ticket", menu_admin: "Command Center", btn_logout: "Log Out", stat_open: "New Tickets", stat_progress: "In Progress", stat_resolved: "Resolved", stat_total: "Total Volume", admin_my_resolved: "My Resolved Tickets", btn_export: "Export CSV", dash_welcome: "Welcome,", dash_recent: "Recent Activity", dash_status: "System Status", sys_net: "Network", sys_erp: "ERP System", filter_all: "All", filter_active: "Active", filter_resolved: "Resolved", empty_recent: "All caught up!", empty_tickets: "No tickets found", form_title: "How can we help?", cat_hw: "❖ Hardware / PC Issue", cat_sw: "❖ Software / Application", cat_nw: "❖ Network / Internet" },
    th: { app_name: "ศูนย์บริการไอทีโรงงาน", title_register: "สร้างบัญชีใหม่", sub_register: "กรอกข้อมูลด้านล่างเพื่อสมัครสมาชิก", name: "ชื่อ-นามสกุล", email: "อีเมล", password: "รหัสผ่าน", confirm_password: "ยืนยันรหัสผ่าน", btn_signin: "เข้าสู่ระบบ", no_account: "ยังไม่มีบัญชี?", btn_register: "สมัครสมาชิก", auth_or: "หรือ", btn_google: "ด้วย Google", menu_group_1: "พื้นที่ทำงาน", menu_group_2: "ผู้ดูแลระบบ", menu_dash: "ภาพรวมระบบ", menu_incidents: "ตั๋วของฉัน", menu_create: "แจ้งปัญหาใหม่", menu_admin: "ศูนย์จัดการงาน", btn_logout: "ออกจากระบบ", stat_open: "รอดำเนินการ", stat_progress: "กำลังแก้ไข", stat_resolved: "ปิดงานแล้ว", stat_total: "จำนวนทั้งหมด", admin_my_resolved: "งานที่ฉันปิดแล้ว", btn_export: "ดาวน์โหลด CSV", dash_welcome: "ยินดีต้อนรับ,", dash_recent: "รายการอัปเดตล่าสุด", dash_status: "สถานะระบบโรงงาน", sys_net: "ระบบเครือข่าย", sys_erp: "ระบบ ERP", filter_all: "ทั้งหมด", filter_active: "กำลังดำเนินการ", filter_resolved: "ปิดงานแล้ว", empty_recent: "จัดการครบหมดแล้ว!", empty_tickets: "ไม่พบข้อมูล", form_title: "มีอะไรให้ช่วยไหม?", cat_hw: "❖ ฮาร์ดแวร์ / เครื่องคอมพิวเตอร์", cat_sw: "❖ ซอฟต์แวร์ / โปรแกรม", cat_nw: "❖ เครือข่าย / อินเทอร์เน็ต" }
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
    document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n'); if(dict[lang][k]) el.innerText = dict[lang][k]; });
    const optHw = document.getElementById('opt-hw'), optSw = document.getElementById('opt-sw'), optNw = document.getElementById('opt-nw');
    if(optHw) optHw.innerText = dict[lang].cat_hw; if(optSw) optSw.innerText = dict[lang].cat_sw; if(optNw) optNw.innerText = dict[lang].cat_nw;
    window.updatePriorityDesc(); 
    ['app'].forEach(v => {
        const en = document.getElementById(`lang-en-${v}`), th = document.getElementById(`lang-th-${v}`);
        if(en && th) { en.className = (lang==='en') ? "px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold shadow-sm" : "px-4 py-1.5 text-slate-500 rounded-full text-xs font-bold"; th.className = (lang==='th') ? "px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold shadow-sm" : "px-4 py-1.5 text-slate-500 rounded-full text-xs font-bold"; }
    });
};

window.updatePriorityDesc = () => {
    const s = document.getElementById('tk-priority'); if(!s) return; const val = s.value;
    const thTexts = { "4 - Low": "● กระทบรายบุคคล - SLA: แก้ไขภายใน 3 วัน", "3 - Moderate": "● กระทบระดับแผนก - SLA: แก้ไขภายใน 24 ชม.", "2 - High": "● กระทบวงกว้าง - SLA: แก้ไขภายใน 4 ชม.", "1 - Critical": "● ระบบหลักล่ม - SLA: แก้ไขภายใน 1 ชม." };
    const enTexts = { "4 - Low": "● Individual impact - SLA: 3 Days", "3 - Moderate": "● Department impact - SLA: 24 Hours", "2 - High": "● Business degraded - SLA: 4 Hours", "1 - Critical": "● Total failure - SLA: 1 Hour" };
    const descColors = { "4 - Low": "bg-emerald-50/50 border-emerald-100 text-emerald-800", "3 - Moderate": "bg-amber-50/50 border-amber-100 text-amber-800", "2 - High": "bg-orange-50/50 border-orange-100 text-orange-800", "1 - Critical": "bg-rose-50/50 border-rose-100 text-rose-800" };
    const pText = document.getElementById('priority-text'); if(pText) pText.innerText = currentLang === 'th' ? thTexts[val] : enTexts[val];
    const pDesc = document.getElementById('priority-desc'); if(pDesc) pDesc.className = `p-4 rounded-xl border text-xs flex gap-3 items-start transition-colors ${descColors[val]}`;
};

window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-link').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`tab-${tabName}`); if(target) target.classList.add('active');
    document.querySelector(`.menu-link[onclick*="'${tabName}'"]`)?.classList.add('active');
    document.getElementById('page-title').innerText = dict[currentLang][`menu_${tabName}`] || dict[currentLang].app_name;
    if(window.innerWidth <= 768 && document.getElementById('sidebar').classList.contains('open')) window.toggleMobileMenu();
};

// ==========================================
// 🤖 AI Assistant (แก้ไขให้ฉลาดและตอบตรงคำถามแล้ว)
// ==========================================
window.openAIModal = () => { document.getElementById('ai-modal').classList.replace('hidden', 'flex'); setTimeout(() => { document.getElementById('ai-modal').style.opacity = '1'; document.getElementById('ai-box').classList.replace('scale-95', 'scale-100'); }, 10); };
window.closeAIModal = () => { document.getElementById('ai-modal').style.opacity = '0'; document.getElementById('ai-box').classList.replace('scale-100', 'scale-95'); setTimeout(() => document.getElementById('ai-modal').classList.replace('flex', 'hidden'), 300); };
window.sendQuickReply = (text) => { document.getElementById('ai-input').value = text; window.sendAIMessage(); };

const botDatabase = [
    { keywords: ["ดี", "ทัก", "เทส", "test", "สวัสดี", "hello", "hi"], answer: "สวัสดีครับ! ผมคือ **Serviceman** 🤖 วันนี้มีปัญหาไอทีตรงไหนให้ผมช่วยตรวจสอบไหมครับ พิมพ์อาการมาได้เลย" },
    { keywords: ["ขอบคุณ", "thank", "thx", "เยี่ยม", "ok", "โอเค"], answer: "ยินดีให้บริการเสมอครับ! 🎉 ถ้ามีปัญหาอื่นๆ เปิดตั๋วแจ้งซ่อมมาได้ตลอดเลยนะครับ" },
    { keywords: ["ลืมรหัส", "เปลี่ยนรหัส", "password", "เข้าไม่ได้"], answer: "ปัญหาเข้าสู่ระบบ/ลืมรหัสผ่าน 🔑 รบกวนกด **Create Ticket** แล้วระบุ Username เพื่อให้แอดมินรีเซ็ตรหัสผ่านให้นะครับ" },
    { keywords: ["เน็ต", "internet", "wifi", "ไวไฟ", "เน็ตหลุด", "ต่อเน็ตไม่ได้"], answer: "ปัญหาอินเทอร์เน็ต/Wi-Fi 📡 ลองปิด-เปิด Wi-Fi ดูสักรอบนะครับ หากไม่หาย รบกวนเปิดตั๋วแจ้งซ่อมเลยครับช่างจะได้เข้าไปดูให้" },
    { keywords: ["เปิดไม่ติด", "ดับ", "ไฟไม่เข้า"], answer: "คอมเปิดไม่ติด 🔌 รบกวนเช็คปลั๊กไฟใต้โต๊ะดูครับ หากไฟเข้าแต่เครื่องเงียบ รบกวนเปิดตั๋วแจ้งซ่อมด่วนเลยครับ!" },
    { keywords: ["จอฟ้า", "blue screen", "ค้าง", "แฮงค์"], answer: "คอมจอฟ้า/ค้าง 💻 รบกวน **ถ่ายรูปหน้าจอ Error (รูปจอฟ้า)** แนบรูปตอนเปิดตั๋วแจ้งซ่อมด้วยนะครับ ทีมไอทีจะได้วิเคราะห์ถูกจุด" },
    { keywords: ["ปริ้น", "printer", "เครื่องปริ้น", "print", "ไม่ออก"], answer: "ปัญหาเครื่องพิมพ์ (Printer) 🖨️ ลองรีสตาร์ทคอม 1 รอบดูก่อนครับ ถ้ายังพิมพ์ไม่ได้ เปิดตั๋วแจ้งซ่อมแล้วระบุชื่อเครื่องพิมพ์มาได้เลย" },
    { keywords: ["สร้างตั๋ว", "เปิดตั๋ว", "แจ้งซ่อมยังไง", "วิธีแจ้งซ่อม"], answer: "การแจ้งปัญหา 📝 ให้กดที่เมนู **Create Ticket** ทางซ้ายมือ เลือกหมวดหมู่, ระบุสถานที่ และเขียนรายละเอียดอาการให้ครบถ้วน แล้วกด Submit ครับ" }
];

window.sendAIMessage = async () => {
    const input = document.getElementById('ai-input'); const rawText = input.value.trim(); if (!rawText) return;
    const consoleBox = document.getElementById('ai-chat-box');
    
    consoleBox.insertAdjacentHTML('beforeend', `<div class="flex items-start gap-4 mb-6 flex-row-reverse chat-user-bubble"><div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0"><i class="fas fa-user text-[10px]"></i></div><div class="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-md text-sm leading-relaxed max-w-[85%]">${rawText}</div></div>`);
    input.value = ''; consoleBox.scrollTop = consoleBox.scrollHeight;
    
    const thinkingId = 'think-' + Date.now();
    consoleBox.insertAdjacentHTML('beforeend', `<div id="${thinkingId}" class="flex items-start gap-4 mb-6 chat-ai-bubble"><div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0"><i class="fas fa-robot text-[10px]"></i></div><div class="bg-white border p-4 rounded-2xl text-sm text-slate-400">กำลังค้นหา...</div></div>`);
    consoleBox.scrollTop = consoleBox.scrollHeight;

    setTimeout(() => {
        document.getElementById(thinkingId)?.remove();
        let botReply = ""; 
        const cleanText = rawText.toLowerCase().replace(/\s+/g, '');

        for (let entry of botDatabase) { 
            if (entry.keywords.some(k => cleanText.includes(k) || rawText.toLowerCase().includes(k))) { 
                botReply = entry.answer; break; 
            } 
        }

        if (botReply === "") {
            botReply = `ขออภัยครับ อาการนี้อาจจะต้องให้ช่างตรวจเช็คเชิงลึก 😅 แนะนำให้กดเมนู **Create Ticket** เพื่อแจ้งเรื่องครับ<br><br>หรือเลือกด้านล่าง 👇<br><div class="flex flex-wrap gap-2 mt-2"><button onclick="window.sendQuickReply('คอมเปิดไม่ติด')" class="px-3 py-1.5 bg-indigo-50 text-indigo-600 border rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors">💻 คอมเปิดไม่ติด</button><button onclick="window.sendQuickReply('ปริ้นไม่ออก')" class="px-3 py-1.5 bg-indigo-50 text-indigo-600 border rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors">🖨️ เครื่องปริ้น</button><button onclick="window.sendQuickReply('เน็ตหลุด')" class="px-3 py-1.5 bg-indigo-50 text-indigo-600 border rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors">📡 อินเทอร์เน็ต</button></div>`;
        }

        botReply = botReply.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-600">$1</strong>').replace(/\n/g, '<br>');
        consoleBox.insertAdjacentHTML('beforeend', `<div class="flex items-start gap-4 mb-6 chat-ai-bubble"><div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-md"><i class="fas fa-robot text-[10px]"></i></div><div class="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-sm text-slate-700 leading-relaxed max-w-[85%]">${botReply}</div></div>`);
        consoleBox.scrollTop = consoleBox.scrollHeight;
    }, 800); 
};
// ==========================================

function loadDashboardData() {
    onSnapshot(query(collection(db, "incidents"), orderBy("createdAt", "desc")), (snapshot) => {
        let adminHtml = "", userHtml = "", recentDashHtml = "";
        let counts = { New: 0, "In Progress": 0, Resolved: 0, Total: 0 }, myResolved = 0, recentCount = 0;
        snapshot.forEach((docSnap) => {
            const t = docSnap.data(), id = docSnap.id, displayId = "TKT-" + id.substring(0, 4).toUpperCase();
            window.globalTickets[id] = t;
            const safeStatus = t.status || 'New';
            if(safeStatus === 'Resolved' && t.assignedTo === auth.currentUser.email) myResolved++;
            counts[safeStatus] = (counts[safeStatus] || 0) + 1; counts['Total']++;
            const bgColors = { 'New': 'bg-blue-100 text-blue-700', 'In Progress': 'bg-amber-100 text-amber-700', 'Resolved': 'bg-emerald-100 text-emerald-700' };
            let statusHtml = `<span class="${bgColors[safeStatus]||'bg-blue-100'} px-3 py-1.5 rounded-md text-[10px] uppercase font-black tracking-widest flex w-fit gap-1 items-center"><span>${safeStatus}</span></span>`;
            adminHtml += `<tr class="hover:bg-slate-50 transition group border-b border-slate-50 cursor-pointer" data-status="${safeStatus}" onclick="window.openModal('${id}')"><td class="py-4 px-4 font-bold text-slate-500 text-xs">${displayId}</td><td class="py-4 px-4"><div class="font-bold text-slate-800 text-sm">${t.subject}</div></td><td class="py-4 px-4 text-xs font-bold text-slate-600">${t.assignedTo ? t.assignedTo.split('@')[0].toUpperCase() : '-'}</td><td class="py-4 px-4">${statusHtml}</td><td class="py-4 px-4 text-right opacity-0 group-hover:opacity-100 transition whitespace-nowrap"><button onclick="event.stopPropagation(); window.updateTicket('${id}', 'Resolved')" class="w-8 h-8 bg-white border border-emerald-200 text-emerald-500 rounded-lg mr-2"><i class="fas fa-check text-xs"></i></button><button onclick="event.stopPropagation(); window.deleteTicket('${id}')" class="w-8 h-8 bg-white border border-rose-200 text-rose-500 rounded-lg"><i class="fas fa-trash text-xs"></i></button></td></tr>`;
            if (t.callerEmail === auth.currentUser.email) userHtml += `<tr class="border-b" onclick="window.openModal('${id}')"><td class="p-4 font-bold text-xs">${displayId}</td><td class="p-4 font-bold text-sm">${t.subject}</td><td class="p-4 text-xs">${safeStatus}</td><td class="p-4 text-right text-xs">${timeAgo(t.createdAt?.toDate())}</td></tr>`;
        });
        document.getElementById('admin-ticket-list').innerHTML = adminHtml || '<tr><td colspan="5" class="p-8 text-center">No data</td></tr>';
        document.getElementById('user-ticket-list').innerHTML = userHtml || '<tr><td colspan="4" class="p-8 text-center">No data</td></tr>';
        document.getElementById('stat-new').innerText = counts['New'] || 0; document.getElementById('stat-progress').innerText = counts['In Progress'] || 0; document.getElementById('stat-resolved').innerText = counts['Resolved'] || 0; document.getElementById('stat-total').innerText = counts['Total'] || 0; document.getElementById('stat-admin-my-resolved').innerText = myResolved;
    });
}

document.getElementById('create-ticket-form').onsubmit = async (e) => {
    e.preventDefault(); const b = document.getElementById('btn-create-submit'); b.disabled = true;
    try {
        let img = null; if(document.getElementById('tk-image').files[0]) img = await resizeAndConvertToBase64(document.getElementById('tk-image').files[0], 800, 800);
        const docRef = await addDoc(collection(db, "incidents"), { callerEmail: auth.currentUser.email, category: document.getElementById('tk-category').value, priority: document.getElementById('tk-priority').value, building: document.getElementById('tk-building').value, floor: document.getElementById('tk-floor').value, department: document.getElementById('tk-dept').value, line: document.getElementById('tk-line').value, brokenItem: document.getElementById('tk-item').value, subject: document.getElementById('tk-subject').value, description: document.getElementById('tk-desc').value, imageUrl: img, status: 'New', createdAt: new Date() });
        await addDoc(collection(db, "incidents", docRef.id, "comments"), { senderEmail: "system", text: "Ticket created.", createdAt: new Date() });
        document.getElementById('create-ticket-form').reset(); window.clearCreateImage(); Toast.fire({ icon: 'success', title: 'Success!' }); window.switchTab('incidents');
    } catch (e) { Swal.fire({ icon: 'error', text: e.message }); } finally { b.disabled = false; }
};

window.updateTicket = (id, newStatus) => { updateDoc(doc(db, "incidents", id), { status: newStatus, assignedTo: auth.currentUser.email }); };
window.deleteTicket = (id) => { Swal.fire({ title: 'Delete?', icon: 'warning', showCancelButton: true }).then(r => { if(r.isConfirmed) deleteDoc(doc(db, "incidents", id)); }); };
window.exportCSV = () => { let c = "ID,Subject,Status\n"; for(let i in window.globalTickets){ let t = window.globalTickets[i]; c += `${i},${t.subject},${t.status}\n`; } let a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([c],{type:'text/csv'})); a.download='Tickets.csv'; a.click(); };
window.filterTickets = (tId, iId) => { let i = document.getElementById(iId).value.toUpperCase(), tr = document.getElementById(tId).getElementsByTagName("tr"); for(let x=1; x<tr.length; x++) tr[x].style.display = tr[x].innerText.toUpperCase().includes(i) ? "" : "none"; };
window.setAdminFilter = (f) => { currentAdminFilter = f; let tr = document.getElementById('admin-ticket-list').getElementsByTagName('tr'); for(let t of tr){ let s = t.getAttribute('data-status'); t.style.display = (f==='All'||(f==='Active'&&s!=='Resolved')||(f==='Resolved'&&s==='Resolved')) ? '' : 'none'; } };

window.openModal = (id) => {
    currentTicketId = id; const t = window.globalTickets[id];
    document.getElementById('modal-id').innerText = id.substring(0,4).toUpperCase(); document.getElementById('modal-subject').innerText = t.subject;
    document.getElementById('modal-location').innerText = `Bldg: ${t.building}, Floor: ${t.floor}`;
    document.getElementById('modal-broken-item').innerText = t.brokenItem; document.getElementById('modal-desc').innerText = t.description;
    if(t.imageUrl) { document.getElementById('modal-image').src = t.imageUrl; document.getElementById('modal-image-container').classList.remove('hidden'); } else { document.getElementById('modal-image-container').classList.add('hidden'); }
    document.getElementById('ticket-modal').classList.replace('hidden', 'flex'); setTimeout(() => { document.getElementById('ticket-modal').style.opacity = '1'; document.getElementById('modal-box').classList.replace('scale-95', 'scale-100'); }, 10);
    if(chatUnsubscribe) chatUnsubscribe();
    chatUnsubscribe = onSnapshot(query(collection(db, "incidents", id, "comments"), orderBy("createdAt", "asc")), (snap) => {
        let h = ""; snap.forEach(doc => { 
            const d = doc.data(); const isMe = d.senderEmail === auth.currentUser.email;
            if(d.senderEmail === 'system') h += `<div class="flex justify-center my-4"><span class="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold">${d.text}</span></div>`; 
            else { let cImg = d.imageUrl ? `<img src="${d.imageUrl}" class="mt-2 rounded-lg max-h-40" onclick="window.viewFullImage('${d.imageUrl}')">` : ''; h += `<div class="flex flex-col ${isMe?'items-end':'items-start'} mb-4"><div class="${isMe?'bg-blue-600 text-white':'bg-white border'} p-3 rounded-xl max-w-[85%] text-sm">${d.text}${cImg}</div></div>`; }
        });
        document.getElementById('chat-messages').innerHTML = h; document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
    });
};

window.closeModal = () => { document.getElementById('ticket-modal').style.opacity = '0'; document.getElementById('modal-box').classList.replace('scale-100', 'scale-95'); setTimeout(() => document.getElementById('ticket-modal').classList.replace('flex', 'hidden'), 300); };
document.getElementById('comment-text').addEventListener('paste', function(e) { const i = (e.clipboardData || e.originalEvent.clipboardData).items; for (let x of i) { if (x.kind === 'file' && x.type.includes('image')) { const dt = new DataTransfer(); dt.items.add(x.getAsFile()); document.getElementById('comment-image').files = dt.files; document.getElementById('comment-img-label').classList.replace('text-slate-500', 'text-blue-500'); e.preventDefault(); } } });
document.getElementById('comment-form').onsubmit = async (e) => {
    e.preventDefault(); const txt = document.getElementById('comment-text'), imgIn = document.getElementById('comment-image');
    if(!txt.value.trim() && imgIn.files.length === 0) return;
    try { let uImg = null; if (imgIn.files.length > 0) uImg = await resizeAndConvertToBase64(imgIn.files[0], 800, 800);
        await addDoc(collection(db, "incidents", currentTicketId, "comments"), { senderEmail: auth.currentUser.email, text: txt.value, imageUrl: uImg, createdAt: new Date() });
        document.getElementById('comment-form').reset(); document.getElementById('comment-img-label').classList.replace('text-blue-500', 'text-slate-500');
    } catch (e) { console.error(e); }
};

document.getElementById('btn-logout').onclick = () => { signOut(auth).then(() => window.location.href = 'index.html'); };

onAuthStateChanged(auth, (user) => {
    if (user) {
        const em = user.email.toLowerCase(); const isAdmin = em === "nattezava1996@gmail.com" || em.includes("admin");
        if (!isAdmin) { window.location.href = 'index.html'; return; }
        document.getElementById('app-view').classList.add('active'); document.getElementById('user-email').innerText = user.email; loadDashboardData();
    } else { window.location.href = 'index.html'; }
    window.toggleLang(currentLang);
});
