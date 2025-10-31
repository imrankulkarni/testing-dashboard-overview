// SHARED SANITY SUITE LOGIC
// This file contains the common functions for all granular Sanity Test Modules.
// It relies on global functions (fetchData, updateStatusAndTimestamp, etc.) from dashboard.js (assumed to be loaded).

const TESTERS = ['Imran', 'John', 'Naresh', 'Saliq', 'Yusuf']; // Used for the default list of testers
let testCaseCounter = 1; // Used for generating new IDs and tracked across sessions

// CRITICAL GLOBAL VARIABLE: This holds the specific key for the current module (e.g., 'testingDataSanityRouteMaster').
// It is set when the page loads via the initializeSanityModule function at the bottom.
let CURRENT_MODULE_KEY = null;

// =======================================================
// MODULE METRICS CALCULATION
// =======================================================

/**
 * Calculates and renders metrics for the CURRENT module, using ONLY its test cases.
 * This is the fix for displaying wrong data on module pages.
 * @param {Array} testCases - The test case objects specific to the current module.
 */
function calculateModuleMetricsAndRender(testCases) {
    if (!testCases || testCases.length === 0) {
        // Clear metrics if no data
        const completionEl = document.getElementById('overallCompletion');
        if (completionEl) completionEl.innerText = '0.0%';
        const passedEl = document.getElementById('totalPassed');
        if (passedEl) passedEl.innerText = '0';
        const failedEl = document.getElementById('totalFailed');
        if (failedEl) failedEl.innerText = '0';
        const pendingEl = document.getElementById('totalPending');
        if (pendingEl) pendingEl.innerText = '0';
        return;
    }

    let total = testCases.length;
    let passed = 0;
    let failed = 0;
    let pending = 0;

    for (const testCase of testCases) {
        if (testCase.status === 'Pass') {
            passed++;
        } else if (testCase.status === 'Fail') {
            failed++;
        } else {
            pending++;
        }
    }
    
    let completion = total > 0 ? ((passed + failed) / total) * 100 : 0;

    // Update the metrics elements on the current module page (IDs are local to the page)
    const completionEl = document.getElementById('overallCompletion');
    if (completionEl) completionEl.innerText = completion.toFixed(1) + '%';
    
    const passedEl = document.getElementById('totalPassed');
    if (passedEl) passedEl.innerText = passed.toString();
    
    const failedEl = document.getElementById('totalFailed');
    if (failedEl) failedEl.innerText = failed.toString();
    
    const pendingEl = document.getElementById('totalPending');
    if (pendingEl) pendingEl.innerText = pending.toString();
}

// =======================================================
// LIVE STATUS AND TIMESTAMP UPDATE HANDLER (CORRECTED FOR PERSISTENCE)
// =======================================================

/**
 * Handles status change, updates timestamp, recalculates metrics, and CRITICALLY,
 * immediately persists the data to localStorage to maintain count accuracy.
 * @param {HTMLSelectElement} selectElement - The status select dropdown that was changed.
 * @param {string} timestampId - The ID of the timestamp element to update.
 */
function updateStatusAndTimestamp(selectElement, timestampId) {
    const newStatus = selectElement.value;
    const row = selectElement.closest('tr');
    const timestampEl = document.getElementById(timestampId);

    // 1. Update row class for visual feedback
    row.className = newStatus.toLowerCase();

    // 2. Update timestamp
    let formattedTime = 'N/A';
    if (newStatus !== 'Pending') {
        const now = new Date();
        formattedTime = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    }
    if (timestampEl) {
        timestampEl.textContent = formattedTime;
    }

    // 3. Read the table data *after* the status change is reflected in the UI.
    const currentData = gatherDataFromTable();
    
    // 4. Recalculate and render metrics using the NEW data state
    calculateModuleMetricsAndRender(currentData);
    
    // 5. CRITICAL FIX: Immediately save the updated data to localStorage
    if (CURRENT_MODULE_KEY) {
        try {
            localStorage.setItem(CURRENT_MODULE_KEY, JSON.stringify(currentData));
            // Optional: Call global metrics update to keep the main dashboard correct
            if (window.renderGlobalMetrics) {
                // Use setTimeout to run this asynchronously to prevent UI lag
                setTimeout(window.renderGlobalMetrics, 0); 
            }
        } catch (error) {
            console.error("Error auto-saving status change:", error);
        }
    } else {
        console.error("Error: CURRENT_MODULE_KEY is null. Status change could not be saved.");
    }
}
// Expose globally for the select element's onchange event
window.updateStatusAndTimestamp = updateStatusAndTimestamp;


// =======================================================
// 1. DATA GATHERING & PERSISTENCE
// =======================================================

/**
 * Gathers all data from the currently visible test case table in the UI.
 * It intelligently reads values from <input> or the cell's text content.
 * @returns {Array} List of test case objects.
 */
function gatherDataFromTable() {
    const tableRows = document.querySelectorAll('#testCaseTable tbody tr');
    const data = [];

    tableRows.forEach((row) => {
        const rowId = row.id.replace('row_', '');

        // Selectors for cells
        const subModuleCell = row.querySelector('td:nth-child(2)');
        const testCaseCell = row.querySelector('td:nth-child(3)');
        const testStepCell = row.querySelector('td:nth-child(4)');
        const testDataCell = row.querySelector('td:nth-child(5)');
        const expectedResultCell = row.querySelector('td:nth-child(6)');
        
        const actualResultTextarea = row.querySelector('td:nth-child(7) textarea');
        
        const testerSelect = row.querySelector('td:nth-child(8) .tester-name');
        const statusSelect = row.querySelector('td:nth-child(9) .status-select');
        const timestampEl = row.querySelector('td:nth-child(10)');

        // Helper to get value from a cell: check for input/textarea/select children, otherwise use textContent
        const getValue = (cell) => {
            const input = cell.querySelector('input, textarea, select');
            if (input) {
                return input.value;
            }
            // For static text fields, normalize steps (replace <br> with \n for storage)
            if (cell.innerHTML.includes('<br')) {
                 return cell.innerHTML.replace(/<br\s*\/?>/gi, '\n').trim();
            }
            return cell.textContent.trim();
        };

        const testCase = {
            id: rowId,
            subModule: getValue(subModuleCell),
            testCase: getValue(testCaseCell),
            testSteps: getValue(testStepCell), 
            testData: getValue(testDataCell),
            expectedResult: getValue(expectedResultCell),
            actualResult: actualResultTextarea ? actualResultTextarea.value : '',
            tester: testerSelect ? testerSelect.value : '',
            // CRITICAL: Ensure we get the status directly from the select element if it exists
            status: statusSelect ? statusSelect.value : (row.className.charAt(0).toUpperCase() + row.className.slice(1)) || 'Pending',
            timestamp: timestampEl ? timestampEl.textContent : 'N/A',
            isStatic: row.getAttribute('data-static') === 'true', // Track static rows
            isNew: row.getAttribute('data-is-new') === 'true' // CRITICAL: Track unsaved new rows
        };

        data.push(testCase);
    });

    return data;
}

/**
 * Saves the current data from the table into localStorage.
 */
async function sendDataToServer() {
    if (!CURRENT_MODULE_KEY) {
        console.error("Error: Module key is not defined. Cannot save."); 
        return;
    }

    const data = gatherDataFromTable();
    
    // Before saving, ensure all 'isNew' flags are set to false, converting them to standard saved records
    const saveData = data.map(item => ({
        ...item,
        isNew: false // Mark as saved
    }));

    // Save visual feedback
    const saveButton = document.querySelector('.actions button[onclick="sendDataToServer()"]');
    const originalText = saveButton.textContent;

    try {
        saveButton.textContent = "SAVING...";
        saveButton.disabled = true;

        // Use localStorage.setItem
        localStorage.setItem(CURRENT_MODULE_KEY, JSON.stringify(saveData));

        // Re-render the table with the saved data. This is what converts the new row's inputs to static text.
        // We pass null for initialTests so it forces loading from localStorage/savedData.
        await loadTestCases(CURRENT_MODULE_KEY, null); 

        // Update global metrics after data is saved and re-rendered (Only if we are on the dashboard)
        if (window.renderGlobalMetrics) {
            await window.renderGlobalMetrics();
        }

        saveButton.textContent = "SAVED!";
        
    } catch (error) {
        console.error("Error saving data:", error);
        saveButton.textContent = "SAVE FAILED";
    } finally {
        // Reset button after a short delay
        setTimeout(() => {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }, 1500);
    }
}
// Expose globally for HTML button
window.sendDataToServer = sendDataToServer;

/**
 * Renders the saved or temporary data onto the table.
 * @param {Array} data - The array of test case objects.
 */
function renderTable(data) {
    const tbody = document.querySelector('#testCaseTable tbody');
    if (!tbody) return;

    // Clear existing content
    tbody.innerHTML = ''; 
    let maxId = 0;

    data.forEach(item => {
        // Use the ID from the item, padded for display
        const rowId = item.id;
        const rowIdNum = parseInt(rowId, 10);
        if (rowIdNum > maxId) {
            maxId = rowIdNum;
        }

        const isStatic = item.isStatic === true ? 'true' : 'false';
        const isNew = item.isNew === true; // CRITICAL check for edit mode

        const row = document.createElement('tr');
        row.id = `row_${rowId.padStart(3, '0')}`;
        row.setAttribute('data-static', isStatic);
        row.setAttribute('data-is-new', isNew); // Set the flag
        row.className = item.status.toLowerCase();

        // 1. ID
        const cellId = document.createElement('td');
        cellId.className = 'test-case-id';
        cellId.textContent = rowId.padStart(3, '0');
        row.appendChild(cellId);

        // 2-6: Sub Module, Test Case, Test Steps, Test Data, Expected Result
        const fields = [
            { key: 'subModule', type: 'input', rows: 1 }, 
            { key: 'testCase', type: 'textarea', rows: 3 }, 
            { key: 'testSteps', type: 'textarea', rows: 3 }, 
            { key: 'testData', type: 'textarea', rows: 3 }, 
            { key: 'expectedResult', type: 'textarea', rows: 3 }
        ];

        fields.forEach(field => {
            const cell = document.createElement('td');
            const content = item[field.key] || '';
            
            if (isNew) {
                // If it's a new, unsaved row, render as an editable input/textarea
                const element = document.createElement(field.type);
                element.value = content.replace(/\n/g, ' '); // Clean newlines for input display
                if (field.type === 'textarea') element.rows = field.rows;
                if (field.type === 'input') element.setAttribute('type', 'text');
                
                cell.appendChild(element);
            } else {
                // If it's a saved (not new) row, render as static text
                cell.innerHTML = content.replace(/\n/g, '<br>'); // Re-insert <br> for display
            }
            row.appendChild(cell);
        });
        
        // 7. Actual Result (Textarea - ALWAYS Editable)
        const cellActual = document.createElement('td');
        const actualTextarea = document.createElement('textarea');
        actualTextarea.rows = 3;
        actualTextarea.placeholder = "Enter actual result";
        actualTextarea.value = item.actualResult || '';
        cellActual.appendChild(actualTextarea);
        row.appendChild(cellActual);

        // 8. Tester (Select - ALWAYS Editable)
        const cellTester = document.createElement('td');
        const testerSelect = document.createElement('select');
        testerSelect.className = 'tester-name';
        TESTERS.forEach(tester => {
            const option = document.createElement('option');
            option.value = tester;
            option.textContent = tester;
            if (tester === item.tester) {
                option.selected = true;
            }
            testerSelect.appendChild(option);
        });
        cellTester.appendChild(testerSelect);
        row.appendChild(cellTester);

        // 9. Status (Select - ALWAYS Editable)
        const cellStatus = document.createElement('td');
        const statusSelect = document.createElement('select');
        statusSelect.className = 'status-select';
        
        // CRITICAL FIX: The onchange event now calls our new function which recalculates metrics AND saves
        statusSelect.onchange = function() {
            window.updateStatusAndTimestamp(this, `timestamp_${rowId.padStart(3, '0')}`);
        };
        
        ['Pending', 'Pass', 'Fail'].forEach(status => {
            const option = document.createElement('option');
            const statusValue = status;
            option.value = statusValue;
            option.textContent = status;
            if (statusValue === item.status) {
                option.selected = true;
            }
            statusSelect.appendChild(option);
        });
        cellStatus.appendChild(statusSelect);
        row.appendChild(cellStatus);

        // 10. Date/Time
        const cellTimestamp = document.createElement('td');
        cellTimestamp.id = `timestamp_${rowId.padStart(3, '0')}`;
        cellTimestamp.textContent = item.timestamp || 'N/A';
        row.appendChild(cellTimestamp);

        tbody.appendChild(row);
    });

    // Update the counter for next new case, only if we processed some data
    if (data.length > 0) {
        testCaseCounter = maxId + 1;
    }
}


/**
 * Loads the test case data from localStorage or initial data and calls renderTable.
 * @param {string} key - The unique storage key for this module.
 * @param {Array | null} initialTests - The module-specific static test cases from the HTML file (or null on save).
 */
async function loadTestCases(key, initialTests) { 
    
    // fetchData is assumed to be a global function that gets data from localStorage by key.
    // If window.fetchData is not defined, fall back to simple localStorage access.
    const savedData = (typeof window.fetchData === 'function') 
        ? await window.fetchData(key) 
        : JSON.parse(localStorage.getItem(key));
        
    let finalTestCases = initialTests || []; // Default to the passed initial array or an empty array

    if (savedData && savedData.length > 0) {
        finalTestCases = savedData; // Use saved data if available
    }

    renderTable(finalTestCases);
    
    // Update local metrics after loading the data (initial load)
    calculateModuleMetricsAndRender(finalTestCases); 
}


/**
 * Initializes the module by fetching saved data and rendering the table.
 * @param {string} key - The unique storage key for this module (e.g., 'testingDataSanityRouteMaster').
 * @param {Array} initialTests - The module-specific static test cases array.
 */
async function initializeSanityModule(key, initialTests) { 
    CURRENT_MODULE_KEY = key;

    // Load and render the table, and calculate local metrics
    await loadTestCases(key, initialTests); 

    // The call to window.renderGlobalMetrics is correctly excluded here.
}
// Expose globally for HTML to call
window.initializeSanityModule = initializeSanityModule;


// =======================================================
// 2. ACTION BUTTON HANDLERS 
// =======================================================

/**
 * Adds a new, blank test case row to the table.
 */
function addTestCase() {
    
    const newId = String(testCaseCounter).padStart(3, '0');
    
    // Create the new data object based on defaults
    const newCase = {
        id: newId,
        subModule: 'New Module/Feature',
        testCase: 'User-Added Sanity Case',
        testSteps: '1. Step 1.\n2. Step 2.\n3. Verify result.',
        testData: 'Input Data',
        expectedResult: 'Expected Outcome.',
        actualResult: '',
        tester: TESTERS[0] || 'Tester', // Default tester (first in list)
        status: 'Pending',
        timestamp: 'N/A',
        isStatic: false,
        isNew: true // CRITICAL: Mark as new/unsaved
    };

    // 1. Get current data from the table (including any unsaved edits)
    const currentData = gatherDataFromTable();
    
    // 2. Add new case
    currentData.push(newCase);
    
    // 3. Re-render the table with the new data. 
    renderTable(currentData);

    // 4. Update metrics after adding a new 'Pending' case
    calculateModuleMetricsAndRender(currentData);
}
// Expose globally for HTML button
window.addTestCase = addTestCase;

/**
 * Resets the status of ALL test cases for the current module to 'Pending'.
 */
function resetTestCases() {
    if (!CURRENT_MODULE_KEY) {
        console.error("Error: Module key is not defined. Cannot reset.");
        return;
    }
    
    // Rule compliance: window.confirm/alert is disallowed. 
    // In a real application, this should be a custom modal. Here, we proceed with reset.
    console.warn("Resetting all test cases to 'Pending' for module: " + CURRENT_MODULE_KEY);

    try {
        const currentData = gatherDataFromTable();
        
        const resetData = currentData.map(item => ({
            ...item,
            status: 'Pending',
            timestamp: 'N/A',
            actualResult: '', // Clear actual result too
            isNew: false // Ensure reset cases are not marked as new/unsaved
        }));

        // 1. Save the reset data (updates localStorage)
        localStorage.setItem(CURRENT_MODULE_KEY, JSON.stringify(resetData));

        // 2. Re-render the table with the reset data
        renderTable(resetData);
        
        // 3. Update global metrics display (only if on the dashboard)
        if (window.renderGlobalMetrics) {
            window.renderGlobalMetrics();
        }
        
        // CRITICAL: Update local module metrics after reset
        calculateModuleMetricsAndRender(resetData);

        console.log("Test cases successfully reset to Pending!");
        
    } catch (error) {
        console.error("Error during reset:", error);
    }
}
// Expose globally for HTML button
window.resetTestCases = resetTestCases;


/**
 * Exports the current data to a CSV file.
 */
function exportDataToCSV() {
    if (!CURRENT_MODULE_KEY) {
        console.error("Error: Module key is not defined. Cannot export."); 
        return;
    }

    const data = gatherDataFromTable();

    if (data.length === 0) {
        console.warn("No data available to export. Please save data first.");
        return;
    }

    // Generate CSV content
    const header = [
        "ID", "Sub Module", "Test Case", "Test Steps", "Test Data", 
        "Expected Result", "Actual Result", "Tester", "Status", "Date/Time"
    ];

    const csvRows = [];
    csvRows.push(header.join(',')); // Add header row

    for (const item of data) {
        // Clean up text content and quote fields that might contain commas
        const cleanAndQuote = (text) => {
            // Remove newlines and trim whitespace
            let cleaned = String(text || '').replace(/[\r\n]+/g, ' ').trim();
            // Escape double quotes by turning them into two double quotes (" becomes "")
            cleaned = cleaned.replace(/"/g, '""');
            // Wrap in double quotes if it contains a comma or escaped quotes (just wrap always for safety)
            return `"${cleaned}"`;
        };

        const row = [
            cleanAndQuote(item.id.padStart(3, '0')),
            cleanAndQuote(item.subModule),
            cleanAndQuote(item.testCase),
            cleanAndQuote(item.testSteps),
            cleanAndQuote(item.testData),
            cleanAndQuote(item.expectedResult),
            cleanAndQuote(item.actualResult),
            cleanAndQuote(item.tester),
            cleanAndQuote(item.status),
            cleanAndQuote(item.timestamp)
        ];
        csvRows.push(row.join(','));
    }

    // Create a Blob and download the file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");

    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${CURRENT_MODULE_KEY}_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// Expose globally for HTML button
window.exportDataToCSV = exportDataToCSV;