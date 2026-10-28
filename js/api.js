async function apiGet(action) {
  try {
    const res = await fetch(`${API_URL}?action=${action}&t=${Date.now()}`);
    if (!res.ok) throw new Error("Lỗi kết nối mạng");
    return await res.json();
  } catch (error) {
    console.error("GET Error:", error);
    throw error;
  }
}

async function apiPost(action, payload) {
  const body = Object.assign({ action }, payload);
  console.log('📤 Gửi dữ liệu:', body); 
  
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) throw new Error("Lỗi mạng hoặc Server từ chối");
    
    const json = await res.json();
    console.log('📥 Nhận phản hồi:', json);
    
    if (json.error) throw new Error(json.error);
    return json;
    
  } catch (error) {
    console.error('❌ Lỗi API:', error);
    throw error;
  }
}