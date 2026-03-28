document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const codeInput = document.getElementById('codeInput');
    const outputContent = document.getElementById('outputContent');
    const lineNumbers = document.getElementById('lineNumbers');
    const btnProcess = document.getElementById('btnProcess');
    const btnCopy = document.getElementById('btnCopy');
    const btnClear = document.getElementById('btnClear');
    const btnCopyOutput = document.getElementById('btnCopyOutput');
    const btnClearOutput = document.getElementById('btnClearOutput');
    const themeToggle = document.getElementById('themeToggle');
    const statusIndicator = document.getElementById('statusIndicator');
    const executionTime = document.getElementById('executionTime');
    const toast = document.getElementById('toast');
    const resizer = document.getElementById('resizer');
    const pythonVersion = document.getElementById('pythonVersion');
    const badgeDot = document.getElementById('badgeDot');

    // ===== Pyodide =====
    let pyodide = null;

    async function initPyodide() {
        try {
            pyodide = await loadPyodide();
            const version = pyodide.runPython('import sys; sys.version.split()[0]');
            pythonVersion.textContent = `Python ${version}`;
            badgeDot.style.background = 'var(--success)';
            btnProcess.disabled = false;
            outputContent.innerHTML = '<span class="output-placeholder">Output will appear here after processing...</span>';
        } catch (err) {
            pythonVersion.textContent = 'Failed to load';
            badgeDot.style.background = 'var(--error)';
            outputContent.innerHTML = `<span class="output-error">Failed to load Python runtime: ${escapeHtml(err.message)}</span>`;
        }
    }

    initPyodide();

    // ===== Theme =====
    const savedTheme = localStorage.getItem('python-processor-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('python-processor-theme', next);
    });

    // ===== Line Numbers =====
    function updateLineNumbers() {
        const lines = codeInput.value.split('\n').length;
        let html = '';
        for (let i = 1; i <= lines; i++) {
            html += i + '\n';
        }
        lineNumbers.textContent = html;
    }

    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeInput.scrollTop;
    });

    updateLineNumbers();

    // ===== Tab Support =====
    codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeInput.selectionStart;
            const end = codeInput.selectionEnd;
            codeInput.value = codeInput.value.substring(0, start) + '    ' + codeInput.value.substring(end);
            codeInput.selectionStart = codeInput.selectionEnd = start + 4;
            updateLineNumbers();
        }

        // Ctrl+Enter to process
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            processCode();
        }
    });

    // ===== Toast =====
    let toastTimeout;
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // ===== Copy =====
    btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(codeInput.value).then(() => {
            showToast('Code copied to clipboard!');
        });
    });

    btnCopyOutput.addEventListener('click', () => {
        const text = outputContent.textContent;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Output copied to clipboard!');
        });
    });

    // ===== Clear =====
    btnClear.addEventListener('click', () => {
        codeInput.value = '';
        updateLineNumbers();
        codeInput.focus();
        showToast('Code cleared');
    });

    btnClearOutput.addEventListener('click', () => {
        outputContent.innerHTML = '<span class="output-placeholder">Output will appear here after processing...</span>';
        executionTime.textContent = '';
        statusIndicator.className = 'status-indicator';
    });

    // ===== Process Code =====
    btnProcess.addEventListener('click', processCode);

    async function processCode() {
        if (!pyodide) {
            showToast('Python is still loading, please wait...');
            return;
        }

        const code = codeInput.value.trim();
        if (!code) {
            showToast('Please enter some Python code');
            return;
        }

        // UI: running state
        btnProcess.classList.add('running');
        btnProcess.disabled = true;
        btnProcess.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </circle>
            </svg>
            Running...
        `;
        statusIndicator.className = 'status-indicator running';
        executionTime.textContent = '';
        outputContent.innerHTML = '<span class="output-placeholder">Processing...</span>';

        // Small delay to let UI update
        await new Promise(r => setTimeout(r, 50));

        const startTime = performance.now();

        try {
            // Redirect stdout and stderr
            pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);

            // Run user code
            pyodide.runPython(code);

            // Capture output
            const stdout = pyodide.runPython('sys.stdout.getvalue()');
            const stderr = pyodide.runPython('sys.stderr.getvalue()');

            const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
            executionTime.textContent = `${elapsed}s`;

            if (stdout && stdout.trim() !== '') {
                statusIndicator.className = 'status-indicator success';
                outputContent.textContent = stdout;
            } else if (!stderr || stderr.trim() === '') {
                statusIndicator.className = 'status-indicator success';
                outputContent.innerHTML = '<span class="output-placeholder">Code executed successfully with no output.</span>';
            }

            if (stderr && stderr.trim() !== '') {
                statusIndicator.className = 'status-indicator error';
                if (stdout && stdout.trim() !== '') {
                    const errorSpan = document.createElement('span');
                    errorSpan.className = 'output-error';
                    errorSpan.textContent = '\n' + stderr;
                    outputContent.appendChild(errorSpan);
                } else {
                    outputContent.innerHTML = `<span class="output-error">${escapeHtml(stderr)}</span>`;
                }
            }

            // Reset stdout/stderr
            pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

        } catch (err) {
            const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
            executionTime.textContent = `${elapsed}s`;
            statusIndicator.className = 'status-indicator error';

            // Try to get any partial stdout
            let partialOutput = '';
            try {
                partialOutput = pyodide.runPython('sys.stdout.getvalue()');
            } catch (_) {}

            // Clean up the error message
            let errorMsg = err.message;
            const match = errorMsg.match(/File "<exec>",[\s\S]*/);
            if (match) {
                errorMsg = match[0];
            }

            if (partialOutput && partialOutput.trim() !== '') {
                outputContent.textContent = partialOutput;
                const errorSpan = document.createElement('span');
                errorSpan.className = 'output-error';
                errorSpan.textContent = '\n' + errorMsg;
                outputContent.appendChild(errorSpan);
            } else {
                outputContent.innerHTML = `<span class="output-error">${escapeHtml(errorMsg)}</span>`;
            }

            // Reset stdout/stderr
            try {
                pyodide.runPython(`
import sys
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);
            } catch (_) {}
        }

        // Reset button
        btnProcess.classList.remove('running');
        btnProcess.disabled = false;
        btnProcess.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Process
        `;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ===== Resizer =====
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizer.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const container = document.querySelector('.editor-container');
        const rect = container.getBoundingClientRect();
        const offset = e.clientX - rect.left;
        const total = rect.width - 16;
        const percent = (offset / total) * 100;

        if (percent > 20 && percent < 80) {
            const inputPanel = document.querySelector('.panel-input');
            const outputPanel = document.querySelector('.panel-output');
            inputPanel.style.flex = `0 0 ${percent}%`;
            outputPanel.style.flex = `0 0 ${100 - percent}%`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizer.classList.remove('active');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
});
