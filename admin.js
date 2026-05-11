import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 🔥 สิ่งที่ทำให้คุณหน้าขาวคือตรงนี้ครับ ต้องใส่ Config กลับเข้ามาด้วย
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
    en: { app_name: "Factory IT Service Center", menu_group_1: "Workspace", menu_group_2: "Admin", menu_dash: "Dashboard", menu_admin: "Command Center", btn_logout: "Log Out", stat_open: "New Tickets", stat_progress: "In Progress", stat_resolved: "Resolved", stat_total: "Total Volume", admin_my_resolved: "My Resolved Tickets", btn_export: "Export CSV", dash_welcome: "Welcome,", dash_recent: "Recent Activity", dash_status: "System Status", sys_net: "Network", sys_erp: "ERP System", filter_all: "All", filter_active: "Active", filter_resolved: "Resolved", empty_recent: "All caught up!", status_new: "New", status_in_progress: "In Progress", status_resolved: "Resolved" },
    th: { app_name: "ศูนย์บริการไอทีโรงงาน", menu_group_1: "พื้นที่ทำงาน", menu_group_2: "ผู้ดูแลระบบ", menu_dash: "ภาพรวมระบบ", menu_admin: "ศูนย์จัดการงาน", btn_logout: "ออกจากระบบ", stat_open: "รอดำเนินการ", stat_progress: "กำลังแก้ไข", stat_resolved: "ปิดงานแล้ว", stat_total: "จำนวนทั้งหมด", admin_my_resolved: "งานที่ฉันปิดแล้ว", btn_export: "ดาวน์โหลด CSV", dash_welcome: "ยินดีต้อนรับ,", dash_recent: "รายการอัปเดตล่าสุด", dash_status: "สถานะระบบโรงงาน", sys_net: "ระบบเครือข่าย", sys_erp: "ระบบ ERP", filter_all: "ทั้งหมด", filter_active: "กำลังดำเนินการ", filter_resolved: "ปิดงานแล้ว", empty_recent: "จัดการครบหมดแล้ว!", status_new: "เปิดใหม่", status_in_progress: "กำลังทำ", status_resolved: "ปิดงานแล้ว" }
};

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
    ['app'].forEach(v => {
        const en = document.getElementById(`lang-en-${v}`), th = document.getElementById(`lang-th-${v}`);
        if(en && th) { en.className = (lang==='en') ? "px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold" : "px-4 py-1.5 text-slate-500 rounded-full text-xs font-bold"; th.className = (lang==='th') ? "px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold" : "px-4 py-1.5 text-slate-500 rounded-full text-xs font-bold"; }
    });
};

window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-link').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`tab-${tabName}`); if(target) target.classList.add('active');
    document.querySelector(`.menu-link[onclick*="'${tabName}'"]`)?.classList.add('active');
    document.getElementById('page-title').innerText = dict[currentLang][`menu_${tabName}`] || dict[currentLang].app_name;
    if(window.innerWidth <= 768 && document.getElementById('sidebar').classList.contains('open')) window.toggleMobileMenu();
};

window.viewFullImage = (url) => { Swal.fire({ imageUrl: url, imageAlt: 'Attached Image', width: 'auto', padding: '1rem', showConfirmButton: false, showCloseButton: true, customClass: { image: 'rounded-xl max-h-[80vh] object-contain' } }); };

function loadDashboardData() {
    onSnapshot(query(collection(db, "incidents"), orderBy("createdAt", "desc")), (snapshot) => {
        let adminHtml = "", recentDashHtml = "", counts = { New: 0, "In Progress": 0, Resolved: 0, Total: 0 }, myResolved = 0, recentCount = 0;
        
        snapshot.forEach((docSnap) => {
            const t = docSnap.data(), id = docSnap.id, displayId = "TKT-" + id.substring(0, 4).toUpperCase();
            window.globalTickets[id] = t;
            
            const safeStatus = t.status || 'New', safePriority = t.priority || '';
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

            if (recentCount < 5) {
                recentDashHtml += `<div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition cursor-pointer" onclick="window.openModal('${id}')"><div class="flex items-center gap-4"><div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500"><i class="fas fa-ticket-alt"></i></div><div><p class="text-sm font-bold text-slate-800">${t.subject}</p><p class="text-[10px] text-slate-400 font-bold uppercase">${displayId}</p></div></div>${statusHtml}</div>`;
                recentCount++;
            }
        });

        document.getElementById('admin-ticket-list').innerHTML = adminHtml || `<tr><td colspan="5" class="p-16 text-center text-slate-400"><i class="fas fa-inbox text-5xl mb-4 opacity-20 block"></i><p>No tickets</p></td></tr>`;
        document.getElementById('stat-new').innerText = counts['New'] || 0; document.getElementById('stat-progress').innerText = counts['In Progress'] || 0; document.getElementById('stat-resolved').innerText = counts['Resolved'] || 0; document.getElementById('stat-total').innerText = counts['Total'] || 0; document.getElementById('stat-admin-my-resolved').innerText = myResolved;
        document.getElementById('dash-recent-list').innerHTML = recentDashHtml || `<div class="p-8 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl"><p class="text-xs font-bold uppercase">${dict[currentLang].empty_recent}</p></div>`;
        const u = auth.currentUser.email.split('@')[0]; document.getElementById('dash-user-name').innerText = u.charAt(0).toUpperCase() + u.slice(1);
        
        window.setAdminFilter(currentAdminFilter);
    });
}

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

document.getElementById('btn-logout').onclick = () => {
    Swal.fire({ title: 'Sign Out?', icon: 'question', showCancelButton: true, confirmButtonColor: '#e11d48' })
    .then((result) => { if (result.isConfirmed) signOut(auth); });
};

// 🛑 ตรวจสอบสิทธิ์: ถ้าเข้ามาแล้วไม่ได้ล็อกอิน หรือไม่ใช่แอดมิน ให้เด้งกลับหน้า index.html
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
        // ถ้ายังไม่ได้ล็อกอิน ให้เด้งไปหน้า index.html เพื่อล็อกอินก่อน
        window.location.href = 'index.html';
    }
    window.toggleLang(currentLang);
});
