const { dialog } = require('@electron/remote')
const { Button } = require('./Button')
const fs = require('fs')

class SaveButton extends Button {
  /**
   * Create a save button
   * @param {Vditor} vditor - Vditor instance
   * @param {string} id - Element ID
   */
  constructor(vditor, id) {
    this.currentFilePath = null // Track current file path
    super(id, () => {
      this.saveFile(vditor)
    })
  }

  /**
   * Save vditor content to file
   * @param {Vditor} vditor - Vditor instance
   */
  async saveFile(vditor) {
    try {
      // If we have a file path, save directly
      if (this.currentFilePath) {
        const content = vditor.getValue()
        fs.writeFileSync(this.currentFilePath, content, 'utf8')
        this.showSavedMessage()
        return
      }
      
      // Otherwise, show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Save File',
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'Text', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (!result.canceled && result.filePath) {
        const content = vditor.getValue()
        fs.writeFileSync(result.filePath, content, 'utf8')
        this.currentFilePath = result.filePath
        this.showSavedMessage()
      }
    } catch (error) {
      console.error('Error saving file:', error)
    }
  }

  /**
   * Show "Saved" message
   */
  showSavedMessage() {
    // Create or get the saved message element
    let messageEl = document.getElementById('saved-message')
    if (!messageEl) {
      messageEl = document.createElement('div')
      messageEl.id = 'saved-message'
      messageEl.textContent = 'Saved'
      messageEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px 40px;
        border-radius: 8px;
        font-size: 18px;
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s;
      `
      document.body.appendChild(messageEl)
    }
    
    // Show message
    messageEl.style.opacity = '1'
    
    // Hide after 1.5 seconds
    setTimeout(() => {
      messageEl.style.opacity = '0'
    }, 1500)
  }

  /**
   * Set current file path
   * @param {string} filePath - File path
   */
  setFilePath(filePath) {
    this.currentFilePath = filePath
  }

  /**
   * Get current file path
   * @returns {string|null} Current file path
   */
  getFilePath() {
    return this.currentFilePath
  }
}

class LoadButton extends Button {
  /**
   * Create a load button
   * @param {Vditor} vditor - Vditor instance
   * @param {string} id - Element ID
   * @param {SaveButton} saveButton - SaveButton instance to update file path
   */
  constructor(vditor, id, saveButton = null) {
    this.saveButton = saveButton
    super(id, () => {
      this.loadFile(vditor)
    })
  }

  /**
   * Load file content into vditor
   * @param {Vditor} vditor - Vditor instance
   */
  async loadFile(vditor) {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Open File',
        properties: ['openFile'],
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'Text', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        const content = fs.readFileSync(filePath, 'utf8')
        vditor.setValue(content)
        
        // Update save button's file path
        if (this.saveButton) {
          this.saveButton.setFilePath(filePath)
        }
      }
    } catch (error) {
      console.error('Error loading file:', error)
    }
  }
}

module.exports = { SaveButton, LoadButton }