// 問卷功能
const surveyForm = document.getElementById('survey-form');
const completionSection = document.getElementById('completion-section');
const returnHomeButton = document.getElementById('return-home');

// 載入問卷
function loadSurvey(topicId) {
    if (!surveyForm) return;
    
    // 清空現有問卷內容
    surveyForm.innerHTML = '';
    
    // 從 localStorage 獲取主題資料
    const topics = JSON.parse(localStorage.getItem('topics')) || [];
    const selectedTopic = topics.find(topic => topic.id === topicId);
    
    if (!selectedTopic || !selectedTopic.questions || selectedTopic.questions.length === 0) {
        // 如果沒有找到主題或主題沒有問題，顯示錯誤訊息
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = '此主題尚未設定問卷';
        surveyForm.appendChild(errorDiv);
        return;
    }
    
    // 添加問卷標題
    const titleDiv = document.createElement('div');
    titleDiv.className = 'survey-title';
    titleDiv.innerHTML = `<h3>${selectedTopic.name} - 衛教評估問卷</h3>
                         <p>總分: ${selectedTopic.totalScore}分</p>`;
    surveyForm.appendChild(titleDiv);
    
    // 生成問卷內容
    selectedTopic.questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'survey-question';
        questionDiv.dataset.score = question.score;
        
        // 問題標題
        const questionTitle = document.createElement('div');
        questionTitle.className = 'question-title';
        questionTitle.innerHTML = `<strong>問題 ${index + 1}</strong> (${question.score}分): ${question.text}`;
        questionDiv.appendChild(questionTitle);
        
        if (question.type === 'truefalse') {
            // 是非題
            const radioGroup = document.createElement('div');
            radioGroup.className = 'radio-group';
            
            const trueOption = document.createElement('div');
            trueOption.className = 'radio-option';
            
            const trueRadio = document.createElement('input');
            trueRadio.type = 'radio';
            trueRadio.name = `question_${index}`;
            trueRadio.id = `question_${index}_true`;
            trueRadio.value = 'true';
            trueRadio.required = true;
            
            const trueLabel = document.createElement('label');
            trueLabel.htmlFor = `question_${index}_true`;
            trueLabel.textContent = '是';
            
            trueOption.appendChild(trueRadio);
            trueOption.appendChild(trueLabel);
            radioGroup.appendChild(trueOption);
            
            const falseOption = document.createElement('div');
            falseOption.className = 'radio-option';
            
            const falseRadio = document.createElement('input');
            falseRadio.type = 'radio';
            falseRadio.name = `question_${index}`;
            falseRadio.id = `question_${index}_false`;
            falseRadio.value = 'false';
            falseRadio.required = true;
            
            const falseLabel = document.createElement('label');
            falseLabel.htmlFor = `question_${index}_false`;
            falseLabel.textContent = '否';
            
            falseOption.appendChild(falseRadio);
            falseOption.appendChild(falseLabel);
            radioGroup.appendChild(falseOption);
            
            questionDiv.appendChild(radioGroup);
        } else if (question.type === 'choice') {
            // 選擇題
            const radioGroup = document.createElement('div');
            radioGroup.className = 'radio-group';
            
            question.options.forEach((option, optionIndex) => {
                const radioOption = document.createElement('div');
                radioOption.className = 'radio-option';
                
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `question_${index}`;
                radio.id = `question_${index}_option_${optionIndex}`;
                radio.value = optionIndex.toString();
                radio.required = true;
                
                const label = document.createElement('label');
                label.htmlFor = `question_${index}_option_${optionIndex}`;
                label.textContent = option;
                
                radioOption.appendChild(radio);
                radioOption.appendChild(label);
                radioGroup.appendChild(radioOption);
            });
            
            questionDiv.appendChild(radioGroup);
        }
        
        surveyForm.appendChild(questionDiv);
    });
    
    // 添加送出按鈕
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.id = 'submit-survey';
    submitButton.textContent = '送出問卷';
    
    buttonGroup.appendChild(submitButton);
    surveyForm.appendChild(buttonGroup);
    
    // 問卷提交處理
    surveyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 檢查所有問題是否已回答
        const unansweredQuestions = document.querySelectorAll('.survey-question').length - 
                                   document.querySelectorAll('.survey-question input:checked').length;
        
        if (unansweredQuestions > 0) {
            alert('請回答所有問題');
            return;
        }
        
        // 計算得分
        let userScore = 0;
        let totalScore = 0;
        
        selectedTopic.questions.forEach((question, index) => {
            const score = parseInt(question.score);
            totalScore += score;
            
            if (question.type === 'truefalse') {
                const selectedAnswer = document.querySelector(`input[name="question_${index}"]:checked`).value === 'true';
                if (selectedAnswer === question.correctAnswer) {
                    userScore += score;
                }
            } else if (question.type === 'choice') {
                const selectedIndex = parseInt(document.querySelector(`input[name="question_${index}"]:checked`).value);
                if (selectedIndex === question.correctAnswerIndex) {
                    userScore += score;
                }
            }
        });
        
        // 計算百分比得分
        const percentageScore = Math.round((userScore / totalScore) * 100);
        
        // 取得病人代碼和主題
        const patientCode = document.getElementById('qr-result').value;
        
        // 儲存問卷結果
        const viewingRecords = JSON.parse(localStorage.getItem('viewingRecords')) || [];
        
        // 檢查是否已存在紀錄
        const existingRecordIndex = viewingRecords.findIndex(
            record => record.patientCode === patientCode && record.topicId === topicId
        );
        
        if (existingRecordIndex !== -1) {
            viewingRecords[existingRecordIndex].surveyCompleted = true;
            viewingRecords[existingRecordIndex].surveyScore = userScore;
            viewingRecords[existingRecordIndex].totalPossibleScore = totalScore;
            viewingRecords[existingRecordIndex].percentageScore = percentageScore;
            viewingRecords[existingRecordIndex].surveyTimestamp = new Date().toISOString();
        }
        
        localStorage.setItem('viewingRecords', JSON.stringify(viewingRecords));
        
        // 同步到GitHub並發送Email通知
        syncSurveyToGitHub(viewingRecords[existingRecordIndex]);
        
        // 顯示完成訊息
        surveySection.style.display = 'none';
        completionSection.style.display = 'block';
    });
}

// 同步問卷到GitHub並發送Email通知
function syncSurveyToGitHub(surveyData) {
    // 發送資料到GitHub Action處理
    fetch('/.netlify/functions/submit-survey', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyData),
    }).catch(error => {
        console.error('提交問卷失敗:', error);
    });
}

// 初始化返回首頁按鈕
function initSurveyControls() {
    if (returnHomeButton) {
        returnHomeButton.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
}

// 當DOM載入完成時初始化
document.addEventListener('DOMContentLoaded', initSurveyControls);
