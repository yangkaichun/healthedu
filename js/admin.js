// 管理設定功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化標籤頁切換
    const tabLinks = document.querySelectorAll('.tabs a');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 取消所有標籤頁和內容的啟用狀態
            tabLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // 啟用當前標籤頁和內容
            this.classList.add('active');
            const targetId = this.getAttribute('href').substring(1);
            document.getElementById(targetId).classList.add('active');
        });
    });
    
    // 初始化主題管理
    initTopicManagement();
    
    // 初始化群組管理
    initGroupManagement();
});

// 初始化主題管理
function initTopicManagement() {
    const addTopicButton = document.getElementById('add-topic');
    const topicsBody = document.getElementById('topics-body');
    const topicModal = document.getElementById('topic-modal');
    const topicForm = document.getElementById('topic-form');
    const closeModal = topicModal.querySelector('.close');
    
    // 載入主題資料
    loadTopics();
    
    // 新增主題按鈕
    addTopicButton.addEventListener('click', function() {
        // 重置表單
        topicForm.reset();
        document.getElementById('topic-id').value = '';
        document.getElementById('topic-name').value = '';
        document.getElementById('topic-video').value = '';
        
        // 顯示模態框
        topicModal.style.display = 'block';
    });
    
    // 關閉模態框
    closeModal.addEventListener('click', function() {
        topicModal.style.display = 'none';
    });
    
    // 點擊模態框外部關閉
    window.addEventListener('click', function(event) {
        if (event.target === topicModal) {
            topicModal.style.display = 'none';
        }
    });
    
    // 提交主題表單
    topicForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = parseInt(document.getElementById('topic-id').value);
        const name = document.getElementById('topic-name').value.trim();
        const videoId = document.getElementById('topic-video').value.trim();
        
        if (id < 1 || id > 30) {
            alert('主題編號必須介於1至30之間');
            return;
        }
        
        if (!name) {
            alert('請輸入主題名稱');
            return;
        }
        
        if (!videoId) {
            alert('請輸入YouTube影片ID');
            return;
        }
        
      // 管理設定功能 (admin.js 繼續)
        // 取得現有主題資料
        let topics = JSON.parse(localStorage.getItem('topics')) || [];
        
        // 檢查編號是否已存在
        const existingIndex = topics.findIndex(t => t.id === id);
        
        if (existingIndex !== -1) {
            // 更新現有主題
            topics[existingIndex] = { id, name, videoId };
        } else {
            // 新增主題
            topics.push({ id, name, videoId });
            
            // 按編號排序
            topics.sort((a, b) => a.id - b.id);
        }
        
        // 儲存到 localStorage
        localStorage.setItem('topics', JSON.stringify(topics));
        
        // 同步到 GitHub
        syncToGitHub('topics', topics);
        
        // 關閉模態框
        topicModal.style.display = 'none';
        
        // 重新載入主題列表
        loadTopics();
    });
}

// 載入主題列表
function loadTopics() {
    const topicsBody = document.getElementById('topics-body');
    
    if (!topicsBody) return;
    
    // 清空現有內容
    topicsBody.innerHTML = '';
    
    // 從 localStorage 獲取主題資料
    let topics = JSON.parse(localStorage.getItem('topics')) || [];
    
    // 如果沒有主題資料，則創建默認主題
    if (topics.length === 0) {
        topics = Array.from({ length: 30 }, (_, i) => ({
            id: i + 1,
            name: `衛教主題 ${i + 1}`,
            videoId: 'dQw4w9WgXcQ'  // 預設 Youtube 影片 ID
        }));
        localStorage.setItem('topics', JSON.stringify(topics));
    }
    
    // 按編號排序
    topics.sort((a, b) => a.id - b.id);
    
    // 生成表格行
    topics.forEach(topic => {
        const row = document.createElement('tr');
        
        // 編號
        const idCell = document.createElement('td');
        idCell.textContent = topic.id;
        row.appendChild(idCell);
        
        // 主題名稱
        const nameCell = document.createElement('td');
        nameCell.textContent = topic.name;
        row.appendChild(nameCell);
        
        // YouTube 影片 ID
        const videoCell = document.createElement('td');
        videoCell.textContent = topic.videoId;
        row.appendChild(videoCell);
        
        // 操作按鈕
        const actionCell = document.createElement('td');
        
        const editButton = document.createElement('button');
        editButton.textContent = '編輯';
        editButton.addEventListener('click', function() {
            editTopic(topic);
        });
        
        actionCell.appendChild(editButton);
        row.appendChild(actionCell);
        
        topicsBody.appendChild(row);
    });
}

// 編輯主題
function editTopic(topic) {
    const topicModal = document.getElementById('topic-modal');
    
    // 填入現有資料
    document.getElementById('topic-id').value = topic.id;
    document.getElementById('topic-name').value = topic.name;
    document.getElementById('topic-video').value = topic.videoId;
    
    // 顯示模態框
    topicModal.style.display = 'block';
}

// 初始化群組管理
function initGroupManagement() {
    const addGroupButton = document.getElementById('add-group');
    const groupsBody = document.getElementById('groups-body');
    const groupModal = document.getElementById('group-modal');
    const groupForm = document.getElementById('group-form');
    const closeModal = groupModal.querySelector('.close');
    const groupTopics = document.getElementById('group-topics');
    
    // 載入群組資料
    loadGroups();
    
    // 新增群組按鈕
    addGroupButton.addEventListener('click', function() {
        // 重置表單
        groupForm.reset();
        document.getElementById('group-name').value = '';
        document.getElementById('group-beds').value = '';
        
        // 載入主題多選項
        loadTopicOptions();
        
        // 顯示模態框
        groupModal.style.display = 'block';
    });
    
    // 關閉模態框
    closeModal.addEventListener('click', function() {
        groupModal.style.display = 'none';
    });
    
    // 點擊模態框外部關閉
    window.addEventListener('click', function(event) {
        if (event.target === groupModal) {
            groupModal.style.display = 'none';
        }
    });
    
    // 提交群組表單
    groupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('group-name').value.trim();
        const bedsInput = document.getElementById('group-beds').value.trim();
        
        if (!name) {
            alert('請輸入群組名稱');
            return;
        }
        
        if (!bedsInput) {
            alert('請輸入病床號碼');
            return;
        }
        
        // 解析病床號碼
        const beds = bedsInput.split(',').map(bed => bed.trim());
        
        // 收集選中的主題
        const topics = [];
        const checkboxes = document.querySelectorAll('#group-topics input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            topics.push(parseInt(checkbox.value));
        });
        
        if (topics.length === 0) {
            alert('請至少選擇一個主題');
            return;
        }
        
        // 取得現有群組資料
        let groups = JSON.parse(localStorage.getItem('bedGroups')) || [];
        
        // 檢查群組名稱是否已存在
        const existingIndex = groups.findIndex(g => g.name === name);
        
        if (existingIndex !== -1) {
            // 更新現有群組
            groups[existingIndex] = { name, beds, topics };
        } else {
            // 新增群組
            groups.push({ name, beds, topics });
        }
        
        // 儲存到 localStorage
        localStorage.setItem('bedGroups', JSON.stringify(groups));
        
        // 同步到 GitHub
        syncToGitHub('bedGroups', groups);
        
        // 關閉模態框
        groupModal.style.display = 'none';
        
        // 重新載入群組列表
        loadGroups();
    });
}

// 載入群組列表
function loadGroups() {
    const groupsBody = document.getElementById('groups-body');
    
    if (!groupsBody) return;
    
    // 清空現有內容
    groupsBody.innerHTML = '';
    
    // 從 localStorage 獲取群組資料
    const groups = JSON.parse(localStorage.getItem('bedGroups')) || [];
    const topics = JSON.parse(localStorage.getItem('topics')) || [];
    
    // 生成表格行
    groups.forEach(group => {
        const row = document.createElement('tr');
        
        // 群組名稱
        const nameCell = document.createElement('td');
        nameCell.textContent = group.name;
        row.appendChild(nameCell);
        
        // 病床號碼
        const bedsCell = document.createElement('td');
        bedsCell.textContent = group.beds.join(', ');
        row.appendChild(bedsCell);
        
        // 包含主題
        const topicsCell = document.createElement('td');
        const groupTopicNames = group.topics.map(topicId => {
            const topic = topics.find(t => t.id === topicId);
            return topic ? topic.name : `主題 ${topicId}`;
        });
        topicsCell.textContent = groupTopicNames.join(', ');
        row.appendChild(topicsCell);
        
        // 操作按鈕
        const actionCell = document.createElement('td');
        
        const editButton = document.createElement('button');
        editButton.textContent = '編輯';
        editButton.addEventListener('click', function() {
            editGroup(group);
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '刪除';
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', function() {
            if (confirm('確定要刪除此群組嗎？')) {
                deleteGroup(group.name);
            }
        });
        
        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);
        
        groupsBody.appendChild(row);
    });
}

// 編輯群組
function editGroup(group) {
    const groupModal = document.getElementById('group-modal');
    
    // 填入現有資料
    document.getElementById('group-name').value = group.name;
    document.getElementById('group-beds').value = group.beds.join(', ');
    
    // 載入主題多選項
    loadTopicOptions(group.topics);
    
    // 顯示模態框
    groupModal.style.display = 'block';
}

// 刪除群組
function deleteGroup(groupName) {
    // 取得現有群組資料
    let groups = JSON.parse(localStorage.getItem('bedGroups')) || [];
    
    // 移除指定群組
    groups = groups.filter(g => g.name !== groupName);
    
    // 儲存到 localStorage
    localStorage.setItem('bedGroups', JSON.stringify(groups));
    
    // 同步到 GitHub
    syncToGitHub('bedGroups', groups);
    
    // 重新載入群組列表
    loadGroups();
}

// 載入主題多選項
function loadTopicOptions(selectedTopics = []) {
    const groupTopics = document.getElementById('group-topics');
    
    if (!groupTopics) return;
    
    // 清空現有內容
    groupTopics.innerHTML = '';
    
    // 從 localStorage 獲取主題資料
    const topics = JSON.parse(localStorage.getItem('topics')) || [];
    
    // 生成多選項
    topics.forEach(topic => {
        const checkboxOption = document.createElement('div');
        checkboxOption.className = 'checkbox-option';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = topic.id;
        checkbox.id = `topic_${topic.id}`;
        checkbox.checked = selectedTopics.includes(topic.id);
        
        const label = document.createElement('label');
        label.htmlFor = `topic_${topic.id}`;
        label.textContent = topic.name;
        
        checkboxOption.appendChild(checkbox);
        checkboxOption.appendChild(label);
        
        groupTopics.appendChild(checkboxOption);
    });
}

// 同步資料到 GitHub
function syncToGitHub(dataType, data) {
    // 發送資料到 GitHub Action
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
        console.error('同步資料到 GitHub 失敗:', error);
    });
}
