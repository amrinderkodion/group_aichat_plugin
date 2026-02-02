# Minimal AI Chat Web Component

This project is a modular, React-powered **AI Chat Web Component** designed to integrate the Google Gemini API into any web application. It features a "Headless" architecture that allows developers to use the underlying logic (API handling and state management) while building a completely custom user interface.

## Core Architecture

The system is built on a "Bridge" pattern between a standard Web Component and a React application:

*   **Logic Layer (`main.jsx`)**: Acts as the public interface for the web component (`<ai-chat-widget>`). It exposes methods like `pushHistory` to update data and properties like `onQuery` to override default behavior.
*   **UI Layer (`App.jsx`)**: A React application that manages the chat state, renders messages, and handles the direct integration with the Gemini API.
*   **Shadow DOM**: Encapsulates styles and the default UI, ensuring that the widget's design does not conflict with the host website's CSS.

## Key Features

*   **Headless Mode**: By setting the component to `display: none`, the host can use its own HTML/JavaScript while leveraging the component's internal `messages` state and API logic.
*   **State Synchronization**: The component dispatches a `history-updated` Custom Event whenever the conversation changes, allowing external UIs to stay in sync automatically.
*   **Automated Context Handling**: The system uses a `useEffect` hook to watch for new user messages. When a message is detected, it automatically sends the **entire conversation history** to Gemini to maintain context.
*   **Markdown Support**: Integrated `marked` library support allows the AI to return formatted text, code blocks, and lists, which are safely rendered via `dangerouslySetInnerHTML`.

## Installation

To contribute to this component or run it locally, follow these steps:

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/aichat_plugin.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd aichat_plugin
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

## Usage & Customization

### 1. Standard Usage
Simply include the `<ai-chat-widget>` tag in your HTML with your `api-key` attribute.

```html
<ai-chat-widget api-key="YOUR_GEMINI_API_KEY"></ai-chat-widget>
<script src="path/to/your/main.js"></script> 
```

### 2. Customization
You can customize the widget in various ways:

**Styling:**
Theme the widget using CSS variables.
```css
ai-chat-widget {
  --chat-primary: #your_custom_color;
}
```

**Custom Query Logic:**
Provide a `customQuery` function to route messages through your own backend instead of directly to Gemini.
```javascript
const widget = document.querySelector('ai-chat-widget');
widget.onQuery = async (inputText, history) => {
  // Your custom logic to get a response
  const response = await myCustomApiCall(inputText, history);
  return response;
};
```

**Handling Results:**
Use `onHandleResult` to process the bot's response before it is added to the history.
```javascript
widget.onHandleResult = (botText) => {
  console.log("The bot said:", botText);
  // You could modify the text here if needed
};
```

**Markdown:**
Enable or disable markdown rendering using the `use-markdown` attribute or the `useMarkdown` property.
```html
<ai-chat-widget api-key="..." use-markdown="true"></ai-chat-widget>
```
```javascript
widget.useMarkdown = true;
```

### 3. Data Persistence & Headless Mode
Access the conversation history and listen for updates, making it easy to save sessions or build a custom UI.

**Accessing History:**
The current history is always accessible via the `history` getter.
```javascript
const currentHistory = widget.history;
```

**Listening for Updates:**
Listen for the `history-updated` event to know when the conversation has changed.
```javascript
widget.addEventListener('history-updated', (event) => {
  const updatedHistory = event.detail;
  // Save to database or update your custom UI
});
```

**Pushing History:**
You can programmatically add messages to the history.
```javascript
widget.pushHistory([
    { role: 'user', parts: [{ text: 'Hello' }] },
    { role: 'model', parts: [{ text: 'Hi there!' }] }
]);
```

## Available Scripts

For developers working on this component, the following scripts are available:

-   `npm run dev`: Runs the app in development mode.
-   `npm run build`: Builds the app for production.
-   `npm run lint`: Lints the source code using ESLint.
-   `npm run preview`: Previews the production build locally.
