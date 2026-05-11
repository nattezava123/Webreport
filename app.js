import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const googleProvider = new GoogleAuthProvider();

let isLoginMode = true;
let currentLang = localStorage.getItem('appLang') || 'en';

const dict = {
    en: { app_name: "Factory IT Service Center", title_register: "Create an Account", sub_register: "Fill in your details to get started.", auth_sub: "Enterprise Service Desk", name: "Full Name", email: "Email", password: "Password", confirm_password: "Confirm Password", btn_signin: "Sign In", no_account: "New here?", btn_register: "Create an account", btn_google: "Continue with Google" },
    th: { app_name: "ศูนย์บริการไอทีโรงงาน", title_register: "สร้างบัญชีใหม่", sub_register: "กรอกข้อมูลด้านล่างเพื่อสมัครสมาชิก", auth_sub: "ระบบแจ้งซ่อมไอที", name: "ชื่อ-นามสกุล", email: "อีเมล", password: "รหัสผ่าน", confirm_password: "ยืนยันรหัสผ่าน", btn_signin: "เข้าสู่ระบบ", no_account: "ยังไม่มีบัญชี?", btn_register: "สมัครสมาชิก", btn_google: "ด้วย Google" }
};

window.toggleLang = (lang) => {
    currentLang = lang; localStorage.setItem('appLang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n'); if(dict[lang][k]) el.innerText = dict[lang][k]; });
    const en = document.getElementById(`lang-en-auth`), th = document.getElementById(`lang-th-auth`);
    if(en && th) { en.className = (lang==='en') ? "px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold shadow-lg" : "px-4 py-1.5 text-slate-500 rounded-full text-xs font-bold"; th.className = (lang==='th') ? "px-4 py-1.5 bg-white text-blue-600 rounded-full text-xs font-bold shadow-lg" : "px-4 py-1.5 text-slate-500 rounded-full text-xs font-bold"; }
};

window.toggleAuthMode = () => { 
    isLoginMode = !isLoginMode; 
    const titleEl = document.getElementById('auth-title'), subEl = document.getElementById('auth-subtitle'), nameField = document.getElementById('field-name'), confirmField = document.getElementById('field-confirm');
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

document.getElementById('auth-form').onsubmit = async (e) => {
    e.preventDefault(); 
    const em = document.getElementById('auth-email').value, ps = document.getElementById('auth-password').value;
    const btn = document.getElementById('auth-submit-btn'); const originalText = btn.innerText;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, em, ps);
        } else {
            const name = document.getElementById('auth-name').value, confirmPs = document.getElementById('auth-confirm-password').value;
            if (ps !== confirmPs) throw new Error(currentLang === 'th' ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match");
            if (ps.length < 6) throw new Error(currentLang === 'th' ? "รหัสผ่านต้องมี 6 ตัวอักษรขึ้นไป" : "Password must be at least 6 characters");
            const userCredential = await createUserWithEmailAndPassword(auth, em, ps);
            await updateProfile(userCredential.user, { displayName: name });
        }
    } catch (error) { Swal.fire({ icon: 'error', text: error.message, confirmButtonColor: '#3b82f6' }); btn.disabled = false; btn.innerText = originalText; }
};

window.loginWithGoogle = () => signInWithPopup(auth, googleProvider).catch(e => Swal.fire({ icon: 'error', text: e.message }));

// 🔥 ถ้าระบบจำได้ว่าล็อกอินอยู่แล้ว ให้เด้งไปหน้าใช้งานเลย
onAuthStateChanged(auth, (user) => {
    if (user) {
        const em = user.email.toLowerCase(); 
        const isAdmin = em === "nattezava1996@gmail.com" || em.includes("admin");
        if (isAdmin) {
            window.location.href = 'admin.html'; // เด้งไปหน้าแอดมิน
        } else {
            window.location.href = 'user.html'; // เด้งไปหน้าพนักงานทั่วไป
        }
    }
    window.toggleLang(currentLang);
});
