// ==================== KONFIGURASI ====================
// ⚠️ GANTI DENGAN URL DEPLOYMENT APPS SCRIPT ANDA
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw8MxyjVxpoL0UOUE4uQQNrpEl-Cu5_ip0rH_daQcs7dqqS54pCAf2Cbkou_0_YwchFFg/exec';

// ==================== VARIABLES ====================
let selectedFile = null;
let selectedModalFile = null;
let currentPaymentId = null;
let currentPaymentNominal = null;
let currentPaymentChatId = null;

// ==================== MENUNGGU DOM SIAP ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    setupTabs();
    loadPaket();
    setupFormSubmit();
    setupFileUpload();
    setupModalUpload();
    setupButtons();
    setupRupiahFormatter();
});

// ==================== SETUP TABS ====================
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

// ==================== SWITCH TAB ====================
window.switchTab = function(tab) {
    const panels = ['formPanel', 'hutangPanel', 'historyPanel', 'bayarPanel'];
    panels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.remove('active');
    });
    
    const allTabs = document.querySelectorAll('.tab-btn');
    allTabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'form') {
        const panel = document.getElementById('formPanel');
        const tabBtn = document.querySelector('.tab-btn[data-tab="form"]');
        if (panel) panel.classList.add('active');
        if (tabBtn) tabBtn.classList.add('active');
        loadPaket();
    } else if (tab === 'hutang') {
        const panel = document.getElementById('hutangPanel');
        const tabBtn = document.querySelector('.tab-btn[data-tab="hutang"]');
        if (panel) panel.classList.add('active');
        if (tabBtn) tabBtn.classList.add('active');
    } else if (tab === 'history') {
        const panel = document.getElementById('historyPanel');
        const tabBtn = document.querySelector('.tab-btn[data-tab="history"]');
        if (panel) panel.classList.add('active');
        if (tabBtn) tabBtn.classList.add('active');
    } else if (tab === 'bayar') {
        const panel = document.getElementById('bayarPanel');
        const tabBtn = document.querySelector('.tab-btn[data-tab="bayar"]');
        if (panel) panel.classList.add('active');
        if (tabBtn) tabBtn.classList.add('active');
    }
}

// ==================== SETUP BUTTONS ====================
function setupButtons() {
    const cekHutangBtn = document.getElementById('cekHutangBtn');
    const cekHistoryBtn = document.getElementById('cekHistoryBtn');
    const cekBayarBtn = document.getElementById('cekBayarBtn');
    
    if (cekHutangBtn) cekHutangBtn.addEventListener('click', loadTotalHutang);
    if (cekHistoryBtn) cekHistoryBtn.addEventListener('click', loadHistory);
    if (cekBayarBtn) cekBayarBtn.addEventListener('click', loadHutangForPayment);
}

// ==================== SETUP FORM SUBMIT ====================
function setupFormSubmit() {
    const form = document.getElementById('myForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const paketSelectElem = document.getElementById('paketSelect');
        const nominalInputElem = document.getElementById('nominalInput');
        
        if (!paketSelectElem || !paketSelectElem.value) {
            showMessage('result', 'Silakan pilih layanan', 'error');
            return;
        }
        
        const nominalRaw = nominalInputElem ? nominalInputElem.value.replace(/\./g, '') : '0';
        const nominalValue = parseInt(nominalRaw) || 0;
        
        if (nominalValue <= 0) {
            showMessage('result', 'Silakan isi nominal dengan benar', 'error');
            return;
        }
        
        showMessage('result', 'Mengirim data...', 'loading');
        
        try {
            let fileData = null;
            if (selectedFile) {
                if (selectedFile.size > 10 * 1024 * 1024) {
                    showMessage('result', 'Ukuran file maksimal 10MB', 'error');
                    return;
                }
                fileData = await fileToBase64(selectedFile);
            }
            
            const payload = {
                nama: form.nama.value.trim(),
                paket: paketSelectElem.value,
                keterangan: form.keterangan.value.trim(),
                nominal: nominalValue,
                chat_id: form.chat_id.value.trim(),
                file: fileData
            };
            
            await fetch(APPSCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            showMessage('result', 'Berhasil! Data tersimpan.', 'success');
            form.reset();
            selectedFile = null;
            const fileNameSpanElem = document.getElementById('fileName');
            if (fileNameSpanElem) fileNameSpanElem.innerHTML = '';
            if (nominalInputElem) nominalInputElem.value = '';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch(error) {
            console.error('Submit error:', error);
            showMessage('result', 'Gagal mengirim data', 'error');
        }
    });
}

// ==================== SETUP FILE UPLOAD ====================
function setupFileUpload() {
    const fileUploadDiv = document.getElementById('fileUploadDiv');
    const fileInputElem = document.getElementById('fileInput');
    const fileNameSpanElem = document.getElementById('fileName');
    
    if (!fileUploadDiv || !fileInputElem) return;
    
    fileUploadDiv.addEventListener('click', () => fileInputElem.click());
    fileInputElem.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            selectedFile = this.files[0];
            if (fileNameSpanElem) fileNameSpanElem.innerHTML = this.files[0].name;
        } else {
            selectedFile = null;
            if (fileNameSpanElem) fileNameSpanElem.innerHTML = '';
        }
    });
}

// ==================== SETUP MODAL UPLOAD ====================
function setupModalUpload() {
    const modalFileUpload = document.getElementById('modalUploadDiv');
    const modalFileInput = document.getElementById('modalFileInput');
    const modalFileNameSpan = document.getElementById('modalFileName');
    const submitBayarBtn = document.getElementById('submitBayarBtn');
    
    if (modalFileUpload && modalFileInput) {
        modalFileUpload.addEventListener('click', () => modalFileInput.click());
        modalFileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                selectedModalFile = this.files[0];
                if (modalFileNameSpan) modalFileNameSpan.innerHTML = this.files[0].name;
            } else {
                selectedModalFile = null;
                if (modalFileNameSpan) modalFileNameSpan.innerHTML = '';
            }
        });
    }
    
    if (submitBayarBtn) {
        submitBayarBtn.addEventListener('click', submitPembayaran);
    }
}

// ==================== SETUP RUPIAH FORMATTER ====================
function setupRupiahFormatter() {
    const nominalInputElem = document.getElementById('nominalInput');
    if (nominalInputElem) {
        nominalInputElem.addEventListener('input', function() {
            let value = this.value.replace(/[^0-9]/g, '');
            if (!value) {
                this.value = '';
                return;
            }
            this.value = new Intl.NumberFormat('id-ID').format(parseInt(value));
        });
    }
}

// ==================== LOAD PAKET ====================
async function loadPaket() {
    const paketSelectElem = document.getElementById('paketSelect');
    if (!paketSelectElem) return;
    
    try {
        const response = await fetch(`${APPSCRIPT_URL}?action=getPaket`);
        const list = await response.json();
        paketSelectElem.innerHTML = '<option value="" disabled selected>Pilih Layanan</option>';
        list.forEach(paket => {
            const option = document.createElement('option');
            option.value = paket;
            option.textContent = paket;
            paketSelectElem.appendChild(option);
        });
    } catch(error) {
        console.error('Load paket error:', error);
        paketSelectElem.innerHTML = '<option value="" disabled selected>Gagal memuat data</option>';
    }
}

// ==================== FILE TO BASE64 ====================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
            bytes: reader.result.split(',')[1],
            filename: file.name,
            mimeType: file.type
        });
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ==================== LOAD TOTAL HUTANG ====================
async function loadTotalHutang() {
    const chatIdInput = document.getElementById('hutangChatId');
    const resultDiv = document.getElementById('hutangResult');
    
    if (!chatIdInput || !resultDiv) return;
    
    const chatId = chatIdInput.value.trim();
    
    if (!chatId) {
        resultDiv.innerHTML = '<div class="result-message error">Masukkan ID Telegram</div>';
        return;
    }
    
    resultDiv.innerHTML = '<div class="result-message loading">Memuat...</div>';
    
    try {
        const response = await fetch(`${APPSCRIPT_URL}?action=getTotalHutang&chat_id=${encodeURIComponent(chatId)}`);
        const data = await response.json();
        
        if (data.status === 'error') throw new Error(data.message);
        
        const total = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.total);
        
        if (data.count === 0) {
            resultDiv.innerHTML = '<div class="empty-data">Tidak ada hutang</div>';
            return;
        }
        
        let html = `<div class="total-amount"><div class="label">Total Hutang</div><div class="amount">${total}</div><div class="count">${data.count} pengajuan</div></div><div class="data-list">`;
        
        data.hutangList.forEach(item => {
            html += `<div class="data-item">
                <div class="data-header">
                    <span class="data-id">${item.id}</span>
                    <span class="data-status status-approved">Disetujui</span>
                </div>
                <div class="data-detail">${new Date(item.tanggal).toLocaleDateString('id-ID')} • ${item.paket}</div>
                <div class="data-nominal">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.nominal)}</div>
            </div>`;
        });
        
        html += '</div>';
        resultDiv.innerHTML = html;
    } catch(error) {
        resultDiv.innerHTML = `<div class="result-message error">${error.message}</div>`;
    }
}

// ==================== LOAD HISTORY ====================
async function loadHistory() {
    const chatIdInput = document.getElementById('historyChatId');
    const resultDiv = document.getElementById('historyResult');
    
    if (!chatIdInput || !resultDiv) return;
    
    const chatId = chatIdInput.value.trim();
    
    if (!chatId) {
        resultDiv.innerHTML = '<div class="result-message error">Masukkan ID Telegram</div>';
        return;
    }
    
    resultDiv.innerHTML = '<div class="result-message loading">Memuat...</div>';
    
    try {
        const response = await fetch(`${APPSCRIPT_URL}?action=getHistory&chat_id=${encodeURIComponent(chatId)}`);
        const data = await response.json();
        
        if (data.status === 'error') throw new Error(data.message);
        
        if (data.count === 0) {
            resultDiv.innerHTML = '<div class="empty-data">Belum ada riwayat</div>';
            return;
        }
        
        let html = `<div style="background:#FFF8F0; padding:8px 12px; border-radius:12px; margin-bottom:12px;">Total ${data.count} pengajuan</div><div class="data-list">`;
        
        data.history.forEach(item => {
            let statusClass = '', statusText = '';
            const statusLower = String(item.status).toLowerCase();
            
            if (statusLower === 'approved') {
                statusClass = 'status-approved';
                statusText = 'Disetujui';
            } else if (statusLower === 'rejected') {
                statusClass = 'status-rejected';
                statusText = 'Ditolak';
            } else if (statusLower === 'lunas') {
                statusClass = 'status-lunas';
                statusText = 'Lunas';
            } else if (statusLower === 'menunggu verifikasi') {
                statusClass = 'status-waiting';
                statusText = 'Menunggu Verifikasi';
            } else {
                statusClass = 'status-pending';
                statusText = 'Pending';
            }
            
            html += `<div class="data-item">
                <div class="data-header">
                    <span class="data-id">${item.id}</span>
                    <span class="data-status ${statusClass}">${statusText}</span>
                </div>
                <div class="data-detail">${new Date(item.tanggal).toLocaleDateString('id-ID')} • ${item.paket}</div>
                <div class="data-nominal">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.nominal)}</div>
                <div class="data-detail">${item.keterangan || '-'}</div>
            </div>`;
        });
        
        html += '</div>';
        resultDiv.innerHTML = html;
    } catch(error) {
        resultDiv.innerHTML = `<div class="result-message error">${error.message}</div>`;
    }
}

// ==================== LOAD HUTANG FOR PAYMENT ====================
async function loadHutangForPayment() {
    const chatIdInput = document.getElementById('bayarChatId');
    const resultDiv = document.getElementById('bayarResult');
    
    if (!chatIdInput || !resultDiv) return;
    
    const chatId = chatIdInput.value.trim();
    
    if (!chatId) {
        resultDiv.innerHTML = '<div class="result-message error">Masukkan ID Telegram</div>';
        return;
    }
    
    resultDiv.innerHTML = '<div class="result-message loading">Memuat hutang...</div>';
    
    try {
        const response = await fetch(`${APPSCRIPT_URL}?action=getHutangForPayment&chat_id=${encodeURIComponent(chatId)}`);
        const data = await response.json();
        
        if (data.status === 'error') throw new Error(data.message);
        
        if (data.count === 0) {
            resultDiv.innerHTML = '<div class="empty-data">Tidak ada hutang yang perlu dibayar</div>';
            return;
        }
        
        const total = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.total);
        let html = `<div class="total-amount"><div class="label">Total Hutang</div><div class="amount">${total}</div><div class="count">${data.count} tagihan</div></div>`;
        html += '<div class="data-list">';
        
        data.hutangList.forEach(item => {
            let statusBadge = '';
            if (item.status_bayar === 'waiting_verification') {
                statusBadge = '<div class="bayar-status waiting">Menunggu Verifikasi</div>';
            } else if (item.status_bayar === 'lunas') {
                statusBadge = '<div class="bayar-status lunas">Lunas</div>';
            }
            
            html += `
                <div class="bayar-item">
                    ${statusBadge}
                    <div class="bayar-info">
                        <strong>${item.id}</strong> - ${item.paket}
                    </div>
                    <div class="bayar-info">
                        Tanggal: ${new Date(item.tanggal).toLocaleDateString('id-ID')}
                    </div>
                    <div class="bayar-nominal">
                        ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.nominal)}
                    </div>
                    <div class="bayar-info" style="font-size: 12px; color: #64748b;">
                        ${item.keterangan || '-'}
                    </div>`;
            
            if (item.status_bayar !== 'lunas' && item.status_bayar !== 'waiting_verification') {
                html += `<button class="btn-bayar" onclick="openUploadModal('${item.id}', ${item.nominal}, '${chatId}')">
                            Bayar Tagihan Ini
                        </button>`;
            } else if (item.status_bayar === 'waiting_verification') {
                html += `<div style="margin-top: 10px; padding: 8px; background: #fef3c7; border-radius: 8px; font-size: 12px; color: #92400e; text-align: center;">
                            ⏳ Bukti transfer sedang diverifikasi admin
                        </div>`;
            } else if (item.status_bayar === 'lunas') {
                html += `<div style="margin-top: 10px; padding: 8px; background: #d1fae5; border-radius: 8px; font-size: 12px; color: #065f46; text-align: center;">
                            ✅ Sudah LUNAS
                        </div>`;
            }
            
            html += `</div>`;
        });
        
        html += '</div>';
        resultDiv.innerHTML = html;
    } catch(error) {
        resultDiv.innerHTML = `<div class="result-message error">${error.message}</div>`;
    }
}

// ==================== OPEN MODAL UPLOAD ====================
window.openUploadModal = function(id, nominal, chatId) {
    currentPaymentId = id;
    currentPaymentNominal = nominal;
    currentPaymentChatId = chatId;
    
    const modalElem = document.getElementById('uploadModal');
    const modalId = document.getElementById('modalId');
    const modalNominal = document.getElementById('modalNominal');
    
    if (modalId) modalId.value = id;
    if (modalNominal) {
        modalNominal.value = new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR' 
        }).format(nominal);
    }
    
    // Reset modal
    selectedModalFile = null;
    const modalFileNameSpan = document.getElementById('modalFileName');
    if (modalFileNameSpan) modalFileNameSpan.innerHTML = '';
    
    const modalMessageDiv = document.getElementById('modalMessage');
    if (modalMessageDiv) modalMessageDiv.innerHTML = '';
    
    if (modalElem) modalElem.style.display = 'flex';
}

// ==================== CLOSE MODAL ====================
window.closeModal = function() {
    const modalElem = document.getElementById('uploadModal');
    if (modalElem) modalElem.style.display = 'none';
    
    selectedModalFile = null;
    
    const modalFileNameSpan = document.getElementById('modalFileName');
    const modalMessageDiv = document.getElementById('modalMessage');
    
    if (modalFileNameSpan) modalFileNameSpan.innerHTML = '';
    if (modalMessageDiv) modalMessageDiv.innerHTML = '';
}

// ==================== SUBMIT PEMBAYARAN ====================
window.submitPembayaran = async function() {
    console.log('Submit payment called');
    
    const modalMessageDiv = document.getElementById('modalMessage');
    
    if (!selectedModalFile) {
        if (modalMessageDiv) {
            modalMessageDiv.innerHTML = '<div class="result-message error">Upload bukti transfer terlebih dahulu!</div>';
        }
        return;
    }
    
    if (selectedModalFile.size > 5 * 1024 * 1024) {
        if (modalMessageDiv) {
            modalMessageDiv.innerHTML = '<div class="result-message error">Ukuran file maksimal 5MB</div>';
        }
        return;
    }
    
    if (modalMessageDiv) {
        modalMessageDiv.innerHTML = '<div class="result-message loading">Mengirim bukti pembayaran...</div>';
    }
    
    try {
        const fileData = await fileToBase64(selectedModalFile);
        
        const payload = {
            action: 'submitPembayaran',
            id: currentPaymentId,
            nominal: currentPaymentNominal,
            chat_id: currentPaymentChatId,
            bukti: fileData
        };
        
        console.log('Sending payload:', payload);
        
        // 🔴 PERBAIKAN: tambahkan mode: 'no-cors' untuk hindari CORS
        await fetch(APPSCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        // Karena mode 'no-cors', response tidak bisa dibaca, langsung anggap sukses
        if (modalMessageDiv) {
            modalMessageDiv.innerHTML = '<div class="result-message success">Bukti terkirim! Menunggu verifikasi admin.</div>';
        }
        
        setTimeout(() => {
            closeModal();
            loadHutangForPayment();
        }, 2000);
        
    } catch(error) {
        console.error('Payment error:', error);
        if (modalMessageDiv) {
            modalMessageDiv.innerHTML = `<div class="result-message error">Gagal: ${error.message}</div>`;
        }
    }
}

// ==================== TOGGLE INSTRUKSI ====================
window.toggleInstruksi = function() {
    const content = document.getElementById('instruksiContent');
    const icon = document.querySelector('.instruksi-header i');
    if (content && icon) {
        content.classList.toggle('show');
        icon.style.transform = content.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

// ==================== SHOW MESSAGE ====================
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.innerHTML = `<div class="result-message ${type}">${message}</div>`;
    setTimeout(() => {
        if (element.innerHTML.includes(message)) {
            element.innerHTML = '';
        }
    }, 5000);
}

// ==================== CLICK OUTSIDE MODAL ====================
window.onclick = function(event) {
    const modalElem = document.getElementById('uploadModal');
    if (event.target === modalElem) {
        closeModal();
    }
}
