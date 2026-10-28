document.addEventListener('keydown', function(event) {
  // 1. Phím ESC: Tự động đóng tất cả các Modal đang mở
  if (event.key === 'Escape' || event.key === 'Esc') {
    const openModals = document.querySelectorAll('.modal.open');
    if (openModals.length > 0) {
      openModals.forEach(modal => modal.classList.remove('open'));
      event.preventDefault();
    }
  }

  // 2. Phím ENTER: Tự động kích hoạt nút Lưu (hoặc tìm kiếm)
  if (event.key === 'Enter') {
    const openModal = document.querySelector('.modal.open');
    
    if (openModal) {
      // Đang mở Modal: Tìm nút "Lưu" (có màu xanh hoặc màu xanh lá) và bấm tự động
      // Ưu tiên tìm các nút có chữ "Lưu" hoặc "Đăng ký"
      const saveButtons = openModal.querySelectorAll('button');
      let btnToClick = null;
      
      saveButtons.forEach(btn => {
        const text = btn.innerText.toLowerCase();
        // Bỏ qua các nút Hủy/Xóa
        if (text.includes('hủy') || text.includes('xóa')) return; 
        
        if (text.includes('lưu') || text.includes('đăng ký') || text.includes('tạo lớp')) {
          btnToClick = btn;
        }
      });

      // Nếu tìm thấy nút Lưu, bấm nó
      if (btnToClick) {
        event.preventDefault(); // Ngăn hành vi xuống dòng mặc định của Enter
        btnToClick.click();
      }
    } else {
      // Không mở Modal: Nếu đang ở ô tìm kiếm, Enter sẽ gõ 1 phát
      if (event.target.tagName === 'INPUT' && event.target.type === 'text') {
        // Có thể để trống hoặc kích hoạt tìm kiếm nếu cần
      }
    }
  }
});