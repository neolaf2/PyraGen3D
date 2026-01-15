
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("PyraGen 3D: Bootstrapping engine...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("PyraGen 3D Error: Root container '#root' not found in DOM.");
} else {
  try {
    // Clear any existing content to ensure the :empty selector behaves correctly
    rootElement.innerHTML = '';
    
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("PyraGen 3D: Engine mounted successfully.");
  } catch (error) {
    console.error("PyraGen 3D Critical Failure:", error);
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center; color: #ef4444; padding: 20px;">
        <h1 style="margin-bottom: 8px;">Architecture Sync Failure</h1>
        <p style="color: #64748b; font-size: 14px;">The 3D rendering engine failed to initialize.</p>
        <pre style="background: #fee2e2; padding: 12px; border-radius: 8px; margin-top: 20px; font-size: 12px; max-width: 100%; overflow: auto; text-align: left;">
${error instanceof Error ? error.message : 'Unknown system error'}
        </pre>
      </div>
    `;
  }
}
