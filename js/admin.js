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
    
    // 初始化病床管理
    initBedManagement();
});

// 初始化主題管理
function initTopicManagement() {
    const addTopicButton = document.getElementById('add-topic');
    const topicsBody = document.getElementById('topics-body');
    const topicModal = document.getElementById('topic-modal');
    const topicForm = document.getElementById('topic-form');
    const closeModal = topicModal.querySelector('.close');
    const addQuestionButton = document.getElementById('add-question');
    const surveyQuestions = document.getElementById('survey-questions');
    
    // 載入主題資料
    loadTopics();
    
    // 新增主題按鈕
    addTopicButton.addEventListener('click', function() {
        // 重置表單
        topicForm.reset();
        document.getElementById('topic-id').value = '';
        document.getElementById('topic-name').value = '';
        document.getElementById('topic-video').value = '';
        
        // 清空問卷問題
        surveyQuestions.innerHTML = '';
        
        // 預設新增一個問題
        addQuestion('truefalse');
        
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
    
    // 新增問題按鈕
    addQuestionButton.addEventListener('click', function() {
        // 顯示問題類型選擇對話框
        const questionType = prompt('請選擇問題類型 (輸入數字)：\n1. 是非題\n2. 選擇題');
        
        if (questionType === '1') {
            addQuestion('truefalse');
        } else if (questionType === '2') {
            addQuestion('choice');
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
        
        // 收集問卷問題
        const questions = [];
        const questionItems = document.querySelectorAll('.question-item');
        
        questionItems.forEach(item => {
            const type = item.dataset.type;
            const text = item.querySelector('.question-text').value.trim();
            const score = parseInt(item.querySelector('.question-score').value);
            
            if (!text) {
                alert('問題文字不能為空');
                return;
            }
            
            if (type === 'truefalse') {
                const correctAnswer = item.querySelector('input[name="correct-answer"]:checked').value === 'true';
                
                questions.push({
                    type: 'truefalse',
                    text: text,
                    correctAnswer: correctAnswer,
                    score: score
                });
            } else if (type === 'choice') {
                const options = [];
                const optionElements = item.querySelectorAll('.option-item');
                let correctAnswerIndex = -1;
                
                optionElements.forEach((optionElement, index) => {
                    const optionText = optionElement.querySelector('.option-text').value.trim();
                    if (!optionText) {
                        alert('選項文字不能為空');
                        return;
                    }
                    
                    options.push(optionText);
                    
                    if (optionElement.querySelector('input[type="radio"]').checked) {
                        correctAnswerIndex = index;
                    }
                });
                
                if (options.length < 2) {
                    alert('選擇題至少需要兩個選項');
                    return;
                }
                
                if (correctAnswerIndex === -1) {
                    alert('請選擇正確答案');
                    return;
                }
                
                questions.push({
                    type: 'choice',
                    text: text,
                    options: options,
                    correctAnswerIndex: correctAnswerIndex,
                    score: score
                });
            }
        });
        
        if (questions.length === 0) {
            alert('至少需要一個問題');
            return;
        }
        
        // 取得現有主題資料
        let topics = JSON.parse(localStorage.getItem('topics')) || [];
        
        // 檢查編號是否已存在
        const existingIndex = topics.findIndex(t => t.id === id);
        
        const newTopic = { 
            id, 
            name, 
            videoId,
            questions: questions,
            totalScore: questions.reduce((sum, q) => sum + q.score, 0)
        };
        
        if (existingIndex !== -1) {
            // 更新現有主題
            topics[existingIndex] = newTopic;
        } else {
            // 新增主題
            topics.push(newTopic);
            
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
    
    // 事件委派，處理動態添加的問題項目
    document.addEventListener('click', function(e) {
        // 刪除問題
        if (e.target.classList.contains('remove-question')) {
            if (document.querySelectorAll('.question-item').length > 1) {
                e.target.closest('.question-item').remove();
            } else {
                alert('至少需要保留一個問題');
            }
        }
        
        // 新增選項
        if (e.target.classList.contains('add-option')) {
            const optionList = e.target.previousElementSibling;
            const questionItem = e.target.closest('.question-item');
            const optionItems = questionItem.querySelectorAll('.option-item');
            
            // 創建新選項
            const newOption = document.createElement('div');
            newOption.className = 'option-item';
            
            const radioName = `option-${Date.now()}`;
            
            newOption.innerHTML = `
                <input type="radio" name="correct-answer" value="${optionItems.length}">
                <input type="text" class="option-text" placeholder="選項文字" required>
                <button type="button" class="remove-option">刪除</button>
            `;
            
            optionList.appendChild(newOption);
        }
        
        // 刪除選項
        if (e.target.classList.contains('remove-option')) {
            const optionItem = e.target.closest('.option-item');
            const optionList = optionItem.parentElement;
            
            if (optionList.querySelectorAll('.option-item').length > 1) {
                optionItem.remove();
                
                // 更新選項值
                const optionItems = optionList.querySelectorAll('.option-item');
                optionItems.forEach((item, index) => {
                    item.querySelector('input[type="radio"]').value = index;
                });
            } else {
                alert('至少需要保留一個選項');
            }
        }
    });
}

// 新增問題
function addQuestion(type) {
    const surveyQuestions = document.getElementById('survey-questions');
    const template = document.getElementById(`question-template-${type}`);
    const clone = document.importNode(template.content, true);
    
    // 為新問題的單選按鈕設置唯一名稱
    const radioName = `correct-answer-${Date.now()}`;
    const radios = clone.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.name = radioName;
    });
    
    surveyQuestions.appendChild(clone);
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
        topics = Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            name: `衛教主題 ${i + 1}`,
            videoId: 'dQw4w9WgXcQ',  // 預設 Youtube 影片 ID
            questions: [
                {
                    type: 'truefalse',
                    text: '這是預設的是非題問題',
                    correctAnswer: true,
                    score: 10
                },
                {
                    type: 'choice',
                    text: '這是預設的選擇題問題',
                    options: ['選項 A', '選項 B', '選項 C'],
                    correctAnswerIndex: 0,
                    score: 10
                }
            ],
            totalScore: 20
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
        
        // 問卷題數
        const questionCell = document.createElement('td');
        questionCell.textContent = topic.questions ? `${topic.questions.length} 題 (總分: ${topic.totalScore})` : '未設定';
        row.appendChild(questionCell);
        
        // 操作按鈕
        const actionCell = document.createElement('td');
        
        const editButton = document.createElement('button');
        editButton.textContent = '編輯';
        editButton.addEventListener('click', function() {
            editTopic(topic);
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '刪除';
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', function() {
            if (confirm(`確定要刪除「${topic.name}」主題嗎？`)) {
                deleteTopic(topic.id);
            }
        });
        
        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);
        
        topicsBody.appendChild(row);
    });
}

// 編輯主題
function editTopic(topic) {
    const topicModal = document.getElementById('topic-modal');
    const surveyQuestions = document.getElementById('survey-questions');
    
    // 填入現有資料
    document.getElementById('topic-id').value = topic.id;
    document.getElementById('topic-name').value = topic.name;
    document.getElementById('topic-video').value = topic.videoId;
    
    // 清空問卷問題
    surveyQuestions.innerHTML = '';
    
    // 填入現有問題
    if (topic.questions && topic.questions.length > 0) {
        topic.questions.forEach(question => {
            if (question.type === 'truefalse') {
                // 添加是非題
                const template = document.getElementById('question-template-truefalse');
                const clone = document.importNode(template.content, true);
                
                // 設置問題文字
                clone.querySelector('.question-text').value = question.text;
                
                // 設置正確答案
                const radioName = `correct-answer-${Date.now()}`;
                const radios = clone.querySelectorAll('input[type="radio"]');
                radios.forEach(radio => {
                    radio.name = radioName;
                    if ((radio.value === 'true' && question.correctAnswer) ||
                        (radio.value === 'false' && !question.correctAnswer)) {
                        radio.checked = true;
                    }
                });
                
                // 設置分數
                clone.querySelector('.question-score').value = question.score;
                
                surveyQuestions.appendChild(clone);
            } else if (question.type === 'choice') {
                // 添加選擇題
                const template = document.getElementById('question-template-choice');
                const clone = document.importNode(template.content, true);
                
                // 設置問題文字
                clone.querySelector('.question-text').value = question.text;
                
                // 設置分數
                clone.querySelector('.question-score').value = question.score;
                
                // 清空預設選項
                const optionList = clone.querySelector('.option-list');
                optionList.innerHTML = '';
                
                // 添加選項
                const radioName = `option-${Date.now()}`;
                
                question.options.forEach((optionText, index) => {
                    const optionItem = document.createElement('div');
                    optionItem.className = 'option-item';
                    
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = 'correct-answer';
                    radio.value = index;
                    radio.checked = index === question.correctAnswerIndex;
                    
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'option-text';
                    input.value = optionText;
                    input.required = true;
                    
                    const removeButton = document.createElement('button');
                    removeButton.type = 'button';
                    removeButton.className = 'remove-option';
                    removeButton.textContent = '刪除';
                    
                    optionItem.appendChild(radio);
                    optionItem.appendChild(input);
                    optionItem.appendChild(removeButton);
                    
                    optionList.appendChild(optionItem);
                });
                
                surveyQuestions.appendChild(clone);
            }
        });
    } else {
        // 如果沒有問題，添加一個預設問題
        addQuestion('truefalse');
    }
    
    // 顯示模態框
    topicModal.style.display = 'block';
}

// 刪除主題
function deleteTopic(topicId) {
    // 取得現有主題資料
    let topics = JSON.parse(localStorage.getItem('topics')) || [];
    
    // 移除指定主題
    topics = topics.filter(t => t.id !== topicId);
    
    // 儲存到 localStorage
    localStorage.setItem('topics', JSON.stringify(topics));
    
    // 同步到 GitHub
    syncToGitHub('topics', topics);
    
    // 重新載入主題列表
    loadTopics();
}

// 初始化群組管理
function initGroupManagement() {
    const addGroupButton = document.getElementById('add-group');
    const groupsBody = document.getElementById('groups-body');
    const groupModal = document.getElementById('group-modal');
    const groupForm = document.getElementById('group-form');
    const closeModal = groupModal.querySelector('.close');
    
    // 載入群組資料
    loadGroups();
    
    // 新增群組按鈕
    addGroupButton.addEventListener('click', function() {
        // 重置表單
        groupForm.reset();
        document.getElementById('group-name').value = '';
        
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
        
        if (!name) {
            alert('請輸入群組名稱');
            return;
        }
        
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
        let groups = JSON.parse(localStorage.getItem('groups')) || [];
        
        // 檢查群組名稱是否已存在
        const existingIndex = groups.findIndex(g => g.name === name);
        
        if (existingIndex !== -1) {
            // 更新現有群組
            groups[existingIndex] = { name, topics };
        } else {
            // 新增群組
            groups.push({ name, topics });
        }
        
        // 儲存到 localStorage
        localStorage.setItem('groups', JSON.stringify(groups));
        
        // 同步到 GitHub
        syncToGitHub('groups', groups);
        
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
    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    const topics = JSON.parse(localStorage.getItem('topics')) || [];
    
    // 生成表格行
    groups.forEach(group => {
        const row = document.createElement('tr');
        
        // 群組名稱
        const nameCell = document.createElement('td');
        nameCell.textContent = group.name;
        row.appendChild(nameCell);
        
        // 包含主題
        const topicsCell = document.createElement('td');
        const groupTopicNames = group.topics.map(topicId => {
            const topic = topics.find(t => t.id === topicId);
            return topic ? topic.name : `主題 ${topicId}`;
        });
        topicsCell.textContent = groupTopicNames.join(', ');
        row.appendChild(topicsCell);
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
            if (confirm(`確定要刪除「${group.name}」群組嗎？`)) {
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
    
    // 載入主題多選項
    loadTopicOptions(group.topics);
    
    // 顯示模態框
    groupModal.style.display = 'block';
}

// 刪除群組
function deleteGroup(groupName) {
    // 取得現有群組資料
    let groups = JSON.parse(localStorage.getItem('groups')) || [];
    
    // 移除指定群組
    groups = groups.filter(g => g.name !== groupName);
    
    // 儲存到 localStorage
    localStorage.setItem('groups', JSON.stringify(groups));
    
    // 同步到 GitHub
    syncToGitHub('groups', groups);
    
    // 重新載入群組列表
    loadGroups();
    
    // 更新病床列表
    loadBeds();
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

// 初始化病床管理
function initBedManagement() {
    const addBedButton = document.getElementById('add-bed');
    const bedsBody = document.getElementById('beds-body');
    const bedModal = document.getElementById('bed-modal');
    const bedForm = document.getElementById('bed-form');
    const closeModal = bedModal.querySelector('.close');
    
    // 載入病床資料
    loadBeds();
    
    // 新增病床按鈕
    addBedButton.addEventListener('click', function() {
        // 重置表單
        bedForm.reset();
        document.getElementById('bed-number').value = '';
        
        // 載入群組選項
        loadGroupOptions();
        
        // 顯示模態框
        bedModal.style.display = 'block';
    });
    
    // 關閉模態框
    closeModal.addEventListener('click', function() {
        bedModal.style.display = 'none';
    });
    
    // 點擊模態框外部關閉
    window.addEventListener('click', function(event) {
        if (event.target === bedModal) {
            bedModal.style.display = 'none';
        }
    });
    
    // 提交病床表單
    bedForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const bedNumber = document.getElementById('bed-number').value.trim();
        const groupName = document.getElementById('bed-group').value;
        
        if (!bedNumber) {
            alert('請輸入病床號碼');
            return;
        }
        
        if (!groupName) {
            alert('請選擇所屬群組');
            return;
        }
        
        // 取得現有病床資料
        let beds = JSON.parse(localStorage.getItem('beds')) || [];
        
        // 檢查病床號碼是否已存在
        const existingIndex = beds.findIndex(b => b.bedNumber === bedNumber);
        
        if (existingIndex !== -1) {
            // 更新現有病床
            beds[existingIndex] = { bedNumber, groupName };
        } else {
            // 新增病床
            beds.push({ bedNumber, groupName });
            
            // 按病床號碼排序
            beds.sort((a, b) => a.bedNumber.localeCompare(b.bedNumber));
        }
        
        // 儲存到 localStorage
        localStorage.setItem('beds', JSON.stringify(beds));
        
        // 同步到 GitHub
        syncToGitHub('beds', beds);
        
        // 關閉模態框
        bedModal.style.display = 'none';
        
        // 重新載入病床列表
        loadBeds();
    });
}

// 載入病床列表
function loadBeds() {
    const bedsBody = document.getElementById('beds-body');
    
    if (!bedsBody) return;
    
    // 清空現有內容
    bedsBody.innerHTML = '';
    
    // 從 localStorage 獲取病床資料
    const beds = JSON.parse(localStorage.getItem('beds')) || [];
    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    
    // 生成表格行
    beds.forEach(bed => {
        const row = document.createElement('tr');
        
        // 病床號碼
        const numberCell = document.createElement('td');
        numberCell.textContent = bed.bedNumber;
        row.appendChild(numberCell);
        
        // 所屬群組
        const groupCell = document.createElement('td');
        const group = groups.find(g => g.name === bed.groupName);
        groupCell.textContent = group ? bed.groupName : '(群組已刪除)';
        row.appendChild(groupCell);
        
        // 操作按鈕
        const actionCell = document.createElement('td');
        
        const editButton = document.createElement('button');
        editButton.textContent = '編輯';
        editButton.addEventListener('click', function() {
            editBed(bed);
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '刪除';
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', function() {
            if (confirm(`確定要刪除病床 ${bed.bedNumber} 嗎？`)) {
                deleteBed(bed.bedNumber);
            }
        });
        
        actionCell.appendChild(editButton);
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);
        
        bedsBody.appendChild(row);
    });
}

// 編輯病床
function editBed(bed) {
    const bedModal = document.getElementById('bed-modal');
    
    // 填入現有資料
    document.getElementById('bed-number').value = bed.bedNumber;
    
    // 載入群組選項
    loadGroupOptions(bed.groupName);
    
    // 顯示模態框
    bedModal.style.display = 'block';
}

// 刪除病床
function deleteBed(bedNumber) {
    // 取得現有病床資料
    let beds = JSON.parse(localStorage.getItem('beds')) || [];
    
    // 移除指定病床
    beds = beds.filter(b => b.bedNumber !== bedNumber);
    
    // 儲存到 localStorage
    localStorage.setItem('beds', JSON.stringify(beds));
    
    // 同步到 GitHub
    syncToGitHub('beds', beds);
    
    // 重新載入病床列表
    loadBeds();
}

// 載入群組選項
function loadGroupOptions(selectedGroup = '') {
    const bedGroup = document.getElementById('bed-group');
    
    if (!bedGroup) return;
    
    // 清空現有內容
    bedGroup.innerHTML = '';
    
    // 添加預設選項
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- 請選擇群組 --';
    bedGroup.appendChild(defaultOption);
    
    // 從 localStorage 獲取群組資料
    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    
    // 生成選項
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.name;
        option.textContent = group.name;
        option.selected = group.name === selectedGroup;
        bedGroup.appendChild(option);
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
        // 操作按鈕
