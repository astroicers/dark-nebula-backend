import express from 'express';
import { KubeConfig, KubernetesObjectApi, CoreV1Api, CustomObjectsApi } from '@kubernetes/client-node';
import { exec } from 'child_process';
import fs from 'fs/promises';
import * as yaml from 'js-yaml';
import * as path from 'path';

const app = express();
const port = 3000;

async function initKubeClients() {
  const kc = new KubeConfig();
  kc.loadFromDefault();
  const kubernetesObjectApi = KubernetesObjectApi.makeApiClient(kc);
  const coreV1Api = kc.makeApiClient(CoreV1Api);
  const customObjectsApi = kc.makeApiClient(CustomObjectsApi);
  return { kubernetesObjectApi, coreV1Api, customObjectsApi };
}


async function applyYaml(filePath: string) {
  const { customObjectsApi } = await initKubeClients();

  const specString = await fs.readFile(filePath, 'utf8');
  const specs = yaml.loadAll(specString);

  for (const spec of specs) {
    const metadata = (spec as any).metadata;
    if (metadata && typeof metadata.name === 'string') {
      const group = "argoproj.io"; // 替換為您的資源組
      const version = "v1alpha1"; // 替換為您的資源版本
      const namespace = metadata.namespace || "default"; // 確保 spec 包含 namespace 或提供預設值
      const plural = "workflowtemplates"; // 替換為您的資源複數形式
      const name = metadata.name;

      try {
        // 嘗試獲取資源來確定是否存在
        await customObjectsApi.getNamespacedCustomObject(group, version, namespace, plural, name);
        console.log(`Resource ${name} exists, updating...`);
        // 準備 PATCH 請求體和 Content-Type
        const patchBody = [{ op: "replace", path: "/spec", value: (spec as any).spec }]; // 以 JSON Patch 為例
        await customObjectsApi.patchNamespacedCustomObject(group, version, namespace, plural, name, patchBody, undefined, undefined, undefined, {
          headers: { 'Content-Type': 'application/json-patch+json' } // 指定 Content-Type
        });
      } catch (error) {
        console.log(`Resource ${name} does not exist, creating...`);
        await customObjectsApi.createNamespacedCustomObject(group, version, namespace, plural, spec as object);
      }
    }
  }
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

app.get('/apply-workflows', async (req, res) => {
  const workflowFolderPath = '/app/src/dark-nebula/workflows/subdomain-ping-check/';
  try {
    const files = await fs.readdir(workflowFolderPath);
    for (const file of files) {
      await applyYaml(path.join(workflowFolderPath, file));
    }
    res.send('Workflows applied successfully.');
  } catch (error) {
    console.error('Error applying workflows:', error);
    res.status(500).send('Error applying workflows.');
  }
});

app.get('/list-services', async (req, res) => {
  const { coreV1Api } = await initKubeClients();
  try {
    const services = await coreV1Api.listNamespacedService('default');
    res.json(services.body.items.map((svc: any) => ({ name: svc.metadata?.name, labels: svc.metadata?.labels }))); // 為 svc 指定類型 V1Service
  } catch (error) {
    console.error('Error listing services:', error);
    res.status(500).send('Error listing services in default namespace.');
  }
});

app.get('/', (req, res) => {
  res.send('dark-nebula-backend');
});

app.listen(port, () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
