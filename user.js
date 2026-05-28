import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
let chatUnsubscribe = null;
let currentLang = localStorage.getItem('appLang') || 'en';

const dict = {
    en: { page_title: "Factory IT Service Center", app_name: "Factory IT Service Center", app_name_short: "Factory IT", role_user: "User", menu_group_1: "Workspace", menu_dash: "Dashboard", menu_incidents: "My Requests", menu_create: "Create Requests", menu_chat: "Live Chat", chat_title: "IT Support Chat", chat_sub: "Real-time helpdesk room", btn_logout: "Log Out", stat_open: "New Request", stat_progress: "In Progress", stat_resolved: "Resolved", stat_total: "Total Volume", th_subject: "Subject", th_status: "Status", th_date: "Timeline", btn_submit: "Submit Request", search_placeholder: "Search...", btn_new_ticket: "Create", form_title: "How can we help?", form_cat: "Category", form_pri: "Priority", form_short: "Subject", form_desc: "Description", form_loc_head: "Location", form_bldg: "Bldg", form_floor: "Floor", form_dept: "Dept", form_line: "Line", form_item: "Item", dash_welcome: "Welcome,", dash_sub: "IT support summary.", dash_recent: "Activity", cat_hw: "❖ Hardware / PC Issue", cat_sw: "❖ Software / Application", cat_nw: "❖ Network / Internet", empty_tickets: "None", empty_recent: "Clear!", status_new: "New", status_in_progress: "In Progress", status_waiting_for_parts: "Waiting for Parts", status_waiting_for_approval: "Waiting for Approval", status_waiting_for_user: "Waiting for User", status_testing: "Testing", status_resolved: "Resolved", status_cancelled: "Cancelled" },
    th: { page_title: "ศูนย์บริการไอทีโรงงาน", app_name: "ศูนย์บริการไอทีโรงงาน", app_name_short: "ศูนย์บริการไอที", role_user: "ผู้แจ้ง", menu_group_1: "พื้นที่ทำงาน", menu_dash: "ภาพรวมระบบ", menu_incidents: "รายการคำขอของฉัน", menu_create: "แจ้งปัญหาใหม่", menu_chat: "คุยกับไอที", chat_title: "ติดต่อสอบถามไอที", chat_sub: "ห้องแชทรวม (Live Chat)", btn_logout: "ออกจากระบบ", stat_open: "รอดำเนินการ", stat_progress: "กำลังแก้ไข", stat_resolved: "ปิดงานแล้ว", stat_total: "ทั้งหมด", th_subject: "หัวข้อ", th_status: "สถานะ", th_date: "ล่าสุด", btn_submit: "ส่งเรื่องแจ้งซ่อม", search_placeholder: "ค้นหา...", btn_new_ticket: "สร้างใหม่", form_title: "มีอะไรให้ช่วยไหม?", form_cat: "หมวดหมู่", form_pri: "ความเร่งด่วน", form_short: "หัวข้อ", form_desc: "รายละเอียด", form_loc_head: "สถานที่", form_bldg: "ตึก", form_floor: "ชั้น", form_dept: "แผนก", form_line: "ไลน์", form_item: "ของที่เสีย", dash_welcome: "ยินดีต้อนรับ,", dash_sub: "สรุปภาพรวมวันนี้", dash_recent: "อัปเดตล่าสุด", cat_hw: "❖ ฮาร์ดแวร์ / เครื่องคอมพิวเตอร์", cat_sw: "❖ ซอฟต์แวร์ / โปรแกรม", cat_nw: "❖ เครือข่าย / อินเทอร์เน็ต", empty_tickets: "ไม่พบข้อมูล", empty_recent: "จัดการครบแล้ว!", status_new: "เปิดใหม่", status_in_progress: "กำลังทำ", status_waiting_for_parts: "รอสั่งซื้ออะไหล่", status_waiting_for_approval: "รออนุมัติ", status_waiting_for_user: "รอผู้ใช้ตอบกลับ", status_testing: "รอดูอาการ", status_resolved: "ปิดงานแล้ว", status_cancelled: "ยกเลิก" }
};

window.viewFullImage = (url) => { Swal.fire({ imageUrl: url, imageAlt: 'Attached Image', width: 'auto', padding: '1rem', showConfirmButton: false, showCloseButton: true, customClass: { image: 'rounded-xl max-h-[80vh] object-contain' } }); };

window.previewCreateImage = (input) => { 
    const container = document.getElementById('create-image-preview-container');
    container.innerHTML = '<button type="button" onclick="window.clearCreateImage()" class="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-md z-10">×</button>';
    if (input.files && input.files.length > 0) { 
        if(input.files.length > 3) { Swal.fire({icon: 'warning', text: currentLang === 'th' ? 'อัปโหลดได้สูงสุด 3 รูปครับ' : 'Maximum 3 images allowed'}); input.value = ''; container.classList.add('hidden'); return; }
        Array.from(input.files).forEach(file => {
            const reader = new FileReader(); 
            reader.onload = (e) => { container.innerHTML += `<img src="${e.target.result}" class="h-24 w-24 object-cover rounded-xl border shadow-sm">`; }; 
            reader.readAsDataURL(file); 
        });
        container.classList.remove('hidden'); 
    } else { container.classList.add('hidden'); } 
};

window.clearCreateImage = () => { document.getElementById('tk-image').value = ''; const container = document.getElementById('create-image-preview-container'); container.classList.add('hidden'); container.innerHTML = '<button type="button" onclick="window.clearCreateImage()" class="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-md z-10">×</button>'; };

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

function formatDateTime(date) {
    if(!date) return '-'; 
    return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
}

window.toggleMobileMenu = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); };

window.toggleLang = (lang) => {
    currentLang = lang; localStorage.setItem('appLang', lang);
    const titleTag = document.getElementById('page-title-tag'); if(titleTag) titleTag.innerText = dict[lang].page_title;
    document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n'); if(dict[lang][k]) el.innerText = dict[lang][k]; });
    const optHw = document.getElementById('opt-hw'), optSw = document.getElementById('opt-sw'), optNw = document.getElementById('opt-nw');
    if(optHw) optHw.innerText = dict[lang].cat_hw; if(optSw) optSw.innerText = dict[lang].cat_sw; if(optNw) optNw.innerText = dict[lang].cat_nw;
    window.updateDynamicDropdowns();
    ['app'].forEach(v => {
        const en = document.getElementById(`lang-en-${v}`), th = document.getElementById(`lang-th-${v}`);
        if(en && th) { en.className = (lang==='en') ? "px-5 py-2 bg-white text-blue-600 rounded-full text-sm font-bold shadow-sm" : "px-5 py-2 text-slate-500 rounded-full text-sm font-bold hover:text-slate-700 transition"; th.className = (lang==='th') ? "px-5 py-2 bg-white text-blue-600 rounded-full text-sm font-bold shadow-sm" : "px-5 py-2 text-slate-500 rounded-full text-sm font-bold hover:text-slate-700 transition"; }
    });
};

window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-content').forEach(el => { el.classList.remove('block'); el.classList.add('hidden'); });
    document.querySelectorAll('.menu-link').forEach(el => el.classList.remove('active'));
    
    document.querySelectorAll('.bottom-nav-link').forEach(el => { 
        el.classList.remove('text-blue-600', 'active'); 
        if(!el.classList.contains('text-indigo-400')) el.classList.add('text-slate-400'); 
    });

    const target = document.getElementById(`tab-${tabName}`); if(target) { target.classList.remove('hidden'); target.classList.add('block'); }
    document.querySelector(`.menu-link[onclick*="'${tabName}'"]`)?.classList.add('active');
    
    const bottomNav = document.querySelector(`.bottom-nav-link[onclick*="'${tabName}'"]`);
    if(bottomNav) { bottomNav.classList.remove('text-slate-400'); bottomNav.classList.add('text-blue-600', 'active'); }

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) { const key = `menu_${tabName}`; pageTitle.setAttribute('data-i18n', key); pageTitle.innerText = dict[currentLang][key] || dict[currentLang].app_name; }
    if(window.innerWidth <= 768 && document.getElementById('sidebar').classList.contains('open')) window.toggleMobileMenu();
};

const categoryData = {
    "Hardware": { items: [{ val: "PC / Desktop", text: "คอมพิวเตอร์ (PC / Desktop)" }, { val: "Laptop / Notebook", text: "โน้ตบุ๊ก (Laptop / Notebook)" }, { val: "Monitor", text: "หน้าจอ (Monitor)" }, { val: "Printer / Scanner", text: "เครื่องปริ้น / สแกนเนอร์" }, { val: "Other", text: "อื่นๆ (ระบุในรายละเอียด)" }], subjects: [{ val: "Cannot power on / No display", text: "เปิดไม่ติด / ไม่มีภาพ" }, { val: "Cannot print / Paper jam", text: "ปริ้นไม่ออก / กระดาษติด" }, { val: "Hardware replacement / Upgrade", text: "ขอเบิกอุปกรณ์ / เปลี่ยนอะไหล่" }, { val: "Other", text: "อื่นๆ (ระบุในรายละเอียด)" }] },
    "Software": { items: [{ val: "Software / System", text: "โปรแกรม / ระบบ ERP" }, { val: "Other", text: "อื่นๆ (ระบุในรายละเอียด)" }], subjects: [{ val: "System Error / Software crashes", text: "ระบบค้าง / โปรแกรมมีปัญหา Error" }, { val: "Request for access / New Account", text: "ขอสิทธิ์เข้าใช้งาน / สร้าง User ใหม่" }, { val: "Other", text: "อื่นๆ (ระบุในรายละเอียด)" }] },
    "Network": { items: [{ val: "Network / Wi-Fi", text: "อุปกรณ์เน็ตเวิร์ค / Wi-Fi" }, { val: "Other", text: "อื่นๆ (ระบุในรายละเอียด)" }], subjects: [{ val: "No Internet / Network drops", text: "ไม่มีเน็ต / อินเทอร์เน็ตหลุด" }, { val: "Other", text: "อื่นๆ (ระบุในรายละเอียด)" }] }
};

window.updateDynamicDropdowns = () => {
    const catSelect = document.getElementById('tk-category'), itemSelect = document.getElementById('tk-item'), subSelect = document.getElementById('tk-subject');
    if (!catSelect || !itemSelect || !subSelect) return;
    const selectedCat = catSelect.value, data = categoryData[selectedCat];
    const chooseItemText = currentLang === 'th' ? "เลือกอุปกรณ์ที่เสีย..." : "Select broken item...";
    const chooseSubText = currentLang === 'th' ? "เลือกหัวข้อปัญหา..." : "Select subject...";
    itemSelect.innerHTML = `<option value="" disabled selected>${chooseItemText}</option>`;
    subSelect.innerHTML = `<option value="" disabled selected>${chooseSubText}</option>`;
    if (data) {
        data.items.forEach(item => { itemSelect.innerHTML += `<option value="${item.val}">${currentLang==='th'?item.text:item.val}</option>`; });
        data.subjects.forEach(sub => { subSelect.innerHTML += `<option value="${sub.val}">${currentLang==='th'?sub.text:sub.val}</option>`; });
    }
};

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
    consoleBox.insertAdjacentHTML('beforeend', `<div class="flex items-start gap-4 mb-6 flex-row-reverse chat-user-bubble"><div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-sm text-base"><i class="fas fa-user"></i></div><div class="bg-indigo-600 text-white p-5 rounded-2xl rounded-tr-sm shadow-md text-base leading-relaxed max-w-[85%]">${rawText}</div></div>`);
    input.value = ''; consoleBox.scrollTop = consoleBox.scrollHeight;
    
    const thinkingId = 'think-' + Date.now();
    consoleBox.insertAdjacentHTML('beforeend', `<div id="${thinkingId}" class="flex items-start gap-4 mb-6 chat-ai-bubble"><div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-md text-sm"><i class="fas fa-robot"></i></div><div class="bg-white border p-5 rounded-2xl text-base text-slate-400">กำลังค้นหา...</div></div>`);
    consoleBox.scrollTop = consoleBox.scrollHeight;

    setTimeout(() => {
        document.getElementById(thinkingId)?.remove();
        const cleanText = rawText.toLowerCase().replace(/\s+/g, ''); let botReply = "";
        for (let entry of botDatabase) { if (entry.keywords.some(k => cleanText.includes(k) || rawText.toLowerCase().includes(k))) { botReply = entry.answer; break; } }

        if (botReply === "") {
            botReply = `ขออภัยครับ อาการนี้อาจจะต้องให้ช่างตรวจเช็คเชิงลึก 😅 แนะนำให้กดเมนู **Create Ticket** เพื่อแจ้งเรื่องครับ<br><br>หรือเลือกด้านล่าง 👇<br><div class="flex flex-wrap gap-2 mt-3"><button onclick="window.sendQuickReply('คอมเปิดไม่ติด')" class="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors">💻 คอมเสีย</button><button onclick="window.sendQuickReply('ปริ้นไม่ออก')" class="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors">🖨️ เครื่องปริ้น</button><button onclick="window.sendQuickReply('เน็ตหลุด')" class="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-sm font-bold hover:bg-indigo-100 transition-colors">📡 เน็ตหลุด</button></div>`;
        }
        botReply = botReply.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-600">$1</strong>').replace(/\n/g, '<br>');
        consoleBox.insertAdjacentHTML('beforeend', `<div class="flex items-start gap-4 mb-6 chat-ai-bubble"><div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-md text-sm"><i class="fas fa-robot"></i></div><div class="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-base text-slate-700 leading-relaxed max-w-[85%]">${botReply}</div></div>`);
        consoleBox.scrollTop = consoleBox.scrollHeight;
    }, 800); 
};

function loadLiveChat() {
    onSnapshot(query(collection(db, "live_chat"), orderBy("createdAt", "asc")), (snap) => {
        let h = "";
        snap.forEach(doc => {
            const d = doc.data(); const isMe = d.senderEmail === auth.currentUser.email; const isAdmin = d.senderEmail.includes('admin') || d.senderEmail === 'nattezava1996@gmail.com';
            const align = isMe ? 'items-end' : 'items-start'; const bg = isMe ? 'bg-slate-800 text-white' : (isAdmin ? 'bg-rose-50 border border-rose-100 text-slate-800' : 'bg-white border text-slate-700');
            const senderName = isMe ? 'You' : d.senderEmail.split('@')[0]; const badge = isAdmin && !isMe ? '<i class="fas fa-shield-alt text-rose-500 ml-1"></i>' : '';
            h += `<div class="flex flex-col ${align} mb-4"><div class="${bg} p-4 rounded-2xl max-w-[85%] shadow-sm text-base"><div class="text-xs font-bold opacity-70 mb-1 flex items-center gap-1">${senderName} ${badge}</div>${d.text}</div></div>`;
        });
        const chatBox = document.getElementById('live-chat-box');
        if(chatBox) { chatBox.innerHTML = h || '<div class="text-center text-slate-400 text-sm py-10">Start the conversation!</div>'; chatBox.scrollTop = chatBox.scrollHeight; }
    });

    const form = document.getElementById('live-chat-form');
    if(form) {
        form.onsubmit = async (e) => {
            e.preventDefault(); const input = document.getElementById('live-chat-input'); const text = input.value.trim(); if(!text) return;
            const btn = document.getElementById('btn-live-chat'); btn.disabled = true;
            try { await addDoc(collection(db, "live_chat"), { senderEmail: auth.currentUser.email, text: text, createdAt: new Date() }); input.value = ''; } 
            catch(err) { console.error(err); } finally { btn.disabled = false; }
        };
    }
}

window.cancelTicket = (id) => {
    Swal.fire({
        title: currentLang === 'th' ? 'ยกเลิกการแจ้งซ่อม?' : 'Cancel this request?',
        text: currentLang === 'th' ? 'หากคุณแก้ปัญหาได้แล้ว หรือต้องการยกเลิกคำขอนี้ กดยืนยันได้เลยครับ' : 'Are you sure you want to cancel this ticket?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: currentLang === 'th' ? 'ยืนยันการยกเลิก' : 'Yes, Cancel it'
    }).then((result) => {
        if (result.isConfirmed) {
            updateDoc(doc(db, "incidents", id), { status: 'Cancelled' }).then(() => {
                addDoc(collection(db, "incidents", id, "comments"), { 
                    senderEmail: "system", 
                    text: currentLang === 'th' ? "ผู้ใช้งานได้ยกเลิกคำขอนี้ด้วยตนเอง" : "Ticket cancelled by user.", 
                    createdAt: new Date() 
                });
                Toast.fire({ icon: 'success', title: currentLang === 'th' ? 'ยกเลิกสำเร็จ' : 'Cancelled Successfully' });
            });
        }
    });
};

function loadDashboardData() {
    onSnapshot(query(collection(db, "incidents"), orderBy("createdAt", "desc")), (snapshot) => {
        let userHtml = "", recentHtml = "", counts = { New: 0, "In Progress": 0, Resolved: 0, Cancelled: 0, Total: 0 }, recentCount=0;
        snapshot.forEach((docSnap) => {
            const t = docSnap.data(), id = docSnap.id; window.globalTickets[id] = t;
            if (t.callerEmail !== auth.currentUser.email) return;
            
            const safeStatus = t.status || 'New';
            if(safeStatus === 'New' || safeStatus === 'Resolved') {
                counts[safeStatus] = (counts[safeStatus] || 0) + 1;
            } else if (safeStatus !== 'Cancelled') {
                counts['In Progress'] = (counts['In Progress'] || 0) + 1; 
            }
            counts.Total++;
            
            const bgColors = { 
                'New': 'bg-blue-100 text-blue-700', 
                'In Progress': 'bg-amber-100 text-amber-700', 
                'Waiting for Parts': 'bg-orange-100 text-orange-700',
                'Waiting for Approval': 'bg-purple-100 text-purple-700',
                'Waiting for User': 'bg-pink-100 text-pink-700',
                'Testing': 'bg-cyan-100 text-cyan-700',
                'Resolved': 'bg-emerald-100 text-emerald-700', 
                'Cancelled': 'bg-slate-200 text-slate-600' 
            };
            
            let statusKey = 'status_' + safeStatus.toLowerCase().replace(/ /g, '_');
            let displayStatus = dict[currentLang][statusKey] || safeStatus;
            let badgeBgClass = bgColors[safeStatus] || bgColors['New'];
            
            let dotBgClass = 'bg-slate-500';
            if (safeStatus === 'New') dotBgClass = 'bg-blue-500';
            else if (safeStatus === 'In Progress') dotBgClass = 'bg-amber-500';
            else if (safeStatus === 'Waiting for Parts') dotBgClass = 'bg-orange-500';
            else if (safeStatus === 'Waiting for Approval') dotBgClass = 'bg-purple-500';
            else if (safeStatus === 'Waiting for User') dotBgClass = 'bg-pink-500';
            else if (safeStatus === 'Testing') dotBgClass = 'bg-cyan-500';
            else if (safeStatus === 'Resolved') dotBgClass = 'bg-emerald-500';

            let statusHtml = `<span class="${badgeBgClass} px-3 py-1.5 rounded-md text-xs uppercase font-black tracking-wider flex w-fit gap-2 items-center"><span class="w-2 h-2 rounded-full ${dotBgClass}"></span><span data-i18n="${statusKey}">${displayStatus}</span></span>`;

            const formattedDate = formatDateTime(t.createdAt?.toDate());
            let displayId = "TKT-" + id.substring(0,4).toUpperCase();
            
            let actionBtn = (safeStatus !== 'Resolved' && safeStatus !== 'Cancelled') ? 
                `<button onclick="event.stopPropagation(); window.cancelTicket('${id}')" class="ml-4 w-10 h-10 rounded-lg bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition shadow-sm flex items-center justify-center shrink-0 text-sm" title="Cancel Request"><i class="fas fa-times"></i></button>` : '';
            
            userHtml += `<tr class="border-b cursor-pointer hover:bg-slate-50 transition flex flex-col md:table-row" onclick="window.openModal('${id}')">
                <td class="p-5 font-bold text-sm text-slate-500 hidden md:table-cell align-middle">${displayId}</td>
                <td class="p-4 md:p-5">
                    <div class="md:hidden text-xs text-slate-400 font-bold mb-1">${displayId}</div>
                    <div class="font-bold text-base text-slate-800 leading-tight">${t.subject}</div>
                    <div class="md:hidden text-xs text-slate-500 mt-2"><i class="far fa-clock"></i> ${formattedDate}</div>
                </td>
                <td class="p-4 md:p-5">${statusHtml}</td>
                <td class="p-4 md:p-5 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end">
                        <span class="hidden md:inline-block text-sm text-slate-500 font-medium mr-2">${formattedDate}</span>
                        ${actionBtn}
                    </div>
                </td>
            </tr>`;
            
            if(recentCount<5){ recentHtml+=`<div class="p-5 bg-white border rounded-xl mb-3 text-base cursor-pointer hover:bg-slate-50 transition flex justify-between items-center" onclick="window.openModal('${id}')"><div><b class="text-slate-800">${t.subject}</b></div>${statusHtml}</div>`; recentCount++;}
        });
        document.getElementById('user-ticket-list').innerHTML = userHtml || '<tr><td colspan="4" class="p-16 text-center text-slate-400 text-base">No requests found</td></tr>';
        document.getElementById('stat-new').innerText = counts.New || 0; document.getElementById('stat-progress').innerText = counts["In Progress"] || 0;
        document.getElementById('stat-resolved').innerText = counts.Resolved || 0; document.getElementById('stat-total').innerText = counts.Total || 0;
        document.getElementById('dash-recent-list').innerHTML = recentHtml || '<p class="text-center text-slate-400 text-sm py-10">Clear!</p>';
        const u = auth.currentUser.displayName || auth.currentUser.email.split('@')[0]; document.getElementById('dash-user-name').innerText = u.charAt(0).toUpperCase() + u.slice(1);
    });
}

document.getElementById('create-ticket-form').onsubmit = async (e) => {
    e.preventDefault(); const b = document.getElementById('btn-create-submit'); b.disabled = true;
    try {
        let imgUrls = []; const files = document.getElementById('tk-image').files;
        if(files.length > 0) { for(let file of files) { imgUrls.push(await resizeAndConvertToBase64(file, 800, 800)); } }
        
        const docRef = await addDoc(collection(db, "incidents"), { callerEmail: auth.currentUser.email, category: document.getElementById('tk-category').value, priority: "3 - Moderate", building: document.getElementById('tk-building').value, floor: document.getElementById('tk-floor').value, department: document.getElementById('tk-dept').value, line: document.getElementById('tk-line').value, brokenItem: document.getElementById('tk-item').value, subject: document.getElementById('tk-subject').value, description: document.getElementById('tk-desc').value, imageUrl: imgUrls.length > 0 ? imgUrls[0] : null, imageUrls: imgUrls, status: 'New', createdAt: new Date() });
        await addDoc(collection(db, "incidents", docRef.id, "comments"), { senderEmail: "system", text: "Ticket created.", createdAt: new Date() });
        
        document.getElementById('create-ticket-form').reset(); window.clearCreateImage(); window.updateDynamicDropdowns(); Toast.fire({ icon: 'success', title: 'Success!' }); window.switchTab('incidents');
    } catch (e) { Swal.fire({ icon: 'error', text: e.message }); } finally { b.disabled = false; }
};

window.openModal = (id) => {
    currentTicketId = id; const t = window.globalTickets[id];
    document.getElementById('modal-id').innerText = "TKT-" + id.substring(0,4).toUpperCase(); document.getElementById('modal-subject').innerText = t.subject || 'No Subject'; document.getElementById('modal-category').innerText = t.category || '-'; document.getElementById('modal-location').innerText = `Bldg: ${t.building || '-'}, Floor: ${t.floor || '-'}, Dept: ${t.department || '-'}`; document.getElementById('modal-broken-item').innerText = t.brokenItem || 'Not specified'; document.getElementById('modal-desc').innerText = t.description || '-'; document.getElementById('modal-caller').innerText = t.callerEmail || '-'; document.getElementById('modal-assignee').innerText = t.assignedTo || 'Unassigned'; 
    document.getElementById('modal-date').innerText = formatDateTime(t.createdAt?.toDate());

    const safeStatus = t.status || 'New'; 
    const bgColors = { 
        'New': 'bg-blue-100 text-blue-700', 
        'In Progress': 'bg-amber-100 text-amber-700', 
        'Waiting for Parts': 'bg-orange-100 text-orange-700',
        'Waiting for Approval': 'bg-purple-100 text-purple-700',
        'Waiting for User': 'bg-pink-100 text-pink-700',
        'Testing': 'bg-cyan-100 text-cyan-700',
        'Resolved': 'bg-emerald-100 text-emerald-700', 
        'Cancelled': 'bg-slate-200 text-slate-600' 
    };
    let statusKey = 'status_' + safeStatus.toLowerCase().replace(/ /g, '_'); 
    let displayStatus = dict[currentLang][statusKey] || safeStatus; 
    let badgeBgClass = bgColors[safeStatus] || bgColors['New']; 
    
    let dotBgClass = 'bg-slate-500';
    if (safeStatus === 'New') dotBgClass = 'bg-blue-500';
    else if (safeStatus === 'In Progress') dotBgClass = 'bg-amber-500';
    else if (safeStatus === 'Waiting for Parts') dotBgClass = 'bg-orange-500';
    else if (safeStatus === 'Waiting for Approval') dotBgClass = 'bg-purple-500';
    else if (safeStatus === 'Waiting for User') dotBgClass = 'bg-pink-500';
    else if (safeStatus === 'Testing') dotBgClass = 'bg-cyan-500';
    else if (safeStatus === 'Resolved') dotBgClass = 'bg-emerald-500';
    
    document.getElementById('modal-status-badge').innerHTML = `<span class="${badgeBgClass} px-4 py-2 rounded-lg text-xs uppercase font-black tracking-wider flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full ${dotBgClass}"></span><span data-i18n="${statusKey}">${displayStatus}</span></span>`;

    let imgHtml = '';
    if(t.imageUrls && t.imageUrls.length > 0) { t.imageUrls.forEach(url => { imgHtml += `<img src="${url}" class="w-full rounded-xl border object-cover max-h-48 cursor-pointer mb-2" onclick="window.viewFullImage('${url}')">`; }); } 
    else if(t.imageUrl) { imgHtml = `<img src="${t.imageUrl}" class="w-full rounded-xl border object-cover max-h-48 cursor-pointer" onclick="window.viewFullImage('${t.imageUrl}')">`; }
    const imgContainer = document.getElementById('modal-image-container');
    if(imgHtml) { imgContainer.innerHTML = imgHtml; imgContainer.classList.remove('hidden'); imgContainer.classList.add('flex'); } 
    else { imgContainer.classList.add('hidden'); imgContainer.classList.remove('flex'); }
    
    document.getElementById('ticket-modal').classList.replace('hidden', 'flex'); setTimeout(() => { document.getElementById('ticket-modal').style.opacity = '1'; document.getElementById('modal-box').classList.replace('scale-95', 'scale-100'); }, 10);
    
    if(chatUnsubscribe) chatUnsubscribe();
    chatUnsubscribe = onSnapshot(query(collection(db, "incidents", id, "comments"), orderBy("createdAt", "asc")), (snap) => {
        let h = ""; 
        snap.forEach(doc => { 
            const d = doc.data(); 
            const isMe = d.senderEmail === auth.currentUser.email;
            const timeStr = d.createdAt ? formatDateTime(d.createdAt.toDate()) : 'Just now';

            if(d.senderEmail === 'system') {
                h += `
                <div class="flex justify-center my-6">
                    <div class="flex flex-col items-center max-w-[85%]">
                        <span class="bg-slate-200 text-slate-600 px-4 py-2 rounded-full text-xs font-bold text-center shadow-sm border border-slate-300">
                            <i class="fas fa-info-circle mr-1 opacity-50"></i> ${d.text}
                        </span>
                        <span class="text-[10px] text-slate-400 mt-1.5 font-medium">${timeStr}</span>
                    </div>
                </div>`; 
            } 
            else { 
                const bg = isMe ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'; 
                const senderName = isMe ? 'You' : d.senderEmail.split('@')[0];
                let cImg = '';
                if(d.imageUrls && d.imageUrls.length > 0) { 
                    d.imageUrls.forEach(url => { cImg += `<img src="${url}" class="mt-3 rounded-lg max-h-48 w-full object-cover cursor-pointer border hover:opacity-90 transition block" onclick="window.viewFullImage('${url}')">`; }); 
                } 
                else if (d.imageUrl) { 
                    cImg = `<img src="${d.imageUrl}" class="mt-3 rounded-lg max-h-48 w-full object-cover cursor-pointer border hover:opacity-90 transition block" onclick="window.viewFullImage('${d.imageUrl}')">`; 
                }

                h += `
                <div class="flex flex-col ${isMe?'items-end':'items-start'} mb-5">
                    <div class="${bg} p-4 rounded-2xl max-w-[85%] shadow-sm text-sm">
                        <div class="flex justify-between items-center gap-4 mb-1">
                            <span class="text-xs font-black opacity-80">${senderName}</span>
                            <span class="text-[9px] opacity-60">${timeStr}</span>
                        </div>
                        <div class="leading-relaxed mt-1">${d.text}</div>
                        ${cImg}
                    </div>
                </div>`; 
            }
        });
        document.getElementById('chat-messages').innerHTML = h; document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
    });
};

window.closeModal = () => { document.getElementById('ticket-modal').style.opacity = '0'; document.getElementById('modal-box').classList.replace('scale-100', 'scale-95'); setTimeout(() => { document.getElementById('ticket-modal').classList.replace('flex', 'hidden'); if(chatUnsubscribe) chatUnsubscribe(); }, 300); };

document.getElementById('comment-text').addEventListener('paste', function(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items; const dt = new DataTransfer(); let hasImage = false;
    for (let i of items) { if (i.kind === 'file' && i.type.includes('image')) { dt.items.add(i.getAsFile()); hasImage = true; } }
    if(hasImage) { document.getElementById('comment-image').files = dt.files; document.getElementById('comment-img-label').classList.replace('text-slate-500', 'text-blue-500'); Toast.fire({ icon: 'success', title: 'Images attached' }); e.preventDefault(); }
});

document.getElementById('comment-form').onsubmit = async (e) => {
    e.preventDefault(); const txt = document.getElementById('comment-text'), imgIn = document.getElementById('comment-image'), btn = document.getElementById('btn-comment-submit');
    if(!txt.value.trim() && imgIn.files.length === 0) return; btn.disabled = true;
    try { 
        let uImgs = []; 
        if (imgIn.files.length > 0) { 
            if(imgIn.files.length > 3) { Swal.fire({icon:'warning', text:'Max 3 images'}); btn.disabled = false; return; }
            for(let file of imgIn.files) { uImgs.push(await resizeAndConvertToBase64(file, 800, 800)); }
        }
        await addDoc(collection(db, "incidents", currentTicketId, "comments"), { senderEmail: auth.currentUser.email, text: txt.value, imageUrl: uImgs.length > 0 ? uImgs[0] : null, imageUrls: uImgs, createdAt: new Date() });
        document.getElementById('comment-form').reset(); document.getElementById('comment-img-label').classList.replace('text-blue-500', 'text-slate-500');
    } catch (e) { Swal.fire({ icon: 'error', text: e.message }); } finally { btn.disabled = false; }
};

window.filterTickets = (tableId, inputId) => { 
    let filter = document.getElementById(inputId).value.toUpperCase(); 
    let tr = document.getElementById(tableId).getElementsByTagName("tr"); 
    for(let i = 0; i < tr.length; i++) { 
        if(tr[i].innerText) { 
            tr[i].style.display = tr[i].innerText.toUpperCase().includes(filter) ? "" : "none"; 
        } 
    } 
};

document.getElementById('btn-logout').onclick = () => {
    Swal.fire({ title: currentLang === 'th' ? 'ออกจากระบบ?' : 'Sign Out?', icon: 'question', showCancelButton: true, confirmButtonColor: '#e11d48' })
    .then((result) => { if (result.isConfirmed) signOut(auth).then(() => window.location.href = 'index.html'); });
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        const em = user.email.toLowerCase(); const isAdmin = em === "nattezava1996@gmail.com" || em.includes("admin");
        if (isAdmin) { window.location.href = 'admin.html'; return; } 
        document.getElementById('user-email').innerText = user.email; loadDashboardData(); loadLiveChat(); window.updateDynamicDropdowns();
    } else { window.location.href = 'index.html'; } 
    window.toggleLang(currentLang);
});
