# Python Processor

An online Python code runner for quick testing, debugging, and learning Python directly in the browser — no setup required.

Python runs entirely in the browser using [Pyodide](https://pyodide.org/) (CPython compiled to WebAssembly). No server-side execution, no PHP, no backend needed.

## Features

- **Code Editor** with line numbers, tab support, and syntax-friendly monospace font
- **Instant Execution** — run Python code with a single click or `Ctrl+Enter`
- **Copy & Clear** buttons for both input and output panels
- **Dark / Light Theme** toggle, persisted via localStorage
- **Resizable Panels** — drag the divider to adjust input/output widths
- **Execution Timer** — shows how long each run took
- **Status Indicators** — visual feedback for running, success, and error states
- **100% Client-Side** — code never leaves your browser
- **Responsive Layout** — stacks vertically on mobile devices

## Requirements

- Any web server (Apache, Nginx, or even a simple file server)
- A modern browser (Chrome, Firefox, Edge, Safari)
- No PHP, no Python installation required

## Installation

1. Clone or download this repository into your web server's root directory:
   ```
   git clone https://github.com/your-username/Python-Processor.git
   ```
2. Open `http://localhost/Python-Processor/` in your browser.

That's it — no dependencies to install.

## Project Structure

```
Python-Processor/
├── index.html           # Main UI page (pure HTML)
├── assets/
│   ├── css/
│   │   └── style.css    # Styling with dark/light theme support
│   └── js/
│       └── app.js       # Frontend logic (editor, Pyodide execution, resizing)
└── README.md
```

## Usage

1. Write your Python code in the left panel (input editor).
2. Click **Process** or press **Ctrl+Enter** to execute.
3. View the output in the right panel.
4. Use **Copy** to copy code or output to your clipboard.
5. Use **Clear** to reset either panel.
6. Toggle the theme using the sun/moon icon in the header.

## How It Works

Python code runs directly in the browser using **Pyodide**, which is CPython compiled to WebAssembly. When you click Process, the code is executed locally via Pyodide — nothing is sent to any server. stdout and stderr are captured and displayed in the output panel.

## License

This project is open source and available under the [MIT License](LICENSE).
