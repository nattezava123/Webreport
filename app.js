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
// ส่วนที่ 1: ตัวแปรและฟังก์ชัน Utility (ต้องผูกกับ window ทั้งหมด)
// ==========================================
window.globalTickets = {};
let currentTicketId = null;
let chatUnsubscribe = null;
let isLoginMode = true;
let currentLang = localStorage.getItem('appLang') || 'en';

const dict = {
    en: { page_title: "Factory IT Service Center", app_name: "Factory IT Service Center", app_name_short: "Factory IT", auth_sub: "Enterprise Service Desk", email: "Email", password: "Password", btn_signin: "Sign In", no_account: "New here?", btn_register: "Create an account", auth_or: "OR", btn_google: "Continue with Google", role_user: "User", menu_group_1: "Workspace", menu_dash: "Dashboard", menu_incidents: "My Tickets", menu_create: "Create Ticket", btn_logout: "Log Out", stat_open: "New Tickets", stat_progress: "In Progress", stat_resolved: "Resolved", stat_total: "Total Volume", th_subject: "Subject", th_status: "Status", th_date: "Timeline", btn_submit: "Submit Request", search_placeholder: "Search...", btn_new_ticket: "Create", form_title: "How can we help?", form_sub: "Support request details.", form_cat: "Category", form_pri: "Priority", form_short: "Subject", form_desc: "Description", form_loc_head: "Location", form_bldg: "Bldg", form_floor: "Floor", form_dept: "Dept", form_line: "Line", form_item: "Item", modal_loc: "Loc & Item", dash_welcome: "Welcome,", dash_sub: "IT support summary.", dash_recent: "Activity", btn_view_all: "All", dash_status: "Status", dash_status_sub: "Running smoothly.", sys_net: "Network", sys_erp: "ERP", cat_hw: "❖ Hardware", cat_sw: "❖ Software", cat_nw: "❖ Network", filter_all: "All", filter_active: "Active", filter_resolved: "Resolved", status_new: "New", status_in_progress: "In Progress", status_resolved: "Resolved", empty_tickets: "None", empty_recent: "Clear!" },
    th: { page_title: "ศูนย์บริการไอทีโรงงาน", app_name: "ศูนย์บริการไอทีโรงงาน", app_name_short: "ศูนย์บริการไอที", auth_sub: "ระบบแจ้งซ่อมไอที", email: "อีเมล", password: "รหัสผ่าน", btn_signin: "เข้าสู่ระบบ", no_account: "ยังไม่มีบัญชี?", btn_register: "สมัครสมาชิก", auth_or: "หรือ", btn_google: "ด้วย Google", role_user: "ผู้แจ้ง", menu_group_1: "พื้นที่ทำงาน", menu_dash: "ภาพรวมระบบ", menu_incidents: "ตั๋วของฉัน", menu_create: "แจ้งปัญหาใหม่", btn_logout: "ออกจากระบบ", stat_open: "รอดำเนินการ", stat_progress: "กำลังแก้ไข", stat_resolved: "ปิดงานแล้ว", stat_total: "ทั้งหมด", th_subject: "หัวข้อ", th_status: "สถานะ", th_date: "ล่าสุด", btn_submit: "ส่งเรื่องแจ้งซ่อม", search_placeholder: "ค้นหา...", btn_new_ticket: "สร้างใหม่", form_title: "มีอะไรให้ช่วยไหม?", form_sub: "ระบุรายละเอียดเพื่อแจ้งซ่อม", form_cat: "หมวดหมู่", form_pri: "ความเร่งด่วน", form_short: "หัวข้อ", form_desc: "รายละเอียด", form_loc_head: "สถานที่", form_bldg: "ตึก", form_floor: "ชั้น", form_dept: "แผนก", form_line: "ไลน์", form_item: "ของที่เสีย", modal_loc: "สถานที่และของ", dash_welcome: "ยินดีต้อนรับ,", dash_sub: "สรุปภาพรวมวันนี้", dash_recent: "อัปเดตล่าสุด", btn_view_all: "ดูทั้งหมด", dash_status: "สถานะระบบ", dash_status_sub: "ทำงานปกติ", sys_net: "เครือข่าย", sys_erp: "ระบบ ERP", cat_hw: "❖ ฮาร์ดแวร์", cat_sw: "❖ ซอฟต์แวร์", cat_nw: "❖ เครือข่าย", filter_all: "ทั้งหมด", filter_active: "กำลังดำเนินการ", filter_resolved: "ปิดงานแล้ว", status_new: "เปิดใหม่", status_in_progress: "กำลังทำ", status_resolved: "ปิดงานแล้ว", empty_tickets: "ไม่พบข้อมูล", empty_recent: "จัดการครบแล้ว!" }
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
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { const k = el.getAttribute('data-i18n-placeholder'); if(dict[lang][k]) el.placeholder = dict[lang][k]; });
    window.updatePriorityDesc(); 
    ['auth', 'app'].forEach(v => {
        const en = document.getElementById(`lang-en-${v}`), th = document.getElementById(`lang-th-${v}`);
        if(en && th) { en.className = (lang==='en' && v==='app') ? "px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold" : (lang==='en'?"px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold":"px-4 py-1.5 text-slate-500 rounded-full text-xs font-bold"); th.className = (lang==='th' && v==='app') ? "px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold" : (lang==='th'?"px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold":"px-4 py-1.5 text-slate-500 rounded-full text-xs font-bold"); }
    });
    let activeTab = document.querySelector('.tab-content.active');
    if(activeTab) document.getElementById('page-title').innerText = dict[lang][`menu_${activeTab.id.replace('tab-', '')}`] || dict[lang].app_name;
};

window.updatePriorityDesc = () => {
    const s = document.getElementById('tk-priority'); if(!s) return; const v = s.value;
    const txt = currentLang === 'th' ? { "3 - Moderate": "● กระทบระดับแผนก - SLA: 24 ชม.", "1 - Critical": "● ระบบหลักล่ม - SLA: 1 ชม." } : { "3 - Moderate": "● Department impact - SLA: 24h", "1 - Critical": "● Critical - SLA: 1h" };
    const priorityText = document.getElementById('priority-text'); if(priorityText) priorityText.innerText = txt[v] || v;
};

window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-link').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`tab-${tabName}`); if(target) target.classList.add('active');
    document.querySelector(`.menu-link[onclick*="'${tabName}'"]`)?.classList.add('active');
    document.getElementById('page-title').innerText = dict[currentLang][`menu_${tabName}`] || dict[currentLang].app_name;
    if(window.innerWidth <= 768 && document.getElementById('sidebar').classList.contains('open')) window.toggleMobileMenu();
};

window.toggleAuthMode = () => { isLoginMode = !isLoginMode; document.getElementById('auth-submit-btn').innerText = isLoginMode ? dict[currentLang].btn_signin : dict[currentLang].btn_register; };

// AI 
window.openAIModal = () => { document.getElementById('ai-modal').classList.replace('hidden', 'flex'); setTimeout(() => { document.getElementById('ai-modal').style.opacity = '1'; document.getElementById('ai-box').classList.replace('scale-95', 'scale-100'); }, 10); };
window.closeAIModal = () => { document.getElementById('ai-modal').style.opacity = '0'; document.getElementById('ai-box').classList.replace('scale-100', 'scale-95'); setTimeout(() => document.getElementById('ai-modal').classList.replace('flex', 'hidden'), 300); };
window.sendAIMessage = () => {
    const i = document.getElementById('ai-input'), b = document.getElementById('ai-chat-box'), t = i.value.trim(); if(!t) return;
    b.insertAdjacentHTML('beforeend', `<div class="flex flex-row-reverse gap-4 mb-6"><div class="bg-indigo-600 text-white p-4 rounded-2xl text-sm">${t}</div></div>`); i.value = '';
    setTimeout(() => { b.insertAdjacentHTML('beforeend', `<div class="flex gap-4 mb-6"><div class="bg-white border p-4 rounded-2xl text-sm text-slate-700">สวัสดีครับ ผม Serviceman ยินดีช่วยตรวจสอบครับ</div></div>`); b.scrollTop = b.scrollHeight; }, 600);
};

// Data
function loadDashboardData() {
    onSnapshot(query(collection(db, "incidents"), orderBy("createdAt", "desc")), (snapshot) => {
        let userHtml = "", recentHtml = "", counts = { New: 0, "In Progress": 0, Resolved: 0, Total: 0 };
        snapshot.forEach((docSnap) => {
            const t = docSnap.data(), id = docSnap.id; window.globalTickets[id] = t;
            if (t.callerEmail !== auth.currentUser.email) return;
            counts[t.status]++; counts.Total++;
            userHtml += `<tr class="border-b cursor-pointer" onclick="window.openModal('${id}')"><td class="p-4 font-bold text-xs">${id.substring(0,4)}</td><td class="p-4 font-bold text-sm">${t.subject}</td><td class="p-4 text-xs">${t.status}</td><td class="p-4 text-right text-xs text-slate-500">${timeAgo(t.createdAt?.toDate())}</td></tr>`;
        });
        document.getElementById('user-ticket-list').innerHTML = userHtml;
        document.getElementById('stat-new').innerText = counts.New || 0; document.getElementById('stat-progress').innerText = counts["In Progress"] || 0;
        document.getElementById('stat-resolved').innerText = counts.Resolved || 0; document.getElementById('stat-total').innerText = counts.Total || 0;
        const u = auth.currentUser.email.split('@')[0]; document.getElementById('dash-user-name').innerText = u.charAt(0).toUpperCase() + u.slice(1);
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

window.openModal = (id) => {
    currentTicketId = id; const t = window.globalTickets[id];
    document.getElementById('modal-id').innerText = id.substring(0,4); document.getElementById('modal-subject').innerText = t.subject;
    document.getElementById('modal-location').innerText = `Bldg: ${t.building}, Floor: ${t.floor}`;
    document.getElementById('modal-broken-item').innerText = t.brokenItem; document.getElementById('modal-desc').innerText = t.description;
    document.getElementById('modal-caller').innerText = t.callerEmail; document.getElementById('modal-date').innerText = t.createdAt?.toDate().toLocaleString();
    if(t.imageUrl) { document.getElementById('modal-image').src = t.imageUrl; document.getElementById('modal-image-container').classList.remove('hidden'); } else { document.getElementById('modal-image-container').classList.add('hidden'); }
    
    document.getElementById('ticket-modal').classList.replace('hidden', 'flex'); setTimeout(() => { document.getElementById('ticket-modal').style.opacity = '1'; document.getElementById('modal-box').classList.replace('scale-95', 'scale-100'); }, 10);
    if(chatUnsubscribe) chatUnsubscribe();
    chatUnsubscribe = onSnapshot(query(collection(db, "incidents", id, "comments"), orderBy("createdAt", "asc")), (snap) => {
        let h = ""; snap.forEach(d => { const msg = d.data(); h += `<div class="p-2 border rounded-xl bg-white text-sm mb-2"><b>${msg.senderEmail.split('@')[0]}:</b> ${msg.text}</div>`; });
        document.getElementById('chat-messages').innerHTML = h; document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
    });
};

window.closeModal = () => { document.getElementById('ticket-modal').style.opacity = '0'; document.getElementById('modal-box').classList.replace('scale-100', 'scale-95'); setTimeout(() => { document.getElementById('ticket-modal').classList.replace('flex', 'hidden'); if(chatUnsubscribe) chatUnsubscribe(); }, 300); };

document.getElementById('comment-form').onsubmit = async (e) => {
    e.preventDefault(); const t = document.getElementById('comment-text'); if(!t.value) return;
    await addDoc(collection(db, "incidents", currentTicketId, "comments"), { senderEmail: auth.currentUser.email, text: t.value, createdAt: new Date() });
    t.value = '';
};

document.getElementById('auth-form').onsubmit = (e) => {
    e.preventDefault(); const em = document.getElementById('auth-email').value, ps = document.getElementById('auth-password').value;
    (isLoginMode ? signInWithEmailAndPassword(auth, em, ps) : createUserWithEmailAndPassword(auth, em, ps)).catch(e => Swal.fire({ icon: 'error', text: e.message }));
};

window.loginWithGoogle = () => signInWithPopup(auth, googleProvider);

onAuthStateChanged(auth, (user) => {
    if (user) {
        const em = user.email.toLowerCase(); const isAdmin = em === "nattezava1996@gmail.com" || em.includes("admin");
        if (isAdmin) { window.location.href = 'admin.html'; return; }
        document.getElementById('auth-view').classList.remove('active'); document.getElementById('app-view').classList.add('active');
        document.getElementById('user-email').innerText = user.email; loadDashboardData();
    } else {
        document.getElementById('app-view').classList.remove('active'); document.getElementById('auth-view').classList.add('active');
    }
    window.toggleLang(currentLang);
});
