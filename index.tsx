
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("PyraGen 3D: Bootstrapping engine...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("PyraGen 3D Error: Root container '#root' not found in DOM.");
} else {
  try {
    // Clear initial loading text immediately to confirm script execution
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
        <h1 style="margin-bottom: 8px; font-size: 24px;">Architecture Sync Failure</h1>
        <p style="color: #64748b; font-size: 14px;">The 3D rendering engine failed to initialize.</p>
        <pre style="background: #fee2e2; padding: 16px; border-radius: 12px; margin-top: 24px; font-size: 12px; max-width: 100%; overflow: auto; text-align: left; border: 1px solid #fecaca;">
${error instanceof Error ? error.stack || error.message : 'Unknown system error'}
        </pre>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Reload Engine</button>
      </div>
    `;
  }
}
