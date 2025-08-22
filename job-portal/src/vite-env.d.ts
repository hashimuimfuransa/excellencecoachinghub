/// <reference types="vite/client" />

declare namespace NodeJS {
  interface Timeout extends ReturnType<typeof setTimeout> {}
}

declare global {
  interface Window {
    // Add any window-specific types if needed
  }
}
