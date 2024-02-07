import express from 'express';
import { createClient } from 'redis';
import axios, { AxiosError } from 'axios'; // 導入AxiosError類型

const app = express();
const port = 3000;

// Redis客戶端配置
const redisClient = createClient({
  url: 'redis://192.168.50.133:30001', // 更改為您的Redis伺服器URL
});

// 監聽Redis連接錯誤
redisClient.on('error', (err) => {
  console.error('Redis連接錯誤:', err);
});

redisClient.connect();

// Argo Workflow API配置
const argoWorkflowApiUrl = 'http://192.168.50.133:2746/api/v1/workflows/default'; // 更改為您的Argo Workflow API URL和namespace

app.get('/', (req, res) => {
    res.send('<h1>Welcome to Dark Nebula.</h1>');
});

// 新增路由以觸發Workflow執行
app.get('/trigger-workflow', async (req, res) => {
  try {
    const key = 'web-fingerprint-scanning-6x8cj-wappalyzer-uploader-2821792403'; // 更改為您要從Redis讀取的鍵
    const value = await redisClient.get(key);
    
    if (value === null) {
      res.status(404).send('無法從Redis找到值');
      return;
    }

    const workflowPayload = {
      metadata: {
        generateName: 'network-scanning-', // 更改為您的Workflow名稱
      },
      spec: {
        arguments: {
          parameters: [
            {
              name: 'base-subdomain',
              value: 'www.yahoo.com',
            },
          ],
        },
      },
    };

    const response = await axios.post(argoWorkflowApiUrl, workflowPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('Workflow API 響應:', response.data);
    res.send('Workflow已成功啟動');
  } catch (error) {
    if (error && typeof error === 'object') {
      const axiosError = error as AxiosError; // 透過類型斷言指定錯誤類型為AxiosError
      console.error('發送到Argo Workflow API的請求錯誤:', axiosError.response ? axiosError.response.data : axiosError.message);
    } else {
      console.error('發送到Argo Workflow API的請求錯誤:', error);
    }
    res.status(500).send('執行Workflow時發生錯誤');
  }
});

app.listen(port, () => {
    console.log(`Server running on http://192.168.50.133:${port}`);
});
