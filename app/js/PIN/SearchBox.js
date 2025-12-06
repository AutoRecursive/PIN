class SearchBox {
  /**
   * Create a search box with toggle and search functionality
   * @param {Vditor} vditor - Vditor instance
   */
  constructor(vditor) {
    this.vditor = vditor
    this.isVisible = false
    this.searchTerm = ''
    this.currentMatchIndex = -1
    this.matches = []
    
    // Get search box elements
    this.searchBox = document.getElementById('search-box')
    this.searchInput = document.getElementById('search-input')
    this.searchClose = document.getElementById('search-close')
    this.searchPrev = document.getElementById('search-prev')
    this.searchNext = document.getElementById('search-next')
    this.searchCount = document.getElementById('search-count')
    
    if (!this.searchBox || !this.searchInput) {
      throw new Error('Search box elements not found')
    }
    
    // Initialize event listeners
    this.initEventListeners()
    
    // Initially hide the search box
    this.hide()
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Close button
    if (this.searchClose) {
      this.searchClose.addEventListener('click', () => {
        this.hide()
      })
    }
    
    // Previous button
    if (this.searchPrev) {
      this.searchPrev.addEventListener('click', () => {
        this.findPrevious()
      })
    }
    
    // Next button
    if (this.searchNext) {
      this.searchNext.addEventListener('click', () => {
        this.findNext()
      })
    }
    
    // Search input - trigger search on input
    this.searchInput.addEventListener('input', (e) => {
      const value = e.target.value
      if (value.trim()) {
        this.search(value)
      } else {
        this.clearHighlights()
        this.updateCount(0, 0)
      }
    })
    
    // Handle Enter key - trigger search first, then navigate
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = this.searchInput.value.trim()
        if (value) {
          // If no matches yet, search first
          if (this.matches.length === 0) {
            this.search(value)
          }
          // Then navigate
          if (e.shiftKey) {
            this.findPrevious()
          } else {
            this.findNext()
          }
        }
        e.preventDefault()
      } else if (e.key === 'Escape') {
        this.hide()
        e.preventDefault()
      }
    })
  }

  /**
   * Toggle search box visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * Show search box
   */
  show() {
    this.isVisible = true
    this.searchBox.style.display = 'flex'
    this.searchInput.focus()
    this.searchInput.select()
    
    // If there's already text, search it (with a small delay to ensure DOM is ready)
    if (this.searchInput.value) {
      setTimeout(() => {
        this.search(this.searchInput.value)
      }, 100)
    }
  }

  /**
   * Hide search box
   */
  hide() {
    this.isVisible = false
    this.searchBox.style.display = 'none'
    this.clearHighlights()
    this.searchInput.value = ''
    this.searchTerm = ''
    this.matches = []
    this.currentMatchIndex = -1
  }

  /**
   * Search for text in the editor
   * @param {string} term - Search term
   */
  search(term) {
    this.searchTerm = term.trim()
    
    if (!this.searchTerm) {
      this.clearHighlights()
      this.updateCount(0, 0)
      return
    }
    
    // Get the vditor instance
    const vditorInstance = this.vditor.getVditor()
    if (!vditorInstance) {
      this.updateCount(0, 0)
      return
    }
    
    // Get the editor element
    const editorElement = vditorInstance.element
    if (!editorElement) {
      this.updateCount(0, 0)
      return
    }
    
    // Try to find the preview element (rendered markdown)
    // This is what the user actually sees
    let targetElement = editorElement.querySelector('.vditor-preview')
    
    // If no preview element found, try to find it in the document
    if (!targetElement) {
      targetElement = document.querySelector('#vditor .vditor-preview')
    }
    
    // If still no preview, search in the entire vditor element
    if (!targetElement) {
      targetElement = editorElement
    }
    
    // Make sure we don't search in the search box itself
    if (targetElement && targetElement.closest('#search-box')) {
      this.updateCount(0, 0)
      return
    }
    
    this.searchInElement(targetElement)
  }

  /**
   * Search in a specific element
   * @param {HTMLElement} element - Element to search in
   */
  searchInElement(element) {
    if (!element) {
      this.updateCount(0, 0)
      return
    }
    
    // Clear previous highlights
    this.clearHighlights()
    
    // Find all matches
    this.matches = this.findAllMatches(element, this.searchTerm)
    
    if (this.matches.length === 0) {
      this.updateCount(0, 0)
      return
    }
    
    // Highlight all matches
    this.highlightMatches(element, this.matches)
    
    // Go to first match
    this.currentMatchIndex = 0
    this.scrollToCurrentMatch()
  }

  /**
   * Find all matches in the content
   * @param {HTMLElement} element - Element to search in
   * @param {string} term - Search term
   * @returns {Array} Array of match information
   */
  findAllMatches(element, term) {
    const matches = []
    
    if (!element) {
      return matches
    }
    
    // First, clear any existing highlights to get clean text nodes
    const existingHighlights = element.querySelectorAll('.search-highlight')
    if (existingHighlights.length > 0) {
      // We'll clear them in clearHighlights, but for now just skip them
    }
    
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip if no parent
          if (!node.parentElement) {
            return NodeFilter.FILTER_REJECT
          }
          
          // Skip search box itself
          if (node.parentElement.closest('#search-box')) {
            return NodeFilter.FILTER_REJECT
          }
          
          // Skip script and style elements
          const parent = node.parentElement
          if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
            return NodeFilter.FILTER_REJECT
          }
          
          // Skip already highlighted elements (but we should have cleared them)
          if (parent.classList && parent.classList.contains('search-highlight')) {
            return NodeFilter.FILTER_REJECT
          }
          
          // Only accept nodes with actual text content
          if (!node.textContent || node.textContent.trim().length === 0) {
            return NodeFilter.FILTER_REJECT
          }
          
          return NodeFilter.FILTER_ACCEPT
        }
      },
      false
    )
    
    const escapedTerm = this.escapeRegex(term)
    
    let node
    while ((node = walker.nextNode())) {
      const text = node.textContent
      if (!text) {
        continue
      }
      
      // Create a new regex for each node to avoid state issues
      const regex = new RegExp(escapedTerm, 'gi')
      let match
      let searchIndex = 0
      
      // Use a while loop with indexOf to avoid regex state issues
      while ((match = regex.exec(text)) !== null) {
        // Avoid infinite loops with zero-length matches
        if (match[0].length === 0) {
          regex.lastIndex++
          continue
        }
        
        // Make sure we're making progress
        if (match.index < searchIndex) {
          break
        }
        searchIndex = match.index + match[0].length
        
        matches.push({
          node: node,
          offset: match.index,
          length: match[0].length
        })
      }
    }
    
    return matches
  }

  /**
   * Highlight all matches
   * @param {HTMLElement} element - Element containing matches
   * @param {Array} matches - Array of match information
   */
  highlightMatches(element, matches) {
    // Group matches by node to handle multiple matches in the same node
    const matchesByNode = new Map()
    matches.forEach(match => {
      if (!matchesByNode.has(match.node)) {
        matchesByNode.set(match.node, [])
      }
      matchesByNode.get(match.node).push(match)
    })
    
    // Sort matches within each node by offset (reverse order for safe replacement)
    matchesByNode.forEach((nodeMatches, node) => {
      nodeMatches.sort((a, b) => b.offset - a.offset)
      
      const parent = node.parentNode
      if (!parent) return
      
      let text = node.textContent
      const fragments = []
      let lastIndex = text.length
      
      // Process matches from end to start
      nodeMatches.forEach(match => {
        const before = text.substring(match.offset + match.length, lastIndex)
        const matched = text.substring(match.offset, match.offset + match.length)
        
        if (before) {
          fragments.unshift(document.createTextNode(before))
        }
        
        const highlight = document.createElement('mark')
        highlight.className = 'search-highlight'
        highlight.textContent = matched
        fragments.unshift(highlight)
        
        lastIndex = match.offset
      })
      
      // Add remaining text before first match
      if (lastIndex > 0) {
        fragments.unshift(document.createTextNode(text.substring(0, lastIndex)))
      }
      
      // Replace the original node with fragments
      fragments.forEach(fragment => {
        parent.insertBefore(fragment, node)
      })
      parent.removeChild(node)
    })
  }

  /**
   * Get node position in document
   * @param {Node} node - Text node
   * @returns {number} Position
   */
  getNodePosition(node) {
    let position = 0
    let prevNode = node.previousSibling
    while (prevNode) {
      position += prevNode.textContent.length
      prevNode = prevNode.previousSibling
    }
    let parent = node.parentNode
    while (parent && parent !== document.body) {
      let sibling = parent.previousSibling
      while (sibling) {
        position += sibling.textContent.length
        sibling = sibling.previousSibling
      }
      parent = parent.parentNode
    }
    return position
  }

  /**
   * Clear all highlights
   */
  clearHighlights() {
    const highlights = document.querySelectorAll('.search-highlight')
    highlights.forEach(highlight => {
      const parent = highlight.parentNode
      if (parent) {
        const text = document.createTextNode(highlight.textContent)
        parent.insertBefore(text, highlight)
        parent.removeChild(highlight)
        // Normalize to merge adjacent text nodes
        parent.normalize()
      }
    })
  }


  /**
   * Find next match
   */
  findNext() {
    if (this.matches.length === 0) {
      if (this.searchInput.value) {
        this.search(this.searchInput.value)
      }
      return
    }
    
    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matches.length
    this.scrollToCurrentMatch()
  }

  /**
   * Find previous match
   */
  findPrevious() {
    if (this.matches.length === 0) {
      if (this.searchInput.value) {
        this.search(this.searchInput.value)
      }
      return
    }
    
    this.currentMatchIndex = (this.currentMatchIndex - 1 + this.matches.length) % this.matches.length
    this.scrollToCurrentMatch()
  }

  /**
   * Scroll to current match
   */
  scrollToCurrentMatch() {
    if (this.matches.length === 0 || this.currentMatchIndex < 0) {
      return
    }
    
    const highlights = document.querySelectorAll('.search-highlight')
    if (highlights.length > 0) {
      const index = this.currentMatchIndex < highlights.length ? this.currentMatchIndex : 0
      const highlight = highlights[index]
      if (highlight) {
        // Remove current class from all highlights
        highlights.forEach(h => h.classList.remove('search-highlight-current'))
        // Add current class to active highlight
        highlight.classList.add('search-highlight-current')
        highlight.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
    
    this.updateCount(this.currentMatchIndex + 1, this.matches.length)
  }


  /**
   * Update search count display
   * @param {number} current - Current match index (1-based)
   * @param {number} total - Total matches
   */
  updateCount(current, total) {
    if (this.searchCount) {
      if (total === 0) {
        this.searchCount.textContent = '无结果'
      } else {
        this.searchCount.textContent = `${current} / ${total}`
      }
    }
  }

  /**
   * Escape special regex characters
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}

module.exports = { SearchBox }

