const { app } = require('@electron/remote')
const path = require('path')
const config = require(path.join(app.getAppPath(), 'config'))

class VditorComponent {
  constructor(initValue = config.VDITOR.INIT_VALUE) {
    const vditorElement = document.getElementById('vditor')
    if (!vditorElement) {
      throw new Error('Vditor element not found')
    }

    this.vditor = new Vditor('vditor', {
      toolbarConfig: {
        pin: true
      },
      cache: {
        enable: false
      },
      after: () => {
        this.vditor.setValue(initValue)
      }
    })
  }

  /**
   * Get the DOM element of vditor
   * @returns {HTMLElement} The vditor element
   */
  getElement() {
    return document.getElementById('vditor')
  }

  /**
   * Get the vditor instance
   * @returns {Vditor} The vditor instance
   */
  getVditor() {
    return this.vditor
  }
}

module.exports = { VditorComponent }