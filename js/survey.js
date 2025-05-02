// 問卷功能
const surveyForm = document.getElementById('survey-form');
const completionSection = document.getElementById('completion-section');
const returnHomeButton = document.getElementById('return-home');

// 載入問卷
function loadSurvey(topicId) {
    if (!surveyForm) return;
    
    // 清空現有問卷內容
    surveyForm.innerHTML = '';
    
    // 創建默認問題 (實際應用中應從資料庫加載)
    const questions = [
        {
            id: 1,
            text: '您對此衛教影片的內容理解程度如何？',
            options: ['非常理解', '大部分理解', '一般理解', '有些不理解', '完全不理解']
        },
        {
            id: 2,
            text: '這個衛教內容對您的幫助程度如何？',
            options: ['非常有幫助', '有些幫助', '一般', '幫助不大', '完全沒幫助']
        },
        {
            id: 3,
            text: '您對影片中提到的健康建議執行的信心程度如何？',
            options: ['非常有信心', '有些信心', '一般', '信心不足', '完全沒信心']
        },
        {
            id: 4,
            text: '您有哪些問題想進一步詢問護理師？',
            isTextarea: true
        }
    ];
    
    // 生成問卷內容
    questions.forEach(question => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'survey-question';
        
        const questionText = document.createElement('p');
        questionText.textContent = question.text;
        questionDiv.appendChild(questionText);
        
        if (question.isTextarea) {
            // 文字輸入問題
            const textarea = document.createElement('textarea');
            textarea.name = `question_${question.id}`;
            textarea.rows = 4;
            textarea.style.width = '100%';
            questionDiv.appendChild(textarea);
        } else {
            // 選擇題
            const radioGroup = document.createElement('div');
            radioGroup.className = 'radio-group';
            
            question.options.forEach((option, index) => {
                const radioOption = document.createElement('div');
                radioOption.className = 'radio-option';
                
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `question_${question.id}`;
                radio.id = `question_${question.id}_option_${index}`;
                radio.value = index + 1;
                
                const label = document.createElement('label');
                label.htmlFor = `question_${question.id}_option_${index}`;
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
        
        // 檢查必答問題是否已回答
        const requiredQuestions = [1, 2, 3]; // 假設前三題為必答
        let allAnswered = true;
        
        for (const qId of requiredQuestions) {
            const answered = document.querySelector(`input[name="question_${qId}"]:checked`);
            if (!answered) {
                allAnswered = false;
                break;
            }
        }
        
        if (!allAnswered) {
            alert('請回答所有必答問題');
            return;
        }
        
        // 計算問卷分數 (假設計分方式為選項值的總和)
        let score = 0;
        for (const qId of requiredQuestions) {
            const selectedOption = document.querySelector(`input[name="question_${qId}"]:checked`);
            score += parseInt(selectedOption.value);
        }
        
        // 取得病人代碼和主題
        const patientCode = document.getElementById('qr-result').value;
        const topicData = JSON.parse(localStorage.getItem('topics')) || [];
        const selectedTopic = topicData.find(topic => topic.id === topicId);
        
        // 儲存問卷結果
        const viewingRecords = JSON.parse(localStorage.getItem('viewingRecords')) || [];
        
        // 檢查是否已存在紀錄
        const existingRecordIndex = viewingRecords.findIndex(
            record => record.patientCode === patientCode && record.topicId === topicId
        );
        
        if (existingRecordIndex !== -1) {
            viewingRecords[existingRecordIndex].surveyCompleted = true;
            viewingRecords[existingRecordIndex].surveyScore = score;
            viewingRecords[existingRecordIndex].surveyTimestamp = new Date().toISOString();
            
            // 收集文字問題的回答
            const feedback = document.querySelector('textarea[name="question_4"]').value;
            viewingRecords[existingRecordIndex].feedback = feedback;
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
