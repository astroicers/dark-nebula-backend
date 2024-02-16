import express from 'express';
import { KubeConfig, KubernetesObjectApi, CoreV1Api } from '@kubernetes/client-node';
import { exec } from 'child_process';
import fs from 'fs/promises';
import * as yaml from 'js-yaml';
import * as path from 'path';

const app = express();
const port = 3000;

async function initKubeClient() {
  const kc = new KubeConfig();
  kc.loadFromDefault();
  const client = KubernetesObjectApi.makeApiClient(kc);
  return client;
}


async function applyYaml(filePath: string) {
  const { kubernetesObjectApi, coreV1Api }  = await initKubeClient();
  const specString = await fs.readFile(filePath, 'utf8');
  const specs = yaml.loadAll(specString); // 假設您處理的是 V1Service 類型的對象

  for (const spec of specs) {
    if (spec.metadata && typeof spec.metadata.name === 'string') {
      try {
        await client.read(spec);
        console.log(`Resource ${spec.metadata.name} exists, updating...`);
        await client.patch(spec);
      } catch (error) {
        console.log(`Resource ${spec.metadata.name} does not exist, creating...`);
        await client.create(spec);
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
  const { coreV1Api } = await initKubeClient();
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
