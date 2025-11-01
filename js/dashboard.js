// =======================================================
// GLOBAL CONFIGURATION & STORAGE KEYS
// =======================================================

const STORAGE_KEYS = {
    // Sanity Test Modules
    SANITY_ROUTE_MASTER: 'testingDataSanityRouteMaster',
    SANITY_SERVICES: 'testingDataSanityServices',
    SANITY_SCHEDULES: 'testingDataSanitySchedules',

    // Regression Test Modules
    REGRESSION_COUNTERS: 'testingDataRegressionCounters',
    

    // --- UPDATED KEYS FOR HOME PAGE QUICK LINKS (ONLY 2 MODULES) ---
    REGRESSION_HOME_PAGE_BLOCKING_HISTORY: 'testingDataRegressionBlockingHistory',
    REGRESSION_HOME_PAGE_BOOKING_HISTORY: 'testingDataRegressionBookingHistory',
    REGRESSION_HOME_PAGE_TICKET_HISTORY: 'testingDataRegressionTicketHistory',
    // --------------------------------------------------

    // --- UPDATED KEYS FOR REPORTS (ONLY 2 MODULES) ---
    REGRESSION_REPORT_PAGE_BRANCH_COLLECTION_REPORT: 'testingDataRegressionBranchCollectionReport',
    REGRESSION_REPORT_PAGE_ACCOUNT_COLLECTION_REPORT: 'testingDataRegressionAccountCollectionReport',
    REGRESSION_REPORT_PAGE_BUS_SERVICE_COLLECTION_REPORT: 'testingDataRegressionBusServiceCollectionReport',
	
	// --- UPDATED KEYS FOR REPORTS (ONLY 2 MODULES) ---
    REGRESSION_MANAGE_PAGE_USERS: 'testingDataRegressionUsers',
    REGRESSION_MANAGE_PAGE_BRANCHES: 'testingDataRegressionBranches',
    REGRESSION_MANAGE_PAGE_COACHES: 'testingDataRegressionCoaches',
	
		// --- UPDATED KEYS FOR REPORTS (ONLY 2 MODULES) ---
    REGRESSION_ROUTEMANAGER_PAGE_ROUTEMASTER: 'testingDataRegressionRoutemaster',
    REGRESSION_ROUTEMANAGER_PAGE_SERVICES: 'testingDataRegressionServices',
    REGRESSION_ROUTEMANAGER_PAGE_SCHEDULES: 'testingDataRegressionSchedules',
	
    // High-Level Suites
    REGRESSION_DASHBOARD: 'testingDataRegressionDashboard',
    SANITY_DASHBOARD: 'testingDataSanityDashboard'
};
window.STORAGE_KEYS = STORAGE_KEYS;

// =======================================================
// CORE UTILITIES
// =======================================================

async function fetchData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error fetching data for key ${key}:`, error);
        return [];
    }
}
window.fetchData = fetchData;

function updateStatusAndTimestamp(selectElement, timestampId) {
    const row = selectElement.closest('tr');
    const newStatus = selectElement.value;
    const timestampCell = document.getElementById(timestampId);

    // Update row class
    row.className = row.className.split(' ').filter(c => !c.endsWith('Case')).join(' ') + ` ${newStatus.toLowerCase()}Case`;

    // Update timestamp
    if (newStatus === 'Pending') {
        timestampCell.textContent = 'N/A';
    } else {
        const now = new Date();
        const datePart = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const timePart = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
        timestampCell.textContent = `${datePart} ${timePart}`;
    }

    if (window.sendDataToServer) window.sendDataToServer();
}
window.updateStatusAndTimestamp = updateStatusAndTimestamp;

// =======================================================
// METRICS CALCULATION
// =======================================================

function calculateMetrics(testCases) {
    const total = testCases.length;
    let passed = 0, failed = 0, pending = 0;

    testCases.forEach(tc => {
        if (tc.status === 'Pass') passed++;
        else if (tc.status === 'Fail') failed++;
        else pending++;
    });

    const completion = total > 0 ? ((passed + failed) / total) * 100 : 0;
    const passRate = (passed + failed) > 0 ? (passed / (passed + failed)) * 100 : 0;

    return {
        total,
        passed,
        failed,
        pending,
        completion: completion.toFixed(1),
        passRate: passRate.toFixed(1),
        status: total === 0 ? 'Pending' : (failed > 0 ? 'Fail' : (pending > 0 ? 'Partial Pass' : 'Pass'))
    };
}
window.calculateMetrics = calculateMetrics;

// -------------------------------------------------------
// Helper Functions for Modularity and Charting Logic
// -------------------------------------------------------

/**
 * Returns the list of keys for the Sanity suite modules.
 */
function getSanityModuleKeys() {
    return [
        STORAGE_KEYS.SANITY_ROUTE_MASTER, 
        STORAGE_KEYS.SANITY_SERVICES, 
        STORAGE_KEYS.SANITY_SCHEDULES
    ];
}
window.getSanityModuleKeys = getSanityModuleKeys; 

/**
 * UPDATED: Returns the list of keys for the Home Page Quick Links modules (NOW ONLY 2).
 */
function getHomePageQuickLinksModuleKeys() {
    return [
        STORAGE_KEYS.REGRESSION_HOME_PAGE_BLOCKING_HISTORY,
        STORAGE_KEYS.REGRESSION_HOME_PAGE_BOOKING_HISTORY,
		STORAGE_KEYS.REGRESSION_HOME_PAGE_TICKET_HISTORY
    ];
}
window.getHomePageQuickLinksModuleKeys = getHomePageQuickLinksModuleKeys;

/**
 * UPDATED: Returns the list of keys for the REPORTS.
 */
function getReportsModuleKeys() {
    return [
        STORAGE_KEYS.REGRESSION_REPORT_PAGE_BRANCH_COLLECTION_REPORT,
        STORAGE_KEYS.REGRESSION_REPORT_PAGE_ACCOUNT_COLLECTION_REPORT,
		STORAGE_KEYS.REGRESSION_REPORT_PAGE_BUS_SERVICE_COLLECTION_REPORT
		
    ];
}
window.getReportsModuleKeys = getReportsModuleKeys;

/**
 * UPDATED: Returns the list of keys for the MANAGE.
 */
function getManageModuleKeys() {
    return [
        STORAGE_KEYS.REGRESSION_MANAGE_PAGE_USERS,
        STORAGE_KEYS.REGRESSION_MANAGE_PAGE_BRANCHES,
		STORAGE_KEYS.REGRESSION_MANAGE_PAGE_COACHES
		
    ];
}
window.getManageModuleKeys = getManageModuleKeys;

/**
 * UPDATED: Returns the list of keys for the ROUTEMANAGER.
 */
function getRoutemanagerModuleKeys() {
    return [
        STORAGE_KEYS.REGRESSION_ROUTEMANAGER_PAGE_ROUTEMASTER,
        STORAGE_KEYS.REGRESSION_ROUTEMANAGER_PAGE_SERVICES,
		STORAGE_KEYS.REGRESSION_ROUTEMANAGER_PAGE_SCHEDULES
		
    ];
}
window.getRoutemanagerModuleKeys = getRoutemanagerModuleKeys;

/**
 * Returns the list of keys for the Regression suite modules (including Quick Links).
 */
function getRegressionModuleKeys() {
    return [
        STORAGE_KEYS.REGRESSION_COUNTERS,
        ...getHomePageQuickLinksModuleKeys(),
        ...getReportsModuleKeys(),
        ...getManageModuleKeys(),		
		...getRoutemanagerModuleKeys()    // Includes the 2 Quick Links modules
    ];
}
window.getRegressionModuleKeys = getRegressionModuleKeys; 

// =======================================================
// METRIC RENDERING
// =======================================================

// --- Global metrics for index.html ---
async function renderGlobalMetrics() {
    const keys = [...getSanityModuleKeys(), ...getRegressionModuleKeys()];
    
    let allTestCases = [];
    for (const key of keys) allTestCases.push(...await fetchData(key));
    const metrics = calculateMetrics(allTestCases);

    const overallCompletionEl = document.getElementById('global-overall-completion');
    const totalPassedEl = document.getElementById('global-total-passed');
    const totalFailedEl = document.getElementById('global-total-failed');
    const totalPendingEl = document.getElementById('global-total-pending');

    if (overallCompletionEl) overallCompletionEl.textContent = metrics.completion + '%';
    if (totalPassedEl) totalPassedEl.textContent = metrics.passed;
    if (totalFailedEl) totalFailedEl.textContent = metrics.failed;
    if (totalPendingEl) totalPendingEl.textContent = metrics.pending;

    const card = overallCompletionEl ? overallCompletionEl.closest('.metric-card.overall') : null;
    if (card) {
        card.style.borderColor = '#3b82f6';
        card.style.backgroundColor = '#e0f2fe';

        if (metrics.failed > 0) {
            card.style.borderColor = '#ef4444'; 
            card.style.backgroundColor = '#ffe6e6';
        } else if (metrics.passed === metrics.total && metrics.total > 0) {
            card.style.borderColor = '#10b981'; 
            card.style.backgroundColor = '#e6f7eb';
        } else if (metrics.total > 0) {
            card.style.borderColor = '#f59e0b'; 
            card.style.backgroundColor = '#fffbe6';
        }
    }
}
window.renderGlobalMetrics = renderGlobalMetrics;

// --- Main Dashboard Status Cards (index.html) ---
async function renderMainDashboardSummary() {
    
    const sanityKeys = getSanityModuleKeys();
    const allSanityTestCases = [];
    for (const key of sanityKeys) allSanityTestCases.push(...await fetchData(key));
    const sanityMetrics = calculateMetrics(allSanityTestCases);
    
    const regressionKeys = getRegressionModuleKeys();
    const allRegressionTestCases = [];
    for (const key of regressionKeys) allRegressionTestCases.push(...await fetchData(key));
    const regressionMetrics = calculateMetrics(allRegressionTestCases);
    
    const updateStatusCard = (elementId, metrics) => {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        let statusText = `Status: ${metrics.status}`;
        
        if (metrics.failed > 0) {
            statusText += ` (${metrics.failed} Failed)`;
        } else if (metrics.status === 'Pass') {
            statusText += ` (100% Passed)`;
        } else if (metrics.status === 'Partial Pass') {
            statusText += ` (${metrics.pending} Pending)`;
        }

        el.innerHTML = statusText.replace('Status:', 'Status: <strong>').replace(')', '</strong>)');
    };

    updateStatusCard('main-dashboard-sanity-status', sanityMetrics);
    updateStatusCard('main-dashboard-regression-status', regressionMetrics);
}
window.renderMainDashboardSummary = renderMainDashboardSummary;

// --- Suite-Specific Metrics (for sanity_dashboard.html) ---
async function renderSanitySuiteMetrics() {
    const keys = getSanityModuleKeys();
    let allTestCases = [];
    for (const key of keys) allTestCases.push(...await fetchData(key));

    const metrics = calculateMetrics(allTestCases);
    updateSuiteMetricCards(metrics, 'overallCompletion', 'totalPassed', 'totalFailed', 'totalPending');
}
window.renderSanitySuiteMetrics = renderSanitySuiteMetrics;

// --- Suite-Specific Metrics (for regression_dashboard.html) ---
async function renderRegressionSuiteMetrics() {
    const keys = getRegressionModuleKeys();
    let allTestCases = [];
    for (const key of keys) allTestCases.push(...await fetchData(key));

    const metrics = calculateMetrics(allTestCases);
    updateSuiteMetricCards(metrics, 'overallCompletion', 'totalPassed', 'totalFailed', 'totalPending');
}
window.renderRegressionSuiteMetrics = renderRegressionSuiteMetrics;

// --- Module-specific metrics (for individual test pages) ---
async function renderModuleMetrics(key) {
    if (!key) return;
    const data = await fetchData(key);
    const metrics = calculateMetrics(data);
    updateSuiteMetricCards(metrics, 'overallCompletion', 'totalPassed', 'totalFailed', 'totalPending');
}
window.renderModuleMetrics = renderModuleMetrics;

// --- Helper to update metric cards (for non-global pages) ---
function updateSuiteMetricCards(metrics, completionId, passedId, failedId, pendingId) {
    const overallCompletionEl = document.getElementById(completionId);
    const totalPassedEl = document.getElementById(passedId);
    const totalFailedEl = document.getElementById(failedId);
    const totalPendingEl = document.getElementById(pendingId);

    if (overallCompletionEl) overallCompletionEl.textContent = metrics.completion + '%';
    if (totalPassedEl) totalPassedEl.textContent = metrics.passed;
    if (totalFailedEl) totalFailedEl.textContent = metrics.failed;
    if (totalPendingEl) totalPendingEl.textContent = metrics.pending;

    const card = overallCompletionEl ? overallCompletionEl.closest('.metric-card.overall') : null;
    if (card) {
        card.style.borderColor = '#3b82f6';
        card.style.backgroundColor = '#e0f2fe';
        if (metrics.failed > 0) {
            card.style.borderColor = '#ef4444'; 
            card.style.backgroundColor = '#ffe6e6';
        } else if (metrics.passed === metrics.total && metrics.total > 0) {
            card.style.borderColor = '#10b981'; 
            card.style.backgroundColor = '#e6f7eb';
        } else if (metrics.total > 0) {
            card.style.borderColor = '#f59e0b'; 
            card.style.backgroundColor = '#fffbe6';
        }
    }
}

// =======================================================
// MODULE STATUS CARDS
// =======================================================

/**
 * Renders the Sanity module statuses.
 */
async function renderSanityModuleStatuses() {
    const container = document.getElementById('regressionModuleStatuses'); 
    if (!container) return;
    
    container.innerHTML = '';

    const modules = [
        { key: STORAGE_KEYS.SANITY_ROUTE_MASTER, title: 'Route Master', link: 'sanity_route_master_tests.html' },
        { key: STORAGE_KEYS.SANITY_SERVICES, title: 'Service', link: 'sanity_service_module_tests.html' },
        { key: STORAGE_KEYS.SANITY_SCHEDULES, title: 'Schedules', link: 'sanity_schedules_module_tests.html' }
    ];

    for (const mod of modules) {
        const data = await fetchData(mod.key);
        const metrics = calculateMetrics(data);
        const statusClass = metrics.failed > 0 ? 'fail-module' : 
                           metrics.passed === metrics.total && metrics.total > 0 ? 'pass-module' : 
                           metrics.total > 0 ? 'partial-pass-module' : 'pending-module';
        
        let statusText = '';
        if (metrics.total === 0) {
             statusText = 'No Cases';
        } else if (metrics.failed > 0) {
            statusText = `${metrics.passRate}% Pass (${metrics.passed}/${metrics.total})`;
        } else if (metrics.pending > 0) {
            const completedCases = metrics.passed + metrics.failed;
            statusText = `${metrics.completion}% Complete (${completedCases}/${metrics.total})`;
        } else {
            statusText = `100.0% Pass (${metrics.passed}/${metrics.total})`;
        }
        
        const moduleCard = document.createElement('div');
        moduleCard.className = `module-status-card card-style ${statusClass}`;
        moduleCard.onclick = () => { window.location.href = mod.link; };

        moduleCard.innerHTML = `
            <div class="module-status-name">${mod.title}</div>
            <div class="module-total-cases">${metrics.total} Cases</div>
            <div class="module-status-text status-${metrics.status === 'Pass' ? 'passed' : metrics.status === 'Fail' ? 'failed' : 'pending'}">
                ${statusText}
            </div>
        `;
        container.appendChild(moduleCard);
    }
}
window.renderSanityModuleStatuses = renderSanityModuleStatuses;

/**
 * UPDATED: Renders the Regression module statuses with Quick Links and Reports as combined groups.
 */
async function renderRegressionModuleStatuses() {
    const container = document.getElementById('regressionModuleStatuses');
    if (!container) return;
    container.innerHTML = '';

    const baseModules = [
        { key: STORAGE_KEYS.REGRESSION_COUNTERS, title: 'Counters Test Cases', link: 'regression_counters_module_tests.html' }
    ];

    // 1. Calculate Quick Links combined metrics
    const quickLinksKeys = getHomePageQuickLinksModuleKeys();
    let allQuickLinksTestCases = [];
    for (const key of quickLinksKeys) {
        allQuickLinksTestCases.push(...await fetchData(key));
    }
    const quickLinksMetrics = calculateMetrics(allQuickLinksTestCases);
    const quickLinksModuleGroup = { 
        title: 'Home Page Quick Links', 
        link: 'regression_HomePageQuickLinks_tests.html', 
        metrics: quickLinksMetrics, 
        isGroup: true 
    };

    // 2. Calculate Reports combined metrics
    const reportsKeys = getReportsModuleKeys();
    let allReportsTestCases = [];
    for (const key of reportsKeys) {
        allReportsTestCases.push(...await fetchData(key));
    }
    const reportsMetrics = calculateMetrics(allReportsTestCases);
    const reportsModuleGroup = { 
        title: 'Reports Test Cases', 
        link: 'regression_Reports_tests.html', 
        metrics: reportsMetrics, 
        isGroup: true 
    };
	
	    // 3. Calculate Manage combined metrics
    const manageKeys = getManageModuleKeys();
    let allManageTestCases = [];
    for (const key of manageKeys) {
        allManageTestCases.push(...await fetchData(key));
    }
    const manageMetrics = calculateMetrics(allManageTestCases);
    const manageModuleGroup = { 
        title: 'Manage Test Cases', 
        link: 'regression_Manage_tests.html', 
        metrics: manageMetrics, 
        isGroup: true 
    };
	
	// 4. Calculate Route Manager combined metrics
    const routemanagerKeys = getRoutemanagerModuleKeys();
    let allRoutemanagerTestCases = [];
    for (const key of routemanagerKeys) {
        allRoutemanagerTestCases.push(...await fetchData(key));
    }
    const routemanagerMetrics = calculateMetrics(allRoutemanagerTestCases);
    const routemanagerModuleGroup = { 
        title: 'Route Manager Test Cases', 
        link: 'regression_Routes_Manager_tests.html', 
        metrics: routemanagerMetrics, 
        isGroup: true 
    };

    // Combine all modules and groups (THE CORRECTED LINE)
    const modules = [...baseModules, quickLinksModuleGroup, reportsModuleGroup, manageModuleGroup, routemanagerModuleGroup]; 

    for (const mod of modules) {
        // Use pre-calculated metrics for groups, or fetch for single modules
        const metrics = mod.isGroup ? mod.metrics : calculateMetrics(await fetchData(mod.key));
        
        const statusClass = metrics.failed > 0 ? 'fail-module' : 
                           metrics.passed === metrics.total && metrics.total > 0 ? 'pass-module' : 
                           metrics.total > 0 ? 'partial-pass-module' : 'pending-module';
        
        let statusText = '';
        if (metrics.total === 0) {
             statusText = 'No Cases';
        } else if (metrics.failed > 0) {
            statusText = `${metrics.passRate}% Pass (${metrics.passed}/${metrics.total})`;
        } else if (metrics.pending > 0) {
            const completedCases = metrics.passed + metrics.failed;
            statusText = `${metrics.completion}% Complete (${completedCases}/${metrics.total})`;
        } else {
            statusText = `100.0% Pass (${metrics.passed}/${metrics.total})`;
        }
        
        const moduleCard = document.createElement('div');
        moduleCard.className = `module-status-card card-style ${statusClass}`;
        moduleCard.onclick = () => { window.location.href = mod.link; };

        moduleCard.innerHTML = `
            <div class="module-status-name">${mod.title}</div>
            <div class="module-total-cases">${metrics.total} Cases</div>
            <div class="module-status-text status-${metrics.status === 'Pass' ? 'passed' : metrics.status === 'Fail' ? 'failed' : 'pending'}">
                ${statusText}
            </div>
        `;
        container.appendChild(moduleCard);
    }
}
window.renderRegressionModuleStatuses = renderRegressionModuleStatuses;

// =======================================================
// DATA INITIALIZATION
// =======================================================

const dummyTestCase = (id, subModule, testCase, expectedResult) => ({
    id: String(id),
    subModule: subModule,
    testCase: testCase,
    testSteps: 'N/A',
    testData: 'N/A',
    expectedResult: expectedResult,
    actualResult: '',
    tester: 'Unassigned',
    status: 'Pending',
    timestamp: 'N/A'
});

function initializeDefaultData() {
    if (localStorage.getItem(STORAGE_KEYS.SANITY_ROUTE_MASTER)) {
        console.log("Default data already initialized.");
        return;
    }

    console.log("Initializing default test data for all modules...");
    
    // Sanity Modules
    const sanityRouteMaster = [
        dummyTestCase(1, 'Routing', 'Verify basic navigation (Home)', 'Home page loads without error.'),
        dummyTestCase(2, 'Routing', 'Verify 404 handling', 'User is redirected to a custom 404 error page.'),
    ];
    localStorage.setItem(STORAGE_KEYS.SANITY_ROUTE_MASTER, JSON.stringify(sanityRouteMaster));

    const sanityServices = [
        dummyTestCase(1, 'API Check', 'Verify User API response', 'User list API returns HTTP 200 and a non-empty array.'),
        dummyTestCase(2, 'Database', 'Verify DB connection (Read)', 'Retrieve mock data from database successfully.'),
    ];
    localStorage.setItem(STORAGE_KEYS.SANITY_SERVICES, JSON.stringify(sanityServices));
    
    const sanitySchedules = [
        dummyTestCase(1, 'Scheduled Task', 'Verify nightly backup job', 'Backup job starts and completes successfully with logs.'),
    ];
    localStorage.setItem(STORAGE_KEYS.SANITY_SCHEDULES, JSON.stringify(sanitySchedules));

    // Regression Modules 
	
    const regressionCounters = [
        dummyTestCase(1, 'Tracking', 'Verify unique visitor counter', 'The visitor count increments by 1 for a new session.'),
    ];
    localStorage.setItem(STORAGE_KEYS.REGRESSION_COUNTERS, JSON.stringify(regressionCounters));
    
    // UPDATED: Quick Links Modules (Only 2 now)
    const quickLinksBlockingHistory = [
        dummyTestCase(1, 'Block User', 'Verify blocking non-existent user', 'System shows "User not found" error.'),
        dummyTestCase(2, 'Block User', 'Verify blocking an active user', 'User is successfully blocked and status changes.'),
    ];
    localStorage.setItem(STORAGE_KEYS.REGRESSION_HOME_PAGE_BLOCKING_HISTORY, JSON.stringify(quickLinksBlockingHistory));

    const quickLinksBookingHistory = [
        dummyTestCase(1, 'Search', 'Verify search by date range', 'History shows bookings within the selected date range.'),
        dummyTestCase(2, 'Details', 'Verify booking details view', 'Clicking on a booking shows all trip details.'),
    ];
    localStorage.setItem(STORAGE_KEYS.REGRESSION_HOME_PAGE_BOOKING_HISTORY, JSON.stringify(quickLinksBookingHistory));
	
	const quickLinksTicketHistory = [
        dummyTestCase(1, 'Search', 'Verify search by date range', 'History shows ticket within the selected date range.'),
        dummyTestCase(2, 'Details', 'Verify ticket details view', 'Clicking on a ticket shows all trip details.'),
    ];
    localStorage.setItem(STORAGE_KEYS.REGRESSION_HOME_PAGE_TICKET_HISTORY, JSON.stringify(quickLinksTicketHistory));
	
	// UPDATED: REPORTS
	
	 const ReportsBranchCollectionReport = [
        dummyTestCase(1, 'Block User', 'Verify blocking non-existent user', 'System shows "User not found" error.'),
        dummyTestCase(2, 'Block User', 'Verify blocking an active user', 'User is successfully blocked and status changes.'),
    ];
    localStorage.setItem(STORAGE_KEYS.REGRESSION_REPORT_PAGE_BRANCH_COLLECTION_REPORT, JSON.stringify(ReportsBranchCollectionReport));

    const ReportsAccountTransactionReport = [
        dummyTestCase(1, 'Search', 'Verify search by date range', 'History shows bookings within the selected date range.'),
        dummyTestCase(2, 'Details', 'Verify booking details view', 'Clicking on a booking shows all trip details.'),
    ];
    localStorage.setItem(STORAGE_KEYS.REGRESSION_REPORT_PAGE_ACCOUNT_COLLECTION_REPORT, JSON.stringify(ReportsAccountTransactionReport));
	
	const ReportsBUSServiceCollectionReport = [
        dummyTestCase(1, 'Search', 'Verify search by date range', 'History shows ticket within the selected date range.'),
        dummyTestCase(2, 'Details', 'Verify ticket details view', 'Clicking on a ticket shows all trip details.'),
    ];
    localStorage.setItem(STORAGE_KEYS.REGRESSION_REPORT_PAGE_BUS_SERVICE_COLLECTION_REPORT, JSON.stringify(ReportsBUSServiceCollectionReport));
	
    // UPDATED: MANAGE
	
	 const ManageUsers = [
        dummyTestCase(1, 'Block User', 'Verify blocking non-existent user', 'System shows "User not found" error.'),
        dummyTestCase(2, 'Block User', 'Verify blocking an active user', 'User is successfully blocked and status changes.'),
    ];
    localStorage.setItem(STORAGE_KEYS.REGRESSION_MANAGE_PAGE_USERS, JSON.stringify(ManageUsers));

    const ManageBranches = [
        dummyTestCase(1, 'Search', 'Verify search by date range', 'History shows bookings within the selected date range.'),
        dummyTestCase(2, 'Details', 'Verify booking details view', 'Clicking on a booking shows all trip details.'),
    ];
    localStorage.setItem(STORAGE_KEYS.REGRESSION_MANAGE_PAGE_BRANCHES, JSON.stringify(ManageBranches));
	
	const ManageCoaches = [
        dummyTestCase(1, 'Search', 'Verify search by date range', 'History shows ticket within the selected date range.'),
        dummyTestCase(2, 'Details', 'Verify ticket details view', 'Clicking on a ticket shows all trip details.'),
    ];
    localStorage.setItem(STORAGE_KEYS.REGRESSION_MANAGE_PAGE_COACHES, JSON.stringify(ManageCoaches));
	
	// UPDATED: ROUTEMANAGER
	
	 const RoutemanagerRoutemaster = [
        dummyTestCase(1, 'Block User', 'Verify blocking non-existent user', 'System shows "User not found" error.'),
        dummyTestCase(2, 'Block User', 'Verify blocking an active user', 'User is successfully blocked and status changes.'),
    ];
    localStorage.setItem(STORAGE_KEYS.REGRESSION_ROUTEMANAGER_PAGE_ROUTEMASTER, JSON.stringify(RoutemanagerRoutemaster));

    const RoutemanagerServices = [
        dummyTestCase(1, 'Search', 'Verify search by date range', 'History shows bookings within the selected date range.'),
        dummyTestCase(2, 'Details', 'Verify booking details view', 'Clicking on a booking shows all trip details.'),
    ];
    localStorage.setItem(STORAGE_KEYS.REGRESSION_ROUTEMANAGER_PAGE_SERVICES, JSON.stringify(RoutemanagerServices));
	
	const RoutemanagerSchedules = [
        dummyTestCase(1, 'Search', 'Verify search by date range', 'History shows ticket within the selected date range.'),
        dummyTestCase(2, 'Details', 'Verify ticket details view', 'Clicking on a ticket shows all trip details.'),
    ];
    localStorage.setItem(STORAGE_KEYS.REGRESSION_ROUTEMANAGER_PAGE_SCHEDULES, JSON.stringify(RoutemanagerSchedules));
    
    console.log("Initialization complete.");
}
window.initializeDefaultData = initializeDefaultData;

// =======================================================
// MODULE DATA & TABLE UTILITIES
// =======================================================

async function initModuleData(key, initialTests) {
    if (!key || !initialTests) { 
        console.error("Missing key or initial tests"); 
        return; 
    }
    window.MODULE_KEY = key;

    const savedData = await fetchData(key);
    const finalData = savedData.length === 0 ? initialTests : savedData;

    if (savedData.length === 0 && finalData.length > 0) {
        localStorage.setItem(key, JSON.stringify(finalData));
    }

    window.testCaseCounter = finalData.length > 0 ? finalData.reduce((max, item) => {
        const num = parseInt(item.id.replace(/[^0-9]/g, ''), 10);
        return num > max ? num : max;
    }, 0) + 1 : 1;

    renderTestCaseTable(key);
}
window.initModuleData = initModuleData;

async function renderTestCaseTable(key) {
    if (!key) return;
    const tableBody = document.querySelector('#testCaseTable tbody');
    const loadingMessage = document.getElementById('loadingMessage');
    if (!tableBody) return;

    const data = await fetchData(key);
    tableBody.innerHTML = '';
    if (loadingMessage) loadingMessage.style.display = 'none';

    if (window.renderTable) window.renderTable(data);
    else tableBody.innerHTML = `<tr><td colspan="10" class="text-center text-red-500">Error: Rendering function missing. Found ${data.length} test cases.</td></tr>`;
}
window.renderTestCaseTable = renderTestCaseTable;

function addNewTestCase(prefix = 'TC-') {
    if (window.addNewRegressionCase) window.addNewRegressionCase(prefix);
    else console.error("Cannot add new case: window.addNewRegressionCase is not defined.");
}
window.addNewTestCase = addNewTestCase;

// =======================================================
// SAVE / RESET UTILITIES
// =======================================================

async function sendDataToServer() {
    if (!window.MODULE_KEY) { 
        console.error("MODULE_KEY not defined"); 
        return; 
    }
    if (window.saveRegressionData) { 
        await window.saveRegressionData(); 
        return; 
    } 

    const saveButton = document.getElementById('saveDataButton');
    if (!saveButton) return;

    const originalText = saveButton.textContent;
    saveButton.textContent = "SAVING...";
    saveButton.disabled = true;

    try {
        if (window.gatherDataFromTable) {
            const data = window.gatherDataFromTable();
            localStorage.setItem(window.MODULE_KEY, JSON.stringify(data));

            saveButton.textContent = "SAVED!";
            saveButton.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'bg-red-500');
            saveButton.classList.add('bg-green-500');

            if (window.renderTestCaseTable) await window.renderTestCaseTable(window.MODULE_KEY);
            if (window.renderModuleMetrics) await window.renderModuleMetrics(window.MODULE_KEY);
        } else {
            saveButton.textContent = "SAVE FAILED (No Gather Function)";
            saveButton.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'bg-green-500');
            saveButton.classList.add('bg-red-500');
            console.error("Save failed: window.gatherDataFromTable is not defined on the current page.");
        }
    } catch (error) {
        console.error("Save failed due to error:", error);
        saveButton.textContent = "SAVE FAILED (Internal Error)";
        saveButton.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'bg-green-500');
        saveButton.classList.add('bg-red-500');
    } finally {
        setTimeout(() => {
            saveButton.textContent = originalText;
            saveButton.classList.remove('bg-green-500', 'bg-red-500');
            saveButton.classList.add('bg-blue-500', 'hover:bg-blue-600');
            saveButton.disabled = false;
        }, 1500);
    }
}
window.sendDataToServer = sendDataToServer;

function resetCurrentModuleExecution() {
    if (!window.MODULE_KEY) { 
        console.error("MODULE_KEY not defined. Cannot reset module."); 
        return; 
    }

    fetchData(window.MODULE_KEY).then(data => {
        const resetData = data.map(item => ({ ...item, status: 'Pending', timestamp: 'N/A', actualResult: '' }));
        localStorage.setItem(window.MODULE_KEY, JSON.stringify(resetData));
        window.location.reload();
    }).catch(error => {
        console.error("Module reset failed:", error);
    });
}
window.resetCurrentModuleExecution = resetCurrentModuleExecution;

// =======================================================
// EXPORT DATA UTILITIES
// =======================================================

async function exportDashboardData(type, suite) {
    const keys = suite === 'Sanity' ? getSanityModuleKeys() : getRegressionModuleKeys();
    let allTestCases = [];

    for (const key of keys) {
        const moduleCases = await fetchData(key);
        const moduleName = key.replace('testingData', '').replace('Sanity', '').replace('Regression', '');
        moduleCases.forEach(tc => tc.module = moduleName);
        allTestCases.push(...moduleCases);
    }
    
    const showNotification = (message) => {
        alert(message);
    };

    if (type === 'csv') {
        if (allTestCases.length === 0) {
            showNotification(`No data available to export for ${suite} suite.`);
            return;
        }
        
        const headers = ["ID", "Module", "Sub Module", "Test Case", "Test Steps", "Test Data", "Expected Result", "Actual Result", "Tester", "Status", "Timestamp"];
        const csvRows = [headers.join(',')];

        const cleanAndQuote = (text) => {
            let cleaned = (text || '').toString().replace(/[\r\n]+/g, ' ').trim();
            cleaned = cleaned.replace(/"/g, '""');
            return `"${cleaned}"`;
        };
        
        for (const item of allTestCases) {
            const row = [
                cleanAndQuote((item.id || '').padStart(3, '0')),
                cleanAndQuote(item.module || ''),
                cleanAndQuote(item.subModule || ''),
                cleanAndQuote(item.testCase || ''),
                cleanAndQuote(item.testSteps || ''),
                cleanAndQuote(item.testData || ''),
                cleanAndQuote(item.expectedResult || ''),
                cleanAndQuote(item.actualResult || ''),
                cleanAndQuote(item.tester || ''),
                cleanAndQuote(item.status || ''),
                cleanAndQuote(item.timestamp || 'N/A')
            ];
            csvRows.push(row.join(','));
        }

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");

        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${suite.toLowerCase()}_dashboard_export_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`${suite} suite data exported to CSV successfully!`);

    } else if (type === 'pdf') {
        if (allTestCases.length === 0) {
            showNotification(`No data available to print for ${suite} suite.`);
            return;
        }

        let reportHtml = `
            <html>
            <head>
                <title>${suite} Dashboard Report</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    h1 { color: #007bff; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 10px; }
                    th { background-color: #f2f2f2; }
                    .status-Pass { background-color: #e6ffe6; }
                    .status-Fail { background-color: #ffe6e6; }
                </style>
            </head>
            <body>
                <h1>${suite} Test Suite Dashboard Export - ${new Date().toLocaleDateString()}</h1>
                <p>Total Cases: ${allTestCases.length}</p>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th><th>Module</th><th>Sub Module</th><th>Test Case</th><th>Status</th><th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        allTestCases.forEach(item => {
            reportHtml += `
                <tr class="status-${item.status}">
                    <td>${(item.id || '').toString().padStart(3, '0')}</td>
                    <td>${item.module || ''}</td>
                    <td>${item.subModule || ''}</td>
                    <td>${item.testCase || ''}</td>
                    <td>${item.status || 'Pending'}</td>
                    <td>${item.timestamp || 'N/A'}</td>
                </tr>
            `;
        });

        reportHtml += `
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write(reportHtml);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
        
        showNotification(`Printing initiated for ${suite} suite data. Please use your browser's print dialog to 'Save as PDF'.`);

    } else if (type === 'rest') {
        if (allTestCases.length === 0) {
            showNotification(`No data to send via REST API for ${suite} suite.`);
            return;
        }
        
        console.log(`--- SIMULATING REST API CALL for ${suite} Suite ---`);
        console.log('Data payload to be sent:', allTestCases);
        console.log('Endpoint: /api/export-dashboard-data');
        console.log('----------------------------------------------------');
        
        showNotification(`${suite} suite data successfully logged and simulated for REST API export! (Check Console for payload)`);
    }
}
window.exportDashboardData = exportDashboardData;

// =======================================================
// INITIALIZATION
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeDefaultData(); 
});