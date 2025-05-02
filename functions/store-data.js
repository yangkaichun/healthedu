// functions/store-data.js
const axios = require('axios');

exports.handler = async function(event, context) {
    try {
        // 解析請求內容
        const payload = JSON.parse(event.body);
        const { type, data } = payload;
        
        // 發送到 GitHub Repository Dispatch Event
        const github_token = process.env.GITHUB_TOKEN;
        const repo_owner = process.env.REPO_OWNER;
        const repo_name = process.env.REPO_NAME;
        
        await axios.post(
            `https://api.github.com/repos/${repo_owner}/${repo_name}/dispatches`,
            {
                event_type: 'store-data',
                client_payload: {
                    type: type,
                    data: JSON.stringify(data)
                }
            },
            {
                headers: {
                    'Authorization': `token ${github_token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Data stored successfully' })
        };
    } catch (error) {
        console.error('儲存資料錯誤:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error storing data', error: error.message })
        };
    }
};
