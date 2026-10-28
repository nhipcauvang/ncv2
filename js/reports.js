function changeReportType() {
  const type = document.getElementById('rp-type').value;
  document.getElementById('rp-filter-month').classList.add('hidden');
  document.getElementById('rp-filter-class').classList.add('hidden');
  document.getElementById('rp-filter-teacher').classList.add('hidden');
  
  if(type === 'month') document.getElementById('rp-filter-month').classList.remove('hidden');
  if(type === 'class') document.getElementById('rp-filter-class').classList.remove('hidden');
  if(type === 'teacher') document.getElementById('rp-filter-teacher').classList.remove('hidden');
}

function executeReport() {
  const tb = document.getElementById('rp-detail-list');
  const thead = document.getElementById('rp-thead');
  if(!tb || !thead) return;

  // Nạp dữ liệu vào dropdown nếu chưa có
  if(document.getElementById('rp-class').options.length === 0) {
    document.getElementById('rp-class').innerHTML = db.classes.map(c => `<option value="${c.classId}">${c.className}</option>`).join('');
  }
  if(document.getElementById('rp-teacher').options.length === 0) {
    document.getElementById('rp-teacher').innerHTML = db.teachers.map(t => `<option value="${t.teacherName}">${t.teacherName}</option>`).join('');
  }
  if(!document.getElementById('rp-month').value) {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('rp-month').value = `${now.getFullYear()}-${mm}`;
  }

  const type = document.getElementById('rp-type').value;
  const methodFilter = document.getElementById('rp-method').value;
  const monthVal = document.getElementById('rp-month').value;
  
  try {
    // ================= 1. TÍNH LƯƠNG NẾU CHỌN LỚP HOẶC GIÁO VIÊN =================
    if(type === 'teacher' || type === 'class') {
      renderSalaryTable(type, methodFilter);
    } else {
      document.getElementById('chot-thang-area').classList.add('hidden');
    }

    // ================= 2. TÍNH TOÁN BÁO CÁO DOANH THU =================
    let basePayments = db.payments || [];
    if (methodFilter !== 'all') {
      basePayments = basePayments.filter(p => (p.method || 'Tiền mặt').trim() === methodFilter);
    }

    let filteredPayments = [];
    let totalStudents = 0;
    let label = "Tổng Doanh Thu";
    let labelSt = "Tổng Học Viên";

    if (type === 'month') {
      if(monthVal) {
        const [year, month] = monthVal.split('-');
        label = `Tổng Doanh Thu Tháng ${month}/${year}`;
        if(methodFilter !== 'all') label += ` (${methodFilter})`;
        filteredPayments = basePayments.filter(p => {
          if(!p.paymentDate || typeof p.paymentDate !== 'string') return false;
          const parts = p.paymentDate.split('/');
          if(parts.length !== 3) return false;
          return parseInt(parts[1]) === parseInt(month) && parseInt(parts[2]) === parseInt(year);
        });
      }
    } 
    else if (type === 'class') {
      const classId = document.getElementById('rp-class').value;
      const cls = db.classes.find(c => String(c.classId) === String(classId));
      if(cls) {
        label = `Tổng Thu Lớp ${cls.className}`;
        if(methodFilter !== 'all') label += ` (${methodFilter})`;
        filteredPayments = basePayments.filter(p => String(p.classId) === String(classId));
        totalStudents = db.enrollments.filter(e => String(e.classId) === String(classId)).length;
        labelSt = "Số lượng Học viên";
      }
    }
    else if (type === 'teacher') {
      const teacherName = document.getElementById('rp-teacher').value;
      if(teacherName) {
        label = `Tổng Thu GV ${teacherName}`;
        if(methodFilter !== 'all') label += ` (${methodFilter})`;
        const classIds = db.classes.filter(c => c.teacherName === teacherName).map(c => String(c.classId));
        filteredPayments = basePayments.filter(p => classIds.includes(String(p.classId)));
        const enrolls = db.enrollments.filter(e => classIds.includes(String(e.classId)));
        const uniqueStudents = new Set(enrolls.map(e => e.studentId));
        totalStudents = uniqueStudents.size;
        labelSt = "Số lượng Học viên";
      }
    }

    const totalMoney = filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    document.getElementById('rp-total-money').innerText = totalMoney.toLocaleString('vi-VN') + ' đ';
    document.getElementById('rp-total-label').innerText = label;
    
    if(type === 'class' || type === 'teacher') {
      document.getElementById('rp-total-st').innerText = totalStudents;
      document.getElementById('rp-label-st').innerText = labelSt;
    } else {
      document.getElementById('rp-total-st').innerText = db.students.length;
      document.getElementById('rp-label-st').innerText = "Tổng Học Viên";
    }

    // ================= 3. VẼ BẢNG CHI TIẾT GIAO DỊCH =================
    thead.innerHTML = `
      <tr class="bg-gray-100 text-gray-600 text-sm">
        <th class="p-3 border-b text-center" style="width: 110px;">Ngày Đóng</th>
        <th class="p-3 border-b">Học Viên</th>
        <th class="p-3 border-b">Lớp</th>
        <th class="p-3 border-b">Hình Thức</th>
        <th class="p-3 border-b">Ghi chú</th>
        <th class="p-3 border-b text-right">Số Tiền</th>
      </tr>
    `;

    // Xử lý hiển thị danh sách (Nếu lọc theo lớp/gv sẽ cố gắng hiện cả người chưa đóng)
    let displayRows = [];
    
    if (type === 'teacher' || type === 'class') {
        // Lấy danh sách tất cả học viên trong các lớp được chọn
        let targetClassIds = [];
        if(type === 'class') {
            targetClassIds = [document.getElementById('rp-class').value];
        } else {
            const tName = document.getElementById('rp-teacher').value;
            targetClassIds = db.classes.filter(c => c.teacherName === tName).map(c => c.classId);
        }
        
        targetClassIds.forEach(cid => {
            const cls = db.classes.find(c => c.classId === cid);
            const enrolls = db.enrollments.filter(e => String(e.classId) === String(cid));
            
            enrolls.forEach(enr => {
                const st = db.students.find(s => String(s.stt) === String(enr.studentId));
                // Tìm xem trong tháng này học viên có đóng tiền cho lớp này không
                const payment = filteredPayments.find(p => String(p.studentId) === String(enr.studentId) && String(p.classId) === String(cid));
                
                displayRows.push({
                    paymentDate: payment ? payment.paymentDate : '---',
                    studentName: st ? st.ho + ' ' + st.ten : 'N/A',
                    className: cls ? cls.className : enr.className,
                    method: payment ? (payment.method || 'Tiền mặt') : 'Chưa đóng',
                    note: payment ? (payment.note || '') : '',
                    amount: payment ? Number(payment.amount) : 0,
                    isPaid: !!payment
                });
            });
        });
    } else {
        displayRows = filteredPayments.map(p => {
            const s = db.students.find(x => String(x.stt) === String(p.studentId));
            const c = db.classes.find(x => String(x.classId) === String(p.classId));
            return {
                paymentDate: p.paymentDate,
                studentName: s ? s.ho + ' ' + s.ten : 'N/A',
                className: c ? c.className : 'N/A',
                method: p.method || 'Tiền mặt',
                note: p.note || '',
                amount: Number(p.amount),
                isPaid: true
            };
        });
    }

    if(displayRows.length === 0) {
      tb.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">Không có dữ liệu.</td></tr>`;
      return;
    }

    // Sắp xếp theo lớp, sau đó người đã đóng lên trước
    displayRows.sort((a, b) => {
      if(a.className !== b.className) return a.className.localeCompare(b.className);
      if(a.isPaid !== b.isPaid) return a.isPaid ? -1 : 1;
      return 0;
    });

    tb.innerHTML = displayRows.map(r => {
      let methodColor = "bg-gray-100 text-gray-700";
      if (r.method === "Chuyển khoản") methodColor = "bg-blue-100 text-blue-700";
      if (r.method === "Giáo viên thu") methodColor = "bg-purple-100 text-purple-700";
      if (r.method === "Chưa đóng") methodColor = "bg-red-100 text-red-700";
      
      const amountDisplay = r.isPaid 
        ? `<span class="text-green-600 font-bold whitespace-nowrap">${r.amount.toLocaleString('vi-VN')} đ</span>` 
        : `<span class="text-gray-400 font-italic">Chưa đóng</span>`;

      return `
        <tr class="border-b hover:bg-gray-50 ${r.isPaid ? '' : 'opacity-70 bg-gray-50'}">
          <td class="p-3 font-semibold text-gray-600 text-center">${r.paymentDate}</td>
          <td class="p-3 font-bold ${r.isPaid ? 'text-blue-700' : 'text-gray-600'}">${r.studentName}</td>
          <td class="p-3 text-sm">${r.className}</td>
          <td class="p-3 text-sm"><span class="${methodColor} px-2 py-1 rounded text-xs font-bold whitespace-nowrap">${r.method}</span></td>
          <td class="p-3 text-sm text-gray-600 italic">${r.note}</td>
          <td class="p-3 text-right">${amountDisplay}</td>
        </tr>
      `;
    }).join('');
    
  } catch (error) {
    console.error("LỖI BÁO CÁO:", error);
    tb.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500 font-bold">Lỗi: ${error.message}</td></tr>`;
  }
}

// Hàm phụ vẽ Bảng Lương (Dùng chung logic)
function renderSalaryTable(type, methodFilter) {
  const monthVal = document.getElementById('rp-month').value;
  const [year, month] = monthVal.split('-');
  document.getElementById('ct-month-label').innerText = `Tháng ${month}/${year}`;
  
  let classesToProcess = db.classes;
  
  if (type === 'teacher') {
    const tName = document.getElementById('rp-teacher').value;
    document.getElementById('ct-month-label').innerText += ` - GV: ${tName}`;
    classesToProcess = db.classes.filter(c => c.teacherName === tName);
  } else if (type === 'class') {
    const cId = document.getElementById('rp-class').value;
    const cls = db.classes.find(c => String(c.classId) === String(cId));
    if(cls) document.getElementById('ct-month-label').innerText += ` - Lớp: ${cls.className}`;
    classesToProcess = db.classes.filter(c => String(c.classId) === String(cId));
  }

  let totalTeacherSessions = 0;
  let totalCenterRev = 0;
  let totalTeacherRev = 0;
  let html = '';

  classesToProcess.forEach(c => {
    const sessions = Number(c.sessions) || 0;
    if(sessions === 0) return; 

    const classPayments = db.payments.filter(p => String(p.classId) === String(c.classId));
    
    let filteredClassPayments = classPayments;
    if (methodFilter !== 'all') {
       filteredClassPayments = classPayments.filter(p => p.method === methodFilter);
    }

    const centerRevenue = filteredClassPayments
      .filter(p => p.method === 'Tiền mặt' || p.method === 'Chuyển khoản')
      .reduce((sum, p) => sum + Number(p.amount), 0);
      
    const teacherRevenue = filteredClassPayments
      .filter(p => p.method === 'Giáo viên thu')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const siso = db.enrollments.filter(e => String(e.classId) === String(c.classId)).length;

    totalTeacherSessions += sessions;
    totalCenterRev += centerRevenue;
    totalTeacherRev += teacherRevenue;

    html += `
      <tr class="border-b hover:bg-gray-50 text-sm">
        <td class="p-3 font-semibold text-purple-700">${c.teacherName}</td>
        <td class="p-3 text-blue-600 font-semibold">${c.className}</td>
        <td class="p-3 text-center font-bold">${sessions} buổi</td>
        <td class="p-3 text-center">${siso} HV</td>
        <td class="p-3 text-right text-green-600">${centerRevenue.toLocaleString('vi-VN')} đ</td>
        <td class="p-3 text-right text-orange-500">${teacherRevenue.toLocaleString('vi-VN')} đ</td>
        <td class="p-3 text-right">
           <input type="number" id="salary_${c.classId}" class="border p-1 rounded w-24 text-right" placeholder="Nhập...">
        </td>
      </tr>
    `;
  });

  const tbody = document.getElementById('chot-thang-list');
  
  if (html === '') {
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500">Không có lớp nào hoạt động.</td></tr>`;
    totalTeacherSessions = 0; totalCenterRev = 0; totalTeacherRev = 0;
  } else {
    let headerRow = '';
    if (type === 'teacher') {
      headerRow = `
        <tr class="bg-purple-50">
          <td class="p-3 font-bold text-purple-800 text-base" colspan="2">👨‍🏫 Tổng kết</td>
          <td class="p-3 text-center font-bold text-purple-800">Tổng: ${totalTeacherSessions} buổi</td>
          <td class="p-3"></td>
          <td class="p-3 text-right font-bold text-green-700">${totalCenterRev.toLocaleString('vi-VN')} đ</td>
          <td class="p-3 text-right font-bold text-orange-600">${totalTeacherRev.toLocaleString('vi-VN')} đ</td>
          <td class="p-3 text-right font-bold text-red-600 text-xs">Tổng Lương:</td>
        </tr>
      `;
    }
    tbody.innerHTML = headerRow + html;
  }

  document.getElementById('chot-thang-area').classList.remove('hidden');
}

async function luuBangLuong() {
  // ... (Giữ nguyên logic lưu như cũ)
  const monthVal = document.getElementById('rp-month').value;
  if(!monthVal) return;
  const [year, month] = monthVal.split('-');
  const monthStr = `${month}/${year}`;
  const inputs = document.querySelectorAll('input[id^="salary_"]');
  if (inputs.length === 0) return showToast('Không có lớp nào để lưu!', 'warning');

  const recordsToSave = [];
  let hasEmpty = false;

  inputs.forEach(input => {
    const classId = input.id.replace('salary_', '');
    const cls = db.classes.find(c => String(c.classId) === String(classId));
    if(!cls) return;
    const inputVal = input.value;
    if(!inputVal || Number(inputVal) <= 0) hasEmpty = true;
    const classPayments = db.payments.filter(p => String(p.classId) === String(classId));
    const centerRev = classPayments.filter(p => p.method === 'Tiền mặt' || p.method === 'Chuyển khoản').reduce((sum, p) => sum + Number(p.amount), 0);
    const teacherRev = classPayments.filter(p => p.method === 'Giáo viên thu').reduce((sum, p) => sum + Number(p.amount), 0);
    const tId = db.teachers.find(x => x.teacherName === cls.teacherName)?.teacherId || 'N/A';
    recordsToSave.push({
      classId: classId, teacherId: tId, teacherName: cls.teacherName, sessions: Number(cls.sessions) || 0,
      centerRevenue: centerRev, teacherRevenue: teacherRev, salaryAmount: Number(inputVal) || 0
    });
  });

  if(hasEmpty) { if(!confirm('Có lớp chưa nhập lương. Vẫn tiếp tục lưu?')) return; }

  try {
    const btn = document.querySelector('button[onclick="luuBangLuong()"]');
    const oldText = btn.innerHTML;
    btn.innerHTML = '⏳ Đang lưu...'; btn.disabled = true;
    await apiPost('save_salary', { month: monthStr, records: recordsToSave });
    showToast('Đã lưu Bảng Lương thành công!', 'success');
    document.getElementById('chot-thang-area').classList.add('hidden');
    loadAllData(false);
  } catch(e) { showToast('Lỗi: ' + e.message, 'error'); }
}

// ================= HÀM XUẤT FILE EXCEL =================
function xuatFileLuong() {
  const type = document.getElementById('rp-type').value;
  const monthVal = document.getElementById('rp-month').value;
  if(!monthVal) return showToast('Vui lòng chọn tháng!', 'warning');
  
  const [year, month] = monthVal.split('-');
  let tenFile = `BangLuong_T${month}_${year}`;

  if(type === 'teacher') {
    const tName = document.getElementById('rp-teacher').value;
    tenFile = `Luong_${tName.replace(/\s+/g, '')}_T${month}`;
  } else if (type === 'class') {
    const cId = document.getElementById('rp-class').value;
    const cls = db.classes.find(c => c.classId === cId);
    if(cls) tenFile = `Luong_Lop_${cls.className.replace(/\s+/g, '')}_T${month}`;
  }

  // 1. Tạo mảng dữ liệu Excel
  const excelData = [];

  // --- PHẦN 1: TIÊU ĐỀ ---
  excelData.push(["TRUNG TÂM NCV EDUCATION", "", "", "", "", "", "", ""]);
  excelData.push(["BẢNG LƯƠNG VÀ XÁC NHẬN ĐÓNG HỌC PHÍ", "", "", "", "", "", "", ""]);
  excelData.push([`Tháng: ${month}/${year}`, "", "", "", "", `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, "", ""]);
  excelData.push([]); // Dòng trống

  // --- PHẦN 2: DANH SÁCH HỌC VIÊN (Giống ảnh) ---
  excelData.push(["TT", "Họ và tên", "Trường", "Số điện thoại", "Lớp", "Số buổi học", "Đóng phí", "Hình thức TT", "Ghi chú"]);
  
  // Lấy dữ liệu học viên
  let studentsForExcel = [];
  let classesToProcess = [];
  
  if (type === 'teacher') {
      const tName = document.getElementById('rp-teacher').value;
      classesToProcess = db.classes.filter(c => c.teacherName === tName);
  } else if (type === 'class') {
      const cId = document.getElementById('rp-class').value;
      classesToProcess = db.classes.filter(c => String(c.classId) === String(cId));
  }

  classesToProcess.forEach(cls => {
      const enrolls = db.enrollments.filter(e => String(e.classId) === String(cls.classId));
      enrolls.forEach(enr => {
          const st = db.students.find(s => String(s.stt) === String(enr.studentId));
          const payment = db.payments.find(p => String(p.studentId) === String(enr.studentId) && String(p.classId) === String(cls.classId)); // Tạm lấy giao dịch đầu tiên tìm thấy
          
          studentsForExcel.push({
              name: st ? st.ho + ' ' + st.ten : 'N/A',
              school: st ? st.school : '',
              phone: st ? st.parentPhone : '',
              className: cls.className,
              sessions: cls.sessions,
              amount: payment ? Number(payment.amount) : 0,
              method: payment ? payment.method : 'Chưa đóng',
              note: payment ? payment.note : ''
          });
      });
  });

  let stt = 1;
  studentsForExcel.forEach(s => {
      excelData.push([
          stt++, s.name, s.school, s.phone, s.className, s.sessions, 
          s.amount > 0 ? s.amount : "", 
          s.method === 'Tiền mặt' ? 'TM' : (s.method === 'Chuyển khoản' ? 'CK' : (s.method === 'Giáo viên thu' ? 'GV' : '')),
          s.note
      ]);
  });

  excelData.push([]); // Dòng trống ngăn cách

  // --- PHẦN 3: TỔNG KẾT (Giống ảnh) ---
  // Tính toán các con số tổng
  let totalTM = 0, totalCK = 0, totalGV = 0;
  studentsForExcel.forEach(s => {
      if(s.method === 'Tiền mặt') totalTM += s.amount;
      if(s.method === 'Chuyển khoản') totalCK += s.amount;
      if(s.method === 'Giáo viên thu') totalGV += s.amount;
  });
  const totalAll = totalTM + totalCK + totalGV;

  excelData.push(["", "", "", "", "TIỀN MẶT", "", totalTM]);
  excelData.push(["", "", "", "", "CHUYỂN KHOẢN", "", totalCK]);
  excelData.push(["", "", "", "", "GV THU", "", totalGV]);
  excelData.push(["", "", "", "", "TỔNG CỘNG", "", totalAll]);

  // 2. Tạo file Excel
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  
  // Chỉnh độ rộng cột (ước lượng)
  ws['!cols'] = [
    { wch: 5 },  // TT
    { wch: 25 }, // Họ tên
    { wch: 15 }, // Trường
    { wch: 15 }, // SĐT
    { wch: 20 }, // Lớp
    { wch: 12 }, // Số buổi
    { wch: 12 }, // Đóng phí
    { wch: 10 }, // Hình thức
    { wch: 25 }  // Ghi chú
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BangLuong");

  // 3. Tải xuống
  XLSX.writeFile(wb, `${tenFile}.xlsx`);
  showToast('Đã xuất file thành công!', 'success');
}