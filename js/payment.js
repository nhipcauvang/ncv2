function renderPayments() {
  document.getElementById('payment-list').innerHTML = db.payments.slice().reverse().map(p => {
    const s = db.students.find(x => x.stt == p.studentId);
    const c = db.classes.find(x => x.classId === p.classId);
    return `<tr class="border-b hover:bg-gray-50">
      <td class="p-3 text-xs text-gray-500">${p.paymentId}</td>
      <td class="p-3 font-bold text-blue-700">${s ? s.ho + ' ' + s.ten : 'N/A'}</td>
      <td class="p-3 text-sm">${c ? c.className : 'N/A'}</td>
      <td class="p-3 text-green-600 font-bold whitespace-nowrap">${Number(p.amount).toLocaleString('vi-VN')} đ</td>
      <td class="p-3 text-sm text-center">${p.cycle || '---'}</td>
      <td class="p-3 text-sm whitespace-nowrap">${p.paymentDate}</td>
      <td class="p-3 text-sm text-gray-500 italic max-w-[200px] truncate" title="${p.note || ''}">${p.note || '---'}</td>
      <td class="p-3 text-center">
        <button onclick="printInvoice('${p.paymentId}')" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-xs font-bold whitespace-nowrap">🖨️ In HĐ</button>
      </td>
    </tr>`;
  }).join('');
}
function searchStudentForPayment() {
  const kw = document.getElementById('pay-search-hv').value.toLowerCase().trim();
  const box = document.getElementById('pay-search-results');
  
  if (kw.length < 1) { box.classList.add('hidden'); return; }
  
  const matches = db.students.filter(s => 
    (s.ho + ' ' + s.ten).toLowerCase().includes(kw) || 
    (s.parentPhone && s.parentPhone.includes(kw))
  ).slice(0, 10);
  
  if (matches.length === 0) {
    box.innerHTML = '<div class="p-2 text-sm text-gray-500">Không tìm thấy ai.</div>';
    box.classList.remove('hidden');
    return;
  }

  box.innerHTML = matches.map(s => `
    <div onclick="selectStudentForPayment(${s.stt}, '${s.ho} ${s.ten}')" class="p-2 hover:bg-blue-50 cursor-pointer border-b text-sm">
      <div class="font-bold text-blue-700">${s.ho} ${s.ten}</div>
      <div class="text-xs text-gray-500">${s.parentPhone || 'Không có SĐT'}</div>
    </div>
  `).join('');
  box.classList.remove('hidden');
}

function selectStudentForPayment(stt, name) {
  document.getElementById('pay-search-hv').value = name;
  document.getElementById('pay-student-id').value = stt;
  document.getElementById('pay-selected-hv').innerText = name;
  document.getElementById('pay-search-results').classList.add('hidden');
  
  const enrolledClasses = db.enrollments.filter(e => String(e.studentId) === String(stt));
  const sel = document.getElementById('pay-class-id');
  
  if (enrolledClasses.length === 0) {
    sel.innerHTML = '<option value="">(Học viên chưa đăng ký lớp nào)</option>';
    sel.disabled = true;
    document.getElementById('btn-pay').disabled = true;
  } else {
    sel.innerHTML = enrolledClasses.map(e => {
      const cls = db.classes.find(c => c.classId === e.classId);
      const fee = cls ? cls.tuitionFee : 350000;
      const displayStr = cls ? `${cls.className} (${cls.subject}) - GV: ${cls.teacherName}` : e.className;
      return `<option value="${e.classId}" data-fee="${fee}">${displayStr}</option>`;
    }).join('');
    sel.disabled = false;
    document.getElementById('btn-pay').disabled = false;
    
    sel.onchange = function() {
       const fee = this.options[this.selectedIndex].getAttribute('data-fee');
       document.getElementById('pay-amount').value = fee;
    };
    sel.dispatchEvent(new Event('change'));
  }
}

document.addEventListener('click', function(event) {
  const box = document.getElementById('pay-search-results');
  const input = document.getElementById('pay-search-hv');
  if (box && input && !input.contains(event.target) && !box.contains(event.target)) {
    box.classList.add('hidden');
  }
});

async function savePayment() {
  const sid = document.getElementById('pay-student-id').value;
  const cid = document.getElementById('pay-class-id').value;
  const amount = document.getElementById('pay-amount').value;
  const cycle = document.getElementById('pay-cycle').value;
  const method = document.getElementById('pay-method').value; 
  
  if (!sid || !cid || !amount) return showToast('Vui lòng chọn đầy đủ Học viên và Lớp!', 'warning');
  
  const btn = document.getElementById('btn-pay');
  const oldText = btn.innerHTML;
  btn.innerHTML = '⏳ Đang lưu...';
  btn.disabled = true;

  try {
    await apiPost('save_payment', {
      studentId: sid, classId: cid, amount: amount, cycle: cycle,
      paymentDate: new Date().toLocaleDateString('vi-VN'), method: method,
      note: document.getElementById('pay-note').value // Lấy ghi chú
    });
    showToast('Đã ghi nhận thanh toán!', 'success');
    
    document.getElementById('pay-search-hv').value = '';
    document.getElementById('pay-student-id').value = '';
    document.getElementById('pay-selected-hv').innerText = 'Chưa chọn ai';
    document.getElementById('pay-class-id').innerHTML = '';
    document.getElementById('pay-class-id').disabled = true;
    document.getElementById('pay-method').value = 'Tiền mặt';
    document.getElementById('btn-pay').disabled = true;
    
    loadAllData(false);
  } catch(e) {
    showToast('Lỗi: ' + e.message, 'error');
  } finally {
    btn.innerHTML = oldText;
    btn.disabled = false;
  }
}

function printInvoice(paymentId) {
  const p = db.payments.find(x => x.paymentId === paymentId);
  if(!p) return;
  
  const s = db.students.find(x => x.stt == p.studentId);
  const c = db.classes.find(x => x.classId === p.classId);
  
  const html = `
    <div class="flex justify-between items-center mb-4 no-print">
      <h2 class="text-xl font-bold text-gray-800">Hóa Đơn Thanh Toán</h2>
      <button onclick="document.getElementById('invoice-modal').classList.remove('open')" class="text-gray-500 hover:text-red-500 font-bold text-2xl">&times;</button>
    </div>
    
    <div class="border-2 border-gray-300 p-8 rounded">
      <div class="flex justify-between items-start mb-8 border-b pb-4">
        <div>
          <h1 class="text-2xl font-bold text-blue-700 uppercase">TRUNG TÂM NCV EDUCATION</h1>
          <p class="text-sm text-gray-600">Địa chỉ: 123 Đường ABC, Quận XYZ</p>
          <p class="text-sm text-gray-600">Hotline: 0987.654.321</p>
        </div>
        <div class="text-right">
          <div class="text-lg font-bold">Mã PT: ${p.paymentId}</div>
          <div class="text-sm text-gray-600">Ngày: ${p.paymentDate}</div>
        </div>
      </div>
      
      <h2 class="text-xl font-bold text-center mb-6 uppercase">Biên Lai Thu Học Phí</h2>
      
      <div class="mb-4 text-base">
        <p class="mb-2"><span class="font-semibold w-32 inline-block">Họ tên HV:</span> <b>${s ? s.ho + ' ' + s.ten : 'N/A'}</b></p>
        <p class="mb-2"><span class="font-semibold w-32 inline-block">Lớp:</span> ${c ? c.className : 'N/A'}</p>
        <p class="mb-2"><span class="font-semibold w-32 inline-block">Số buổi ĐK:</span> ${p.cycle || '---'} buổi</p>
        <p class="mb-2"><span class="font-semibold w-32 inline-block">Hình thức:</span> ${p.method || 'Tiền mặt'}</p>
      </div>
      
      <div class="bg-gray-100 p-4 rounded text-lg font-bold flex justify-between items-center my-6">
        <span>Số tiền đã thu:</span>
        <span class="text-green-600 text-2xl">${Number(p.amount).toLocaleString('vi-VN')} VNĐ</span>
      </div>
      
      <div class="flex justify-between mt-12 pt-8">
        <div class="text-center">
          <p class="font-semibold mb-16">Người nộp tiền</p>
          <p class="text-gray-500 italic">(Ký, ghi rõ họ tên)</p>
        </div>
        <div class="text-center">
          <p class="font-semibold mb-16">Người thu tiền</p>
          <p class="text-gray-500 italic">(Ký, ghi rõ họ tên)</p>
        </div>
      </div>
    </div>
    
    <div class="mt-6 text-right no-print">
      <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">🖨️ In Ngay</button>
    </div>
  `;
  
  document.getElementById('invoice-content').innerHTML = html;
  document.getElementById('invoice-modal').classList.add('open');
}

const style = document.createElement('style');
style.innerHTML = `@media print { .no-print { display: none !important; } body { background: white; } .modal { position: absolute; background: white; padding: 0; display: block; } }`;
document.head.appendChild(style);