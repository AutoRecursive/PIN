const { app } = require('@electron/remote')
const { Button } = require('./Buttons/Button')
const { ChangeThemeButton } = require('./Buttons/ChangeThemeButton')
const { MinimizeButton } = require('./Buttons/MinimizeButton')
const { SaveButton, LoadButton } = require('./Buttons/SaveLoadButton')
const { VditorComponent } = require('./VditorComponent')
const { SearchBox } = require('./SearchBox')

class PIN {
  constructor() {
    // Base button anchors that should change color with theme
    this.buttonAnchors = ['.top-bar', '#btn-minimize', '.dark-btn']
    
    // Store theme buttons
    this.themeButtons = {}
    
    // Initialize components
    this.vditor = new VditorComponent()
    this.initButtons()
    this.initThemes()
    this.initSearchBox()
  }

  /**
   * Initialize all buttons
   */
  initButtons() {
    this.btnMinimize = new MinimizeButton('btn-minimize', this.vditor.getElement())
    this.btnNew = new Button('new-window', app.appendWindow)
    this.btnSave = new SaveButton(this.vditor.getVditor(), 'btn-save')
    this.btnLoad = new LoadButton(this.vditor.getVditor(), 'btn-load', this.btnSave)
    this.initKeyboardShortcuts()
  }

  /**
   * Initialize keyboard shortcuts
   */
  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifierKey = isMac ? e.metaKey : e.ctrlKey
      
      // Cmd+S or Ctrl+S for save
      if (modifierKey && e.key === 's') {
        e.preventDefault()
        if (this.btnSave) {
          this.btnSave.saveFile(this.vditor.getVditor())
        }
      }
    })
  }

  /**
   * Initialize themes and theme buttons
   */
  initThemes() {
    const themes = app.loadThemes()
    
    // Add theme button anchors
    themes.forEach(theme => {
      this.buttonAnchors.push(`#btn-theme-${theme.theme}`)
    })
    
    // Create theme buttons
    themes.forEach(theme => {
      this.addChangeThemeButton(theme)
    })
  }

  /**
   * Add a change theme button
   * @param {Object} theme - Theme object with theme and color properties
   */
  addChangeThemeButton(theme) {
    const buttonId = `btn-theme-${theme.theme}`
    const updateTheme = (color) => {
      this.buttonAnchors.forEach(selector => {
        const element = document.querySelector(selector)
        if (element) {
          element.style.backgroundColor = color
        }
      })
    }
    
    this.themeButtons[buttonId] = new ChangeThemeButton(
      buttonId,
      theme.color,
      updateTheme
    )
  }

  /**
   * Initialize search box and keyboard shortcuts
   */
  initSearchBox() {
    // Initialize search box (it will work once vditor is ready)
    this.searchBox = new SearchBox(this.vditor)
    
    // Listen for Cmd+F (Mac) or Ctrl+F (Windows/Linux)
    document.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in the search input
      if (e.target.id === 'search-input') {
        return
      }
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifierKey = isMac ? e.metaKey : e.ctrlKey
      
      if (modifierKey && e.key === 'f') {
        e.preventDefault()
        if (this.searchBox) {
          this.searchBox.toggle()
        }
      }
    })
  }
}

module.exports = { PIN }
