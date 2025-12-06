const remote = require('@electron/remote')
const { app, BrowserWindow } = require('@electron/remote')
const { Button } = require('./Button')
const path = require('path')
const config = require(path.join(app.getAppPath(), 'config'))

class MinimizeButton extends Button {
  /**
   * Create a minimize/restore button
   * @param {string} id - Element ID
   * @param {HTMLElement} vditorElement - Vditor DOM element
   */
  constructor(id, vditorElement) {
    super(id, () => {
      this.toggle()
    })
    
    this.isMinimized = false
    this.vditorElement = vditorElement
  }

  /**
   * Get the current window
   * @returns {BrowserWindow} The current browser window
   */
  getWindow() {
    return BrowserWindow.getFocusedWindow() || remote.getCurrentWindow()
  }

  /**
   * Toggle window minimize/restore state
   */
  toggle() {
    if (this.isMinimized) {
      this.restore()
    } else {
      this.minimize()
    }
    this.isMinimized = !this.isMinimized
  }

  /**
   * Minimize the window
   */
  minimize() {
    const window = this.getWindow()
    if (window) {
      window.setSize(
        config.WINDOW.WIDTH,
        config.WINDOW.MINIMIZED_HEIGHT
      )
    }
    if (this.vditorElement) {
      this.vditorElement.style.visibility = 'hidden'
    }
  }

  /**
   * Restore the window
   */
  restore() {
    const window = this.getWindow()
    if (window) {
      window.setSize(
        config.WINDOW.WIDTH,
        config.WINDOW.HEIGHT
      )
    }
    if (this.vditorElement) {
      this.vditorElement.style.visibility = 'visible'
    }
  }
}

module.exports = { MinimizeButton }