const { app, BrowserWindow } = require('electron')
const { format } = require('url')
const { join } = require('path')
const remoteMain = require('@electron/remote/main')
const config = require('./config')

// Initialize remote module
remoteMain.initialize()

// Window management
app.winQueue = []

/**
 * Create a new browser window
 * @returns {BrowserWindow} The created window instance
 */
function createWindow() {
  const win = new BrowserWindow({
    width: config.WINDOW.WIDTH,
    height: config.WINDOW.HEIGHT,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    vibrancy: 'light'
  })

  // Enable remote module for this window
  remoteMain.enable(win.webContents)

  // Set window always on top
  win.setAlwaysOnTop(true, 'screen')

  // Load the HTML file
  win.loadURL(format({
    pathname: join(__dirname, config.PATHS.HTML),
    protocol: 'file',
    slashes: true
  }))

  // Uncomment to open DevTools
  // win.webContents.openDevTools()

  return win
}

/**
 * Append a new window to the queue
 */
app.appendWindow = function() {
  app.winQueue.push(createWindow())
}

/**
 * Remove the last window from the queue
 */
app.removeWindow = function() {
  if (app.winQueue.length > 0) {
    const lastWindow = app.winQueue[app.winQueue.length - 1]
    lastWindow.close()
    app.winQueue.pop()
  }
}

/**
 * Load themes configuration
 * @returns {Array} Array of theme objects
 */
app.loadThemes = function() {
  return require('./themes.json')
}

/**
 * Main application entry point
 */
function main() {
  app.appendWindow()
}

app.on('ready', main)
