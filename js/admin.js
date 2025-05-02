// 結果頁面功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化頁面
    loadResults();
    
    // 設定自動重整
    setInterval(loadResults, 30000); // 每30秒自動重整
    
    // 設定Email按鈕
    const settingsButton = document.getElementById('settings-button');
    const emailModal = document.getElementById('email-modal');
    const closeModal = document.querySelector('.close');
    const addEmailButton = document.getElementById('add-email');
    const saveEmailsButton = document.getElementById('save-emails');
    
    settingsButton.addEventListener('click', function() {
        loadEmailSettings();
        emailModal.style.display = 'block';
    });
    
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            emailModal.style.display = 'none';
        });
    }
    
    // 點擊模態框外部關閉
    window.addEventListener('click', function(event) {
        if (event.target === emailModal) {
            emailModal.style.display = 'none';
        }
    });
    
    // 新增Email
    if (addEmailButton) {
        addEmailButton.addEventListener('click', function() {
            const newEmail = document.getElementById('new-email').value.trim();
            
            if (newEmail && isValidEmail(newEmail)) {
                addEmailToList(newEmail, true);
                document.getElementById('new-email').value = '';
            } else {
                alert('請輸入有效的Email地址');
            }
        });
    }
    
    // 儲存Email設定
    if (saveEmailsButton) {
        saveEmailsButton.addEventListener('click', function() {
            const emailItems = document.querySelectorAll('.email-item');
            const emails = [];
            
            emailItems.forEach(item => {
                const emailText = item.querySelector('.email-text').textContent;
                const enabled = item.querySelector('input[type="checkbox"]').checked;
                
                emails.push({
                    email: emailText,
                    enabled: enabled
                });
            });
            
            // 儲存到localStorage
            localStorage.setItem('notificationEmails', JSON.stringify(emails));
            
            // 同步到GitHub
            syncToGitHub('notificationEmails', emails);
            
            emailModal.style.display = 'none';
            alert('Email設定已儲存');
        });
    }
});

// 加載問卷結果
function loadResults() {
    const resultsBody = document.getElementById('results-body');
    
    if (!resultsBody) return;
    
    // 清空現有內容
    resultsBody.innerHTML = '';
    
    // 從localStorage獲取觀看紀錄
    const viewingRecords = JSON.parse(localStorage.getItem('viewingRecords')) || [];
    
    // 按時間排序，最新的在前
    viewingRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // 生成表格行
    viewingRecords.forEach((record, index) => {
        const row = document.createElement('tr');
        
        // 病人代碼
        const patientCell = document.createElement('td');
        patientCell.textContent = record.patientCode;
        row.appendChild(patientCell);
        
        // 衛教主題
        const topicCell = document.createElement('td');
        topicCell.textContent = record.topicName;
        row.appendChild(topicCell);
        
        // 觀看狀態
        const statusCell = document.createElement('td');
        const statusMap = {
            'watching': '觀看中',
            'completed': '已觀看'
        };
        statusCell.textContent = statusMap[record.viewingStatus] || '未知';
        row.appendChild(statusCell);
        
        // 問卷分數
        const scoreCell = document.createElement('td');
        scoreCell.textContent = record.surveyCompleted ? record.surveyScore : '未填寫';
        row.appendChild(scoreCell);
        
        // 護理師確認狀態
        const nurseCell = document.createElement('td');
        const nurseCheckbox = document.createElement('input');
        nurseCheckbox.type = 'checkbox';
        nurseCheckbox.checked = record.nurseConfirmed;
        nurseCheckbox.addEventListener('change', function() {
            updateNurseConfirmation(index, this.checked);
        });
        nurseCell.appendChild(nurseCheckbox);
        row.appendChild(nurseCell);
        
        // 刪除按鈕
        const actionCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '刪除';
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', function() {
            if (confirm('確定要刪除此紀錄嗎？')) {
                deleteRecord(index);
            }
        });
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);
        
        resultsBody.appendChild(row);
    });
}

// 更新護理師確認狀態
function updateNurseConfirmation(index, confirmed) {
    const viewingRecords = JSON.parse(localStorage.getItem('viewingRecords')) || [];
    
    if (index >= 0 && index < viewingRecords.length) {
        viewingRecords[index].nurseConfirmed = confirmed;
        localStorage.setItem('viewingRecords', JSON.stringify(viewingRecords));
        
        // 同步到GitHub
        syncToGitHub('viewingRecords', viewingRecords);
    }
}

// 刪除紀錄
function deleteRecord(index) {
    const viewingRecords = JSON.parse(localStorage.getItem('viewingRecords')) || [];
    
    if (index >= 0 && index < viewingRecords.length) {
        viewingRecords.splice(index, 1);
        localStorage.setItem('viewingRecords', JSON.stringify(viewingRecords));
        
        // 同步到GitHub
        syncToGitHub('viewingRecords', viewingRecords);
        
        // 重新載入表格
        loadResults();
    }
}

// 加載Email設定
function loadEmailSettings() {
    const emailList = document.getElementById('email-list');
    
    if (!emailList) return;
    
    // 清空現有內容
    emailList.innerHTML = '';
    
    // 從localStorage獲取Email設定
    const emails = JSON.parse(localStorage.getItem('notificationEmails')) || [];
    
    // 生成Email列表
    emails.forEach(email => {
        addEmailToList(email.email, email.enabled);
    });
}

// 添加Email到列表
function addEmailToList(email, enabled) {
    const emailList = document.getElementById('email-list');
    
    const emailItem = document.createElement('div');
    emailItem.className = 'email-item';
    
    const emailText = document.createElement('span');
    emailText.className = 'email-text';
    emailText.textContent = email;
    
    const emailStatus = document.createElement('div');
    emailStatus.className = 'email-status';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = enabled;
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '刪除';
    deleteButton.className = 'delete-button';
    deleteButton.addEventListener('click', function() {
        emailItem.remove();
    });
    
    emailStatus.appendChild(checkbox);
    emailStatus.appendChild(deleteButton);
    
    emailItem.appendChild(emailText);
    emailItem.appendChild(emailStatus);
    
    emailList.appendChild(emailItem);
}

// 驗證Email格式
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 同步資料到GitHub
function syncToGitHub(dataType, data) {
    // 發送資料到GitHub Action
    fetch('/.netlify/functions/store-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: dataType,
            data: data
        }),
    }).catch(error => {
        console.error('同步資料到GitHub失敗:', error);
    });
}
