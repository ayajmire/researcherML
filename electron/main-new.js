const electron = require('electron');
const { app, BrowserWindow, ipcMain } = electron;
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let backendProcess = null;
const BACKEND_PORT = 8000;
const isDev = process.argv.includes('--dev');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    backgroundColor: '#07090e'
  });

  mainWindow.loadFile('index.html');
  
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const backendPath = path.join(__dirname, '..', 'backend');
    const mainPy = path.join(backendPath, 'main.py');

    console.log(`Starting backend from: ${backendPath}`);

    backendProcess = spawn('python3', [mainPy], {
      cwd: backendPath,
      env: {
        ...process.env,
        BACKEND_PORT: BACKEND_PORT.toString(),
        ALLOWED_ORIGINS: `http://localhost:${BACKEND_PORT},http://127.0.0.1:${BACKEND_PORT}`
      }
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`[Backend] ${data.toString().trim()}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error] ${data.toString().trim()}`);
    });

    backendProcess.on('error', (error) => {
      console.error('[Backend] Failed to start:', error);
      reject(error);
    });

    waitForBackend(resolve, reject);
  });
}

function waitForBackend(resolve, reject, attempt = 1) {
  const maxAttempts = 30;
  const checkInterval = 1000;

  if (attempt > maxAttempts) {
    reject(new Error(`Backend failed to start after ${maxAttempts} attempts`));
    return;
  }

  const healthCheck = http.get(`http://127.0.0.1:${BACKEND_PORT}/`, (res) => {
    if (res.statusCode === 200 || res.statusCode === 404) {
      console.log(`✓ Backend ready after ${attempt} attempts`);
      resolve();
    } else {
      setTimeout(() => waitForBackend(resolve, reject, attempt + 1), checkInterval);
    }
  });

  healthCheck.on('error', () => {
    setTimeout(() => waitForBackend(resolve, reject, attempt + 1), checkInterval);
  });
}

function stopBackend() {
  return new Promise((resolve) => {
    if (!backendProcess) {
      resolve();
      return;
    }

    console.log('Stopping backend...');
    backendProcess.kill();
    
    backendProcess.on('exit', () => {
      console.log('Backend stopped');
      resolve();
    });
  });
}

app.whenReady().then(async () => {
  try {
    // Setup IPC handlers after app is ready
    ipcMain.handle('get-backend-url', () => {
      return `http://127.0.0.1:${BACKEND_PORT}`;
    });
    
    await startBackend();
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async (event) => {
  if (backendProcess) {
    event.preventDefault();
    await stopBackend();
    app.quit();
  }
});
