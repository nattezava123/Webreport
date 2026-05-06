window.openAIModal = () => {
    document.getElementById('ai-modal').classList.remove('hidden');
    document.getElementById('ai-modal').classList.add('flex');
    setTimeout(() => { document.getElementById('ai-modal').style.opacity = '1'; }, 10);
};
window.closeAIModal = () => {
    document.getElementById('ai-modal').style.opacity = '0';
    setTimeout(() => { document.getElementById('ai-modal').classList.add('hidden'); document.getElementById('ai-modal').classList.remove('flex'); }, 300);
};
window.sendQuickReply = (text) => {
    document.getElementById('ai-input').value = text;
    window.sendAIMessage();
};
window.sendAIMessage = () => {
    const input = document.getElementById('ai-input');
    const msg = input.value.trim();
    if(!msg) return;
    const box = document.getElementById('ai-chat-box');
    box.insertAdjacentHTML('beforeend', `<div class="chat-bubble chat-me">${msg}</div>`);
    input.value = '';
    box.scrollTop = box.scrollHeight;
    setTimeout(() => {
        box.insertAdjacentHTML('beforeend', `<div class="chat-bubble chat-ai">บอท Serviceman รับทราบครับ! <br><br>หากต้องการความช่วยเหลือด่วน กรุณาไปที่เมนู <b>Create Ticket</b> เพื่อให้พี่ๆ ไอทีตรวจสอบให้นะครับ!</div>`);
        box.scrollTop = box.scrollHeight;
    }, 800);
};
