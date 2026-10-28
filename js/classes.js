function renderClasses() {
  const filterDiv = document.getElementById('class-filter');
  if(filterDiv) {
    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    filterDiv.innerHTML = `
      <div class="flex items-center gap-4 flex-wrap">
        <div class="relative w-64">
          <input type="text" id="search-class-kw" oninput="searchClasses()" placeholder="🔍 Tìm mã lớp, tên lớp..." class="border p-2 rounded w-full text-sm">
        </div>
        <div class="flex gap-2 items-center">
          <span class="font-bold text-sm text-gray-600">Lọc theo thứ:</span>
          ${days.map(d => `
            <label class="inline-flex items-center gap-1 cursor-pointer">
              <input type="checkbox" value="${d}" class="day-filter-cb w-4 h-4 text-blue-600 rounded" onchange="searchClasses()">
              <span class="text-sm">${d}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <button onclick="diemDanhLopDaChon()" class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-bold text-sm">📝 Điểm Danh Lớp Đã Chọn</button>
    `;
  }
  searchClasses();
}

function searchClasses() {
  const kw = document.getElementById('search-class-kw').value.toLowerCase().trim();
  const checkedDays = Array.from(document.querySelectorAll('.day-filter-cb:checked')).map(cb => cb.value);
  
  let filtered = db.classes;
  
  // 1. Lọc theo từ khóa (Mã hoặc Tên lớp)
  if (kw) {
    filtered = filtered.filter(c => 
      (c.classId || '').toLowerCase().includes(kw) || 
      (c.className || '').toLowerCase().includes(kw)
    );
  }
  
  // 2. Lọc theo thứ
  if (checkedDays.length > 0) {
    filtered = filtered.filter(c => checkedDays.some(day => (c.days || '').includes(day)));
  }

  // Reset nút check-all
  document.getElementById('check-all-classes').checked = false;

  const listEl = document.getElementById('class-list');
  listEl.innerHTML = filtered.map(c => {
    const siso = db.enrollments.filter(e => String(e.classId) === String(c.classId)).length;
    return `
    <tr class="border-b hover:bg-gray-50">
      <td class="p-3 text-center">
        <input type="checkbox" value="${c.classId}" class="class-cb w-4 h-4 text-orange-500 rounded cursor-pointer">
      </td>
      <td class="p-3 text-xs text-gray-500">${c.classId}</td>
      <td class="p-3 font-bold text-blue-700 cursor-pointer hover:underline" onclick="viewClassDetails('${c.classId}')">${c.className}</td>
      <td class="p-3">${c.subject}</td>
      <td class="p-3 text-center">Khối ${c.grade}</td>
      <td class="p-3">${c.teacherName}</td>
      <td class="p-3 font-bold text-center text-red-600">${c.room}</td>
      <td class="p-3 font-bold text-center">${c.shift}</td>
      <td class="p-3 text-center font-semibold">${c.days}</td>
      <td class="p-3 text-green-600">${Number(c.tuitionFee).toLocaleString('vi-VN')} đ</td>
      <td class="p-3 text-center font-bold text-orange-600">${siso}</td>
      <td class="p-3 text-center">
        <input type="number" value="${c.sessions || 0}" onchange="updateClassSessions('${c.classId}', this.value)" class="w-16 border p-1 rounded text-center font-bold" min="0">
      </td>
      <td class="p-3 whitespace-nowrap">
        <button onclick="viewClassDetails('${c.classId}')" class="text-green-600 hover:underline text-xs">Chi tiết</button>
        <button onclick="editClass('${c.classId}')" class="text-blue-600 hover:underline text-xs ml-2">Sửa</button>
        <button onclick="deleteClass('${c.classId}')" class="text-red-600 hover:underline text-xs ml-2">Xóa</button>
      </td>
    </tr>
  `}).join('');
}

// Hàm Check All
function toggleAllClasses(masterCb) {
  const cbs = document.querySelectorAll('.class-cb');
  cbs.forEach(cb => cb.checked = masterCb.checked);
}

// Hàm Điểm Danh Chỉ Các Lớp Được Chọn
async function diemDanhLopDaChon() {
  const selectedCbs = document.querySelectorAll('.class-cb:checked');
  if (selectedCbs.length === 0) {
    return showToast('Vui lòng tick chọn ít nhất 1 lớp để điểm danh!', 'warning');
  }

  if(!confirm(`Xác nhận điểm danh cho ${selectedCbs.length} lớp đã chọn? Hệ thống sẽ tự động cộng 1 buổi vào các lớp này.`)) return;

  const btn = document.querySelector('button[onclick="diemDanhLopDaChon()"]');
  const oldText = btn.innerHTML;
  btn.innerHTML = '⏳ Đang xử lý...';
  btn.disabled = true;

  try {
    for (const cb of selectedCbs) {
      const classId = cb.value;
      await apiPost('diem_danh_lop', { classId: classId });
    }
    showToast('Đã điểm danh thành công!', 'success');
    await loadAllData(false);
  } catch(e) {
    showToast('Lỗi điểm danh: ' + e.message, 'error');
  } finally {
    btn.innerHTML = oldText;
    btn.disabled = false;
  }
}

// Giữ nguyên các hàm cũ khác của bạn ở dưới...
// (updateClassSessions, openClassModal, editClass, saveClass, deleteClass, viewClassDetails, v.v...)

async function updateClassSessions(classId, val) {
  const sessions = parseInt(val) || 0;
  const classData = db.classes.find(c => c.classId === classId);
  if(classData) classData.sessions = sessions;
  try {
    await apiPost('update_sessions', { classId: classId, sessions: sessions });
    showToast('Đã cập nhật số buổi lớp!', 'success');
  } catch(e) { showToast('Lỗi khi lưu số buổi: ' + e.message, 'error'); }
}

// Các hàm khác (openClassModal, editClass, saveClass, deleteClass, viewClassDetails, openEnrollModal, searchStudentForEnroll, selectStudentForEnroll, saveEnrollment) giữ nguyên như cũ

function openClassModal() {
  document.getElementById('cls-modal-title').innerText = 'Xếp Lớp Mới';
  document.getElementById('cls-id').value = '';
  document.getElementById('cls-name').value = '';
  document.getElementById('cls-subject').value = '';
  document.getElementById('cls-grade').value = '';
  document.getElementById('cls-days').value = '';
  document.getElementById('cls-fee').value = '350000';
  
  const sel = document.getElementById('cls-teacher');
  sel.innerHTML = '<option value="">-- Chọn GV --</option>' +
    db.teachers.map(t => `<option value="${t.teacherName}">${t.teacherName}</option>`).join('');
    
  document.getElementById('class-modal').classList.add('open');
}
// Hàm tự động tạo tên lớp theo công thức: Môn + Khối - GV (Ngày)
function autoGenerateClassName() {
  const subject = document.getElementById('cls-subject').value.trim();
  const grade = document.getElementById('cls-grade').value.trim();
  const teacherName = document.getElementById('cls-teacher').value;
  const days = document.getElementById('cls-days').value.trim();

  // Nếu chưa nhập đủ thông tin cơ bản thì không tạo
  if (!subject || !grade || !teacherName || !days) {
    document.getElementById('cls-name').value = '';
    return;
  }

  // Xử lý tên giáo viên viết tắt: "Nguyễn Thị Mỹ Phúc" -> "Cô Phúc"
  let shortTeacher = teacherName;
  const nameParts = teacherName.split(' ');
  if (nameParts.length > 1) {
    const lastName = nameParts[nameParts.length - 1]; // Lấy chữ cuối cùng
    // Đoán danh xưng (Cô/Thầy) dựa vào tên đệm (nếu có chữ Thị thì là Cô)
    const isFemale = teacherName.toLowerCase().includes('thị') || 
                     ['lan', 'hương', 'mai', 'thảo', 'trang', 'phúc', 'nga', 'hà', 'linh', 'yến', 'nhi'].some(n => lastName.toLowerCase() === n);
    const title = isFemale ? 'Cô' : 'Thầy';
    shortTeacher = `${title} ${lastName}`;
  }

  // Ghép thành tên lớp: "Văn 7 - Cô Phúc (T2-T4)"
  const generatedName = `${subject} ${grade} - ${shortTeacher} (${days})`;
  
  document.getElementById('cls-name').value = generatedName;
}

function editClass(id) {
  const c = db.classes.find(x => x.classId === id);
  if(!c) return;
  document.getElementById('cls-modal-title').innerText = 'Sửa Lớp Học';
  document.getElementById('cls-id').value = c.classId;
  document.getElementById('cls-name').value = c.className; // Giữ nguyên tên cũ
  document.getElementById('cls-subject').value = c.subject;
  document.getElementById('cls-grade').value = c.grade;
  document.getElementById('cls-days').value = c.days;
  document.getElementById('cls-fee').value = c.tuitionFee;
  
  const sel = document.getElementById('cls-teacher');
  sel.innerHTML = '<option value="">-- Chọn GV --</option>' +
    db.teachers.map(t => `<option value="${t.teacherName}">${t.teacherName}</option>`).join('');
  sel.value = c.teacherName;

  document.getElementById('cls-room').value = c.room;
  document.getElementById('cls-shift').value = c.shift;
  document.getElementById('class-modal').classList.add('open');
}

async function saveClass() {
  const data = {
    classId: document.getElementById('cls-id').value,
    className: document.getElementById('cls-name').value,
    subject: document.getElementById('cls-subject').value,
    grade: document.getElementById('cls-grade').value,
    teacherName: document.getElementById('cls-teacher').value,
    room: document.getElementById('cls-room').value,
    shift: document.getElementById('cls-shift').value,
    days: document.getElementById('cls-days').value,
    tuitionFee: document.getElementById('cls-fee').value
  };
  if (!data.className || !data.room || !data.teacherName) return showToast('Nhập đủ Tên lớp, Phòng, Giáo viên!', 'warning');

  const action = data.classId ? 'update_class' : 'create_class';
  try {
    const res = await apiPost(action, data);
    if (res.error) throw new Error(res.error);
    showToast('Đã lưu Lớp Học!', 'success');
    document.getElementById('class-modal').classList.remove('open');
    loadAllData(false);
  } catch(e) {
    showToast('Lỗi: ' + e.message, 'error');
  }
}

async function deleteClass(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa lớp này?')) return;
  try {
    await apiPost('delete_class', { classId: id });
    showToast('Đã xóa Lớp Học!', 'success');
    loadAllData(false);
  } catch(e) {
    showToast('Lỗi: ' + e.message, 'error');
  }
}

function viewClassDetails(classId) {
  const c = db.classes.find(x => x.classId === classId);
  if(!c) return;
  
  document.getElementById('cd-name').innerText = c.className;
  document.getElementById('cd-teacher').innerText = c.teacherName;
  document.getElementById('cd-subject').innerText = c.subject;
  document.getElementById('cd-fee').innerText = Number(c.tuitionFee).toLocaleString('vi-VN') + ' đ';
  
  const enrolls = db.enrollments.filter(e => String(e.classId) === String(classId));
  document.getElementById('cd-size').innerText = enrolls.length + ' HS';
  document.getElementById('cd-list-count').innerText = enrolls.length;
  
  const total = db.payments.filter(p => p.classId === classId).reduce((sum, p) => sum + Number(p.amount), 0);
  document.getElementById('cd-total').innerText = total.toLocaleString('vi-VN') + ' đ';
  
  document.getElementById('cd-student-list').innerHTML = enrolls.map((e, i) => {
    const st = db.students.find(s => String(s.stt) === String(e.studentId));
    const phone = st ? st.parentPhone : '---';
    return `
      <tr class="border-b hover:bg-gray-50">
        <td class="p-2 text-center">${i+1}</td>
        <td class="p-2 font-semibold text-blue-700">${e.studentName}</td>
        <td class="p-2 text-gray-600">${phone || ''}</td>
        <td class="p-2"><button onclick="removeEnrollment('${e.enrollId}', null, '${classId}')" class="text-red-500 hover:underline text-xs">Xóa</button></td>
      </tr>
    `;
  }).join('');
  
  if(enrolls.length === 0) {
     document.getElementById('cd-student-list').innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-500">Lớp chưa có học viên nào.</td></tr>';
  }
  document.getElementById('class-detail-modal').classList.add('open');
}

function openEnrollModal() {
  const clsName = document.getElementById('cd-name').innerText;
  const clsId = db.classes.find(c => c.className === clsName)?.classId;
  
  document.getElementById('enroll-cls-name').innerText = clsName;
  document.getElementById('enroll-cls-id').value = clsId;
  
  document.getElementById('enroll-search-hv').value = '';
  document.getElementById('enroll-student-id').value = '';
  document.getElementById('enroll-selected-hv').innerText = 'Chưa chọn ai';
  document.getElementById('btn-save-enroll').disabled = true;
  
  document.getElementById('enroll-modal').classList.add('open');
}

function searchStudentForEnroll() {
  const kw = document.getElementById('enroll-search-hv').value.toLowerCase().trim();
  const box = document.getElementById('enroll-search-results');
  
  if (kw.length < 1) { box.classList.add('hidden'); return; }
  
  const matches = db.students.filter(s => 
    (s.ho + ' ' + s.ten).toLowerCase().includes(kw) || 
    (s.parentPhone && s.parentPhone.includes(kw))
  ).slice(0, 10);
  
  if (matches.length === 0) {
    box.innerHTML = '<div class="p-2 text-sm text-gray-500">Không tìm thấy ai.</div>';
    box.classList.remove('hidden');
    return;
  }

  box.innerHTML = matches.map(s => `
    <div onclick="selectStudentForEnroll(${s.stt}, '${s.ho} ${s.ten}')" class="p-2 hover:bg-blue-50 cursor-pointer border-b text-sm">
      <div class="font-bold text-blue-700">${s.ho} ${s.ten}</div>
      <div class="text-xs text-gray-500">${s.parentPhone || 'Không có SĐT'}</div>
    </div>
  `).join('');
  box.classList.remove('hidden');
}

function selectStudentForEnroll(stt, name) {
  document.getElementById('enroll-search-hv').value = name;
  document.getElementById('enroll-student-id').value = stt;
  document.getElementById('enroll-selected-hv').innerText = name;
  document.getElementById('enroll-search-results').classList.add('hidden');
  document.getElementById('btn-save-enroll').disabled = false;
}

async function saveEnrollment() {
  const studentId = document.getElementById('enroll-student-id').value;
  const classId = document.getElementById('enroll-cls-id').value;
  if(!studentId || !classId) return;
  
  try {
    await apiPost('enroll_student', { studentId, classId });
    showToast('Đã đăng ký lớp thành công!', 'success');
    document.getElementById('enroll-modal').classList.remove('open');
    await loadAllData(false);
    viewClassDetails(classId);
  } catch(e) {
    showToast('Lỗi: ' + e.message, 'error');
  }
}