/**
 * Electron Main Process - Workaround for module loading issue
 */

// Workaround: Access Electron APIs through process object instead of require
const electron = process.type === 'browser' ? require('electron') : (() => {
  // If we're in Electron browser process, the APIs should be available on process
  if (typeof process.electronBinding === 'function') {
    // Use internal Electron bindings
    return {
      app: process.electronBinding('app').app || process.electronBinding('app'),
      BrowserWindow: process.electronBinding('browser_window').BrowserWindow,
      ipcMain: process.electronBinding('ipc').ipcMain || process.electronBinding('ipc')
    };
  }
  
  // Fallback: try to get from global
  if (global.require) {
    try {
      return global.require('electron');
    } catch (e) {
      console.error('Failed to load electron via global.require:', e);
    }
  }
  
  // Last resort: check if already in global scope
  if (typeof global.app !== 'undefined') {
    return {
      app: global.app,
      BrowserWindow: global.BrowserWindow,
      ipcMain: global.ipcMain
    };
  }
  
  throw new Error('Cannot load Electron APIs');
})();

const { app, BrowserWindow, ipcMain } = electron;

// Verify we got the APIs
if (typeof app === 'undefined' || typeof BrowserWindow === 'undefined') {
  console.error('FATAL: Electron APIs not available');
  console.error('app:', typeof app);
  console.error('BrowserWindow:', typeof BrowserWindow);
  console.error('process.type:', process.type);
  console.error('process.versions:', process.versions);
  process.exit(1);
}

const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let backendProcess = null;
const BACKEND_PORT = 8000;
const isDev = process.argv.includes('--dev');

console.log('✓ Electron APIs loaded successfully');

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
  
  console.log('✓ Window created');
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

// Setup app lifecycle
app.whenReady().then(async () => {
  try {
    // Setup IPC after app is ready
    ipcMain.handle('get-backend-url', () => {
      return `http://127.0.0.1:${BACKEND_PORT}`;
    });
    
    console.log('Starting application...');
    await startBackend();
    createWindow();
    console.log('✓ Application started successfully');
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

console.log('Main process initialized');
