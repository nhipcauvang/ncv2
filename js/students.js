function renderStudents() {
  const kw = document.getElementById('search-student') ? document.getElementById('search-student').value.toLowerCase() : '';
  const tb = document.getElementById('student-list');
  const list = db.students.filter(s => (s.ho + ' ' + s.ten + ' ' + s.parentPhone).toLowerCase().includes(kw));

  tb.innerHTML = list.map(s => `
    <tr class="border-b hover:bg-gray-50">
      <td class="p-2 text-center text-xs">${s.stt}</td>
      <td class="p-2 font-medium">${s.ho}</td>
      <td class="p-2 text-blue-700 font-bold">${s.ten}</td>
      <td class="p-2 text-sm">${s.birthYear || ''}</td>
      <td class="p-2 text-sm">${s.school || ''}</td>
      <td class="p-2 text-sm">${s.className || ''}</td>
      <td class="p-2 text-sm">${s.parentPhone || ''}</td>
      <td class="p-2 whitespace-nowrap">
        <button onclick="viewStudentProgress(${s.stt})" class="text-teal-600 hover:underline text-xs font-bold mr-2" title="Xem tiến độ">Xem</button>
        <button onclick="openAssignClassModal(${s.stt})" class="text-orange-600 hover:underline text-xs font-bold mr-2" title="Gán vào lớp">🎯 Gán Lớp</button>
        <button onclick="viewStudentProfile(${s.stt})" class="text-purple-600 hover:underline text-xs font-bold mr-2" title="Xem hồ sơ">HĐ</button>
        <button onclick="editStudent(${s.stt})" class="text-blue-600 hover:underline text-xs mr-1">Sửa</button>
        <button onclick="deleteStudent(${s.stt})" class="text-red-600 hover:underline text-xs">Xóa</button>
      </td>
    </tr>
  `).join('');
}

function viewStudentProgress(stt) {
  const s = db.students.find(x => x.stt == stt);
  if(!s) return;
  
  document.getElementById('sp-name').innerText = s.ho + ' ' + s.ten;
  document.getElementById('sp-info').innerHTML = `
    <div><span class="text-gray-500">Năm sinh:</span> <b>${s.birthYear || '---'}</b></div>
    <div><span class="text-gray-500">Trường:</span> ${s.school || '---'}</div>
    <div><span class="text-gray-500">SĐT PH:</span> ${s.parentPhone || '---'}</div>
    <div><span class="text-gray-500">Địa chỉ:</span> ${s.address || '---'}</div>
  `;
  
  const enrolls = db.enrollments.filter(e => String(e.studentId) === String(stt));
  
  document.getElementById('sp-class-list').innerHTML = enrolls.map(e => {
    const cls = db.classes.find(c => c.classId === e.classId);
    const teacher = cls ? cls.teacherName : '---';
    const totalClassSessions = cls ? (Number(cls.sessions) || 0) : 0;
    
    // Lấy số buổi học viên đã học từ bảng DiemDanh
    const att = db.attendances.find(a => String(a.studentId) === String(stt) && String(a.classId) === String(e.classId));
    
    // Nếu chưa có trong bảng điểm danh -> Mặc định bằng số buổi của lớp
    const studentSessions = att ? Number(att.sessions) : totalClassSessions;

    return `<tr class="border-b hover:bg-gray-50">
      <td class="p-3 font-semibold text-blue-700">${e.className}</td>
      <td class="p-3">${teacher}</td>
      <td class="p-3 text-center font-bold text-purple-600">${totalClassSessions} buổi</td>
      <td class="p-3 text-center">
        <input type="number" id="st_sess_${e.classId}" value="${studentSessions}" min="0" class="w-16 border p-1 rounded text-center font-bold text-green-600">
      </td>
      <td class="p-3 text-center">
        <button onclick="updateStudentProgress(${stt}, '${e.classId}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">Cập nhật</button>
      </td>
    </tr>`;
  }).join('');
  
  if(enrolls.length === 0) {
    document.getElementById('sp-class-list').innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">Chưa đăng ký lớp nào.</td></tr>';
  }
  document.getElementById('student-progress-modal').classList.add('open');
}

async function updateStudentProgress(studentId, classId) {
  const val = document.getElementById('st_sess_' + classId).value;
  const sessions = parseInt(val) || 0;
  
  try {
    await apiPost('update_student_session', { studentId, classId, sessions });
    showToast('Đã cập nhật số buổi học viên!', 'success');
    
    // Cập nhật lại dữ liệu trong bộ nhớ tạm
    let att = db.attendances.find(a => String(a.studentId) === String(studentId) && String(a.classId) === String(classId));
    if(att) {
      att.sessions = sessions;
    } else {
      db.attendances.push({ studentId, classId, sessions, lastUpdated: new Date().toLocaleDateString('vi-VN') });
    }
    
    // Tự động load lại bảng để thấy thay đổi ngay lập tức
    viewStudentProgress(studentId); 
    
  } catch(e) {
    showToast('Lỗi: ' + e.message, 'error');
  }
}

// ================= CÁC HÀM CŨ GIỮ NGUYÊN =================
function openAssignClassModal(stt) {
  const st = db.students.find(x => x.stt == stt);
  if(!st) return;
  document.getElementById('assign-st-id').value = stt;
  document.getElementById('assign-st-name').innerText = st.ho + ' ' + st.ten;
  const listDiv = document.getElementById('assign-class-list');
  const enrolledIds = db.enrollments.filter(e => String(e.studentId) === String(stt)).map(e => e.classId);
  
  if (db.classes.length === 0) {
    listDiv.innerHTML = '<div class="text-center text-gray-500 p-2">Chưa có lớp học nào được tạo.</div>';
  } else {
    listDiv.innerHTML = db.classes.map(c => {
      const isChecked = enrolledIds.includes(c.classId) ? 'checked' : '';
      return `
        <label class="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors border border-transparent hover:border-gray-200">
          <input type="checkbox" value="${c.classId}" ${isChecked} class="assign-cb w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer">
          <div class="flex-1">
            <div class="font-bold text-gray-800">${c.className}</div>
            <div class="text-xs text-gray-500">GV: ${c.teacherName} | Ca: ${c.shift} | Phòng: ${c.room}</div>
          </div>
        </label>
      `;
    }).join('');
  }

  const actionDiv = document.createElement('div');
  actionDiv.className = "flex justify-end gap-2 mt-4 pt-3 border-t action-buttons";
  actionDiv.innerHTML = `
    <button onclick="document.getElementById('assign-class-modal').classList.remove('open')" class="px-4 py-2 border rounded hover:bg-gray-100">Hủy</button>
    <button onclick="saveAssignClasses()" class="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700">💾 Lưu Lớp Đã Chọn</button>
  `;
  
  const oldAction = listDiv.parentElement.querySelector('.action-buttons');
  if(oldAction) oldAction.remove();
  
  listDiv.parentElement.appendChild(actionDiv);
  document.getElementById('assign-class-modal').classList.add('open');
}

async function saveAssignClasses() {
  const stt = document.getElementById('assign-st-id').value;
  const checkboxes = document.querySelectorAll('.assign-cb');
  const selectedClassIds = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
  const oldEnrolls = db.enrollments.filter(e => String(e.studentId) === String(stt));
  const oldClassIds = oldEnrolls.map(e => e.classId);
  const toAdd = selectedClassIds.filter(id => !oldClassIds.includes(id));
  const toRemove = oldClassIds.filter(id => !selectedClassIds.includes(id));

  if (toAdd.length === 0 && toRemove.length === 0) {
    showToast('Không có thay đổi nào!', 'info');
    document.getElementById('assign-class-modal').classList.remove('open');
    return;
  }

  const btn = document.querySelector('.action-buttons button.bg-green-600');
  btn.innerText = '⏳ Đang lưu...';
  btn.disabled = true;

  try {
    for (const classId of toAdd) await apiPost('enroll_student', { studentId: stt, classId: classId });
    for (const classId of toRemove) await apiPost('delete_enroll', { enrollId: stt + '_' + classId });
    showToast('Đã cập nhật lớp cho Học Viên!', 'success');
    document.getElementById('assign-class-modal').classList.remove('open');
    await loadAllData(false);
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error');
  } finally {
    btn.innerText = '💾 Lưu Lớp Đã Chọn';
    btn.disabled = false;
  }
}

function openStudentModal() {
  // 1. Kiểm tra xem form có tồn tại trong HTML không
  const modal = document.getElementById('student-modal');
  if (!modal) {
    alert("LỖI: Không tìm thấy thẻ <div id='student-modal'> trong file HTML. Hãy chắc chắn bạn đã lưu file index.html!");
    return;
  }

  // 2. Đổi tiêu đề
  const title = document.getElementById('st-modal-title');
  if (title) title.innerText = 'Thêm Học Viên';

  // 3. Reset các ô nhập liệu (Bọc kiểm tra an toàn)
  const fields = ['st-id', 'st-ho', 'st-ten', 'st-by', 'st-school', 'st-class', 'st-phone', 'st-cccd', 'st-address'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  
  const feeEl = document.getElementById('st-fee');
  if (feeEl) feeEl.value = 350000;

  // 4. Hiển thị Modal
  modal.classList.add('open');
}
function editStudent(stt) {
  const s = db.students.find(x => x.stt == stt);
  if (!s) return;
  document.getElementById('st-modal-title').innerText = 'Sửa Học Viên';
  document.getElementById('st-id').value = s.stt;
  document.getElementById('st-ho').value = s.ho;
  document.getElementById('st-ten').value = s.ten;
  document.getElementById('st-by').value = s.birthYear || '';
  document.getElementById('st-school').value = s.school || '';
  document.getElementById('st-class').value = s.className || '';
  document.getElementById('st-phone').value = s.parentPhone || '';
  document.getElementById('st-cccd').value = s.cccd || '';
  document.getElementById('st-fee').value = s.monthlyFee || 350000;
  document.getElementById('st-address').value = s.address || '';
  document.getElementById('student-modal').classList.add('open');
}
async function saveStudent() {
  const data = {
    stt: document.getElementById('st-id').value,
    ho: document.getElementById('st-ho').value, ten: document.getElementById('st-ten').value,
    birthYear: document.getElementById('st-by').value, school: document.getElementById('st-school').value,
    className: document.getElementById('st-class').value, 
    parentPhone: document.getElementById('st-phone').value, cccd: document.getElementById('st-cccd').value,
    monthlyFee: document.getElementById('st-fee').value, address: document.getElementById('st-address').value,
    startDate: new Date().toLocaleDateString('vi-VN')
  };
  if (!data.ho || !data.ten) return showToast('Vui lòng nhập Họ Tên!', 'warning');
  try {
    await apiPost('save_student', data);
    showToast('Đã lưu Học Viên!', 'success');
    document.getElementById('student-modal').classList.remove('open');
    loadAllData(false);
  } catch(e) { showToast('Lỗi: ' + e.message, 'error'); }
}
async function deleteStudent(stt) {
  if (!confirm('Xóa học viên này?')) return;
  try {
    await apiPost('delete_student', { stt });
    showToast('Đã xóa Học Viên!', 'success');
    loadAllData(false);
  } catch(e) { showToast('Lỗi: ' + e.message, 'error'); }
}
function viewStudentProfile(stt) {
  const s = db.students.find(x => x.stt == stt);
  if(!s) return;
  document.getElementById('profile-info').innerHTML = `
    <div class="grid grid-cols-2 gap-2">
      <div><span class="text-gray-500">Họ tên:</span> <b>${s.ho} ${s.ten}</b></div>
      <div><span class="text-gray-500">Năm sinh:</span> ${s.birthYear || '---'}</div>
      <div><span class="text-gray-500">Trường:</span> ${s.school || '---'}</div>
      <div><span class="text-gray-500">SĐT PH:</span> ${s.parentPhone || '---'}</div>
      <div class="col-span-2"><span class="text-gray-500">Địa chỉ:</span> ${s.address || '---'}</div>
    </div>
  `;
  const enrolls = db.enrollments.filter(e => String(e.studentId) === String(stt));
  document.getElementById('profile-classes').innerHTML = enrolls.map(e => {
    const cls = db.classes.find(c => c.classId === e.classId);
    const teacher = cls ? cls.teacherName : '---';
    const fee = cls ? Number(cls.tuitionFee).toLocaleString('vi-VN') + ' đ' : '---';
    return `<tr class="border-b">
      <td class="p-2 font-semibold text-blue-600">${e.className}</td>
      <td class="p-2">${teacher}</td>
      <td class="p-2 text-green-600 font-bold">${fee}</td>
      <td class="p-2">${e.regDate}</td>
      <td class="p-2"><button onclick="removeEnrollment('${e.enrollId}', ${stt})" class="text-red-500 hover:underline text-xs">Hủy ĐK</button></td>
    </tr>`;
  }).join('');
  if(enrolls.length === 0) document.getElementById('profile-classes').innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">Học viên chưa đăng ký lớp nào.</td></tr>';
  document.getElementById('student-profile-modal').classList.add('open');
}
async function removeEnrollment(enrollId, stt, classId) {
  if(!confirm('Bạn có chắc muốn hủy đăng ký lớp này?')) return;
  try {
    await apiPost('delete_enroll', { enrollId });
    showToast('Đã hủy đăng ký lớp!', 'success');
    await loadAllData(false);
    if(classId && typeof viewClassDetails === 'function') viewClassDetails(classId);
    else if(stt) viewStudentProfile(stt);
  } catch(e) { showToast('Lỗi: ' + e.message, 'error'); }
}
