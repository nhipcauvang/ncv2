// Hàm hiển thị thông báo dạng Toast
function showToast(message, type = 'success') {
  // Tạo khung chứa thông báo nếu chưa có
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    // Đặt ở góc trên bên phải, hiển thị trên cùng
    container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }

  // Tạo phần tử thông báo
  const toast = document.createElement('div');
  // Thiết kế màu sắc dựa trên loại thông báo (thành công, lỗi, cảnh báo)
  let bgClass = 'bg-green-500';
  let icon = '✅';
  if (type === 'error') { bgClass = 'bg-red-500'; icon = '❌'; }
  else if (type === 'warning') { bgClass = 'bg-yellow-500'; icon = '⚠️'; }
  else if (type === 'info') { bgClass = 'bg-blue-500'; icon = 'ℹ️'; }

  toast.className = `${bgClass} text-white px-4 py-3 rounded shadow-lg flex items-center gap-2 transform transition-all duration-300 translate-x-full opacity-0 pointer-events-auto text-sm font-medium`;
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  // Hiệu ứng trượt vào
  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  }, 10);

  // Tự động biến mất sau 3 giây
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => { toast.remove(); }, 300);
  }, 3000);
}