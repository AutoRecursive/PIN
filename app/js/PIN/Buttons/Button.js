class Button {
  /**
   * Create a button with click event handler
   * @param {string} id - Element ID
   * @param {Function} clickEvent - Click event handler
   */
  constructor(id, clickEvent) {
    const element = document.getElementById(id)
    if (!element) {
      throw new Error(`Button element with id "${id}" not found`)
    }
    
    element.addEventListener('click', () => {
      clickEvent()
    })
  }
}

module.exports = { Button }