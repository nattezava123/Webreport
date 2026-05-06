import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.globalTickets = {};
window.currentTicketId = null;

// Auth State Check globally
onAuthStateChanged(auth, user => {
    const isLogin = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    if(!user && !isLogin) window.location.href = 'index.html';
    if(user && isLogin) window.location.href = 'dashboard.html';

    if(user) {
        if(document.getElementById('user-email')) document.getElementById('user-email').innerText = user.email;
        if(user.email === 'nattezava1996@gmail.com' || user.email.includes('admin')) {
            if(document.getElementById('admin-menu')) document.getElementById('admin-menu').classList.remove('hidden');
            if(document.getElementById('user-role')) {
                document.getElementById('user-role').innerText = 'IT Admin';
                document.getElementById('user-role').classList.replace('text-blue-400', 'text-rose-400');
            }
        }
    }
});

if(document.getElementById('logout-btn')) {
    document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.href = 'index.html');
}

// Global Ticket Loading for My Tickets and Admin (and Dash stats)
export function loadTickets(isAdminView, tableId) {
    onSnapshot(query(collection(db, "incidents"), orderBy("createdAt", "desc")), (snap) => {
        let html = "";
        let newCount=0, progCount=0, resCount=0;
        snap.forEach(docSnap => {
            const t = docSnap.data();
            const id = docSnap.id;
            window.globalTickets[id] = t;
            
            if(t.status === 'New') newCount++;
            if(t.status === 'In Progress') progCount++;
            if(t.status === 'Resolved') resCount++;

            const isMyTicket = t.callerEmail === (auth.currentUser ? auth.currentUser.email : '');
            
            if(isAdminView || isMyTicket) {
                const bColor = t.status === 'New' ? 'bg-blue-100 text-blue-600' : (t.status === 'In Progress' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600');
                
                html += `<tr class="hover:bg-slate-50 transition cursor-pointer border-b border-slate-50" onclick="openModal('${id}')">
                    <td class="p-6 font-bold text-xs text-slate-400">TKT-${id.substring(0,4).toUpperCase()}</td>
                    <td class="p-6 font-bold text-sm text-slate-800">${t.subject}</td>
                    <td class="p-6 text-sm text-slate-500">${t.brokenItem || '-'}</td>`;
                
                if(isAdminView) html += `<td class="p-6 text-xs text-slate-500">${t.callerEmail}</td>`;
                
                html += `<td class="p-6"><span class="px-3 py-1.5 rounded-md text-[10px] uppercase font-black tracking-widest ${bColor}">${t.status}</span></td>`;
                
                if(isAdminView) {
                    html += `<td class="p-6">
                        <button onclick="event.stopPropagation(); updateTkt('${id}', 'In Progress')" class="mr-2 text-amber-500"><i class="fas fa-play"></i></button>
                        <button onclick="event.stopPropagation(); updateTkt('${id}', 'Resolved')" class="text-emerald-500"><i class="fas fa-check"></i></button>
                    </td>`;
                }
                html += `</tr>`;
            }
        });
        
        if(document.getElementById(tableId)) document.getElementById(tableId).innerHTML = html || `<tr><td colspan="6" class="p-8 text-center text-slate-400">No tickets found.</td></tr>`;
        
        // Update dashboard stats if they exist
        if(document.getElementById('stat-total')) document.getElementById('stat-total').innerText = snap.size;
        if(document.getElementById('stat-new')) document.getElementById('stat-new').innerText = newCount;
        if(document.getElementById('stat-progress')) document.getElementById('stat-progress').innerText = progCount;
        if(document.getElementById('stat-resolved')) document.getElementById('stat-resolved').innerText = resCount;
    });
}

window.updateTkt = (id, status) => { updateDoc(doc(db, "incidents", id), { status: status }); };

// Modal System (Details & Chat)
let chatUnsub = null;
window.openModal = (id) => {
    window.currentTicketId = id;
    const t = window.globalTickets[id];
    document.getElementById('modal-id').innerText = "TKT-" + id.substring(0,4).toUpperCase();
    document.getElementById('modal-subject').innerText = t.subject;
    document.getElementById('modal-item').innerText = t.brokenItem || '-';
    document.getElementById('modal-desc').innerText = t.description;
    
    document.getElementById('ticket-modal').classList.remove('hidden');
    setTimeout(() => { document.getElementById('modal-box').classList.remove('scale-95'); document.getElementById('modal-box').classList.add('scale-100'); }, 10);
    
    // Load Comments
    chatUnsub = onSnapshot(query(collection(db, "incidents", id, "comments"), orderBy("createdAt", "asc")), (snap) => {
        let html = "";
        snap.forEach(docSnap => {
            const d = docSnap.data();
            if(d.senderEmail === 'system') {
                html += `<div class="text-center text-xs text-slate-400 my-2">${d.text}</div>`;
            } else {
                const isMe = d.senderEmail === auth.currentUser.email;
                html += `<div class="flex flex-col ${isMe?'items-end':'items-start'} mb-4">
                    <div class="px-4 py-2 rounded-xl text-sm ${isMe?'bg-blue-600 text-white rounded-br-none':'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'}">
                        <div class="text-[10px] opacity-70 mb-1">${isMe?'You':d.senderEmail.split('@')[0]}</div>${d.text}
                    </div></div>`;
            }
        });
        document.getElementById('chat-messages').innerHTML = html;
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
    });
};

window.closeModal = () => {
    document.getElementById('modal-box').classList.remove('scale-100'); document.getElementById('modal-box').classList.add('scale-95');
    setTimeout(() => document.getElementById('ticket-modal').classList.add('hidden'), 300);
    if(chatUnsub) chatUnsub();
};

if(document.getElementById('comment-form')) {
    document.getElementById('comment-form').onsubmit = async (e) => {
        e.preventDefault();
        const input = document.getElementById('comment-text');
        const text = input.value.trim();
        if(!text) return;
        input.value = '';
        await addDoc(collection(db, "incidents", window.currentTicketId, "comments"), { senderEmail: auth.currentUser.email, text: text, createdAt: new Date() });
    };
}
