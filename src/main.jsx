import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import styles from './index.css?inline';
import { marked } from 'marked';

class AIChatElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._state = { history: [] };
    this.reactRoot = null;
    
    // Internal storage for methods
    this._onQuery = null;
    this._onHandleResult = null;
    this._useMarkdown = false; // Internal flag
  }

  // Define a setter for onQuery so it triggers a re-render when changed
  set onQuery(fn) {
    this._onQuery = fn;
    this.render(); // Force React to see the new custom function
  }

  get onQuery() {
    return this._onQuery;
  }

  set onHandleResult(fn) {
    this._onHandleResult = fn;
    this.render();
  }

  get onHandleResult() {
    return this._onHandleResult;
  }

  static get observedAttributes() {
    return ['api-key', 'use-markdown']; //
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'use-markdown') {
      this._useMarkdown = newValue === 'true'; //
    }
    if (this.reactRoot) this.render();
  }

  // Allow setting via JS: widget.useMarkdown = true;
  set useMarkdown(val) {
    this._useMarkdown = !!val;
    this.render();
  }

  connectedCallback() {
    const container = document.createElement('div');
    container.id = 'widget-root';
    
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    
    this.shadowRoot.appendChild(styleTag);
    this.shadowRoot.appendChild(container);

    // Initialize the root here, then call the first render
    this.reactRoot = ReactDOM.createRoot(container);
    this.render();
  }

  pushHistory(newHistory) {
    this._state.history = newHistory;
    this.render(); // Re-render React with the new history
    this.dispatchEvent(new CustomEvent('history-updated', { 
        detail: newHistory 
    }));
  }

  parse(text) {
    if (this._useMarkdown) {
      return marked.parse(text);
    }
    return text;
  }

  get history() {
    return this._state.history;
  }

  render() {
    if (!this.reactRoot) return;

    this.reactRoot.render(
      <App 
        apiKey={this.getAttribute('api-key')}
        initialHistory={this._state.history}
        // Use the internal stored methods
        useMarkdown={this._useMarkdown}
        customQuery={this._onQuery}
        customHandleResult={this._onHandleResult}
        onHistoryChange={(h) => {
            this._state.history = h;
            this.dispatchEvent(new CustomEvent('history-updated', { detail: h }));
        }}
      />
    );
  }
}

customElements.define('ai-chat-widget', AIChatElement);