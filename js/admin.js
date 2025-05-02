// 修正 admin.js 文件中的問卷設定部分

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
        const questionTypeDialog = document.createElement('div');
        questionTypeDialog.className = 'question-type-dialog';
        questionTypeDialog.innerHTML = `
            <div class="question-type-dialog-content">
                <h4>選擇問題類型</h4>
                <button type="button" data-type="truefalse">是非題</button>
                <button type="button" data-type="choice">選擇題</button>
                <button type="button" class="cancel-button">取消</button>
            </div>
        `;
        
        document.body.appendChild(questionTypeDialog);
        
        // 處理問題類型選擇
        questionTypeDialog.addEventListener('click', function(e) {
            if (e.target.dataset.type) {
                addQuestion(e.target.dataset.type);
                document.body.removeChild(questionTypeDialog);
            } else if (e.target.classList.contains('cancel-button')) {
                document.body.removeChild(questionTypeDialog);
            }
        });
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
    const surveyQuestions = document.getElementById('survey-questions');
    
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
