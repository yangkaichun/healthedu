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
    let previousTime = 0;
    
    videoElement.addEventListener('timeupdate', function() {
        if (videoElement.currentTime - previousTime > 1) {
            // 使用者嘗試跳轉，將時間重置回上一個有效位置
            videoElement.currentTime = previousTime;
        } else {
            previousTime = videoElement.currentTime;
        }
    });
}

// 當影片播放完畢
function onVideoEnded() {
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
    selectedTopicId = topicId;
    videoCompleted = false;
    
    // 從localStorage獲取主題資料
    const topicData = JSON.parse(localStorage.getItem('topics')) || [];
    const selectedTopic = topicData.find(topic => topic.id === topicId);
    
    if (selectedTopic) {
        videoTitle.textContent = selectedTopic.name;
        // 使用 YouTube Embed API
        videoElement.innerHTML = `
            <iframe 
                id="youtube-player" 
                width="100%" 
                height="500" 
                src="https://www.youtube.com/embed/${selectedTopic.videoId}?enablejsapi=1&controls=0&disablekb=1&rel=0" 
                frameborder="0" 
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
        
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
                nurseConfirmed: false,
                timestamp: new Date().toISOString()
            });
        }
        
        localStorage.setItem('viewingRecords', JSON.stringify(viewingRecords));
        
        // 嘗試將資料同步到 GitHub
        syncToGitHub('viewingRecords', viewingRecords);
        
        // YouTube API 載入完成後初始化
        window.onYouTubeIframeAPIReady = function() {
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
        };
        
        // 動態載入 YouTube API
        if (!document.getElementById('youtube-api')) {
            const tag = document.createElement('script');
            tag.id = 'youtube-api';
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
        
        // 顯示影片區段
        videoSection.style.display = 'block';
        surveyButtonContainer.style.display = 'none';
    } else {
        alert('無法載入影片，請重新選擇主題');
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

// 當DOM載入完成時初始化
document.addEventListener('DOMContentLoaded', function() {
    // 在首頁初始化主題選項
    if (document.getElementById('topic-grid') && !window.location.pathname.includes('bed-selection.html')) {
        initTopics();
    }
    
    initVideoControls();
    preventSeek();
});

// 初始化主題選項
function initTopics() {
    const topicGrid = document.getElementById('topic-grid');
    const submitTopicButton = document.getElementById('submit-topic');
    
    // 從localStorage獲取主題資料
    let topicData = JSON.parse(localStorage.getItem('topics')) || [];
    
    // 如果沒有主題資料，則創建默認主題
    if (topicData.length === 0) {
        topicData = Array.from({ length: 30 }, (_, i) => ({
            id: i + 1,
            name: `衛教主題 ${i + 1}`,
            videoId: 'dQw4w9WgXcQ'  // 預設Youtube影片ID
        }));
        localStorage.setItem('topics', JSON.stringify(topicData));
    }
    
    // 顯示主題選項
    topicData.forEach(topic => {
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
    
    // 提交主題選擇
    submitTopicButton.addEventListener('click', function() {
        const selectedTopic = document.querySelector('.topic-item.selected');
        
        if (selectedTopic) {
            const topicId = parseInt(selectedTopic.dataset.id);
            document.getElementById('topic-section').style.display = 'none';
            loadVideo(topicId);
        }
    });
}

// 病床選擇頁面特有的主題載入功能
function loadBedTopics(bedCode) {
    const topicGrid = document.getElementById('topic-grid');
    const submitTopicButton = document.getElementById('submit-topic');
    
    if (!topicGrid) return;
    
    // 清空現有主題
    topicGrid.innerHTML = '';
    
    // 從localStorage獲取病床群組資料
    const groupData = JSON.parse(localStorage.getItem('bedGroups')) || [];
    const topicData = JSON.parse(localStorage.getItem('topics')) || [];
    
    // 尋找床號對應的群組
    const matchingGroups = groupData.filter(group => 
        group.beds.some(bed => bed.toString() === bedCode.toString())
    );
    
    if (matchingGroups.length > 0) {
        // 取得所有相關主題ID
        const allowedTopicIds = new Set();
        matchingGroups.forEach(group => {
            group.topics.forEach(topicId => {
                allowedTopicIds.add(topicId);
            });
        });
        
        // 過濾並顯示允許的主題
        topicData.filter(topic => allowedTopicIds.has(topic.id)).forEach(topic => {
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
        alert(`找不到病床 ${bedCode} 對應的衛教主題，請確認病床號碼是否正確`);
    }
}
