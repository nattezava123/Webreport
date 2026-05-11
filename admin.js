import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { /* นำ Config ของคุณมาใส่ */ };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });

window.globalTickets = {};
let currentTicketId = null;
let currentAdminFilter = 'All';

// นำฟังก์ชัน Utility (resizeImage, timeAgo, dict, toggle) มาแปะตรงนี้ 
// ...

function loadDashboardData() {
    const q = query(collection(db, "incidents"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        let adminHtml = "";
        let recentDashHtml = "";
        let counts = { New: 0, "In Progress": 0, Resolved: 0, Total: 0 };
        let myResolved = 0;
        let recentCount = 0;
        
        snapshot.forEach((docSnap) => {
            const t = docSnap.data();
            const id = docSnap.id;
            const displayId = "TKT-" + id.substring(0, 4).toUpperCase();
            window.globalTickets[id] = t;
            
            const safeStatus = t.status || 'New';
            const safePriority = t.priority || '';
            
            if(safeStatus === 'Resolved' && t.assignedTo === auth.currentUser.email) myResolved++;
            
            counts[safeStatus] = (counts[safeStatus] || 0) + 1;
            counts['Total']++;

            const bgColors = { 'New': 'bg-blue-100 text-blue-700', 'In Progress': 'bg-amber-100 text-amber-700', 'Resolved': 'bg-emerald-100 text-emerald-700' };
            let statusKey = 'status_' + safeStatus.toLowerCase().replace(' ', '_');
            let displayStatus = dict[currentLang][statusKey] || safeStatus;
            
            let badgeBgClass = bgColors[safeStatus] || bgColors['New'];
            let dotBgClass = safeStatus === 'New' ? 'bg-blue-500' : (safeStatus === 'In Progress' ? 'bg-amber-500' : 'bg-emerald-500');
            
            let statusHtml = `<span class="${badgeBgClass} px-3 py-1.5 rounded-md text-[10px] uppercase font-black tracking-widest flex w-fit gap-1 items-center"><span class="w-1.5 h-1.5 rounded-full ${dotBgClass}"></span><span>${displayStatus}</span></span>`;

            let priIndicator = safePriority.includes('1') ? '<i class="fas fa-fire text-rose-500 mr-2"></i>' : (safePriority.includes('2') ? '<i class="fas fa-exclamation-circle text-orange-500 mr-2"></i>' : '');
            let imgIcon = t.imageUrl ? ' <i class="fas fa-image text-blue-400 ml-1 text-[10px]"></i>' : '';

            adminHtml += `<tr class="hover:bg-slate-50 transition group border-b border-slate-50 cursor-pointer" data-status="${safeStatus}" onclick="openModal('${id}')">
                <td class="py-4 px-4 font-bold text-slate-500 text-xs">${displayId}</td>
                <td class="py-4 px-4"><div class="font-bold text-slate-800 text-sm">${priIndicator}${t.subject || 'No Subject'}${imgIcon}</div><div class="text-[10px] text-slate-400 mt-0.5">${t.callerEmail || '-'}</div></td>
                <td class="py-4 px-4 text-xs font-bold text-slate-600">${t.assignedTo ? t.assignedTo.split('@')[0].toUpperCase() : '-'}</td>
                <td class="py-4 px-4">${statusHtml}</td>
                <td class="py-4 px-4 text-right opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    <button onclick="event.stopPropagation(); editTicket('${id}')" class="w-8 h-8 bg-white border border-blue-200 text-blue-500 rounded-lg hover:bg-blue-50 transition shadow-sm mr-1"><i class="fas fa-edit text-xs"></i></button>
                    <button onclick="event.stopPropagation(); updateTicket('${id}', 'In Progress')" class="w-8 h-8 bg-white border border-amber-200 text-amber-500 rounded-lg hover:bg-amber-50 transition shadow-sm mr-1"><i class="fas fa-play text-xs"></i></button>
                    <button onclick="event.stopPropagation(); updateTicket('${id}', 'Resolved')" class="w-8 h-8 bg-white border border-emerald-200 text-emerald-500 rounded-lg hover:bg-emerald-50 transition shadow-sm mr-2"><i class="fas fa-check text-xs"></i></button>
                    <button onclick="event.stopPropagation(); deleteTicket('${id}')" class="w-8 h-8 bg-white border border-rose-200 text-rose-500 rounded-lg hover:bg-rose-50 transition shadow-sm"><i class="fas fa-trash text-xs"></i></button>
                </td></tr>`;

            if (recentCount < 5) {
                recentDashHtml += `<div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition cursor-pointer" onclick="openModal('${id}')">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500"><i class="fas fa-ticket-alt"></i></div>
                        <div><p class="text-sm font-bold text-slate-800">${t.subject || 'No Subject'}</p><p class="text-[10px] text-slate-400 font-bold uppercase">${displayId}</p></div>
                    </div>
                    ${statusHtml}
                </div>`;
                recentCount++;
            }
        });

        document.getElementById('admin-ticket-list').innerHTML = adminHtml || `<tr><td colspan="5" class="p-16 text-center text-slate-400"><i class="fas fa-inbox text-5xl mb-4 opacity-20 block"></i><p>No tickets</p></td></tr>`;
        
        document.getElementById('stat-new').innerText = counts['New'] || 0;
        document.getElementById('stat-progress').innerText = counts['In Progress'] || 0;
        document.getElementById('stat-resolved').innerText = counts['Resolved'] || 0;
        document.getElementById('stat-total').innerText = counts['Total'] || 0;
        document.getElementById('stat-admin-my-resolved').innerText = myResolved;
        document.getElementById('dash-recent-list').innerHTML = recentDashHtml;

        const userName = auth.currentUser.displayName ? auth.currentUser.displayName.split(' ')[0] : auth.currentUser.email.split('@')[0];
        document.getElementById('dash-user-name').innerText = userName.charAt(0).toUpperCase() + userName.slice(1);
        
        setAdminFilter(currentAdminFilter);
    }, (error) => console.error(error));
}

// ... นำฟังก์ชันอัปเดตตั๋ว editTicket(), updateTicket(), deleteTicket(), exportCSV(), setAdminFilter() มาแปะตรงนี้เหมือนเดิม ...
// ... นำฟังก์ชัน window.openModal และ คอมเมนต์ Chat มาแปะตรงนี้ ...

// 🛑 ดักจับสิทธิ์: ถ้าไม่ใช่ Admin จะถูกเตะออกไปหน้า index.html ทันที
onAuthStateChanged(auth, (user) => {
    if (user) {
        const safeEmail = user.email ? user.email.toLowerCase().trim() : "";
        const isAdmin = safeEmail === "nattezava1996@gmail.com" || safeEmail.includes("admin");

        if (!isAdmin) {
            Swal.fire({ icon: 'error', title: 'Access Denied', text: 'หน้านี้สำหรับเจ้าหน้าที่ IT เท่านั้น' }).then(() => {
                signOut(auth);
                window.location.href = 'index.html'; // เด้งผู้ใช้กลับหน้าธรรมดา
            });
            return;
        }

        document.getElementById('auth-view').classList.remove('active');
        document.getElementById('app-view').classList.add('active');
        document.getElementById('user-email').innerText = user.email;
        loadDashboardData();
    } else {
        document.getElementById('app-view').classList.remove('active');
        document.getElementById('auth-view').classList.add('active');
    }
});