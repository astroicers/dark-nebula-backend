import express from 'express';
import * as k8s from '@kubernetes/client-node';
import { exec } from 'child_process';
import fs from 'fs/promises';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { Api } from './myApi';
const app = express();
const port = 3000;

async function initKubeClients() {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
  return k8sApi;
}

async function fetchArchivedWorkflows() {
  const response = await fetch('/api/v1/archived-workflows', {
      method: 'GET'
      // 根據需要添加額外的請求頭或參數
  });
  const data = await response.json();
  return data; // 根據 APIV1ArchivedWorkflows 類型處理和返回數據
}

// upper part have some error, need to fix

// 路由設定
app.get('/clone-repo', async (req, res) => {
  const repoUrl = 'https://github.com/astroicers/dark-nebula.git';
  const cloneDir = '/app/src/dark-nebula';

  exec(`git clone ${repoUrl} ${cloneDir}`, (error, stdout, stderr) => {
    if (error) {
      console.error('exec error:', error);
      return res.status(500).send('Failed to clone repository.');
    }
    console.log('stdout:', stdout);
    console.error('stderr:', stderr);
    res.send('Repository cloned successfully.');
  });
});

app.get('/list-pods', async (req, res) => {
  const k8sApi = await initKubeClients();
  try {
    const podsRes = await k8sApi.listNamespacedPod('default');
    console.log(podsRes.body);
    res.json(podsRes.body.items.map((svc: any) => ({ name: svc.metadata?.name, labels: svc.metadata?.labels }))); // 為 svc 指定類型 V1Service
  } catch (error) {
    console.error('Error listing services:', error);
    res.status(500).send('Error listing services in default namespace.');
  }
});

app.get('/list-services', async (req, res) => {
  const k8sApi = await initKubeClients();
  try {
    const services = await k8sApi.listNamespacedService('default');
    res.json(services.body.items.map((svc: any) => ({ name: svc.metadata?.name, labels: svc.metadata?.labels }))); // 為 svc 指定類型 V1Service
  } catch (error) {
    console.error('Error listing services:', error);
    res.status(500).send('Error listing services in default namespace.');
  }
});

app.get('/create-workflowtemplate', async (req, res) => {
  const argo = new Api();
  try {
    // Prepare for testing
    const body = {};
    const workflowTemplate = await argo.api.workflowTemplateServiceCreateWorkflowTemplate('default', body);
    res.json(workflowTemplate);
  } catch (error) {
    console.error('Error creating workflow template:', error);
    res.status(500).send('Error creating workflow template.');
  }
});

app.get('/', (req, res) => {
  res.send('dark-nebula-backend');
});

app.listen(port, () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
