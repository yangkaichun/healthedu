// 病床選擇功能
document.addEventListener('DOMContentLoaded', function() {
    // 病床掃描或輸入處理
    const bedCode = document.getElementById('bed-code');
    const bedInfo = document.getElementById('patient-info');
    const bedNumber = document.getElementById('bed-number');
    
    // 如果手動輸入病床號碼，按下 Enter 處理
    if (bedCode) {
        bedCode.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const value = this.value.trim();
                if (value) {
                    bedNumber.textContent = value;
                    bedInfo.style.display = 'block';
                    loadBedTopics(value);
                }
            }
        });
    }
    
    // 病人掃描或輸入處理
    const patientCode = document.getElementById('qr-result');
    
    // 如果手動輸入病人代碼，按下 Enter 處理
    if (patientCode) {
        patientCode.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const value = this.value.trim();
                if (value) {
                    // 病人代碼已輸入，可以繼續下一步
                    if (document.getElementById('topic-section').style.display !== 'block') {
                        document.getElementById('topic-section').style.display = 'block';
                    }
                }
            }
        });
    }
});
