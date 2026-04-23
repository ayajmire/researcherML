// Diagnostic script to check Electron module loading
console.log('=== ELECTRON DIAGNOSTIC ===');
console.log('Process versions:', process.versions);
console.log('Platform:', process.platform);
console.log('Arch:', process.arch);
console.log('\nAttempting to load electron module...\n');

try {
  const electron = require('electron');
  console.log('✓ Electron module loaded');
  console.log('Type of electron:', typeof electron);
  console.log('Is object?:', typeof electron === 'object');
  console.log('Keys:', Object.keys(electron).slice(0, 20));
  
  const { app, BrowserWindow, ipcMain } = electron;
  console.log('\n=== Destructured APIs ===');
  console.log('app:', typeof app);
  console.log('BrowserWindow:', typeof BrowserWindow);
  console.log('ipcMain:', typeof ipcMain);
  
  if (typeof app === 'undefined') {
    console.error('\n❌ ERROR: app is undefined!');
    console.error('This indicates the Electron module is not exporting APIs correctly.');
    console.error('This is a critical Electron installation issue.');
  } else {
    console.log('\n✓ All APIs loaded successfully!');
  }
} catch (error) {
  console.error('\n❌ Failed to load electron:', error);
}

console.log('\n=== END DIAGNOSTIC ===');
