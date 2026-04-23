/**
 * Electron Main Process for ResearcherML
 * Handles window management and Python backend lifecycle
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let backendProcess = null;
const BACKEND_PORT = 8000;
const isDev = process.argv.includes('--dev');

/**
 * Create the main application window
 */
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
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false // Don't show until backend is ready
  });

  // Load the index.html
  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Find Python executable
 */
function findPython() {
  const platform = process.platform;
  
  // Try common Python locations
  const pythonCandidates = [
    'python3',
    'python',
    '/usr/bin/python3',
    '/usr/local/bin/python3',
    path.join(process.resourcesPath, 'python', 'bin', 'python3')
  ];
  
  return pythonCandidates[0]; // Default to python3
}

/**
 * Start the Python backend server
 */
function startBackend() {
  return new Promise((resolve, reject) => {
    const pythonExe = findPython();
    const backendPath = isDev 
      ? path.join(__dirname, '../backend')
      : path.join(process.resourcesPath, 'backend');
    
    const mainScript = path.join(backendPath, 'main.py');
    
    console.log('Starting Python backend...');
    console.log('Python:', pythonExe);
    console.log('Script:', mainScript);
    console.log('CWD:', backendPath);
    
    // Set environment variables
    const env = Object.assign({}, process.env, {
      PORT: BACKEND_PORT.toString(),
      ALLOWED_ORIGINS: `http://localhost:${BACKEND_PORT},file://`,
      PYTHONUNBUFFERED: '1'
    });
    
    // Start backend process
    backendProcess = spawn(pythonExe, [mainScript], {
      cwd: backendPath,
      env: env,
      shell: false
    });
    
    // Handle stdout
    backendProcess.stdout.on('data', (data) => {
      console.log(`[Backend] ${data.toString().trim()}`);
    });
    
    // Handle stderr
    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error] ${data.toString().trim()}`);
    });
    
    // Handle process exit
    backendProcess.on('exit', (code, signal) => {
      console.log(`Backend process exited with code ${code}, signal ${signal}`);
      backendProcess = null;
    });
    
    // Handle process error
    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });
    
    // Wait for backend to be ready
    console.log('Waiting for backend to start...');
    waitForBackend(10, 1000)
      .then(() => {
        console.log('✓ Backend is ready!');
        resolve();
      })
      .catch(reject);
  });
}

/**
 * Wait for backend to be ready by polling health endpoint
 */
function waitForBackend(maxAttempts = 10, delayMs = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      console.log(`Checking backend... (attempt ${attempts}/${maxAttempts})`);
      
      // Use 127.0.0.1 instead of localhost to force IPv4
      const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/`, (res) => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          resolve();
        } else {
          retry();
        }
      });
      
      req.on('error', (err) => {
        if (attempts >= maxAttempts) {
          reject(new Error(`Backend failed to start after ${maxAttempts} attempts: ${err.message}`));
        } else {
          retry();
        }
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    };
    
    const retry = () => {
      setTimeout(check, delayMs);
    };
    
    check();
  });
}

/**
 * Stop the Python backend
 */
function stopBackend() {
  return new Promise((resolve) => {
    if (!backendProcess) {
      resolve();
      return;
    }
    
    console.log('Stopping backend...');
    
    // Try graceful shutdown first
    backendProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (backendProcess) {
        console.log('Force killing backend...');
        backendProcess.kill('SIGKILL');
      }
      resolve();
    }, 5000);
    
    backendProcess.on('exit', () => {
      console.log('Backend stopped');
      resolve();
    });
  });
}

/**
 * App lifecycle events
 */
app.whenReady().then(async () => {
  try {
    // Start backend first
    await startBackend();
    
    // Then create window
    createWindow();
    
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean up on quit
app.on('before-quit', async (event) => {
  if (backendProcess) {
    event.preventDefault();
    await stopBackend();
    app.quit();
  }
});

// Handle IPC messages
ipcMain.handle('get-backend-url', () => {
  return `http://127.0.0.1:${BACKEND_PORT}`;
});
