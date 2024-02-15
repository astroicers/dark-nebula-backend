import express from 'express';
import * as k8s from '@kubernetes/client-node';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const app = express();
const port = 3000;

const kc = new k8s.KubeConfig();
kc.loadFromCluster();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const applyYaml = async (filePath: string) => {
  const yamlContent = fs.readFileSync(filePath, 'utf8');
  const json = yaml.load(yamlContent) as k8s.KubernetesObject;
  const { kind, apiVersion } = json;
  const spec = json as k8s.KubernetesObject;

  const client = k8s.KubernetesObjectApi.makeApiClient(kc);
  spec.apiVersion = apiVersion;
  spec.kind = kind;

  try {
      await client.create(spec);
      console.log(`${kind} created successfully`);
  } catch (err) {
      console.error(`Failed to create ${kind}: ${err}`);
  }
};

app.get('/clone-repo', (req, res) => {
  const repoUrl = 'https://github.com/astroicers/dark-nebula.git'; // 修改為您的專案地址
  const cloneDir = '/app/src/dark-nebula'; // 指定克隆目錄

  exec(`git clone ${repoUrl} ${cloneDir}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send('Failed to clone repository.');
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    res.send('Repository cloned successfully.');
  });
});

// debugging
// fix the error of "k8s api call failed."
app.get('/apply-workflows', async (req, res) => {
  const workflowFolderPath = '/app/src/dark-nebula/workflows/subdomain-ping-check/';
  const files = fs.readdirSync(workflowFolderPath);

  try {
    for (const file of files) {
      const filePath = path.join(workflowFolderPath, file);
      // if (filePath !== `${workflowFolderPath}subdomain-ping-check.yaml`) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const resources = yaml.loadAll(fileContents) as k8s.KubernetesObject[];
      for (const resource of resources) {
        // 使用適當的API方法應用資源
        // 這裡僅示範，請根據實際情況調整
        applyYaml(resource as any)
      }
    }
    res.send('Workflows applied successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error applying workflows.');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
