/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2024 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */

(() => {
  'use strict'

  const getStoredTheme = () => localStorage.getItem('theme')
  const setStoredTheme = theme => localStorage.setItem('theme', theme)

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme()
    if (storedTheme) {
      return storedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const setTheme = theme => {
    if (theme === 'auto') {
      document.documentElement.setAttribute('data-bs-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
    } else {
      document.documentElement.setAttribute('data-bs-theme', theme)
    }
  }

  setTheme(getPreferredTheme())

  const showActiveTheme = (theme, focus = false) => {
    const themeSwitcher = document.querySelector('#dropdownUser2') // Updated to match our sidebar dropdown ID

    if (!themeSwitcher) {
      return
    }

    const themeSwitcherText = document.querySelector('#dropdownUser2 strong') // To update the button text
    const activeThemeIcon = document.querySelector('.theme-icon.active use') // Should target the icon within the button if we add one
    const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`)
    const svgOfActiveBtn = btnToActive.querySelector('svg use').getAttribute('href')

    document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
      element.classList.remove('active')
      element.querySelector('.bi.ms-auto').classList.add('d-none') // Hide all checkmarks
    })

    btnToActive.classList.add('active')
    btnToActive.querySelector('.bi.ms-auto').classList.remove('d-none') // Show checkmark for active theme
    
    // Update the main dropdown button to reflect the active theme (icon and text)
    if (themeSwitcherText) {
        const activeThemeLabel = btnToActive.textContent.trim();
        // themeSwitcherText.textContent = activeThemeLabel; // This might be too much if icon is also there
    }
    const mainIcon = themeSwitcher.querySelector('.bi.me-2 use');
    if (mainIcon) {
        mainIcon.setAttribute('href', svgOfActiveBtn);
    }


    if (focus) {
      themeSwitcher.focus()
    }
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const storedTheme = getStoredTheme()
    if (storedTheme !== 'light' && storedTheme !== 'dark') {
      setTheme(getPreferredTheme())
    }
  })

  window.addEventListener('DOMContentLoaded', () => {
    showActiveTheme(getPreferredTheme())

    document.querySelectorAll('[data-bs-theme-value]')
      .forEach(toggle => {
        toggle.addEventListener('click', () => {
          const theme = toggle.getAttribute('data-bs-theme-value')
          setStoredTheme(theme)
          setTheme(theme)
          showActiveTheme(theme, true)
        })
      })
  })
})()
