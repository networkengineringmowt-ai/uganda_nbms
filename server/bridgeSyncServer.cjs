const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = Number(process.env.PORT || 3001);

const G_DRIVE_DATA_DIR = process.env.BMS_SYNC_DIR || 'G:\\My Drive\\MOWT\\Bridge stuff\\uganda_bms_data';
const FRONTEND_DATA_DIR = process.env.BMS_FRONTEND_DATA_DIR || path.join(__dirname, '..', 'public', 'data');

if (!fs.existsSync(G_DRIVE_DATA_DIR)) {
  fs.mkdirSync(G_DRIVE_DATA_DIR, { recursive: true });
}

const datasets = {
  bridges: {
    idField: 'BridgeNumber',
    sourcePath: path.join(FRONTEND_DATA_DIR, 'bridges.json'),
    drivePath: path.join(G_DRIVE_DATA_DIR, 'bridges.json'),
  },
  culverts: {
    idField: 'CulvertNumber',
    sourcePath: path.join(FRONTEND_DATA_DIR, 'culverts.json'),
    drivePath: path.join(G_DRIVE_DATA_DIR, 'culverts.json'),
  },
};

function seedDriveFile(datasetName) {
  const dataset = datasets[datasetName];
  if (!fs.existsSync(dataset.drivePath) && fs.existsSync(dataset.sourcePath)) {
    fs.copyFileSync(dataset.sourcePath, dataset.drivePath);
    console.log(`Copied ${datasetName}.json to Google Drive sync folder`);
  }
}

Object.keys(datasets).forEach(seedDriveFile);

function readDataset(datasetName) {
  return JSON.parse(fs.readFileSync(datasets[datasetName].drivePath, 'utf8'));
}

function writeJsonAtomic(filePath, value) {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.${Date.now()}.tmp`);
  fs.writeFileSync(tmpPath, JSON.stringify(value, null, 2));
  fs.renameSync(tmpPath, filePath);
}

function writeDataset(datasetName, rows) {
  if (!Array.isArray(rows)) {
    const error = new Error(`${datasetName} payload must be an array.`);
    error.statusCode = 400;
    throw error;
  }
  writeJsonAtomic(datasets[datasetName].drivePath, rows);
}

function upsertDatasetRecord(datasetName, record) {
  const dataset = datasets[datasetName];
  const id = record && record[dataset.idField];
  if (!id) {
    const error = new Error(`${dataset.idField} is required.`);
    error.statusCode = 400;
    throw error;
  }

  const rows = readDataset(datasetName);
  const index = rows.findIndex((row) => row[dataset.idField] === id);
  if (index >= 0) rows[index] = record;
  else rows.push(record);
  writeDataset(datasetName, rows);
  return { id, rows: rows.length };
}

app.use(cors({ origin: true }));
app.use(bodyParser.json({ limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    syncDir: G_DRIVE_DATA_DIR,
    datasets: Object.fromEntries(Object.entries(datasets).map(([name, dataset]) => [
      name,
      {
        exists: fs.existsSync(dataset.drivePath),
        path: dataset.drivePath,
      },
    ])),
  });
});

Object.keys(datasets).forEach((datasetName) => {
  app.get(`/api/${datasetName}`, (req, res) => {
    try {
      res.json(readDataset(datasetName));
    } catch (err) {
      res.status(500).json({ error: `Failed to read ${datasetName} data`, detail: err.message });
    }
  });

  app.post(`/api/${datasetName}`, (req, res) => {
    try {
      writeDataset(datasetName, req.body);
      res.json({ success: true, message: `${datasetName} data updated successfully` });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: `Failed to write ${datasetName} data`, detail: err.message });
    }
  });

  app.post(`/api/${datasetName}/upsert`, (req, res) => {
    try {
      const result = upsertDatasetRecord(datasetName, req.body);
      res.json({ success: true, ...result, message: `${datasetName} record updated successfully` });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: `Failed to upsert ${datasetName} record`, detail: err.message });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Syncing data to: ${G_DRIVE_DATA_DIR}`);
});
