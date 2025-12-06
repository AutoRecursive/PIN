const { Button } = require('./Button')

class ChangeThemeButton extends Button {
  /**
   * Create a theme change button
   * @param {string} id - Element ID
   * @param {string} color - Theme color
   * @param {Function} updateTheme - Theme update function
   */
  constructor(id, color, updateTheme) {
    super(id, () => {
      updateTheme(color)
    })
  }
}

module.exports = { ChangeThemeButton }