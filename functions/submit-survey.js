// functions/submit-survey.js
const axios = require('axios');
const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
    try {
        // 解析請求內容
        const surveyData = JSON.parse(event.body);
        
        // 儲存資料到 GitHub
        const github_token = process.env.GITHUB_TOKEN;
        const repo_owner = process.env.REPO_OWNER;
        const repo_name = process.env.REPO_NAME;
        
        // 先獲取現有的記錄
        let viewingRecords = [];
        try {
            const response = await axios.get(
                `https://raw.githubusercontent.com/${repo_owner}/${repo_name}/main/data/viewingRecords.json`,
                {
                    headers: {
                        'Accept': 'application/vnd.github.v3.raw'
                    }
                }
            );
            
            if (response.status === 200) {
                viewingRecords = JSON.parse(response.data);
            }
        } catch (error) {
            // 可能是第一次儲存，忽略錯誤
            console.log('無法獲取現有記錄，創建新記錄');
        }
        
        // 更新或添加新記錄
        const existingIndex = viewingRecords.findIndex(
            record => record.patientCode === surveyData.patientCode && record.topicId === surveyData.topicId
        );
        
        if (existingIndex !== -1) {
            viewingRecords[existingIndex] = {
                ...viewingRecords[existingIndex],
                ...surveyData
            };
        } else {
            viewingRecords.push(surveyData);
        }
        
        // 發送更新後的資料到 GitHub
        await axios.post(
            `https://api.github.com/repos/${repo_owner}/${repo_name}/dispatches`,
            {
                event_type: 'store-data',
                client_payload: {
                    type: 'viewingRecords',
                    data: JSON.stringify(viewingRecords)
                }
            },
            {
                headers: {
                    'Authorization': `token ${github_token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        // 獲取通知 Email 列表
        let notificationEmails = [];
        try {
            const emailResponse = await axios.get(
                `https://raw.githubusercontent.com/${repo_owner}/${repo_name}/main/data/notificationEmails.json`,
                {
                    headers: {
                        'Accept': 'application/vnd.github.v3.raw'
                    }
                }
            );
            
            if (emailResponse.status === 200) {
                notificationEmails = JSON.parse(emailResponse.data);
            }
        } catch (error) {
            console.log('無法獲取 Email 通知列表');
        }
        
        // 發送 Email 通知
        const enabledEmails = notificationEmails.filter(item => item.enabled).map(item => item.email);
        
        if (enabledEmails.length > 0) {
            // 設定 Email 服務
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            
            // 準備 Email 內容
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: enabledEmails.join(','),
                subject: '新衛教問卷已提交',
                html: `
                    <h2>新衛教問卷已提交</h2>
                    <p><strong>病人代碼:</strong> ${surveyData.patientCode}</p>
                    <p><strong>衛教主題:</strong> ${surveyData.topicName}</p>
                    <p><strong>問卷分數:</strong> ${surveyData.surveyScore}</p>
                    <p><strong>提交時間:</strong> ${new Date(surveyData.surveyTimestamp).toLocaleString()}</p>
                    ${surveyData.feedback ? `<p><strong>意見反饋:</strong> ${surveyData.feedback}</p>` : ''}
                    <p>請登入系統查看詳細資料。</p>
                `
            };
            
            // 發送 Email
            try {
                await transporter.sendMail(mailOptions);
                console.log('Email 通知已發送');
            } catch (emailError) {
                console.error('發送 Email 通知失敗:', emailError);
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Survey submitted successfully' })
        };
    } catch (error) {
        console.error('提交問卷錯誤:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error submitting survey', error: error.message })
        };
    }
};
