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
    en: { app_name: "Factory IT Service Center", menu_group_1: "Workspace", menu_group_2: "Admin", menu_dash: "Dashboard", menu_incidents: "My Tickets", menu_create: "Create Ticket", menu_admin: "Command Center", btn_logout: "Log Out", stat_open: "New Tickets", stat_progress: "In Progress", stat_resolved: "Resolved", stat_total: "Total Volume", admin_my_resolved: "My Resolved Tickets", btn_export: "Export CSV", dash_welcome: "Welcome,", dash_recent: "Recent Activity", dash_status: "System Status", sys_net: "Network", sys_erp: "ERP System", filter_all: "All", filter_active: "Active", filter_resolved: "Resolved", empty_recent: "All caught up!", empty_tickets: "No tickets found", form_title: "How can we help?", cat_hw: "❖ Hardware / PC Issue", cat_sw: "❖ Software / Application", cat_nw: "❖ Network / Internet" },
    th: { app_name: "ศูนย์บริการไอทีโรงงาน", menu_group_1: "พื้นที่ทำงาน", menu_group_2: "ผู้ดูแลระบบ", menu_dash: "ภาพรวมระบบ", menu_incidents: "ตั๋วของฉัน", menu_create: "แจ้งปัญหาใหม่", menu_admin: "ศูนย์จัดการงาน", btn_logout: "ออกจากระบบ", stat_open: "รอดำเนินการ", stat_progress: "กำลังแก้ไข", stat_resolved: "ปิดงานแล้ว", stat_total: "จำนวนทั้งหมด", admin_my_resolved: "งานที่ฉันปิดแล้ว", btn_export: "ดาวน์โหลด CSV", dash_welcome: "ยินดีต้อนรับ,", dash_recent: "รายการอัปเดตล่าสุด", dash_status: "สถานะระบบโรงงาน", sys_net: "ระบบเครือข่าย", sys_erp: "ระบบ ERP", filter_all: "ทั้งหมด", filter_active: "กำลังดำเนินการ", filter_resolved: "ปิดงานแล้ว", empty_recent: "จัดการครบหมดแล้ว!", empty_tickets: "ไม่พบข้อมูล", form_title: "มีอะไรให้ช่วยไหม?", cat_hw: "❖ ฮาร์ดแวร์ / เครื่องคอมพิวเตอร์", cat_sw: "❖ ซอฟต์แวร์ / โปรแกรม", cat_nw: "❖ เครือข่าย / อินเทอร์เน็ต" }
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
        if(en && th) { en.className = (lang==='en') ? "px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold" : "px-4 py-1.5 text-slate-500 rounded-full text-xs font-bold"; th.className = (lang==='th') ? "px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold" : "px-4 py-1.5 text-slate-500 rounded-full text-xs font-bold"; }
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
    document.getElementById('page-title').innerText = dict[currentLang][`menu_${tabName}`] || dict[currentLang].app_name;
    if(window.innerWidth <= 768 && document.getElementById('sidebar').classList.contains('open')) window.toggleMobileMenu();
};

// ==========================================
// AI Assistant (สมบูรณ์ 100%)
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
    const input = document.getElementById('ai-input'); 
    const rawText = input.value.trim(); 
    if (!rawText) return;
    
    const consoleBox = document.getElementById('ai-chat-box');
    consoleBox.insertAdjacentHTML('beforeend', `<div class="flex items-start gap-4 mb-6 flex-row-reverse chat-user-bubble"><div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-sm"><i class="fas fa-user text-[10px]"></i></div><div class="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-md text-sm leading-relaxed max-w-[85%]">${rawText}</div></div>`);
    input.value = ''; 
    consoleBox.scrollTop = consoleBox.scrollHeight;

    const thinkingId = 'think-' + Date.now();
    consoleBox.insertAdjacentHTML('beforeend', `<div id="${thinkingId}" class="flex items-start gap-4 mb-6 chat-ai-bubble"><div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0"><i class="fas fa-robot text-[10px]"></i></div><div class="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm text-slate-400 flex items-center gap-1">กำลังค้นหาข้อมูล...</div></div>`);
    consoleBox.scrollTop = consoleBox.scrollHeight;

    setTimeout(() => {
        document.getElementById(thinkingId)?.remove();
        const cleanText = rawText.toLowerCase().replace(/\s+/g, '');
        let botReply = "";

        for (let entry of botDatabase) {
            if (entry.keywords.some(k => cleanText.includes(k) || rawText.toLowerCase().includes(k))) {
                botReply = entry.answer; break;
            }
        }

        if (botReply === "") {
            botReply = `ขออภัยครับ อาการนี้อาจจะต้องให้ช่างตรวจเช็คเชิงลึก 😅 แนะนำให้กดเมนู **Create Ticket** เพื่อให้พี่ๆ ทีมช่างไอทีไปตรวจสอบให้นะครับ ชัวร์ที่สุด!<br><br>หรือลองเลือกหัวข้อปัญหาด้านล่างนี้ดูครับ 👇<br>
            <div class="flex flex-wrap gap-2 mt-3">
                <button onclick="window.sendQuickReply('คอมเปิดไม่ติด')" class="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-full text-xs font-bold transition-colors">💻 คอมเปิดไม่ติด</button>
                <button onclick="window.sendQuickReply('ปริ้นไม่ออก')" class="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-full text-xs font-bold transition-colors">🖨️ เครื่องปริ้น</button>
                <button onclick="window.sendQuickReply('เน็ตหลุด')" class="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-full text-xs font-bold transition-colors">📡 อินเทอร์เน็ต</button>
            </div>`;
        }

        botReply = botReply.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-600">$1</strong>').replace(/\n/g, '<br>');
        consoleBox.insertAdjacentHTML('beforeend', `<div class="flex items-start gap-4 mb-6 chat-ai-bubble"><div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-md"><i class="fas fa-robot text-[10px]"></i></div><div class="bg-slate-50 border border-slate-100 p-5 rounded-2xl rounded-tl-sm shadow-sm text-sm text-slate-700 leading-relaxed max-w-[85%]">${botReply}</div></div>`);
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
            
            const safeStatus = t.status || 'New', safePriority = t.priority || '';
            const isMyTicket = t.callerEmail === auth.currentUser.email;

            if(safeStatus === 'Resolved' && t.assignedTo === auth.currentUser.email) myResolved++;
            counts[safeStatus] = (counts[safeStatus] || 0) + 1; counts['Total']++;

            const bgColors = { 'New': 'bg-blue-100 text-blue-700', 'In Progress': 'bg-amber-100 text-amber-700', 'Resolved': 'bg-emerald-100 text-emerald-700' };
            let statusKey = 'status_' + safeStatus.toLowerCase().replace(' ', '_');
            let displayStatus = dict[currentLang][statusKey] || safeStatus;
            let badgeBgClass = bgColors[safeStatus] || bgColors['New'];
            let dotBgClass = safeStatus === 'New' ? 'bg-blue-500' : (safeStatus === 'In Progress' ? 'bg-amber-500' : 'bg-emerald-500');
            let statusHtml = `<span class="${badgeBgClass} px-3 py-1.5 rounded-md text-[10px] uppercase font-black tracking-widest flex w-fit gap-1 items-center"><span class="w-1.5 h-1.5 rounded-full ${dotBgClass}"></span><span>${displayStatus}</span></span>`;

            let priIndicator = safePriority.includes('1') ? '<i class="fas fa-fire text-rose-500 mr-2"></i>' : (safePriority.includes('2') ? '<i class="fas fa-exclamation-circle text-orange-500 mr-2"></i>' : '');
            let imgIcon = t.imageUrl ? ' <i class="fas fa-image text-blue-400 ml-1 text-[10px]"></i>' : '';

            adminHtml += `<tr class="hover:bg-slate-50 transition group border-b border-slate-50 cursor-pointer" data-status="${safeStatus}" onclick="window.openModal('${id}')">
                <td class="py-4 px-4 font-bold text-slate-500 text-xs">${displayId}</td>
                <td class="py-4 px-4"><div class="font-bold text-slate-800 text-sm">${priIndicator}${t.subject || 'No Subject'}${imgIcon}</div><div class="text-[10px] text-slate-400 mt-0.5">${t.callerEmail || '-'}</div></td>
                <td class="py-4 px-4 text-xs font-bold text-slate-600">${t.assignedTo ? t.assignedTo.split('@')[0].toUpperCase() : '-'}</td>
                <td class="py-4 px-4">${statusHtml}</td>
                <td class="py-4 px-4 text-right opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    <button onclick="event.stopPropagation(); window.editTicket('${id}')" class="w-8 h-8 bg-white border border-blue-200 text-blue-500 rounded-lg shadow-sm mr-1"><i class="fas fa-edit text-xs"></i></button>
                    <button onclick="event.stopPropagation(); window.updateTicket('${id}', 'In Progress')" class="w-8 h-8 bg-white border border-amber-200 text-amber-500 rounded-lg shadow-sm mr-1"><i class="fas fa-play text-xs"></i></button>
                    <button onclick="event.stopPropagation(); window.updateTicket('${id}', 'Resolved')" class="w-8 h-8 bg-white border border-emerald-200 text-emerald-500 rounded-lg shadow-sm mr-2"><i class="fas fa-check text-xs"></i></button>
                    <button onclick="event.stopPropagation(); window.deleteTicket('${id}')" class="w-8 h-8 bg-white border border-rose-200 text-rose-500 rounded-lg shadow-sm"><i class="fas fa-trash text-xs"></i></button>
                </td></tr>`;

            if (isMyTicket) {
                userHtml += `<tr class="hover:bg-slate-50 transition border-b border-slate-50 cursor-pointer" onclick="window.openModal('${id}')">
                    <td class="py-4 px-6 font-bold text-slate-500 text-xs">${displayId}</td>
                    <td class="py-4 px-6"><div class="font-bold text-slate-800 text-sm">${priIndicator}${t.subject || 'No Subject'}${imgIcon}</div></td>
                    <td class="py-4 px-6">${statusHtml}</td>
                    <td class="py-4 px-6 text-right text-xs text-slate-500">${timeAgo(t.createdAt?.toDate())}</td>
                </tr>`;
            }

            if (recentCount < 5) {
                recentDashHtml += `<div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition cursor-pointer" onclick="window.openModal('${id}')"><div class="flex items-center gap-4"><div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500"><i class="fas fa-ticket-alt"></i></div><div><p class="text-sm font-bold text-slate-800">${t.subject}</p><p class="text-[10px] text-slate-400 font-bold uppercase">${displayId}</p></div></div>${statusHtml}</div>`;
                recentCount++;
            }
        });

        document.getElementById('admin-ticket-list').innerHTML = adminHtml || `<tr><td colspan="5" class="p-16 text-center text-slate-400">No tickets</td></tr>`;
        document.getElementById('user-ticket-list').innerHTML = userHtml || `<tr><td colspan="4" class="p-16 text-center text-slate-400">No tickets</td></tr>`;
        
        document.getElementById('stat-new').innerText = counts['New'] || 0; document.getElementById('stat-progress').innerText = counts['In Progress'] || 0; document.getElementById('stat-resolved').innerText = counts['Resolved'] || 0; document.getElementById('stat-total').innerText = counts['Total'] || 0; document.getElementById('stat-admin-my-resolved').innerText = myResolved;
        document.getElementById('dash-recent-list').innerHTML = recentDashHtml || `<div class="p-8 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl"><p class="text-xs font-bold uppercase">Clear!</p></div>`;
        const u = auth.currentUser.email.split('@')[0]; document.getElementById('dash-user-name').innerText = u.charAt(0).toUpperCase() + u.slice(1);
        
        window.setAdminFilter(currentAdminFilter);
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

window.updateTicket = (id, newStatus) => {
    updateDoc(doc(db, "incidents", id), { status: newStatus, assignedTo: auth.currentUser.email }).then(() => {
        addDoc(collection(db, "incidents", id, "comments"), { senderEmail: "system", text: `Status updated to ${newStatus} by ${auth.currentUser.email.split('@')[0]}`, createdAt: new Date() });
        Toast.fire({ icon: 'success', title: 'Status Updated' });
    });
};

window.deleteTicket = (id) => {
    Swal.fire({ title: 'Delete Ticket?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48' }).then((result) => {
        if (result.isConfirmed) { deleteDoc(doc(db, "incidents", id)); Toast.fire({ icon: 'success', title: 'Deleted' }); }
    });
};

window.editTicket = (id) => {
    const t = window.globalTickets[id];
    Swal.fire({
        title: 'Edit Ticket Details', width: '600px',
        html: `<div class="space-y-4 text-left mt-4">
            <div><label class="block text-[10px] font-bold text-slate-500 uppercase">Subject</label><input id="edit-sub" class="w-full border rounded-xl px-4 py-3 text-sm" value="${t.subject || ''}"></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-[10px] font-bold text-slate-500 uppercase">Category</label><select id="edit-cat" class="w-full border rounded-xl px-4 py-3 text-sm"><option value="Hardware" ${t.category==='Hardware'?'selected':''}>Hardware</option><option value="Software" ${t.category==='Software'?'selected':''}>Software</option><option value="Network" ${t.category==='Network'?'selected':''}>Network</option></select></div>
                <div><label class="block text-[10px] font-bold text-slate-500 uppercase">Priority</label><select id="edit-pri" class="w-full border rounded-xl px-4 py-3 text-sm"><option value="4 - Low" ${t.priority==='4 - Low'?'selected':''}>Low</option><option value="3 - Moderate" ${t.priority==='3 - Moderate'?'selected':''}>Moderate</option><option value="2 - High" ${t.priority==='2 - High'?'selected':''}>High</option><option value="1 - Critical" ${t.priority==='1 - Critical'?'selected':''}>Critical</option></select></div>
            </div>
            <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
                <div><label class="block text-[10px] font-bold text-slate-500 uppercase">Building</label><input id="edit-bldg" class="w-full border rounded-lg px-3 py-2 text-sm" value="${t.building || ''}"></div>
                <div><label class="block text-[10px] font-bold text-slate-500 uppercase">Department</label><input id="edit-dept" class="w-full border rounded-lg px-3 py-2 text-sm" value="${t.department || ''}"></div>
                <div class="col-span-2"><label class="block text-[10px] font-bold text-slate-500 uppercase">Broken Item</label><input id="edit-item" class="w-full border rounded-lg px-3 py-2 text-sm" value="${t.brokenItem || ''}"></div>
            </div>
            <div><label class="block text-[10px] font-bold text-slate-500 uppercase">Description</label><textarea id="edit-desc" rows="4" class="w-full border rounded-xl px-4 py-3 text-sm resize-none">${t.description || ''}</textarea></div>
        </div>`,
        showCancelButton: true, confirmButtonColor: '#3b82f6',
        preConfirm: () => ({ subject: document.getElementById('edit-sub').value, category: document.getElementById('edit-cat').value, priority: document.getElementById('edit-pri').value, building: document.getElementById('edit-bldg').value, department: document.getElementById('edit-dept').value, brokenItem: document.getElementById('edit-item').value, description: document.getElementById('edit-desc').value })
    }).then((result) => {
        if (result.isConfirmed) { updateDoc(doc(db, "incidents", id), result.value); Toast.fire({ icon: 'success', title: 'Updated' }); }
    });
};

window.exportCSV = () => {
    let csv = "ID,Subject,Status,Priority,Category,Building,Floor,Department,Line,BrokenItem,Caller,AssignedTo,Date\n";
    for(let id in window.globalTickets) {
        let t = window.globalTickets[id], dateStr = t.createdAt ? t.createdAt.toDate().toISOString() : "";
        csv += `${id},"${t.subject}",${t.status},"${t.priority}",${t.category},"${t.building||'-'}","${t.floor||'-'}","${t.department||'-'}","${t.line||'-'}","${t.brokenItem||'-'}",${t.callerEmail},${t.assignedTo||''},${dateStr}\n`;
    }
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = `Tickets.csv`; link.click();
};

window.filterTickets = (tableId, inputId) => {
    const input = document.getElementById(inputId).value.toUpperCase(), trs = document.getElementById(tableId).getElementsByTagName("tr");
    for (let i=0; i<trs.length; i++) { trs[i].style.display = trs[i].innerText.toUpperCase().includes(input) ? "" : "none"; }
};

window.setAdminFilter = (f) => {
    currentAdminFilter = f;
    const act = "px-5 py-2 rounded-lg text-xs font-bold bg-white text-slate-800 shadow-sm", inact = "px-5 py-2 rounded-lg text-xs font-bold text-slate-500";
    ['All', 'Active', 'Resolved'].forEach(btn => { const b = document.getElementById(`btn-filter-${btn}`); if(b) b.className = btn === f ? act : inact; });
    let trs = document.getElementById('admin-ticket-list').getElementsByTagName('tr');
    for(let tr of trs) { 
        let s = tr.getAttribute('data-status'); 
        tr.style.display = (f === 'All' || (f === 'Active' && s !== 'Resolved') || (f === 'Resolved' && s === 'Resolved')) ? '' : 'none'; 
    }
};

window.openModal = (id) => {
    currentTicketId = id; const t = window.globalTickets[id];
    document.getElementById('modal-id').innerText = "TKT-" + id.substring(0,4).toUpperCase(); document.getElementById('modal-subject').innerText = t.subject;
    document.getElementById('modal-category').innerText = t.category; document.getElementById('modal-priority').innerText = t.priority;
    document.getElementById('modal-location').innerText = `Bldg: ${t.building}, Floor: ${t.floor}, Dept: ${t.department}`;
    document.getElementById('modal-broken-item').innerText = t.brokenItem; document.getElementById('modal-desc').innerText = t.description;
    document.getElementById('modal-caller').innerText = t.callerEmail; document.getElementById('modal-date').innerText = t.createdAt?.toDate().toLocaleString();
    if(t.imageUrl) { document.getElementById('modal-image').src = t.imageUrl; document.getElementById('modal-image-container').classList.remove('hidden'); } else { document.getElementById('modal-image-container').classList.add('hidden'); }
    
    document.getElementById('ticket-modal').classList.replace('hidden', 'flex'); setTimeout(() => { document.getElementById('ticket-modal').style.opacity = '1'; document.getElementById('modal-box').classList.replace('scale-95', 'scale-100'); }, 10);
    if(chatUnsubscribe) chatUnsubscribe();
    
    chatUnsubscribe = onSnapshot(query(collection(db, "incidents", id, "comments"), orderBy("createdAt", "asc")), (snap) => {
        let h = ""; 
        snap.forEach(doc => { 
            const d = doc.data();
            if(d.senderEmail === 'system') { 
                h += `<div class="flex justify-center my-4"><span class="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold"><i class="fas fa-cog"></i> ${d.text}</span></div>`; 
            } else {
                const isMe = d.senderEmail === auth.currentUser.email;
                const align = isMe ? 'items-end' : 'items-start';
                const bg = isMe ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700';
                const senderName = isMe ? 'You' : d.senderEmail.split('@')[0];
                let chatImgHtml = d.imageUrl ? `<img src="${d.imageUrl}" class="mt-2 rounded-lg max-h-40 cursor-pointer border hover:opacity-90 transition" onclick="window.viewFullImage('${d.imageUrl}')">` : '';
                h += `<div class="flex flex-col ${align} mb-4"><div class="max-w-[85%] ${bg} p-3 rounded-xl shadow-sm text-sm"><div class="text-[10px] font-bold opacity-70 mb-1">${senderName}</div>${d.text}${chatImgHtml}</div></div>`;
            }
        });
        document.getElementById('chat-messages').innerHTML = h; document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
    });
};

window.closeModal = () => { document.getElementById('ticket-modal').style.opacity = '0'; document.getElementById('modal-box').classList.replace('scale-100', 'scale-95'); setTimeout(() => { document.getElementById('ticket-modal').classList.replace('flex', 'hidden'); if(chatUnsubscribe) chatUnsubscribe(); }, 300); };

document.getElementById('comment-text').addEventListener('paste', function(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
        if (items[index].kind === 'file' && items[index].type.includes('image')) {
            const dataTransfer = new DataTransfer(); dataTransfer.items.add(items[index].getAsFile());
            document.getElementById('comment-image').files = dataTransfer.files;
            document.getElementById('comment-img-label').classList.replace('text-slate-500', 'text-blue-500');
            Toast.fire({ icon: 'success', title: 'Image attached from Clipboard' }); e.preventDefault(); 
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
    btnSubmit.disabled = true; btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i>';

    try {
        let uploadedImageUrl = null;
        if (imgInput.files.length > 0) uploadedImageUrl = await resizeAndConvertToBase64(imgInput.files[0], 800, 800);

        await addDoc(collection(db, "incidents", currentTicketId, "comments"), { 
            senderEmail: auth.currentUser.email, text: text, imageUrl: uploadedImageUrl, createdAt: new Date() 
        });

        document.getElementById('comment-form').reset(); 
        document.getElementById('comment-img-label').classList.replace('text-blue-500', 'text-slate-500');
    } catch (error) { Swal.fire({ icon: 'error', text: error.message }); } 
    finally { btnSubmit.disabled = false; btnSubmit.innerHTML = '<i class="fas fa-paper-plane text-xs"></i>'; }
};

document.getElementById('btn-logout').onclick = () => {
    Swal.fire({ title: 'Sign Out?', icon: 'question', showCancelButton: true, confirmButtonColor: '#e11d48' })
    .then((result) => { if (result.isConfirmed) signOut(auth); });
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        const safeEmail = user.email ? user.email.toLowerCase().trim() : "";
        const isAdmin = safeEmail === "nattezava1996@gmail.com" || safeEmail.includes("admin");

        if (!isAdmin) {
            Swal.fire({ icon: 'error', title: 'Access Denied', text: 'คุณไม่มีสิทธิ์เข้าถึงหน้า Admin ครับ' }).then(() => {
                window.location.href = 'index.html'; 
            });
            return;
        }

        document.getElementById('app-view').classList.add('active');
        document.getElementById('user-email').innerText = user.email;
        loadDashboardData();
    } else {
        window.location.href = 'index.html';
    }
    window.toggleLang(currentLang);
});
