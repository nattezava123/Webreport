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

// นำฟังก์ชัน Utility (resizeImage, timeAgo, dict, toggle, switchTab, botDatabase, sendAIMessage) มาแปะตรงนี้ (คัดลอกจากไฟล์เดิมได้เลย)
// ...

window.globalTickets = {};
let currentTicketId = null;
let chatUnsubscribe = null;
let isLoginMode = true;

function loadDashboardData() {
    const q = query(collection(db, "incidents"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        let userHtml = "";
        let recentDashHtml = "";
        let counts = { New: 0, "In Progress": 0, Resolved: 0, Total: 0 };
        let recentCount = 0;
        
        const emptyState = `<tr><td colspan="4" class="p-16 text-center text-slate-400"><i class="fas fa-inbox text-5xl mb-4 opacity-20 block"></i><p class="font-medium text-sm" data-i18n="empty_tickets">${dict[currentLang].empty_tickets}</p></td></tr>`;
        const emptyRecent = `<div class="p-8 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl"><i class="fas fa-check-circle text-4xl mb-3 opacity-20 block"></i><p class="text-xs font-bold uppercase tracking-widest" data-i18n="empty_recent">${dict[currentLang].empty_recent}</p></div>`;
        
        snapshot.forEach((docSnap) => {
            const t = docSnap.data();
            const id = docSnap.id;
            const displayId = "TKT-" + id.substring(0, 4).toUpperCase();
            window.globalTickets[id] = t;
            
            const isMyTicket = t.callerEmail === auth.currentUser.email;
            if (!isMyTicket) return; // เฉพาะหน้า User โชว์แค่ตั๋วตัวเอง
            
            const safeStatus = t.status || 'New';
            const safePriority = t.priority || '';
            
            counts[safeStatus] = (counts[safeStatus] || 0) + 1;
            counts['Total']++;

            const bgColors = { 'New': 'bg-blue-100 text-blue-700', 'In Progress': 'bg-amber-100 text-amber-700', 'Resolved': 'bg-emerald-100 text-emerald-700' };
            let statusKey = 'status_' + safeStatus.toLowerCase().replace(' ', '_');
            let displayStatus = dict[currentLang][statusKey] || safeStatus;
            
            let badgeBgClass = bgColors[safeStatus] || bgColors['New'];
            let dotBgClass = safeStatus === 'New' ? 'bg-blue-500' : (safeStatus === 'In Progress' ? 'bg-amber-500' : 'bg-emerald-500');
            
            let statusHtml = `<span class="${badgeBgClass} px-3 py-1.5 rounded-md text-[10px] uppercase font-black tracking-widest flex w-fit gap-1 items-center"><span class="w-1.5 h-1.5 rounded-full ${dotBgClass}"></span><span data-i18n="${statusKey}">${displayStatus}</span></span>`;

            let priIndicator = safePriority.includes('1') ? '<i class="fas fa-fire text-rose-500 mr-2"></i>' : (safePriority.includes('2') ? '<i class="fas fa-exclamation-circle text-orange-500 mr-2"></i>' : '');
            let imgIcon = t.imageUrl ? ' <i class="fas fa-image text-blue-400 ml-1 text-[10px]"></i>' : '';

            userHtml += `<tr class="hover:bg-slate-50 transition group border-b border-slate-50 cursor-pointer" onclick="openModal('${id}')">
                <td class="py-4 px-6 font-bold text-slate-500 text-xs">${displayId}</td>
                <td class="py-4 px-6"><div class="font-bold text-slate-800 text-sm">${priIndicator}${t.subject || 'No Subject'}${imgIcon}</div></td>
                <td class="py-4 px-6">${statusHtml}</td>
                <td class="py-4 px-6 text-right text-xs text-slate-500">${timeAgo(t.createdAt?.toDate())}</td>
            </tr>`;

            if (recentCount < 5) {
                recentDashHtml += `
                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition cursor-pointer" onclick="openModal('${id}')">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500"><i class="fas fa-ticket-alt"></i></div>
                        <div>
                            <p class="text-sm font-bold text-slate-800">${t.subject || 'No Subject'}</p>
                            <p class="text-[10px] text-slate-400 font-bold uppercase">${displayId} • ${timeAgo(t.createdAt?.toDate())}</p>
                        </div>
                    </div>
                    ${statusHtml}
                </div>`;
                recentCount++;
            }
        });

        document.getElementById('user-ticket-list').innerHTML = userHtml || emptyState;
        document.getElementById('stat-new').innerText = counts['New'] || 0;
        document.getElementById('stat-progress').innerText = counts['In Progress'] || 0;
        document.getElementById('stat-resolved').innerText = counts['Resolved'] || 0;
        document.getElementById('stat-total').innerText = counts['Total'] || 0;
        document.getElementById('dash-recent-list').innerHTML = recentDashHtml || emptyRecent;

        const userName = auth.currentUser.displayName ? auth.currentUser.displayName.split(' ')[0] : auth.currentUser.email.split('@')[0];
        document.getElementById('dash-user-name').innerText = userName.charAt(0).toUpperCase() + userName.slice(1);
    }, (error) => console.error("Firebase Listener Error:", error));
}

// ... ใส่โค้ด document.getElementById('create-ticket-form').onsubmit ของเดิมมาตรงนี้ ...
// ... ใส่โค้ด window.openModal และ การส่งคอมเมนต์ (Chat) แบบเดิมมาตรงนี้ ...

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-view').classList.remove('active');
        document.getElementById('app-view').classList.add('active');
        document.getElementById('user-email').innerText = user.email;
        
        const roleElement = document.getElementById('user-role');
        roleElement.setAttribute('data-i18n', 'role_user');
        roleElement.classList.add('text-blue-400'); 
        
        loadDashboardData();
        window.updatePriorityDesc();
    } else {
        document.getElementById('app-view').classList.remove('active');
        document.getElementById('auth-view').classList.add('active');
    }
    toggleLang(currentLang); 
});