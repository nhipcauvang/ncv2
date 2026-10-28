function handleLogin() {
  if (document.getElementById('login-username').value === 'giamdoc' &&
      document.getElementById('login-password').value === '123') {
    sessionStorage.setItem('ncv_login', '1');
    document.getElementById('login-screen').style.display = 'none';
    const cache = localStorage.getItem('ncv_db');
    if (cache) { db = JSON.parse(cache); renderAll(); }
    loadAllData(true);
  } else {
    alert('Sai tài khoản!');
  }
}

function handleLogout() {
  sessionStorage.removeItem('ncv_login');
  location.reload();
}