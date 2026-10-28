function loadStudentsForAttendance() {
  const cid = document.getElementById('att-class').value;
  if (!cid) { document.getElementById('attendance-list').innerHTML = ''; return; }
  
  // Lấy danh sách ID học viên đăng ký lớp này
  const enrolls = db.enrollments.filter(e => String(e.classId) === String(cid));
  
  // Lấy thông tin chi tiết học viên
  attTempData = enrolls.map(e => db.students.find(s => String(s.stt) === String(e.studentId))).filter(s => s);
  
  document.getElementById('attendance-list').innerHTML = attTempData.map((s, i) => `
    <tr class="border-b hover:bg-gray-50">
      <td class="p-3 text-center">${i + 1}</td>
      <td class="p-3 font-medium">${s.ho} ${s.ten}</td>
      <td class="p-3">
        <label class="inline-flex items-center gap-2 cursor-pointer">
          <input type="radio" name="att_${s.stt}" value="present" checked class="w-4 h-4 text-green-600">
          <span class="text-green-700">Có mặt</span>
        </label>
        <label class="inline-flex items-center gap-2 cursor-pointer ml-4">
          <input type="radio" name="att_${s.stt}" value="absent" class="w-4 h-4 text-red-600">
          <span class="text-red-700">Vắng</span>
        </label>
      </td>
    </tr>
  `).join('');
}

async function saveAttendance() {
  const classId = document.getElementById('att-class').value;
  const date = document.getElementById('att-date').value;
  const session = document.getElementById('att-session').value;
  if (!classId || !date) return alert('Chọn Lớp và Ngày!');

  const records = attTempData.map(s => ({
    studentId: s.stt, studentName: `${s.ho} ${s.ten}`,
    status: document.querySelector(`input[name="att_${s.stt}"]:checked`).value
  }));

  if (records.length === 0) return alert('Lớp này chưa có HV!');

  await apiPost('save_attendance', { classId, date, sessionNumber: session, records });
  alert('✅ Đã lưu điểm danh!');
  document.getElementById('att-session').value = Number(session) + 1;
  loadAllData(false);
}