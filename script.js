// --- 1. ระบบจัดการฐานข้อมูลจำลอง (Safe Init) ---
function initData() {
    if(!localStorage.getItem('carma_checks')) localStorage.setItem('carma_checks', JSON.stringify([]));
    if(!localStorage.getItem('carma_repairs')) localStorage.setItem('carma_repairs', JSON.stringify([]));
    if(!localStorage.getItem('carma_cars')) {
        localStorage.setItem('carma_cars', JSON.stringify([
            {car_id: "1231", license: "ตอม4448", color: "ขาว"},
            {car_id: "1232", license: "รวย8887", color: "ขาว"}
        ]));
    }
    
    // ตรวจสอบและสร้าง User ป้องกันการหายตอนรีเฟรช
    let users = JSON.parse(localStorage.getItem('carma_users')) || [];
    if(!users.some(u => u.user === 'admin')) {
        users.push({id: "ADM-001", fname: "อลิส", lname: "มาร์ติน", user: "admin", pass: "admin123", role: "admin"});
    }
    if(!users.some(u => u.user === 'user')) {
        users.push({id: "EMP-001", fname: "คาลอส", lname: "ไดรอน", user: "user", pass: "user123", role: "staff"});
    }
    localStorage.setItem('carma_users', JSON.stringify(users));
}
initData();

let currentRole = null;
let currentUserName = null;
let deleteType = null;
let deleteId = null;

// --- 2. ระบบค้นหา (ใช้ได้ทุกตาราง) ---
function filterTable(inputId, tableId) {
    let input = document.getElementById(inputId).value.toLowerCase();
    let trs = document.getElementById(tableId).getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    for (let i = 0; i < trs.length; i++) {
        trs[i].style.display = trs[i].innerText.toLowerCase().includes(input) ? '' : 'none';
    }
}

// --- 3. Login System ---
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let userIn = document.getElementById('username').value.trim();
    let passIn = document.getElementById('password').value.trim();
    let users = JSON.parse(localStorage.getItem('carma_users'));
    let foundUser = users.find(u => u.user === userIn && u.pass === passIn);

    if(foundUser) {
        currentRole = foundUser.role;
        currentUserName = `${foundUser.fname} ${foundUser.lname}`;
        document.getElementById('login-view').classList.remove('active');
        
        if(currentRole === 'staff') {
            document.getElementById('staff-view').classList.add('active');
            document.getElementById('staff-user-name').innerText = currentUserName;
            document.getElementById('repair-name').value = currentUserName;
            showView('staff-check');
        } else {
            document.getElementById('admin-view').classList.add('active');
            showAdminView('admin-dashboard');
        }
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
});

// --- 4. Navigation Views ---
function showView(section) {
    document.querySelectorAll('#staff-view .content-section').forEach(sec => sec.style.display = 'none');
    document.querySelectorAll('#staff-view .sidebar-menu-link').forEach(link => link.classList.remove('active'));
    document.getElementById(section + '-content').style.display = 'block';
    document.getElementById(section + '-menu').classList.add('active');

    if(section === 'staff-check') loadStaffCheckItems();
    if(section === 'staff-status') loadStaffStatusTable();
    
    let titles = {
        'staff-check': { t: 'บันทึกการตรวจเช็คสภาพรถยนต์', d: 'กรอกข้อมูลและตรวจสอบสภาพรถ', i: 'fa-clipboard-check' },
        'staff-repair': { t: 'แจ้งข้อมูลการซ่อม', d: 'ระบุอาการเสียและขออนุมัติซ่อม', i: 'fa-tools' },
        'staff-status': { t: 'ตรวจสอบสถานะรายการ', d: 'ติดตามสถานะการทำงานของคุณ', i: 'fa-tasks' }
    };
    document.getElementById('staff-content-title').innerText = titles[section].t;
    document.getElementById('staff-content-desc').innerText = titles[section].d;
    document.getElementById('staff-header-icon').className = 'fas ' + titles[section].i;
}

function showAdminView(section) {
    document.querySelectorAll('#admin-view .content-section').forEach(sec => sec.style.display = 'none');
    document.querySelectorAll('#admin-view .sidebar-menu-link').forEach(link => link.classList.remove('active'));
    document.getElementById(section + '-content').style.display = 'block';
    document.getElementById(section + '-menu').classList.add('active');

    if(section === 'admin-dashboard') loadAdminDashboard();
    if(section === 'admin-users') loadAdminUsersTable();
    if(section === 'admin-cars') loadAdminCarsTable();
    if(section === 'admin-repairs') loadAdminRepairsTable();
    if(section === 'admin-reports') loadAdminReportsTable();
    
    let titles = {
        'admin-dashboard': {t: 'แดชบอร์ดภาพรวม', d: 'สถิติและสถานะการทำงานทั้งหมด', i: 'fa-tachometer-alt'},
        'admin-users': {t: 'จัดการข้อมูลผู้ใช้งาน', d: 'บริหารจัดการบัญชีพนักงาน', i: 'fa-users-cog'},
        'admin-cars': {t: 'จัดการข้อมูลรถยนต์', d: 'ฐานข้อมูลรถยนต์ขององค์กร', i: 'fa-car'},
        'admin-repairs': {t: 'อนุมัติการแจ้งซ่อม', d: 'รายการรออนุมัติจากพนักงาน', i: 'fa-clipboard-check'},
        'admin-reports': {t: 'รายงานข้อมูล', d: 'ประวัติการทำงานและการ Export', i: 'fa-file-invoice'}
    };
    document.getElementById('admin-content-title').innerText = titles[section].t;
    document.getElementById('admin-content-desc').innerText = titles[section].d;
    document.getElementById('admin-header-icon').className = 'fas ' + titles[section].i;
}

// --- 5. Staff Functions ---
function loadStaffCheckItems() {
    let container = document.getElementById('check-items-list');
    container.innerHTML = '';
    let items = [{id: 'tire', n: 'สภาพลมยาง'}, {id: 'brake', n: 'ระบบเบรค'}, {id: 'elec', n: 'ระบบไฟ'}, {id: 'water', n: 'หม้อน้ำ'}, {id: 'oil', n: 'น้ำมันเครื่อง'}];
    items.forEach(item => {
        container.innerHTML += `<div class="check-item"><span class="check-name">${item.n}</span><div class="check-radios"><label class="check-radio radio-green"><input type="radio" name="chk_${item.id}" value="pass" checked> ปกติ</label><label class="check-radio radio-red"><input type="radio" name="chk_${item.id}" value="fail"> ไม่ปกติ</label></div></div>`;
    });
}

document.getElementById('staff-check-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let checks = JSON.parse(localStorage.getItem('carma_checks'));
    let isPass = true;
    new FormData(this).forEach((v, k) => { if(k.startsWith('chk_') && v === 'fail') isPass = false; });

    checks.push({
        car_id: document.getElementById('check-carid').value, license: document.getElementById('check-license').value,
        color: document.getElementById('check-color').value, status: isPass ? "ปกติ" : "ไม่ปกติ",
        date: new Date().toLocaleDateString('th-TH'), staff: currentUserName
    });
    localStorage.setItem('carma_checks', JSON.stringify(checks));
    showSuccessModal('บันทึกการตรวจเช็คเรียบร้อย!');
    this.reset();
});

document.getElementById('staff-repair-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let repairs = JSON.parse(localStorage.getItem('carma_repairs'));
    repairs.push({
        id: Date.now(), license: document.getElementById('repair-license').value,
        name: currentUserName, dept: document.getElementById('repair-dept').value,
        detail: document.getElementById('repair-detail').value,
        date: new Date().toLocaleDateString('th-TH'), status: "pending"
    });
    localStorage.setItem('carma_repairs', JSON.stringify(repairs));
    showSuccessModal('แจ้งซ่อมเรียบร้อย!');
    this.reset();
    document.getElementById('repair-name').value = currentUserName;
});

function loadStaffStatusTable() {
    let repairs = JSON.parse(localStorage.getItem('carma_repairs'));
    let checks = JSON.parse(localStorage.getItem('carma_checks'));
    let tbody = document.getElementById('staff-status-table').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    repairs.forEach(r => tbody.innerHTML += `<tr><td>${r.date}</td><td><b>${r.license}</b></td><td>แจ้งซ่อม</td><td>${r.detail.substring(0,30)}...</td><td><span class="badge badge-${r.status}">${r.status}</span></td></tr>`);
    checks.forEach(c => tbody.innerHTML += `<tr><td>${c.date}</td><td><b>${c.license}</b></td><td>ตรวจเช็ค</td><td>ผล: ${c.status}</td><td><span class="badge badge-completed">บันทึกสำเร็จ</span></td></tr>`);
}

// --- 6. Admin Functions ---
function loadAdminDashboard() {
    document.getElementById('dashboard-users').innerText = JSON.parse(localStorage.getItem('carma_users')).length;
    document.getElementById('dashboard-cars').innerText = JSON.parse(localStorage.getItem('carma_cars')).length;
    document.getElementById('dashboard-repairs-pending').innerText = JSON.parse(localStorage.getItem('carma_repairs')).filter(r => r.status === 'pending').length;
}

function loadAdminUsersTable() {
    let tbody = document.getElementById('admin-users-table').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    JSON.parse(localStorage.getItem('carma_users')).forEach(u => {
        let rBadge = u.role === 'admin' ? '<span class="badge badge-completed">แอดมิน</span>' : '<span class="badge" style="background:#95a5a6;">พนักงาน</span>';
        tbody.innerHTML += `<tr><td>${u.id}</td><td><b>${u.fname} ${u.lname}</b></td><td>${u.user}</td><td>${rBadge}</td><td><button onclick="confirmDelete('user', '${u.id}')" class="btn btn-danger btn-action"><i class="fas fa-trash"></i></button></td></tr>`;
    });
}
function addUser() {
    let f = prompt("ชื่อ-นามสกุล ผู้ใช้งานใหม่:"); let user = prompt("Username สำหรับล็อกอิน:"); let pass = prompt("รหัสผ่าน:");
    if(f && user && pass) {
        let users = JSON.parse(localStorage.getItem('carma_users'));
        users.push({id: "EMP-"+Date.now().toString().slice(-4), fname: f, lname: "", user: user, pass: pass, role: "staff"});
        localStorage.setItem('carma_users', JSON.stringify(users));
        loadAdminUsersTable(); loadAdminDashboard();
        showSuccessModal('เพิ่มผู้ใช้สำเร็จ!');
    }
}

function loadAdminCarsTable() {
    let tbody = document.getElementById('admin-cars-table').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    JSON.parse(localStorage.getItem('carma_cars')).forEach(c => {
        tbody.innerHTML += `<tr><td>${c.car_id}</td><td><b>${c.license}</b></td><td>${c.color}</td><td><button onclick="confirmDelete('car', '${c.car_id}')" class="btn btn-danger btn-action"><i class="fas fa-trash"></i></button></td></tr>`;
    });
}
function addCar() {
    let lic = prompt("ทะเบียนรถ:"); let cid = prompt("รหัสรถ:"); let col = prompt("สีรถ:");
    if(lic && cid && col) {
        let cars = JSON.parse(localStorage.getItem('carma_cars'));
        cars.push({car_id: cid, license: lic, color: col});
        localStorage.setItem('carma_cars', JSON.stringify(cars));
        loadAdminCarsTable(); loadAdminDashboard();
        showSuccessModal('เพิ่มรถยนต์สำเร็จ!');
    }
}

function loadAdminRepairsTable() {
    let tbody = document.getElementById('admin-repairs-table').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    JSON.parse(localStorage.getItem('carma_repairs')).filter(r => r.status === 'pending').forEach(r => {
        tbody.innerHTML += `<tr><td>${r.date}</td><td><b>${r.license}</b></td><td>${r.name}</td><td>${r.detail}</td><td><button onclick="updateRepairStatus(${r.id}, 'approved')" class="btn btn-success btn-action"><i class="fas fa-check"></i></button></td><td><button onclick="updateRepairStatus(${r.id}, 'rejected')" class="btn btn-danger btn-action"><i class="fas fa-times"></i></button></td></tr>`;
    });
}
function updateRepairStatus(id, stat) {
    let reps = JSON.parse(localStorage.getItem('carma_repairs'));
    let idx = reps.findIndex(r => r.id === id);
    if(idx !== -1) { reps[idx].status = stat; localStorage.setItem('carma_repairs', JSON.stringify(reps)); loadAdminRepairsTable(); loadAdminDashboard(); showSuccessModal('อัปเดตเรียบร้อย!'); }
}

function loadAdminReportsTable() {
    let tbody = document.getElementById('admin-reports-table').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    JSON.parse(localStorage.getItem('carma_checks')).forEach((r, i) => {
        tbody.innerHTML += `<tr><td>${r.date}</td><td><b>${r.license}</b></td><td>${r.car_id}</td><td>${r.staff}</td><td><span class="badge badge-${r.status==='ปกติ'?'completed':'rejected'}">${r.status}</span></td></tr>`;
    });
}

// --- 7. Modals & Delete Logic ---
function confirmDelete(type, id) { deleteType = type; deleteId = id; document.getElementById('delete-modal').classList.add('active'); }
function executeDelete() {
    if(deleteType === 'user') {
        let data = JSON.parse(localStorage.getItem('carma_users')).filter(i => i.id !== deleteId);
        localStorage.setItem('carma_users', JSON.stringify(data)); loadAdminUsersTable();
    } else if(deleteType === 'car') {
        let data = JSON.parse(localStorage.getItem('carma_cars')).filter(i => i.car_id !== deleteId);
        localStorage.setItem('carma_cars', JSON.stringify(data)); loadAdminCarsTable();
    }
    loadAdminDashboard(); closeModals(); showSuccessModal('ลบข้อมูลสำเร็จ');
}
function showSuccessModal(msg) { document.getElementById('success-msg').innerText = msg; document.getElementById('success-modal').classList.add('active'); }
function showLogoutModal() { document.getElementById('logout-modal').classList.add('active'); }
function closeModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active')); }
function logout() {
    closeModals();
    document.getElementById('staff-view').classList.remove('active');
    document.getElementById('admin-view').classList.remove('active');
    document.getElementById('login-view').classList.add('active');
    document.getElementById('login-form').reset();
    document.getElementById('login-error').style.display = 'none';
}
