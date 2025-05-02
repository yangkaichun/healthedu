// 管理設定功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin JS loaded');
    
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
    console.log('Initializing topic management');
    
    const addTopicButton = document.getElementById('add-topic');
    const topicsBody = document.getElementById('topics-body');
    const topicModal = document.getElementById('topic-modal');
    const topicForm = document.getElementById('topic-form');
    const closeModal = topicModal ? topicModal.querySelector('.close') : null;
    const addQuestionButton = document.getElementById('add-question-btn'); // 注意這裡的ID改變
    const surveyQuestions = document.getElementById('survey-questions');
    
    if (!addTopicButton || !topicModal || !topicForm) {
        console.error('Missing required elements for topic management');
        return;
    }
    
    // 載入主題資料
    loadTopics();
    
    // 新增主題按鈕
    addTopicButton.addEventListener('click', function() {
        console.log('Add topic button clicked');
        
        // 重置表單
        topicForm.reset();
        document.getElementById('topic-id').value = '';
        document.getElementById('topic-name').value = '';
        document.getElementById('topic-video').value = '';
        
        // 清空問卷問題
        if (surveyQuestions) {
            surveyQuestions.innerHTML = '';
            
            // 預設新增一個問題
            addQuestion('truefalse');
        }
        
        // 顯示模態框
        topicModal.style.display = 'block';
    });
    
    // 關閉模態框
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            topicModal.style.display = 'none';
        });
    }
    
    // 點擊模態框外部關閉
    window.addEventListener('click', function(event) {
        if (event.target === topicModal) {
            topicModal.style.display = 'none';
        }
    });
    
    // 新增問題按鈕 - 這裡是修正的關鍵部分
    if (addQuestionButton) {
        console.log('Found add question button');
        
        // 直接使用 onclick 而不是 addEventListener
        addQuestionButton.onclick = function() {
            console.log('Add question button clicked');
            const questionType = prompt('請選擇問題類型 (輸入數字)：\n1. 是非題\n2. 選擇題');
            
            if (questionType === '1') {
                addQuestion('truefalse');
            } else if (questionType === '2') {
                addQuestion('choice');
            }
        };
    } else {
        console.error('Add question button not found');
    }
    
    // 提交主題表單
    topicForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Topic form submitted');
        
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
        
        if (questionItems.length === 0) {
            alert('至少需要一個問題');
            return;
        }
        
        let valid = true;
        
        questionItems.forEach((item, index) => {
            const type = item.dataset.type;
            const text = item.querySelector('.question-text').value.trim();
            const score = parseInt(item.querySelector('.question-score').value);
            
            if (!text) {
                alert(`問題 ${index + 1} 的問題文字不能為空`);
                valid = false;
                return;
            }
            
            if (type === 'truefalse') {
                // 獲取這個特定問題項目內的單選按鈕
                const radioButtons = item.querySelectorAll('input[type="radio"]');
                let correctAnswer = false;
                
                // 檢查哪個單選按鈕被選中
                for (const radio of radioButtons) {
                    if (radio.checked) {
                        correctAnswer = radio.value === 'true';
                        break;
                    }
                }
                
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
                
                if (optionElements.length < 2) {
                    alert(`問題 ${index + 1} 至少需要兩個選項`);
                    valid = false;
                    return;
                }
                
                optionElements.forEach((optionElement, optIndex) => {
                    const optionText = optionElement.querySelector('.option-text').value.trim();
                    if (!optionText) {
                        alert(`問題 ${index + 1} 的選項 ${optIndex + 1} 文字不能為空`);
                        valid = false;
                        return;
                    }
                    
                    options.push(optionText);
                    
                    // 檢查這個選項的單選按鈕是否被選中
                    if (optionElement.querySelector('input[type="radio"]').checked) {
                        correctAnswerIndex = optIndex;
                    }
                });
                
                if (correctAnswerIndex === -1) {
                    alert(`問題 ${index + 1} 請選擇正確答案`);
                    valid = false;
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
        
        if (!valid) {
            return;
        }
        
        // 計算總分
        const totalScore = questions.reduce((sum, q) => sum + q.score, 0);
        
        // 取得現有主題資料
        let topics = JSON.parse(localStorage.getItem('topics')) || [];
        
        // 檢查編號是否已存在
        const existingIndex = topics.findIndex(t => t.id === id);
        
        const newTopic = { 
            id, 
            name, 
            videoId,
            questions: questions,
            totalScore: totalScore
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
}

// 新增問題函數 - 改進版
function addQuestion(type) {
    console.log(`Adding question of type: ${type}`);
    const surveyQuestions = document.getElementById('survey-questions');
    
    if (!surveyQuestions) {
        console.error('Survey questions container not found');
        return;
    }
    
    // 創建新問題容器
    const questionItem = document.createElement('div');
    questionItem.className = 'question-item';
    questionItem.dataset.type = type;
    
    // 創建問題標題與刪除按鈕
    const questionHeader = document.createElement('div');
    questionHeader.className = 'question-header';
    
    const questionTitle = document.createElement('h4');
    questionTitle.textContent = type === 'truefalse' ? '是非題' : '選擇題';
    
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-question';
    removeButton.textContent = '刪除';
    
    // 添加刪除問題事件
    removeButton.addEventListener('click', function() {
        if (confirm('確定要刪除這個問題嗎？')) {
            questionItem.remove();
            
            // 檢查是否還有問題
            if (document.querySelectorAll('.question-item').length === 0) {
                const noQuestionsMessage = document.createElement('p');
                noQuestionsMessage.className = 'no-questions-message';
                noQuestionsMessage.textContent = '尚未添加任何問題，請點擊"新增問題"按鈕添加問題。';
                surveyQuestions.appendChild(noQuestionsMessage);
            }
        }
    });
    
    questionHeader.appendChild(questionTitle);
    questionHeader.appendChild(removeButton);
    questionItem.appendChild(questionHeader);
    
    // 問題文字輸入
    const textGroup = document.createElement('div');
    textGroup.className = 'form-group';
    
    const textLabel = document.createElement('label');
    textLabel.textContent = '問題文字：';
    
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'question-text';
    textInput.required = true;
    
    textGroup.appendChild(textLabel);
    textGroup.appendChild(textInput);
    questionItem.appendChild(textGroup);
    
    // 根據問題類型添加不同的選項
    if (type === 'truefalse') {
        // 是非題選項
        const answerGroup = document.createElement('div');
        answerGroup.className = 'form-group';
        
        const answerLabel = document.createElement('label');
        answerLabel.textContent = '正確答案：';
        
        const radioContainer = document.createElement('div');
        radioContainer.className = 'radio-inline';
        
        // 生成唯一的 radio 組名
        const radioName = `correct-answer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // 是的選項
        const trueLabel = document.createElement('label');
        
        const trueRadio = document.createElement('input');
        trueRadio.type = 'radio';
        trueRadio.name = radioName;
        trueRadio.value = 'true';
        trueRadio.checked = true;
        
        trueLabel.appendChild(trueRadio);
        trueLabel.appendChild(document.createTextNode(' 是'));
        
        // 否的選項
        const falseLabel = document.createElement('label');
        
        const falseRadio = document.createElement('input');
        falseRadio.type = 'radio';
        falseRadio.name = radioName;
        falseRadio.value = 'false';
        
        falseLabel.appendChild(falseRadio);
        falseLabel.appendChild(document.createTextNode(' 否'));
        
        radioContainer.appendChild(trueLabel);
        radioContainer.appendChild(falseLabel);
        
        answerGroup.appendChild(answerLabel);
        answerGroup.appendChild(radioContainer);
        questionItem.appendChild(answerGroup);
    } else if (type === 'choice') {
        // 選擇題選項
        const optionsGroup = document.createElement('div');
        optionsGroup.className = 'form-group';
        
        const optionsLabel = document.createElement('label');
        optionsLabel.textContent = '選項：';
        
        const optionList = document.createElement('div');
        optionList.className = 'option-list';
        
        // 生成唯一的 radio 組名
        const radioName = `option-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // 預設添加兩個選項
        for (let i = 0; i < 2; i++) {
            const optionItem = document.createElement('div');
            optionItem.className = 'option-item';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = radioName;
            radio.value = i;
            radio.checked = i === 0; // 預設選中第一個
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'option-text';
            input.placeholder = `選項 ${i + 1}`;
            input.required = true;
            
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-option';
            removeButton.textContent = '刪除';
            
            // 添加刪除選項事件
            removeButton.addEventListener('click', function() {
                const optionItems = optionList.querySelectorAll('.option-item');
                if (optionItems.length <= 2) {
                    alert('選擇題至少需要保留兩個選項');
                    return;
                }
                
                optionItem.remove();
                
                // 更新選項值
                const remainingOptions = optionList.querySelectorAll('.option-item');
                remainingOptions.forEach((item, index) => {
                    item.querySelector('input[type="radio"]').value = index;
                });
            });
            
            optionItem.appendChild(radio);
            optionItem.appendChild(input);
            optionItem.appendChild(removeButton);
            
            optionList.appendChild(optionItem);
        }
        
        const addOptionButton = document.createElement('button');
        addOptionButton.type = 'button';
        addOptionButton.className = 'add-option';
        addOptionButton.textContent = '新增選項';
        
        // 添加新增選項事件
        addOptionButton.addEventListener('click', function() {
            const optionItems = optionList.querySelectorAll('.option-item');
            const newIndex = optionItems.length;
            
            const optionItem = document.createElement('div');
            optionItem.className = 'option-item';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = radioName;
            radio.value = newIndex;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'option-text';
            input.placeholder = `選項 ${newIndex + 1}`;
            input.required = true;
            
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-option';
            removeButton.textContent = '刪除';
            
            // 添加刪除選項事件
            removeButton.addEventListener('click', function() {
                const currentOptions = optionList.querySelectorAll('.option-item');
                if (currentOptions.length <= 2) {
                    alert('選擇題至少需要保留兩個選項');
                    return;
                }
                
                optionItem.remove();
                
                // 更新選項值
                const remainingOptions = optionList.querySelectorAll('.option-item');
                remainingOptions.forEach((item, index) => {
                    item.querySelector('input[type="radio"]').value = index;
                });
            });
            
            optionItem.appendChild(radio);
            optionItem.appendChild(input);
            optionItem.appendChild(removeButton);
            
            optionList.appendChild(optionItem);
        });
        
        optionsGroup.appendChild(optionsLabel);
        optionsGroup.appendChild(optionList);
        optionsGroup.appendChild(addOptionButton);
        questionItem.appendChild(optionsGroup);
    }
    
    // 分數設定
    const scoreGroup = document.createElement('div');
    scoreGroup.className = 'form-group';
    
    const scoreLabel = document.createElement('label');
    scoreLabel.textContent = '題目分數：';
    
    const scoreInput = document.createElement('input');
    scoreInput.type = 'number';
    scoreInput.className = 'question-score';
    scoreInput.min = '1';
    scoreInput.value = '10';
    scoreInput.required = true;
    
    scoreGroup.appendChild(scoreLabel);
    scoreGroup.appendChild(scoreInput);
    questionItem.appendChild(scoreGroup);
    
    // 移除任何「沒有問題」的提示訊息
    const noQuestionsMessage = surveyQuestions.querySelector('.no-questions-message');
    if (noQuestionsMessage) {
        noQuestionsMessage.remove();
    }
    
    // 添加問題到容器
    surveyQuestions.appendChild(questionItem);
}

// 載入主題列表
function loadTopics() {
    console.log('Loading topics');
    const topicsBody = document.getElementById('topics-body');
    
    if (!topicsBody) {
        console.error('Topics table body not found');
        return;
    }
    
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
    console.log(`Editing topic: ${topic.name}`);
    const topicModal = document.getElementById('topic-modal');
    const surveyQuestions = document.getElementById('survey-questions');
    
    if (!topicModal || !surveyQuestions) {
        console.error('Required elements for editing topic not found');
        return;
    }
    
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
                // 創建新問題容器
                const questionItem = document.createElement('div');
                questionItem.className = 'question-item';
                questionItem.dataset.type = 'truefalse';
                
                // 創建問題標題與刪除按鈕
                const questionHeader = document.createElement('div');
                questionHeader.className = 'question-header';
                
                const questionTitle = document.createElement('h4');
                questionTitle.textContent = '是非題';
                
                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.className = 'remove-question';
                removeButton.textContent = '刪除';
                
                // 添加刪除問題事件
                removeButton.addEventListener('click', function() {
                    if (confirm('確定要刪除這個問題嗎？')) {
                        questionItem.remove();
                        
                        // 檢查是否還有問題
                        if (document.querySelectorAll('.question-item').length === 0) {
                            const noQuestionsMessage = document.createElement('p');
                            noQuestionsMessage.className = 'no-questions-message';
                            noQuestionsMessage.textContent = '尚未添加任何問題，請點擊"新增問題"按鈕添加問題。';
                            surveyQuestions.appendChild(noQuestionsMessage);
                        }
                    }
                });
                
                questionHeader.appendChild(questionTitle);
                questionHeader.appendChild(removeButton);
                questionItem.appendChild(questionHeader);
                
                // 問題文字輸入
                const textGroup = document.createElement('div');
                textGroup.className = 'form-group';
                
                const textLabel = document.createElement('label');
                textLabel.textContent = '問題文字：';
                
                const textInput = document.createElement('input');
                textInput.type = 'text';
                textInput.className = 'question-text';
                textInput.value = question.text;
                textInput.required = true;
                
                textGroup.appendChild(textLabel);
                textGroup.appendChild(textInput);
                questionItem.appendChild(textGroup);
                
                // 是非題選項
                const answerGroup = document.createElement('div');
                answerGroup.className = 'form-group';
                
                const answerLabel = document.createElement('label');
                answerLabel.textContent = '正確答案：';
                
                const radioContainer = document.createElement('div');
                radioContainer.className = 'radio-inline';
                
                // 生成唯一的 radio 組名
                const radioName = `correct-answer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                // 是的選項
                const trueLabel = document.createElement('label');
                
                const trueRadio = document.createElement('input');
                trueRadio.type = 'radio';
                trueRadio.name = radioName;
                trueRadio.value = 'true';
                trueRadio.checked = question.correctAnswer === true;
                
                trueLabel.appendChild(trueRadio);
                trueLabel.appendChild(document.createTextNode(' 是'));
                
                // 否的選項
                const falseLabel = document.createElement('label');
                
                const falseRadio = document.createElement('input');
                falseRadio.type = 'radio';
                falseRadio.name = radioName;
                falseRadio.value = 'false';
                falseRadio.checked = question.correctAnswer === false;
                
                falseLabel.appendChild(falseRadio);
                falseLabel.appendChild(document.createTextNode(' 否'));
                
                radioContainer.appendChild(trueLabel);
                radioContainer.appendChild(falseLabel);
                
                answerGroup.appendChild(answerLabel);
                answerGroup.appendChild(radioContainer);
                questionItem.appendChild(answerGroup);
                
                // 分數設定
                const scoreGroup = document.createElement('div');
                scoreGroup.className = 'form-group';
                
                const scoreLabel = document.createElement('label');
                scoreLabel.textContent = '題目分數：';
                
                const scoreInput = document.createElement('input');
                scoreInput.type = 'number';
                scoreInput.className = 'question-score';
                scoreInput.min = '1';
                scoreInput.value = question.score;
                scoreInput.required = true;
                
                scoreGroup.appendChild(scoreLabel);
                scoreGroup.appendChild(scoreInput);
                questionItem.appendChild(scoreGroup);
                
                surveyQuestions.appendChild(questionItem);
            } else if (question.type === 'choice') {
                // 創建新問題容器
                const questionItem = document.createElement('div');
                questionItem.className = 'question-item';
                questionItem.dataset.type = 'choice';
                
                // 創建問題標題與刪除按鈕
                const questionHeader = document.createElement('div');
                questionHeader.className = 'question-header';
                
                const questionTitle = document.createElement('h4');
                questionTitle.textContent = '選擇題';
                
                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.className = 'remove-question';
                removeButton.textContent = '刪除';
                
                // 添加刪除問題事件
                removeButton.addEventListener('click', function() {
                    if (confirm('確定要刪除這個問題嗎？')) {
                        questionItem.remove();
                        
                        // 檢查是否還有問題
                        if (document.querySelectorAll('.question-item').length === 0) {
                            const noQuestionsMessage = document.createElement('p');
                            noQuestionsMessage.className = 'no-questions-message';
                            noQuestionsMessage.textContent = '尚未添加任何問題，請點擊"新增問題"按鈕添加問題。';
                            surveyQuestions.appendChild(noQuestionsMessage);
                        }
                    }
                });
                
                questionHeader.appendChild(questionTitle);
                questionHeader.appendChild(removeButton);
                questionItem.appendChild(questionHeader);
                
                // 問題文字輸入
                const textGroup = document.createElement('div');
                textGroup.className = 'form-group';
                
                const textLabel = document.createElement('label');
                textLabel.textContent = '問題文字：';
                
                const textInput = document.createElement('input');
                textInput.type = 'text';
                textInput.className = 'question-text';
                textInput.value = question.text;
                textInput.required = true;
                
                textGroup.appendChild(textLabel);
                textGroup.appendChild(textInput);
                questionItem.appendChild(textGroup);
                
                // 選擇題選項
                const optionsGroup = document.createElement('div');
                optionsGroup.className = 'form-group';
                
                const optionsLabel = document.createElement('label');
                optionsLabel.textContent = '選項：';
                
                const optionList = document.createElement('div');
                optionList.className = 'option-list';
                
                // 生成唯一的 radio 組名
                const radioName = `option-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                // 創建現有選項
                question.options.forEach((optionText, index) => {
                    const optionItem = document.createElement('div');
                    optionItem.className = 'option-item';
                    
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = radioName;
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
                    
                    // 添加刪除選項事件
                    removeButton.addEventListener('click', function() {
                        const optionItems = optionList.querySelectorAll('.option-item');
                        if (optionItems.length <= 2) {
                            alert('選擇題至少需要保留兩個選項');
                            return;
                        }
                        
                        optionItem.remove();
                        
                        // 更新選項值
                        const remainingOptions = optionList.querySelectorAll('.option-item');
                        remainingOptions.forEach((item, idx) => {
                            item.querySelector('input[type="radio"]').value = idx;
                        });
                    });
                    
                    optionItem.appendChild(radio);
                    optionItem.appendChild(input);
                    optionItem.appendChild(removeButton);
                    
                    optionList.appendChild(optionItem);
                });
                
                const addOptionButton = document.createElement('button');
                addOptionButton.type = 'button';
                addOptionButton.className = 'add-option';
                addOptionButton.textContent = '新增選項';
                
                // 添加新增選項事件
                addOptionButton.addEventListener('click', function() {
                    const optionItems = optionList.querySelectorAll('.option-item');
                    const newIndex = optionItems.length;
                    
                    const optionItem = document.createElement('div');
                    optionItem.className = 'option-item';
                    
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = radioName;
                    radio.value = newIndex;
                    
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'option-text';
                    input.placeholder = `選項 ${newIndex + 1}`;
                    input.required = true;
                    
                    const removeButton = document.createElement('button');
                    removeButton.type = 'button';
                    removeButton.className = 'remove-option';
                    removeButton.textContent = '刪除';
                    
                    // 添加刪除選項事件
                    removeButton.addEventListener('click', function() {
                        const currentOptions = optionList.querySelectorAll('.option-item');
                        if (currentOptions.length <= 2) {
                            alert('選擇題至少需要保留兩個選項');
                            return;
                        }
                        
                        optionItem.remove();
                        
                        // 更新選項值
                        const remainingOptions = optionList.querySelectorAll('.option-item');
                        remainingOptions.forEach((item, idx) => {
                            item.querySelector('input[type="radio"]').value = idx;
                        });
                    });
                    
                    optionItem.appendChild(radio);
                    optionItem.appendChild(input);
                    optionItem.appendChild(removeButton);
                    
                    optionList.appendChild(optionItem);
                });
                
                optionsGroup.appendChild(optionsLabel);
                optionsGroup.appendChild(optionList);
                optionsGroup.appendChild(addOptionButton);
                questionItem.appendChild(optionsGroup);
                
                // 分數設定
                const scoreGroup = document.createElement('div');
                scoreGroup.className = 'form-group';
                
                const scoreLabel = document.createElement('label');
                scoreLabel.textContent = '題目分數：';
                
                const scoreInput = document.createElement('input');
                scoreInput.type = 'number';
                scoreInput.className = 'question-score';
                scoreInput.min = '1';
                scoreInput.value = question.score;
                scoreInput.required = true;
                
                scoreGroup.appendChild(scoreLabel);
                scoreGroup.appendChild(scoreInput);
                questionItem.appendChild(scoreGroup);
                
                surveyQuestions.appendChild(questionItem);
            }
        });
    } else {
        // 如果沒有問題，添加一個提示
        const noQuestionsMessage = document.createElement('p');
        noQuestionsMessage.className = 'no-questions-message';
        noQuestionsMessage.textContent = '尚未添加任何問題，請點擊"新增問題"按鈕添加問題。';
        surveyQuestions.appendChild(noQuestionsMessage);
    }
    
    // 顯示模態框
    topicModal.style.display = 'block';
}

// 刪除主題
function deleteTopic(topicId) {
    console.log(`Deleting topic ID: ${topicId}`);
    
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
    console.log('Initializing group management');
    
    const addGroupButton = document.getElementById('add-group');
    const groupsBody = document.getElementById('groups-body');
    const groupModal = document.getElementById('group-modal');
    const groupForm = document.getElementById('group-form');
    const closeModal = groupModal ? groupModal.querySelector('.close') : null;
    
    if (!addGroupButton || !groupModal || !groupForm) {
        console.error('Missing required elements for group management');
        return;
    }
    
    // 載入群組資料
    loadGroups();
    
    // 新增群組按鈕
    addGroupButton.addEventListener('click', function() {
        console.log('Add group button clicked');
        
        // 重置表單
        groupForm.reset();
        document.getElementById('group-name').value = '';
        
        // 載入主題多選項
        loadTopicOptions();
        
        // 顯示模態框
        groupModal.style.display = 'block';
    });
    
    // 關閉模態框
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            groupModal.style.display = 'none';
        });
    }
    
    // 點擊模態框外部關閉
    window.addEventListener('click', function(event) {
        if (event.target === groupModal) {
            groupModal.style.display = 'none';
        }
    });
    
    // 提交群組表單
    groupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Group form submitted');
        
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
    console.log('Loading groups');
    
    const groupsBody = document.getElementById('groups-body');
    
    if (!groupsBody) {
        console.error('Group table body not found');
        return;
    }
    
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
    console.log(`Editing group: ${group.name}`);
    
    const groupModal = document.getElementById('group-modal');
    
    if (!groupModal) {
        console.error('Group modal not found');
        return;
    }
    
    // 填入現有資料
    document.getElementById('group-name').value = group.name;
    
    // 載入主題多選項
    loadTopicOptions(group.topics);
    
    // 顯示模態框
    groupModal.style.display = 'block';
}

// 刪除群組
function deleteGroup(groupName) {
    console.log(`Deleting group: ${groupName}`);
    
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
    console.log('Loading topic options for group form');
    
    const groupTopics = document.getElementById('group-topics');
    
    if (!groupTopics) {
        console.error('Group topics container not found');
        return;
    }
    
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
    console.log('Initializing bed management');
    
    const addBedButton = document.getElementById('add-bed');
    const bedsBody = document.getElementById('beds-body');
    const bedModal = document.getElementById('bed-modal');
    const bedForm = document.getElementById('bed-form');
    const closeModal = bedModal ? bedModal.querySelector('.close') : null;
    
    if (!addBedButton || !bedModal || !bedForm || !bedsBody) {
        console.error('Missing required elements for bed management');
        return;
    }
    
    // 載入病床資料
    loadBeds();
    
    // 新增病床按鈕
    addBedButton.addEventListener('click', function() {
        console.log('Add bed button clicked');
        
        // 重置表單
        bedForm.reset();
        document.getElementById('bed-number').value = '';
        
        // 載入群組選項
        loadGroupOptions();
        
        // 顯示模態框
        bedModal.style.display = 'block';
    });
    
    // 關閉模態框
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            bedModal.style.display = 'none';
        });
    }
    
    // 點擊模態框外部關閉
    window.addEventListener('click', function(event) {
        if (event.target === bedModal) {
            bedModal.style.display = 'none';
        }
    });
    
    // 提交病床表單
    bedForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Bed form submitted');
        
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
    console.log('Loading beds');
    
    const bedsBody = document.getElementById('beds-body');
    
    if (!bedsBody) {
        console.error('Beds table body not found');
        return;
    }
    
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
    console.log(`Editing bed: ${bed.bedNumber}`);
    
    const bedModal = document.getElementById('bed-modal');
    
    if (!bedModal) {
        console.error('Bed modal not found');
        return;
    }
    
    // 填入現有資料
    document.getElementById('bed-number').value = bed.bedNumber;
    
    // 載入群組選項
    loadGroupOptions(bed.groupName);
    
    // 顯示模態框
    bedModal.style.display = 'block';
}

// 刪除病床
function deleteBed(bedNumber) {
    console.log(`Deleting bed: ${bedNumber}`);
    
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
    console.log('Loading group options for bed form');
    
    const bedGroup = document.getElementById('bed-group');
    
    if (!bedGroup) {
        console.error('Bed group select not found');
        return;
    }
    
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
    console.log(`Syncing ${dataType} data to GitHub`);
    
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
