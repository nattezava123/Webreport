// --- 1. ระบบจัดการฐานข้อมูลจำลอง (Safe Init) ---
function initData() {
    // 1.1 สร้างข้อมูลตั้งต้น (ถ้ายังไม่มี)
    if (!localStorage.getItem('carma_checks')) {
        localStorage.setItem('carma_checks', JSON.stringify([
            { car_id: "CAR-001", license: "ตอม4448", color: "ขาว", status: "ปกติ", date: "15/03/2567", staff: "คาลอส" },
            { car_id: "CAR-002", license: "รวย8887", color: "ดำ", status: "ไม่ปกติ", date: "16/03/2567", staff: "คาลอส" }
        ]));
    }

    if (!localStorage.getItem('carma_repairs')) {
        localStorage.setItem('carma_repairs', JSON.stringify([
            { id: 1, license: "รวย8887", name: "คาลอส ไดรอน", dept: "แผนกจัดส่ง", detail: "ไฟหน้าไม่ติด", date: "16/03/2567", status: "pending" }
        ]));
    }

    if (!localStorage.getItem('carma_cars')) {
        localStorage.setItem('carma_cars', JSON.stringify([
            { car_id: "CAR-001", license: "ตอม4448", color: "ขาว", brand: "Toyota", model: "Hilux Revo", year: "2021", mileage: 45000, status: "พร้อมใช้งาน" },
            { car_id: "CAR-002", license: "รวย8887", color: "ดำ", brand: "Isuzu", model: "D-Max", year: "2019", mileage: 120500, status: "กำลังซ่อมบำรุง" }
        ]));
    }

    // 1.2 ระบบบังคับสร้าง User หลัก (ป้องกันการโดนลบจนเข้าไม่ได้)
    let users = [];
    try {
        let storedUsers = localStorage.getItem('carma_users');
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        }
    } catch (e) {
        console.error("Error parsing users:", e);
        users = [];
    }

    let hasAdmin = false;
    let hasStaff = false;

    // เช็คว่ามี admin และ user ปกติอยู่ไหม
    for (let i = 0; i < users.length; i++) {
        if (users[i].user === 'admin') hasAdmin = true;
        if (users[i].user === 'user') hasStaff = true;
    }

    // ถ้าไม่มี ให้สร้างเข้าไปใหม่
    if (!hasAdmin) {
        users.push({ id: "ADM-001", fname: "อลิส", lname: "มาร์ติน", user: "admin", pass: "admin123", role: "admin", position: "ผู้จัดการ", dept: "ฝ่ายบริหาร", phone: "089-999-9999", status: "active" });
    }
    if (!hasStaff) {
        users.push({ id: "EMP-001", fname: "คาลอส", lname: "ไดรอน", user: "user", pass: "user123", role: "staff", position: "พนักงานขับรถ", dept: "แผนกจัดส่ง", phone: "081-234-5678", status: "active" });
    }

    localStorage.setItem('carma_users', JSON.stringify(users));
    console.log("Database Initialized. Users loaded:", users.length);
}

// เรียกใช้ทันทีเมื่อโหลดไฟล์ JS
initData();

// ตัวแปรเก็บสถานะการล็อกอิน
let currentRole = null;
let currentUserName = null;
let deleteType = null;
let deleteId = null;

// --- 2. ระบบค้นหา ---
function filterTable(inputId, tableId) {
    let input = document.getElementById(inputId).value.toLowerCase();
    let tbody = document.getElementById(tableId).getElementsByTagName('tbody')[0];
    if(!tbody) return;
    
    let trs = tbody.getElementsByTagName('tr');
    for (let i = 0; i < trs.length; i++) {
        let textContent = trs[i].innerText.toLowerCase();
        trs[i].style.display = textContent.includes(input) ? '' : 'none';
    }
}

// --- 3. Login System (แก้บั๊กการล็อกอิน) ---
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    let userIn = document.getElementById('username').value.trim();
    let passIn = document.getElementById('password').value.trim();
    let errorMsg = document.getElementById('login-error');
    
    // ดึงข้อมูล User จาก LocalStorage ใหม่สดๆ เพื่อความชัวร์
    let users = JSON.parse(localStorage.getItem('carma_users')) || [];
    
    console.log("Attempting login with:", userIn, "pass:", passIn);
    
    // ค้นหา User ที่ตรงกัน (และสถานะต้อง active)
    let foundUser = users.find(u => u.user === userIn && u.pass === passIn);

    if (foundUser) {
        if (foundUser.status === 'inactive') {
            errorMsg.innerHTML = '<i class="fas fa-ban"></i> บัญชีนี้ถูกระงับการใช้งาน!';
            errorMsg.style.display = 'block';
            return;
        }

        console.log("Login Success! Role:", foundUser.role);
        
        currentRole = foundUser.role;
        currentUserName = `${foundUser.fname} ${foundUser.lname}`;
        
        // ปิดหน้า Login
        document.getElementById('login-view').classList.remove('active');
        errorMsg.style.display = 'none';
        
        // แยกไปตามสิทธิ์
        if (currentRole === 'staff') {
            document.getElementById('staff-view').classList.add('active');
            document.getElementById('staff-user-name').innerText = currentUserName;
            
            // พยายามใส่ชื่อลงในช่องแจ้งซ่อม (ถ้ามี)
            let repairNameField = document.getElementById('repair-name');
            if(repairNameField) repairNameField.value = currentUserName;
            
            showView('staff-check');
        } else if (currentRole === 'admin') {
            document.getElementById('admin-view').classList.add('active');
            showAdminView('admin-dashboard');
        }
    } else {
        console.log("Login Failed. No matching user found.");
        errorMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!';
        errorMsg.style.display = 'block';
    }
});

// --- 4. Navigation Views ---
function showView(section) {
    document.querySelectorAll('#staff-view .content-section').forEach(sec => sec.style.display = 'none');
    document.querySelectorAll('#staff-view .sidebar-menu-link').forEach(link => link.classList.remove('active'));
    
    let targetContent = document.getElementById(section + '-content');
    let targetMenu = document.getElementById(section + '-menu');
    
    if(targetContent) targetContent.style.display = 'block';
    if(targetMenu) targetMenu.classList.add('active');

    if(section === 'staff-check') loadStaffCheckItems();
    if(section === 'staff-status') loadStaffStatusTable();
    
    let titles = {
        'staff-check': { t: 'บันทึกการตรวจเช็คสภาพรถยนต์', d: 'กรอกข้อมูลและตรวจสอบสภาพรถ', i: 'fa-clipboard-check' },
        'staff-repair': { t: 'แจ้งข้อมูลการซ่อม', d: 'ระบุอาการเสียและขออนุมัติซ่อม', i: 'fa-tools' },
        'staff-status': { t: 'ตรวจสอบสถานะรายการ', d: 'ติดตามสถานะการทำงานของคุณ', i: 'fa-tasks' }
    };
    
    if(titles[section]) {
        document.getElementById('staff-content-title').innerText = titles[section].t;
        document.getElementById('staff-content-desc').innerText = titles[section].d;
        document.getElementById('staff-header-icon').className = 'fas ' + titles[section].i;
    }
}

function showAdminView(section) {
    document.querySelectorAll('#admin-view .content-section').forEach(sec => sec.style.display = 'none');
    document.querySelectorAll('#admin-view .sidebar-menu-link').forEach(link => link.classList.remove('active'));
    
    let targetContent = document.getElementById(section + '-content');
    let targetMenu = document.getElementById(section + '-menu');
    
    if(targetContent) targetContent.style.display = 'block';
    if(targetMenu) targetMenu.classList.add('active');

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
    
    if(titles[section]) {
        document.getElementById('admin-content-title').innerText = titles[section].t;
        document.getElementById('admin-content-desc').innerText = titles[section].d;
        document.getElementById('admin-header-icon').className = 'fas ' + titles[section].i;
    }
}

// --- 5. Staff Functions ---
function loadStaffCheckItems() {
    let container = document.getElementById('check-items-list');
    if(!container) return;
    
    container.innerHTML = '';
    let items = [
        {id: 'tire', n: 'สภาพลมยาง'}, 
        {id: 'brake', n: 'ระบบเบรค'}, 
        {id: 'elec', n: 'ระบบไฟ'}, 
        {id: 'water', n: 'หม้อน้ำ'}, 
        {id: 'oil', n: 'น้ำมันเครื่อง'}
    ];
    
    items.forEach(item => {
        container.innerHTML += `
            <div class="check-item">
                <span class="check-name">${item.n}</span>
                <div class="check-radios">
                    <label class="check-radio radio-green"><input type="radio" name="chk_${item.id}" value="pass" checked> ปกติ</label>
                    <label class="check-radio radio-red"><input type="radio" name="chk_${item.id}" value="fail"> ไม่ปกติ</label>
                </div>
            </div>`;
    });
}

// ผูก Event ให้ฟอร์มพนักงาน
let staffCheckForm = document.getElementById('staff-check-form');
if(staffCheckForm) {
    staffCheckForm.addEventListener('submit', function(e) {
        e.preventDefault();
        let checks = JSON.parse(localStorage.getItem('carma_checks')) || [];
        let isPass = true;
        
        new FormData(this).forEach((v, k) => { 
            if(k.startsWith('chk_') && v === 'fail') isPass = false; 
        });

        checks.push({
            car_id: document.getElementById('check-carid').value, 
            license: document.getElementById('check-license').value,
            color: document.getElementById('check-color').value, 
            status: isPass ? "ปกติ" : "ไม่ปกติ",
            date: new Date().toLocaleDateString('th-TH'), 
            staff: currentUserName
        });
        
        localStorage.setItem('carma_checks', JSON.stringify(checks));
        showSuccessModal('บันทึกการตรวจเช็คเรียบร้อย!');
        this.reset();
    });
}

let staffRepairForm = document.getElementById('staff-repair-form');
if(staffRepairForm) {
    staffRepairForm.addEventListener('submit', function(e) {
        e.preventDefault();
        let repairs = JSON.parse(localStorage.getItem('carma_repairs')) || [];
        
        repairs.push({
            id: Date.now(), 
            license: document.getElementById('repair-license').value,
            name: currentUserName, 
            dept: document.getElementById('repair-dept').value,
            detail: document.getElementById('repair-detail').value,
            date: new Date().toLocaleDateString('th-TH'), 
            status: "pending"
        });
        
        localStorage.setItem('carma_repairs', JSON.stringify(repairs));
        showSuccessModal('แจ้งซ่อมเรียบร้อย!');
        this.reset();
        document.getElementById('repair-name').value = currentUserName;
    });
}

function loadStaffStatusTable() {
    let repairs = JSON.parse(localStorage.getItem('carma_repairs')) || [];
    let checks = JSON.parse(localStorage.getItem('carma_checks')) || [];
    
    let table = document.getElementById('staff-status-table');
    if(!table) return;
    
    let tbody = table.getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    
    // ดึงเฉพาะรายการของตัวเอง (อิงจากชื่อ)
    let myRepairs = repairs.filter(r => r.name === currentUserName);
    let myChecks = checks.filter(c => c.staff === currentUserName);

    myRepairs.forEach(r => {
        let statusText = r.status === 'pending' ? 'รออนุมัติ' : (r.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ');
        tbody.innerHTML += `<tr><td>${r.date}</td><td><b>${r.license}</b></td><td>แจ้งซ่อม</td><td>${r.detail.substring(0,30)}...</td><td><span class="badge badge-${r.status}">${statusText}</span></td></tr>`;
    });
    
    myChecks.forEach(c => {
        tbody.innerHTML += `<tr><td>${c.date}</td><td><b>${c.license}</b></td><td>ตรวจเช็ค</td><td>ผล: ${c.status}</td><td><span class="badge badge-completed">บันทึกสำเร็จ</span></td></tr>`;
    });
}

// --- 6. Admin Functions ---
function loadAdminDashboard() {
    let users = JSON.parse(localStorage.getItem('carma_users')) || [];
    let cars = JSON.parse(localStorage.getItem('carma_cars')) || [];
    let repairs = JSON.parse(localStorage.getItem('carma_repairs')) || [];
    
    let uEl = document.getElementById('dashboard-users');
    let cEl = document.getElementById('dashboard-cars');
    let rEl = document.getElementById('dashboard-repairs-pending');
    
    if(uEl) uEl.innerText = users.length;
    if(cEl) cEl.innerText = cars.length;
    if(rEl) rEl.innerText = repairs.filter(r => r.status === 'pending').length;
}

// 6.1 Users
function loadAdminUsersTable() {
    let table = document.getElementById('admin-users-table');
    if(!table) return;
    let tbody = table.getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    
    let users = JSON.parse(localStorage.getItem('carma_users')) || [];
    
    users.forEach(u => {
        let rBadge = u.role === 'admin' ? '<span class="badge badge-completed">แอดมิน</span>' : '<span class="badge" style="background:#95a5a6;">พนักงาน</span>';
        let statB = u.status === 'active' ? '<span class="badge badge-active">ปกติ</span>' : '<span class="badge badge-inactive">ระงับ</span>';
        let pos = u.position || '-'; let dep = u.dept || '-'; let ph = u.phone || '-';
        
        tbody.innerHTML += `
            <tr>
                <td style="color:#666; font-size:13px;">${u.id}</td>
                <td><div style="font-weight:bold; color:#0d47a1;">${u.fname} ${u.lname}</div><div style="font-size:12px; color:#888;"><i class="fas fa-envelope"></i> ${u.user}</div></td>
                <td><div>${pos}</div><div style="font-size:12px; color:#888;">แผนก: ${dep}</div></td>
                <td><i class="fas fa-phone-alt text-muted"></i> ${ph}</td>
                <td>${rBadge} ${statB}</td>
                <td style="text-align: right;">
                    <button onclick="openUserModal('${u.id}')" class="btn btn-action btn-light mr-2"><i class="fas fa-edit"></i> แก้ไข</button> 
                    <button onclick="confirmDelete('user', '${u.id}')" class="btn btn-danger btn-action"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

function openUserModal(id) {
    let form = document.getElementById('user-form');
    if(!form) return;
    form.reset();
    
    if(id) {
        document.getElementById('u_mode').value = 'edit';
        document.getElementById('user-modal-title').innerHTML = '<i class="fas fa-user-edit"></i> แก้ไขข้อมูลพนักงาน';
        document.getElementById('u_id').readOnly = true; 
        document.getElementById('u_id').style.backgroundColor = '#e9ecef';
        
        let user = JSON.parse(localStorage.getItem('carma_users')).find(u => u.id === id);
        if(user) {
            document.getElementById('u_id').value = user.id || ''; 
            document.getElementById('u_fname').value = user.fname || ''; 
            document.getElementById('u_lname').value = user.lname || '';
            document.getElementById('u_position').value = user.position || ''; 
            document.getElementById('u_dept').value = user.dept || '';
            document.getElementById('u_phone').value = user.phone || ''; 
            document.getElementById('u_role').value = user.role || 'staff';
            document.getElementById('u_status').value = user.status || 'active'; 
            document.getElementById('u_user').value = user.user || ''; 
            document.getElementById('u_pass').value = user.pass || '';
        }
    } else {
        document.getElementById('u_mode').value = 'add';
        document.getElementById('user-modal-title').innerHTML = '<i class="fas fa-user-plus"></i> เพิ่มพนักงานใหม่';
        document.getElementById('u_id').readOnly = false; 
        document.getElementById('u_id').style.backgroundColor = '';
        document.getElementById('u_id').value = "EMP-" + Date.now().toString().slice(-4);
    }
    document.getElementById('user-modal').classList.add('active');
}

let userForm = document.getElementById('user-form');
if(userForm) {
    userForm.addEventListener('submit', function(e) {
        e.preventDefault();
        let users = JSON.parse(localStorage.getItem('carma_users')) || [];
        let mode = document.getElementById('u_mode').value;
        
        let userData = {
            id: document.getElementById('u_id').value.trim(), 
            fname: document.getElementById('u_fname').value.trim(),
            lname: document.getElementById('u_lname').value.trim(), 
            position: document.getElementById('u_position').value.trim(),
            dept: document.getElementById('u_dept').value.trim(), 
            phone: document.getElementById('u_phone').value.trim(),
            role: document.getElementById('u_role').value, 
            status: document.getElementById('u_status').value,
            user: document.getElementById('u_user').value.trim(), 
            pass: document.getElementById('u_pass').value.trim()
        };
        
        if(mode === 'edit') {
            let idx = users.findIndex(u => u.id === userData.id); 
            if(idx !== -1) users[idx] = userData;
            showSuccessModal('อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว');
        } else {
            if(users.some(u => u.id === userData.id || u.user === userData.user)) { 
                alert('รหัสพนักงาน หรือ Username นี้มีในระบบแล้ว!'); 
                return; 
            }
            users.push(userData); 
            showSuccessModal('เพิ่มพนักงานใหม่เรียบร้อยแล้ว');
        }
        
        localStorage.setItem('carma_users', JSON.stringify(users)); 
        loadAdminUsersTable(); 
        closeModals();
    });
}

// 6.2 Cars
function loadAdminCarsTable() {
    let table = document.getElementById('admin-cars-table');
    if(!table) return;
    let tbody = table.getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    
    let cars = JSON.parse(localStorage.getItem('carma_cars')) || [];
    
    cars.forEach(c => {
        let sColor = c.status === 'พร้อมใช้งาน' ? '#2ecc71' : (c.status === 'กำลังซ่อมบำรุง' ? '#f39c12' : '#e74c3c');
        let brandModel = (c.brand || 'ไม่ระบุ') + ' ' + (c.model || '');
        let yearColor = (c.year || '-') + ' / สี' + (c.color || '-');
        
        tbody.innerHTML += `
            <tr>
                <td style="color:#666; font-size:13px;">${c.car_id}</td>
                <td style="font-weight:bold; font-size:16px;">${c.license}</td>
                <td>${brandModel}</td>
                <td>${yearColor}</td>
                <td><span style="color:${sColor}; font-weight:bold;"><i class="fas fa-circle" style="font-size:10px;"></i> ${c.status || 'พร้อมใช้งาน'}</span></td>
                <td style="text-align: right;">
                    <button onclick="openCarModal('${c.car_id}')" class="btn btn-action btn-light mr-2"><i class="fas fa-edit"></i> แก้ไข</button> 
                    <button onclick="confirmDelete('car', '${c.car_id}')" class="btn btn-danger btn-action"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

function openCarModal(id) {
    let form = document.getElementById('car-form');
    if(!form) return;
    form.reset();
    
    if(id) {
        document.getElementById('c_mode').value = 'edit';
        document.getElementById('car-modal-title').innerHTML = '<i class="fas fa-edit"></i> แก้ไขข้อมูลรถยนต์';
        document.getElementById('c_id').readOnly = true; 
        document.getElementById('c_id').style.backgroundColor = '#e9ecef';
        
        let car = JSON.parse(localStorage.getItem('carma_cars')).find(c => c.car_id === id);
        if(car) {
            document.getElementById('c_id').value = car.car_id || ''; 
            document.getElementById('c_license').value = car.license || '';
            document.getElementById('c_color').value = car.color || ''; 
            document.getElementById('c_brand').value = car.brand || '';
            document.getElementById('c_model').value = car.model || ''; 
            document.getElementById('c_year').value = car.year || '';
            document.getElementById('c_mileage').value = car.mileage || ''; 
            document.getElementById('c_status').value = car.status || 'พร้อมใช้งาน';
        }
    } else {
        document.getElementById('c_mode').value = 'add';
        document.getElementById('car-modal-title').innerHTML = '<i class="fas fa-car-plus"></i> เพิ่มรถยนต์ใหม่';
        document.getElementById('c_id').readOnly = false; 
        document.getElementById('c_id').style.backgroundColor = '';
        document.getElementById('c_id').value = "CAR-" + Date.now().toString().slice(-4);
    }
    document.getElementById('car-modal').classList.add('active');
}

let carForm = document.getElementById('car-form');
if(carForm) {
    carForm.addEventListener('submit', function(e) {
        e.preventDefault();
        let cars = JSON.parse(localStorage.getItem('carma_cars')) || [];
        let mode = document.getElementById('c_mode').value;
        
        let carData = {
            car_id: document.getElementById('c_id').value.trim(), 
            license: document.getElementById('c_license').value.trim(),
            color: document.getElementById('c_color').value.trim(), 
            brand: document.getElementById('c_brand').value.trim(),
            model: document.getElementById('c_model').value.trim(), 
            year: document.getElementById('c_year').value.trim(),
            mileage: document.getElementById('c_mileage').value, 
            status: document.getElementById('c_status').value
        };
        
        if(mode === 'edit') {
            let idx = cars.findIndex(c => c.car_id === carData.car_id); 
            if(idx !== -1) cars[idx] = carData;
            showSuccessModal('อัปเดตข้อมูลรถยนต์เรียบร้อยแล้ว');
        } else {
            if(cars.some(c => c.car_id === carData.car_id || c.license === carData.license)) { 
                alert('รหัสรถยนต์ หรือ ทะเบียนรถ นี้มีในระบบแล้ว!'); 
                return; 
            }
            cars.push(carData); 
            showSuccessModal('เพิ่มรถยนต์ใหม่เรียบร้อยแล้ว');
        }
        
        localStorage.setItem('carma_cars', JSON.stringify(cars)); 
        loadAdminCarsTable(); 
        closeModals();
    });
}

// 6.3 Repairs
function loadAdminRepairsTable() {
    let table = document.getElementById('admin-repairs-table');
    if(!table) return;
    let tbody = table.getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    
    let repairs = JSON.parse(localStorage.getItem('carma_repairs')) || [];
    let pending = repairs.filter(r => r.status === 'pending');
    
    if(pending.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">ไม่มีรายการรออนุมัติ</td></tr>`;
        return;
    }
    
    pending.forEach(r => {
        tbody.innerHTML += `
            <tr>
                <td>${r.date}</td>
                <td><b>${r.license}</b></td>
                <td>${r.name} <br><small class="text-muted">${r.dept || '-'}</small></td>
                <td>${r.detail}</td>
                <td style="text-align:center;"><button onclick="updateRepairStatus(${r.id}, 'approved')" class="btn btn-success btn-action"><i class="fas fa-check"></i></button></td>
                <td style="text-align:center;"><button onclick="updateRepairStatus(${r.id}, 'rejected')" class="btn btn-danger btn-action"><i class="fas fa-times"></i></button></td>
            </tr>`;
    });
}

function updateRepairStatus(id, stat) {
    let reps = JSON.parse(localStorage.getItem('carma_repairs')) || [];
    let idx = reps.findIndex(r => r.id === id);
    if(idx !== -1) { 
        reps[idx].status = stat; 
        localStorage.setItem('carma_repairs', JSON.stringify(reps)); 
        loadAdminRepairsTable(); 
        loadAdminDashboard(); 
        showSuccessModal('อัปเดตสถานะเรียบร้อย!'); 
    }
}

// 6.4 Reports
function loadAdminReportsTable() {
    let table = document.getElementById('admin-reports-table');
    if(!table) return;
    let tbody = table.getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    
    let checks = JSON.parse(localStorage.getItem('carma_checks')) || [];
    
    if(checks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">ยังไม่มีข้อมูลการตรวจเช็ค</td></tr>`;
        return;
    }
    
    checks.forEach((r) => {
        let badgeClass = r.status === 'ปกติ' ? 'completed' : 'rejected';
        tbody.innerHTML += `
            <tr>
                <td>${r.date}</td>
                <td><b>${r.license}</b></td>
                <td>${r.car_id}</td>
                <td>${r.staff}</td>
                <td><span class="badge badge-${badgeClass}">${r.status}</span></td>
            </tr>`;
    });
}

// --- 7. Modals & Logout ---
function confirmDelete(type, id) { 
    deleteType = type; 
    deleteId = id; 
    let modal = document.getElementById('delete-modal');
    if(modal) modal.classList.add('active'); 
}

function executeDelete() {
    if(deleteType === 'user') {
        let data = JSON.parse(localStorage.getItem('carma_users')) || [];
        data = data.filter(i => i.id !== deleteId);
        localStorage.setItem('carma_users', JSON.stringify(data)); 
        loadAdminUsersTable();
    } else if(deleteType === 'car') {
        let data = JSON.parse(localStorage.getItem('carma_cars')) || [];
        data = data.filter(i => i.car_id !== deleteId);
        localStorage.setItem('carma_cars', JSON.stringify(data)); 
        loadAdminCarsTable();
    }
    loadAdminDashboard(); 
    closeModals(); 
    showSuccessModal('ลบข้อมูลสำเร็จ');
}

function showSuccessModal(msg) { 
    let msgEl = document.getElementById('success-msg');
    let modal = document.getElementById('success-modal');
    if(msgEl) msgEl.innerText = msg; 
    if(modal) modal.classList.add('active'); 
}

function showLogoutModal() { 
    let modal = document.getElementById('logout-modal');
    if(modal) modal.classList.add('active'); 
}

function closeModals() { 
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active')); 
}

function logout() {
    closeModals();
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    let loginView = document.getElementById('login-view');
    if(loginView) loginView.classList.add('active');
    
    let loginForm = document.getElementById('login-form');
    if(loginForm) loginForm.reset();
    
    let loginError = document.getElementById('login-error');
    if(loginError) loginError.style.display = 'none';
    
    currentRole = null;
    currentUserName = null;
}
