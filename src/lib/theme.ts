import { writable } from 'svelte/store';

// Get initial theme from localStorage or default to 'light'
const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
};

// Create the theme store
export const theme = writable<'light' | 'dark'>(getInitialTheme());

// Subscribe to theme changes and update localStorage and document class
if (typeof window !== 'undefined') {
  theme.subscribe((value) => {
    localStorage.setItem('theme', value);
    document.documentElement.classList.toggle('dark', value === 'dark');
  });
} 