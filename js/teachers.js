function renderTeachers() {
  document.getElementById('teacher-list').innerHTML = db.teachers.map(t => `
    <tr class="border-b hover:bg-gray-50">
      <td class="p-3 text-xs text-gray-500">${t.teacherId}</td>
      <td class="p-3 font-bold text-blue-700">${t.teacherName}</td>
      <td class="p-3 text-sm">${t.phone || ''}</td>
      <td class="p-3"><span class="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">${t.subjects || ''}</span></td>
      <td class="p-3 text-sm">Khối: ${t.grades || ''}</td>
      <td class="p-3 whitespace-nowrap">
        <button onclick="editTeacher('${t.teacherId}')" class="text-blue-600 hover:underline text-xs">Sửa</button>
        <button onclick="deleteTeacher('${t.teacherId}')" class="text-red-600 hover:underline text-xs ml-2">Xóa</button>
      </td>
    </tr>
  `).join('');
}

function openTeacherModal() {
  document.getElementById('gv-modal-title').innerText = 'Thêm Giáo Viên';
  document.getElementById('gv-id').value = '';
  document.getElementById('gv-name').value = '';
  document.getElementById('gv-phone').value = '';
  document.getElementById('gv-subjects').value = '';
  document.getElementById('gv-grades').value = '';
  document.getElementById('teacher-modal').classList.add('open');
}

function editTeacher(id) {
  const t = db.teachers.find(x => x.teacherId === id);
  if(!t) return;
  document.getElementById('gv-modal-title').innerText = 'Sửa Giáo Viên';
  document.getElementById('gv-id').value = t.teacherId;
  document.getElementById('gv-name').value = t.teacherName;
  document.getElementById('gv-phone').value = t.phone || '';
  document.getElementById('gv-subjects').value = t.subjects || '';
  document.getElementById('gv-grades').value = t.grades || '';
  document.getElementById('teacher-modal').classList.add('open');
}

async function saveTeacher() {
  const data = {
    teacherId: document.getElementById('gv-id').value,
    teacherName: document.getElementById('gv-name').value.trim(),
    phone: document.getElementById('gv-phone').value.trim(),
    subjects: document.getElementById('gv-subjects').value.trim(),
    grades: document.getElementById('gv-grades').value.trim()
  };
  if (!data.teacherName) return showToast('Vui lòng nhập tên Giáo Viên!', 'warning');
  
  const action = data.teacherId ? 'update_teacher' : 'create_teacher';
  const btn = document.querySelector('#teacher-modal button.bg-blue-600');
  const oldText = btn.innerHTML;
  
  try {
    btn.innerHTML = '⏳ Đang lưu...';
    btn.disabled = true;
    await apiPost(action, data);
    showToast('Đã lưu thông tin Giáo Viên!', 'success');
    document.getElementById('teacher-modal').classList.remove('open');
    loadAllData(false);
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error');
  } finally {
    btn.innerHTML = oldText;
    btn.disabled = false;
  }
}

async function deleteTeacher(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa giáo viên này?')) return;
  try {
    await apiPost('delete_teacher', { teacherId: id });
    showToast('Đã xóa Giáo Viên!', 'success');
    loadAllData(false);
  } catch(e) {
    showToast('Lỗi xóa: ' + e.message, 'error');
  }
}