// Dashboard JavaScript - separate file to avoid regex escaping issues
const vscode = acquireVsCodeApi();
let changedFilesData = [];
let currentTestOutput = '';
let ignoredTests = JSON.parse(localStorage.getItem('wprocket-ignored-tests') || '[]');

function parseAnsi(text) {
    // Convert ANSI codes to HTML
    const ansiRegex = /\x1b\[(\d+(?:;\d+)*)m/g;
    let html = text;
    
    // Escape HTML
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Replace ANSI codes with spans
    const colorMap = {
        '0': '', // Reset
        '1': 'ansi-bold',
        '2': 'ansi-dim',
        '3': 'ansi-italic',
        '4': 'ansi-underline',
        '7': 'ansi-inverse',
        '30': 'ansi-black',
        '31': 'ansi-red',
        '32': 'ansi-green',
        '33': 'ansi-yellow',
        '34': 'ansi-blue',
        '35': 'ansi-magenta',
        '36': 'ansi-cyan',
        '37': 'ansi-white',
        '41': 'ansi-bg-red',
        '90': 'ansi-bright-black',
        '91': 'ansi-bright-red',
        '92': 'ansi-bright-green',
        '93': 'ansi-bright-yellow',
        '94': 'ansi-bright-blue',
        '95': 'ansi-bright-magenta',
        '96': 'ansi-bright-cyan',
        '97': 'ansi-bright-white'
    };
    
    let openTags = [];
    html = html.replace(ansiRegex, (match, codes) => {
        const codeList = codes.split(';');
        if (codeList.includes('0')) {
            const closing = openTags.map(() => '</span>').join('');
            openTags = [];
            return closing;
        }
        
        let result = '';
        for (const code of codeList) {
            const cssClass = colorMap[code];
            if (cssClass) {
                openTags.push(cssClass);
                result += '<span class="' + cssClass + '">';
            }
        }
        return result;
    });
    
    // Close any remaining tags
    html += openTags.map(() => '</span>').join('');
    
    return html;
}

function parseTestFailures(output) {
    const failures = [];
    
    // Only parse the "There were X failures:" section
    const failureSection = output.match(/There were \d+ failures?:([\s\S]*?)(?=\n\n(?:There were|FAILURES!|$))/i);
    if (!failureSection) return failures;
    
    // PHPUnit failure pattern within that section only
    const failureRegex = /^\d+\)\s+(.+?)$/gm;
    const matches = failureSection[1].matchAll(failureRegex);
    
    for (const match of matches) {
        const testName = match[1];
        const startIdx = match.index;
        
        // Find the failure message and stack trace
        let endIdx = output.indexOf('\n\n', startIdx + match[0].length);
        if (endIdx === -1) endIdx = output.length;
        
        const failureBlock = output.substring(startIdx, endIdx);
        const lines = failureBlock.split('\n');
        
        let message = '';
        let stack = '';
        let inStack = false;
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('Failed asserting') || line.includes('Error:')) {
                message = line.trim();
                inStack = true;
            } else if (inStack) {
                stack += line + '\n';
            }
        }
        
        failures.push({
            name: testName,
            message: message || 'Test failed',
            stack: stack.trim()
        });
    }
    
    return failures;
}

function displayFailures(failures) {
    const panel = document.getElementById('failuresPanel');
    const list = document.getElementById('failuresList');
    const count = document.getElementById('failureCount');
    
    if (!failures || failures.length === 0) {
        panel.classList.remove('visible');
        return;
    }
    
    panel.classList.add('visible');
    count.textContent = '(' + failures.length + ')';
    
    list.innerHTML = failures.map((failure, idx) => {
        const isIgnored = ignoredTests.includes(failure.name);
        const escapedName = failure.name.replace(/'/g, "\\'");
        return '<div class="failure-item">' +
            '<div class="failure-header">' +
            '<input type="checkbox" class="failure-checkbox" ' +
            'id="ignore-' + idx + '" ' +
            (isIgnored ? 'checked' : '') + ' ' +
            'onchange="toggleIgnore(\'' + escapedName + '\')" ' +
            'title="Mark as expected failure">' +
            '<div class="failure-info">' +
            '<div class="failure-name">' +
            failure.name +
            (isIgnored ? '<span class="ignored-badge">IGNORED</span>' : '') +
            '</div>' +
            '<div class="failure-message">' + failure.message + '</div>' +
            (failure.stack ? '<div class="failure-stack">' + failure.stack + '</div>' : '') +
            '</div></div></div>';
    }).join('');
}

function toggleIgnore(testName) {
    const idx = ignoredTests.indexOf(testName);
    if (idx > -1) {
        ignoredTests.splice(idx, 1);
    } else {
        ignoredTests.push(testName);
    }
    localStorage.setItem('wprocket-ignored-tests', JSON.stringify(ignoredTests));
    
    // Re-parse and display to update badges
    const failures = parseTestFailures(currentTestOutput);
    displayFailures(failures);
}

function runTest(scriptName) {
    vscode.postMessage({
        command: 'runTest',
        payload: { scriptName }
    });
}

function runQualityCheck() {
    vscode.postMessage({
        command: 'runQuality'
    });
}

function clearOutput() {
    currentTestOutput = '';
    document.getElementById('output').innerHTML = '';
    document.getElementById('failuresPanel').classList.remove('visible');
}

function showChangedFiles() {
    const modal = document.getElementById('filesModal');
    const fileList = document.getElementById('fileList');
    
    if (changedFilesData.length === 0) {
        fileList.innerHTML = '<li class="file-item">No changes</li>';
    } else {
        fileList.innerHTML = changedFilesData.map(file => {
            let status = 'M';
            let statusClass = 'modified';
            if (file.includes('??')) {
                status = 'A';
                statusClass = 'added';
            } else if (file.includes('D')) {
                status = 'D';
                statusClass = 'deleted';
            }
            const fileName = file.replace(/^[AMD?]\s+/, '').trim();
            return '<li class="file-item"><span class="file-status ' + statusClass + '">' + status + '</span><span>' + fileName + '</span></li>';
        }).join('');
    }
    
    modal.classList.add('active');
}

function closeModal(event) {
    if (!event || event.target.id === 'filesModal' || event.target.classList.contains('close-button')) {
        document.getElementById('filesModal').classList.remove('active');
    }
}

function filterTests() {
    const searchTerm = document.getElementById('testSearch').value.toLowerCase();
    const sections = document.querySelectorAll('.test-section');
    
    sections.forEach(section => {
        const buttons = section.querySelectorAll('.test-button');
        let visibleCount = 0;
        
        buttons.forEach(button => {
            const testName = button.querySelector('h4').textContent.toLowerCase();
            if (testName.includes(searchTerm)) {
                button.style.display = '';
                visibleCount++;
            } else {
                button.style.display = 'none';
            }
        });
        
        // Hide section if no tests match
        if (visibleCount === 0) {
            section.style.display = 'none';
        } else {
            section.style.display = '';
            // Auto-expand sections with matches
            if (searchTerm) {
                section.classList.remove('collapsed');
            }
        }
    });
}

function toggleSection(element) {
    element.closest('.test-section').classList.toggle('collapsed');
}

function renderTestGroups(groups) {
    const container = document.getElementById('testGroups');
    container.innerHTML = '';

    // Auto-collapse categories with many tests or less common ones
    const autoCollapse = ['Page Builders', 'Third-Party', 'Hosting', 'Other', 'Quality Checks'];

    groups.forEach(group => {
        const section = document.createElement('div');
        section.className = 'test-section';
        if (autoCollapse.includes(group.category)) {
            section.classList.add('collapsed');
        }
        
        const header = document.createElement('div');
        header.className = 'section-header';
        header.onclick = () => toggleSection(header);
        
        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'toggle-icon';
        toggleIcon.textContent = '▼';
        header.appendChild(toggleIcon);
        
        const title = document.createElement('span');
        title.textContent = group.category;
        header.appendChild(title);
        
        const count = document.createElement('span');
        count.className = 'section-count';
        count.textContent = group.scripts.length + ' test' + (group.scripts.length !== 1 ? 's' : '');
        header.appendChild(count);
        
        section.appendChild(header);

        const content = document.createElement('div');
        content.className = 'section-content';
        
        const grid = document.createElement('div');
        grid.className = 'test-grid';

        group.scripts.forEach(script => {
            const button = document.createElement('div');
            button.className = 'test-button';
            button.onclick = () => runTest(script.name);

            const name = document.createElement('h4');
            name.textContent = script.displayName;
            button.appendChild(name);

            const status = document.createElement('div');
            status.className = 'test-status';
            status.textContent = 'Ready';
            button.appendChild(status);

            grid.appendChild(button);
        });

        content.appendChild(grid);
        section.appendChild(content);
        container.appendChild(section);
    });
}

function updateHistory(history) {
    const list = document.getElementById('historyList');
    if (!history || history.length === 0) {
        list.innerHTML = '<div style="color: var(--text-secondary);">No tests run yet</div>';
        return;
    }

    list.innerHTML = history.map(item => {
        const date = new Date(item.timestamp).toLocaleTimeString();
        const className = item.success ? 'success' : 'failed';
        const icon = item.success ? '✅' : '❌';
        const duration = (item.duration / 1000).toFixed(2);
        return '<div class="history-item ' + className + '">' +
            '<div>' + icon + ' ' + item.name + '</div>' +
            '<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">' +
            date + ' • ' + duration + 's' +
            '</div></div>';
    }).join('');
}

function updateDashboard(data) {
    if (data.gitBranch) {
        document.getElementById('branchBadge').textContent = data.gitBranch;
    }
    
    changedFilesData = data.changedFiles || [];
    document.getElementById('filesBadge').textContent = data.changedFilesCount + ' changed file' + (data.changedFilesCount !== 1 ? 's' : '');

    if (data.stats) {
        document.getElementById('testsToday').textContent = data.stats.testsToday;
        document.getElementById('successRate').textContent = data.stats.successRate + '%';
        document.getElementById('avgDuration').textContent = data.stats.avgDuration + 's';
    }

    if (data.testScripts) {
        renderTestGroups(data.testScripts);
    }
    
    if (data.lastRuns) {
        const unitCard = document.querySelector('.action-card .status');
        const integrationCard = document.querySelectorAll('.action-card .status')[1];
        
        if (unitCard && data.lastRuns['test-unit']) {
            unitCard.innerHTML = 'Last run: ' + formatLastRun(data.lastRuns['test-unit']);
        }
        if (integrationCard && data.lastRuns['test-integration']) {
            integrationCard.innerHTML = 'Last run: ' + formatLastRun(data.lastRuns['test-integration']);
        }
    }
}

function formatLastRun(runInfo) {
    const now = Date.now();
    const diff = now - runInfo.timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    const icon = runInfo.success ? '✅' : '❌';
    let timeStr;
    if (minutes < 1) timeStr = 'Just now';
    else if (minutes < 60) timeStr = minutes + 'm ago';
    else if (hours < 24) timeStr = hours + 'h ago';
    else timeStr = new Date(runInfo.timestamp).toLocaleDateString();
    
    return timeStr + ' ' + icon;
}

// Message handler
window.addEventListener('message', event => {
    const message = event.data;

    switch (message.type) {
        case 'dashboardData':
            updateDashboard(message.data);
            break;
        case 'testStarted':
            currentTestOutput = 'Running tests...\n';
            document.getElementById('output').innerHTML = parseAnsi(currentTestOutput);
            document.getElementById('failuresPanel').classList.remove('visible');
            break;
        case 'testOutput':
            const output = document.getElementById('output');
            currentTestOutput += message.data.output;
            output.innerHTML = parseAnsi(currentTestOutput);
            output.scrollTop = output.scrollHeight;
            break;
        case 'testCompleted':
            const status = message.data.success ? '✅ Passed' : '❌ Failed';
            const outputEl = document.getElementById('output');
            currentTestOutput += '\n' + status;
            outputEl.innerHTML = parseAnsi(currentTestOutput);
            
            // Parse and display failures if test failed
            if (!message.data.success) {
                const failures = parseTestFailures(currentTestOutput);
                displayFailures(failures);
            } else {
                document.getElementById('failuresPanel').classList.remove('visible');
            }
            break;
        case 'testHistory':
            updateHistory(message.data.history);
            break;
    }
});

// Request initial data
vscode.postMessage({ command: 'refresh' });
