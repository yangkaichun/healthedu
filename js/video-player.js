// 影片播放控制
const videoSection = document.getElementById('video-section');
const videoTitle = document.getElementById('video-title');
const videoElement = document.getElementById('education-video');
const surveyButtonContainer = document.getElementById('survey-button-container');
const showSurveyButton = document.getElementById('show-survey');
const surveySection = document.getElementById('survey-section');
let selectedTopicId = null;
let videoCompleted = false;

// 阻止影片快轉
function preventSeek() {
    // 注意：在使用嵌入的YouTube播放器時，這個功能可能無法直接使用
    // 控制權交給YouTube API的事件監聽
}

// 當影片播放完畢
function onVideoEnded() {
    console.log('Video ended');
    videoCompleted = true;
    surveyButtonContainer.style.display = 'block';
    
    // 儲存觀看狀態
    const patientCode = document.getElementById('qr-result').value;
    const topicData = JSON.parse(localStorage.getItem('topics')) || [];
    const selectedTopic = topicData.find(topic => topic.id === selectedTopicId);
    
    // 儲存到觀看紀錄
    const viewingRecords = JSON.parse(localStorage.getItem('viewingRecords')) || [];
    
    // 檢查是否已存在紀錄
    const existingRecordIndex = viewingRecords.findIndex(
        record => record.patientCode === patientCode && record.topicId === selectedTopicId
    );
    
    if (existingRecordIndex !== -1) {
        viewingRecords[existingRecordIndex].viewingStatus = 'completed';
    } else {
        viewingRecords.push({
            patientCode: patientCode,
            topicId: selectedTopicId,
            topicName: selectedTopic ? selectedTopic.name : `主題 ${selectedTopicId}`,
            viewingStatus: 'completed',
            surveyCompleted: false,
            surveyScore: null,
            totalPossibleScore: selectedTopic ? selectedTopic.totalScore : 0,
            percentageScore: null,
            nurseConfirmed: false,
            timestamp: new Date().toISOString()
        });
    }
    
    localStorage.setItem('viewingRecords', JSON.stringify(viewingRecords));
    
    // 嘗試將資料同步到 GitHub
    syncToGitHub('viewingRecords', viewingRecords);
}

// 載入影片
function loadVideo(topicId) {
    console.log(`Loading video for topic ID: ${topicId}`);
    selectedTopicId = topicId;
    videoCompleted = false;
    
    // 從localStorage獲取主題資料
    const topicData = JSON.parse(localStorage.getItem('topics')) || [];
    const selectedTopic = topicData.find(topic => topic.id === topicId);
    
    if (selectedTopic) {
        videoTitle.textContent = selectedTopic.name;
        
        // 清空舊的影片內容
        videoElement.innerHTML = '';
        
        // 創建新的iframe元素
        const iframe = document.createElement('iframe');
        iframe.width = "100%";
        iframe.height = "500";
        iframe.src = `https://www.youtube.com/embed/${selectedTopic.videoId}?enablejsapi=1&rel=0&controls=1`;
        iframe.frameBorder = "0";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.id = "youtube-player";
        
        // 將iframe添加到影片容器
        videoElement.appendChild(iframe);
        
        // 記錄觀看開始
        const patientCode = document.getElementById('qr-result').value;
        const viewingRecords = JSON.parse(localStorage.getItem('viewingRecords')) || [];
        
        // 檢查是否已存在紀錄
        const existingRecordIndex = viewingRecords.findIndex(
            record => record.patientCode === patientCode && record.topicId === topicId
        );
        
        if (existingRecordIndex !== -1) {
            viewingRecords[existingRecordIndex].viewingStatus = 'watching';
        } else {
            viewingRecords.push({
                patientCode: patientCode,
                topicId: topicId,
                topicName: selectedTopic.name,
                viewingStatus: 'watching',
                surveyCompleted: false,
                surveyScore: null,
                totalPossibleScore: selectedTopic.totalScore || 0,
                percentageScore: null,
                nurseConfirmed: false,
                timestamp: new Date().toISOString()
            });
        }
        
        localStorage.setItem('viewingRecords', JSON.stringify(viewingRecords));
        
        // 嘗試將資料同步到 GitHub
        syncToGitHub('viewingRecords', viewingRecords);
        
        // 載入YouTube API
        loadYouTubeAPI();
        
        // 顯示影片區段
        videoSection.style.display = 'block';
        surveyButtonContainer.style.display = 'none';
    } else {
        alert('無法載入影片，請重新選擇主題');
    }
}

// 載入YouTube API
function loadYouTubeAPI() {
    // 檢查API是否已載入
    if (window.YT && window.YT.Player) {
        initYouTubePlayer();
        return;
    }
    
    // 動態載入YouTube API
    if (!document.getElementById('youtube-api')) {
        window.onYouTubeIframeAPIReady = function() {
            initYouTubePlayer();
        };
        
        const tag = document.createElement('script');
        tag.id = 'youtube-api';
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
}

// 初始化YouTube播放器
function initYouTubePlayer() {
    if (document.getElementById('youtube-player')) {
        new YT.Player('youtube-player', {
            events: {
                'onStateChange': function(event) {
                    // 當影片結束時 (state = 0)
                    if (event.data === 0) {
                        onVideoEnded();
                    }
                }
            }
        });
    }
}

// 初始化按鈕事件
function initVideoControls() {
    if (showSurveyButton) {
        showSurveyButton.addEventListener('click', function() {
            if (videoCompleted) {
                videoSection.style.display = 'none';
                loadSurvey(selectedTopicId);
                surveySection.style.display = 'block';
            } else {
                alert('請先完整觀看影片再填寫問卷');
            }
        });
    }
}

// 同步資料到 GitHub
function syncToGitHub(dataType, data) {
    // 發送資料到 GitHub Action 儲存
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

// 從 GitHub 同步資料
async function syncFromGitHub() {
    const dataTypes = ['topics', 'groups', 'beds', 'viewingRecords', 'notificationEmails'];
    
    for (const dataType of dataTypes) {
        try {
            // 獲取 Netlify 環境變數
            const repoOwner = process.env.REPO_OWNER || '';
            const repoName = process.env.REPO_NAME || '';
            
            if (!repoOwner || !repoName) {
                console.log('未設定 GitHub 儲存庫資訊，跳過同步');
                return;
            }
            
            const response = await fetch(`https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/data/${dataType}.json`);
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem(dataType, JSON.stringify(data));
                console.log(`成功從 GitHub 同步 ${dataType} 資料`);
            }
        } catch (error) {
            console.error(`無法從 GitHub 同步 ${dataType} 資料:`, error);
        }
    }
}

// 當DOM載入完成時初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Video Player JS loaded');
    
    // 嘗試從 GitHub 同步資料
    syncFromGitHub();
    
    // 在首頁初始化主題選項
    if (document.getElementById('topic-grid') && !window.location.pathname.includes('bed-selection.html')) {
        initTopics();
    }
    
    initVideoControls();
});

// 初始化主題選項
function initTopics() {
    const topicGrid = document.getElementById('topic-grid');
    const submitTopicButton = document.getElementById('submit-topic');
    const qrResult = document.getElementById('qr-result');
    
    if (!topicGrid) return;
    
    // 清空現有主題
    topicGrid.innerHTML = '';
    
    // 從localStorage獲取主題資料
    let topicData = JSON.parse(localStorage.getItem('topics')) || [];
    
    // 如果沒有主題資料，則創建默認主題
    if (topicData.length === 0) {
        topicData = Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            name: `衛教主題 ${i + 1}`,
            videoId: 'dQw4w9WgXcQ',  // 預設Youtube影片ID
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
        localStorage.setItem('topics', JSON.stringify(topicData));
    }
    
    // 檢查 QR 碼是否對應到病床號碼
    const qrCode = qrResult.value.trim();
    if (qrCode) {
        const beds = JSON.parse(localStorage.getItem('beds')) || [];
        const matchingBed = beds.find(bed => bed.bedNumber === qrCode);
        
        if (matchingBed) {
            // 找到對應的病床，只顯示該病床群組的主題
            const groups = JSON.parse(localStorage.getItem('groups')) || [];
            const bedGroup = groups.find(group => group.name === matchingBed.groupName);
            
            if (bedGroup && bedGroup.topics && bedGroup.topics.length > 0) {
                // 過濾只顯示群組內的主題
                const filteredTopics = topicData.filter(topic => bedGroup.topics.includes(topic.id));
                displayTopics(filteredTopics);
                return;
            }
        }
    }
    
    // 如果沒有找到對應的病床或群組，顯示所有主題
    displayTopics(topicData);
    
    // 內部函數：顯示主題列表
    function displayTopics(topics) {
        if (topics.length === 0) {
            const noTopicsMsg = document.createElement('p');
            noTopicsMsg.className = 'no-topics-message';
            noTopicsMsg.textContent = '沒有可用的衛教主題';
            topicGrid.appendChild(noTopicsMsg);
            submitTopicButton.disabled = true;
            return;
        }
        
        // 按編號排序
        topics.sort((a, b) => a.id - b.id);
        
        // 顯示主題選項
        topics.forEach(topic => {
            const topicItem = document.createElement('div');
            topicItem.className = 'topic-item';
            topicItem.dataset.id = topic.id;
            topicItem.textContent = topic.name;
            
            topicItem.addEventListener('click', function() {
                // 移除其他選項的選中狀態
                document.querySelectorAll('.topic-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // 添加選中狀態
                this.classList.add('selected');
                
                // 啟用提交按鈕
                submitTopicButton.disabled = false;
            });
            
            topicGrid.appendChild(topicItem);
        });
    }
    
    // 提交主題選擇
    if (submitTopicButton) {
        submitTopicButton.addEventListener('click', function() {
            const selectedTopic = document.querySelector('.topic-item.selected');
            
            if (selectedTopic) {
                const topicId = parseInt(selectedTopic.dataset.id);
                document.getElementById('topic-section').style.display = 'none';
                loadVideo(topicId);
            }
        });
    }
}

// 病床選擇頁面特有的主題載入功能
function loadBedTopics(bedCode) {
    const topicGrid = document.getElementById('topic-grid');
    const submitTopicButton = document.getElementById('submit-topic');
    
    if (!topicGrid) return;
    
    // 清空現有主題
    topicGrid.innerHTML = '';
    
    // 從localStorage獲取病床資料
    const beds = JSON.parse(localStorage.getItem('beds')) || [];
    const groups = JSON.parse(localStorage.getItem('groups')) || [];
    const topicData = JSON.parse(localStorage.getItem('topics')) || [];
    
    // 尋找床號對應的群組
    const matchingBed = beds.find(bed => bed.bedNumber === bedCode);
    
    if (matchingBed) {
        const bedGroup = groups.find(group => group.name === matchingBed.groupName);
        
        if (bedGroup && bedGroup.topics && bedGroup.topics.length > 0) {
            // 過濾並顯示允許的主題
            const filteredTopics = topicData.filter(topic => bedGroup.topics.includes(topic.id));
            
            if (filteredTopics.length === 0) {
                const noTopicsMsg = document.createElement('p');
                noTopicsMsg.className = 'no-topics-message';
                noTopicsMsg.textContent = '此病床沒有可用的衛教主題';
                topicGrid.appendChild(noTopicsMsg);
                submitTopicButton.disabled = true;
                return;
            }
            
            // 按編號排序
            filteredTopics.sort((a, b) => a.id - b.id);
            
            // 顯示主題選項
            filteredTopics.forEach(topic => {
                const topicItem = document.createElement('div');
                topicItem.className = 'topic-item';
                topicItem.dataset.id = topic.id;
                topicItem.textContent = topic.name;
                
                topicItem.addEventListener('click', function() {
                    // 移除其他選項的選中狀態
                    document.querySelectorAll('.topic-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    
                    // 添加選中狀態
                    this.classList.add('selected');
                    
                    // 啟用提交按鈕
                    submitTopicButton.disabled = false;
                });
                
                topicGrid.appendChild(topicItem);
            });
            
            // 顯示主題選擇區域
            document.getElementById('topic-section').style.display = 'block';
            
            // 提交主題選擇
            submitTopicButton.addEventListener('click', function() {
                const selectedTopic = document.querySelector('.topic-item.selected');
                
                if (selectedTopic) {
                    const topicId = parseInt(selectedTopic.dataset.id);
                    document.getElementById('topic-section').style.display = 'none';
                    loadVideo(topicId);
                }
            });
        } else {
            // 無可用主題
            const noTopicsMsg = document.createElement('p');
            noTopicsMsg.className = 'no-topics-message';
            noTopicsMsg.textContent = '此病床群組未設定衛教主題';
            topicGrid.appendChild(noTopicsMsg);
            submitTopicButton.disabled = true;
        }
    } else {
        alert(`找不到病床 ${bedCode} 的設定，請確認病床號碼是否正確`);
    }
}

// 手動輸入病床號碼處理
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    const qrResult = document.getElementById('qr-result');
    
    if (qrResult) {
        qrResult.addEventListener('change', function() {
            // 當使用者手動輸入 QR 碼後，重新初始化主題
            initTopics();
        });
    }
}
