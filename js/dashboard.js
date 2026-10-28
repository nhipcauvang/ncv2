function renderDashboard() {
  document.getElementById('stat-student').innerText = db.students.length;
  document.getElementById('stat-class').innerText = db.classes.length;
  
  const now = new Date();
  const cm = now.getMonth(), cy = now.getFullYear();
  let rev = 0;
  db.payments.forEach(p => {
    if(!p.paymentDate) return;
    const parts = p.paymentDate.split('/');
    if(parts.length === 3 && parseInt(parts[1]) === cm+1 && parseInt(parts[2]) === cy) rev += Number(p.amount);
  });
  document.getElementById('stat-revenue').innerText = rev.toLocaleString('vi-VN') + ' đ';

  // 1. Tính toán dữ liệu cho tất cả học viên
  let studentStats = db.students.map(s => {
    let totalPaidAll = 0;
    let warningLabels = [];
    let maxSessionDisplay = 0;
    let maxUnpaid = 0;
    let worstClassId = ''; // Lưu ID lớp nợ nặng nhất để nút Thu Tiền chọn đúng lớp
    let worstClassFee = 350000;
    let priority = 4; // 1: Đỏ, 2: Vàng, 3: Xanh dương, 4: Đủ

    let worstRowClass = ''; 
    let worstSessionClass = 'bg-green-100 text-green-700';

    const studentEnrolls = db.enrollments.filter(e => String(e.studentId) === String(s.stt));
    
    if (studentEnrolls.length === 0) {
      return {
        stt: s.stt, name: s.ho + ' ' + s.ten, 
        warningLabels: ['<span class="text-gray-400">Chưa xếp lớp</span>'],
        maxSessionDisplay: 0, totalPaidAll: 0, worstRowClass: '', worstSessionClass: '',
        maxUnpaid: 0, worstClassId: '', worstClassFee: 350000, priority: 4
      };
    }

    studentEnrolls.forEach(enr => {
      const cls = db.classes.find(c => String(c.classId) === String(enr.classId));
      const className = cls ? cls.className : enr.className;
      const classFee = cls ? Number(cls.tuitionFee) : 350000;

      const classSessions = cls ? (Number(cls.sessions) || 0) : 0;
      const att = db.attendances.find(a => String(a.studentId) === String(s.stt) && String(a.classId) === String(enr.classId));
      const studentSessions = att ? Number(att.sessions) : classSessions;
      
      if (studentSessions > maxSessionDisplay) maxSessionDisplay = studentSessions;

      const classPayments = db.payments.filter(p => String(p.studentId) === String(s.stt) && String(p.classId) === String(enr.classId));
      const paidForThisClass = classPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      totalPaidAll += paidForThisClass;

      const cyclesPaid = Math.floor(paidForThisClass / classFee);
      const allowed = cyclesPaid * 8; 
      const unpaid = studentSessions - allowed; 

      if (unpaid > 0) {
        if (unpaid >= 7) {
          warningLabels.push(`<span class="text-red-600 font-bold block">🔴 Nợ ${unpaid} buổi lớp ${className}</span>`);
          if(priority > 1) priority = 1;
          worstRowClass = 'row-red';
          worstSessionClass = 'bg-red-500 text-white font-bold';
        } else if (unpaid >= 5) {
          warningLabels.push(`<span class="text-yellow-600 font-bold block">🟡 Nợ ${unpaid} buổi lớp ${className}</span>`);
          if(priority > 2) priority = 2;
          if(worstRowClass !== 'row-red') worstRowClass = 'row-yellow';
          if(worstSessionClass !== 'bg-red-500 text-white font-bold') worstSessionClass = 'bg-yellow-400 text-yellow-900 font-bold';
        } else {
          warningLabels.push(`<span class="text-blue-500 block">Học trước ${unpaid} buổi lớp ${className}</span>`);
          if(priority > 3) priority = 3;
          if(worstRowClass === '') worstRowClass = '';
          if(worstSessionClass === 'bg-green-100 text-green-700') worstSessionClass = 'bg-blue-100 text-blue-700 font-bold';
        }
        
        // Ghi nhận lớp nợ nặng nhất để nút Thu Tiền tự động chọn
        if (unpaid > maxUnpaid) {
          maxUnpaid = unpaid;
          worstClassId = cls ? cls.classId : '';
          worstClassFee = classFee;
        }
      } else {
        warningLabels.push(`<span class="text-green-600 block">🟢 Đủ phí lớp ${className}</span>`);
      }
    });

    if (warningLabels.length === 0) {
      warningLabels.push('<span class="text-green-600 font-bold">🟢 Đủ</span>');
    }

    return {
      stt: s.stt, name: s.ho + ' ' + s.ten, warningLabels,
      maxSessionDisplay, totalPaidAll, worstRowClass, worstSessionClass,
      maxUnpaid, worstClassId, worstClassFee, priority
    };
  });

  // 2. Sắp xếp: Đỏ (1) -> Vàng (2) -> Xanh dương (3) -> Đủ (4)
  studentStats.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.maxUnpaid - a.maxUnpaid; // Cùng màu thì ai nợ nhiều hơn xếp trước
  });

  // 3. Render HTML
  const html = studentStats.map(s => {
    let btn = '';
    // Nếu có nợ, hiện nút thu tiền, truyền vào ID lớp đang nợ nặng nhất
    if (s.maxUnpaid > 0) {
       let btnColor = s.priority === 1 ? 'bg-red-600' : (s.priority === 2 ? 'bg-yellow-600' : 'bg-blue-600');
       btn = `<button onclick="quickPay(${s.stt}, '${s.worstClassId}', ${s.worstClassFee})" class="${btnColor} text-white px-3 py-1 rounded text-xs whitespace-nowrap hover:opacity-80">Thu tiền</button>`;
    }

    return `<tr class="${s.worstRowClass} border-b hover:bg-gray-50">
      <td class="p-3">${s.warningLabels.join('')}</td>
      <td class="p-3 font-bold text-gray-800">${s.name}</td>
      <td class="p-3 text-sm text-gray-600">Đa lớp</td>
      <td class="p-3 text-center">
        <span class="px-3 py-1 rounded-full ${s.worstSessionClass}">${s.maxSessionDisplay}</span>
      </td>
      <td class="p-3 text-center text-green-600">${s.totalPaidAll.toLocaleString('vi-VN')} đ</td>
      <td class="p-3">${btn}</td>
    </tr>`;
  }).join('');
  
  document.getElementById('dashboard-list').innerHTML = html;
}

// Hàm liên kết sang tab Thu Học Phí
// 1. Hàm mở Modal khi bấm nút ở Trang Chủ
function quickPay(stt, classId, fee) {
  const st = db.students.find(x => x.stt == stt);
  if(!st) return;
  
  const cls = db.classes.find(c => String(c.classId) === String(classId));

  document.getElementById('qp-student-name').innerText = st.ho + ' ' + st.ten;
  document.getElementById('qp-class-id').innerHTML = `<option value="${classId}">${cls ? cls.className : 'N/A'}</option>`;
  document.getElementById('qp-amount').value = fee || 350000;
  document.getElementById('qp-cycle').value = 8;
  document.getElementById('qp-method').value = 'Tiền mặt';
  
  document.getElementById('quick-pay-modal').classList.add('open');
}

// 2. Hàm thực thi lưu tiền khi bấm nút "Thu Tiền" trong Modal
async function executeQuickPay() {
  const stName = document.getElementById('qp-student-name').innerText;
  const cid = document.getElementById('qp-class-id').value;
  const amount = document.getElementById('qp-amount').value;
  const cycle = document.getElementById('qp-cycle').value;
  const method = document.getElementById('qp-method').value;
  
  if (!amount || !cid) return showToast('Thiếu thông tin số tiền hoặc lớp!', 'warning');
  
  const btn = document.getElementById('btn-qp-submit');
  const oldText = btn.innerHTML;
  btn.innerHTML = '⏳ Đang lưu...';
  btn.disabled = true;

  // Tìm ID học viên dựa vào tên (vì Modal không lưu ID trực tiếp)
  const st = db.students.find(x => (x.ho + ' ' + x.ten) === stName);
  if(!st) {
    btn.innerHTML = oldText; btn.disabled = false;
    return showToast('Không tìm thấy học viên!', 'error');
  }

 try {
    await apiPost('save_payment', {
      studentId: st.stt, classId: cid, amount: amount, cycle: cycle,
      paymentDate: new Date().toLocaleDateString('vi-VN'), method: method,
      note: document.getElementById('qp-note').value // Lấy ghi chú từ modal nhanh
    });
    
    showToast('Đã thu tiền thành công!', 'success');
    document.getElementById('quick-pay-modal').classList.remove('open');
    loadAllData(false); // Tải lại dữ liệu để cập nhật Trang Chủ
    
  } catch(e) {
    showToast('Lỗi: ' + e.message, 'error');
  } finally {
    btn.innerHTML = oldText;
    btn.disabled = false;
  }
}