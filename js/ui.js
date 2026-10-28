function switchTab(id) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  document.querySelectorAll('button[id^="btn-tab"]').forEach(el => {
    el.classList.remove('tab-active'); el.classList.add('text-gray-600');
  });
  document.getElementById('btn-' + id).classList.add('tab-active');
  document.getElementById('btn-' + id).classList.remove('text-gray-600');

  if (id === 'tab-dashboard') renderDashboard();
  if (id === 'tab-students') renderStudents();
  if (id === 'tab-teachers') renderTeachers();
  if (id === 'tab-classes') renderClasses();
  if (id === 'tab-payment') { populateDropdowns(); renderPayments(); }
  if (id === 'tab-reports') renderReports();
}

function populateDropdowns() {
  document.getElementById('att-class').innerHTML = '<option value="">-- Chọn Lớp --</option>' +
    db.classes.map(c => `<option value="${c.classId}">${c.className} (${c.teacherName})</option>`).join('');
  document.getElementById('pay-student').innerHTML = '<option value="">-- Chọn Bé --</option>' +
    db.students.map(s => `<option value="${s.stt}">${s.ho} ${s.ten}</option>`).join('');
  document.getElementById('pay-class').innerHTML = '<option value="">-- Chọn Lớp --</option>' +
    db.classes.map(c => `<option value="${c.classId}">${c.className}</option>`).join('');
}