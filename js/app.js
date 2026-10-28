async function loadAllData(alert) {
  if(alert) document.getElementById('api-status').innerText = '⏳...';
  try {
    const res = await apiGet('read_all');
    if(res.error) throw new Error(res.error);
    db = res;
    localStorage.setItem('ncv_db', JSON.stringify(db));
    document.getElementById('api-status').className = 'text-xs px-2 py-1 rounded bg-green-100 text-green-700';
    document.getElementById('api-status').innerText = '🟢 Online';
    renderAll();
    
    // Thêm thông báo tại đây
    if(alert) showToast('Đã đồng bộ dữ liệu mới nhất!', 'info');
    
  } catch (e) {
    document.getElementById('api-status').className = 'text-xs px-2 py-1 rounded bg-red-100 text-red-700';
    document.getElementById('api-status').innerText = '🔴 Lỗi';
    if (alert) showToast('Lỗi tải dữ liệu!', 'error');
  }
}

function renderAll() {
  renderDashboard();
  renderStudents();
  renderTeachers();
  renderClasses();
  renderPayments();
}

window.onload = function () {
  if (sessionStorage.getItem('ncv_login')) {
    document.getElementById('login-screen').style.display = 'none';
    const cache = localStorage.getItem('ncv_db');
    if (cache) { db = JSON.parse(cache); renderAll(); }
    loadAllData(true);
  }
};