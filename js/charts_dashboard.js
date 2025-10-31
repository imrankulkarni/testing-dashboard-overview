// Global variables to hold chart instances for destruction/re-creation
let testerChartInstance = null;
let consolidatedChartInstance = null;
let moduleCompletionChartInstance = null;
let dailyTrendChartInstance = null; // NEW: Global instance for the daily trend chart

// Colors mapped to the user's CSS variables for Chart.js
const STATUS_COLORS = {
    'Pass': '#10b981',        // --color-success
    'Fail': '#ef4444',        // --color-failure
    'Pending': '#f59e0b',     // --color-pending

    // Colors for Module Completion Chart (Completed vs. Not Completed) and Line Chart
    'Completed': '#2172f3',   // --color-primary
    'NotCompleted': '#f59e0b',// --color-pending
    'LineChart': '#2172f3',   // --color-primary
};

// =======================================================
// UTILITIES & AGGREGATION
// (Assumes getSanityModuleKeys, getRegressionModuleKeys, fetchData, calculateMetrics are defined in dashboard.js)
// =======================================================

function getKeysForSuite(suite) {
    if (suite === 'Sanity' && typeof getSanityModuleKeys === 'function') {
        return getSanityModuleKeys();
    } else if (suite === 'Regression' && typeof getRegressionModuleKeys === 'function') {
        return getRegressionModuleKeys();
    }
    return [];
}

async function aggregateDataByTester(suite) {
    const keys = getKeysForSuite(suite);
    const allDataPromises = keys.map(key => fetchData(key));
    const allTestData = (await Promise.all(allDataPromises)).flat();

    const testerData = {};
    allTestData.forEach(testCase => {
        const tester = testCase.tester || 'Unassigned';
        if (!testerData[tester]) {
            testerData[tester] = { passed: 0, failed: 0, pending: 0, total: 0 };
        }

        testerData[tester].total++;
        if (testCase.status === 'Pass') {
            testerData[tester].passed++;
        } else if (testCase.status === 'Fail') {
            testerData[tester].failed++;
        } else {
            testerData[tester].pending++;
        }
    });

    return testerData;
}

async function aggregateSuiteMetrics(suite) {
    const keys = getKeysForSuite(suite);
    const allTestData = (await Promise.all(keys.map(key => fetchData(key)))).flat();
    return calculateMetrics(allTestData);
}

async function aggregateModuleCompletionMetrics(suite) {
    const keys = getKeysForSuite(suite);
    const moduleMetrics = [];

    for (const key of keys) {
        const data = await fetchData(key);
        const metrics = calculateMetrics(data);

        if (metrics.total > 0) {
            const moduleName = key.replace(/testingData(Sanity|Regression)/, '').replace(/([A-Z])/g, ' $1').trim();
            moduleMetrics.push({
                moduleName: moduleName,
                completed: metrics.passed + metrics.failed,
                pending: metrics.pending,
                total: metrics.total
            });
        }
    }
    return moduleMetrics;
}

async function aggregateDailyTrend(suite) {
    const keys = getKeysForSuite(suite);
    const allTestData = (await Promise.all(keys.map(key => fetchData(key)))).flat();

    const dailyData = {}; // Format: {'YYYY-MM-DD': {total: n, passed: n...}}
    allTestData.forEach(testCase => {
        // Mocking a date if not available for demo purposes. Remove this line in production!
        if (!testCase.dateExecuted) {
            const today = new Date();
            testCase.dateExecuted = new Date(today.setDate(today.getDate() - Math.floor(Math.random() * 7))).toISOString().split('T')[0];
        }

        const date = testCase.dateExecuted;
        if (date) {
            dailyData[date] = dailyData[date] || { total: 0 };
            dailyData[date].total++;
        }
    });

    const sortedDates = Object.keys(dailyData).sort();
    const labels = sortedDates;
    const data = sortedDates.map(date => dailyData[date].total);

    // build cumulative
    let cum = 0;
    const cumulative = data.map(v => (cum += v));

    return { labels, data, cumulative };
}

// =======================================================
// KPI & CHART RENDERING FUNCTIONS
// =======================================================

function updateKPIs(metrics) {
    const total = metrics.total || 0;
    const executed = (metrics.passed || 0) + (metrics.failed || 0);
    const remaining = Math.max(total - executed, 0);
    const passRate = executed > 0 ? ((metrics.passed / executed) * 100).toFixed(1) : 0;

    if (!document.getElementById('pulseStyle')) {
        const style = document.createElement('style');
        style.id = 'pulseStyle';
        style.textContent = `
            @keyframes subtlePulse {
                0%   { box-shadow: 0 0 6px rgba(245,158,11,0.28); transform: scale(1); }
                50%  { box-shadow: 0 0 12px rgba(245,158,11,0.38); transform: scale(1.03); }
                100% { box-shadow: 0 0 6px rgba(245,158,11,0.28); transform: scale(1); }
            }
            .pulse-badge {
                display: inline-block;
                background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
                color: #fff;
                padding: 3px 8px;
                border-radius: 8px;
                margin-left: 8px;
                font-weight: 700;
                font-size: 0.95rem;
                letter-spacing: 0.3px;
                animation: subtlePulse 1800ms infinite ease-in-out;
                box-shadow: 0 0 6px rgba(245,158,11,0.28);
                vertical-align: middle;
            }
            .kpi-key { font-weight:700; color: #0f172a; font-size: 1rem; }
            .kpi-value { font-weight:800; color: #16a34a; font-size: 1.03rem; margin: 0 4px; }
            .kpi-muted { color: #64748b; font-size: 1rem; }
        `;
        document.head.appendChild(style);
    }

    const totalElement = document.getElementById('totalCasesKPI');
    const passRateElement = document.getElementById('passRateKPI');
    const totalInfoElement = document.getElementById('totalCasesPieInfo');

    if (totalElement) {
        totalElement.innerHTML = `
            <span class="kpi-key">Execution:</span>
            <span class="kpi-value">${executed.toLocaleString()}</span>
            <span class="kpi-muted">/ ${total.toLocaleString()}</span>
            <span class="pulse-badge">Remaining: ${remaining.toLocaleString()}</span>
        `;
    }

    if (passRateElement) {
        passRateElement.innerHTML = `<span style="color:#2563eb;font-weight:700;font-size:1rem;">${passRate}%</span>`;
    }

    if (totalInfoElement) {
        totalInfoElement.innerHTML = `
            <span style="color:#16a34a;font-weight:700;font-size:0.95rem;">Executed: ${executed.toLocaleString()}</span>
            &nbsp;|&nbsp;
            <span style="color:#f59e0b;font-weight:700;font-size:0.95rem;">Remaining: ${remaining.toLocaleString()}</span>
        `;
    }
}

/**
 * Renders the Tester Performance Stacked Bar Chart.
 */
function renderTesterChart(data, suiteName) {
    const ctx = document.getElementById('testerPerformanceChart');
    if (!ctx) return;

    if (testerChartInstance) {
        testerChartInstance.destroy();
    }

    document.getElementById('testerChartSuiteName').textContent = suiteName.toUpperCase();

    const testers = Object.keys(data);
    const passed = testers.map(t => data[t].passed);
    const failed = testers.map(t => data[t].failed);
    const pending = testers.map(t => data[t].pending);

    testerChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: testers,
            datasets: [
                { label: 'Passed', data: passed, backgroundColor: STATUS_COLORS.Pass },
                { label: 'Failed', data: failed, backgroundColor: STATUS_COLORS.Fail },
                { label: 'Pending', data: pending, backgroundColor: STATUS_COLORS.Pending }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: { display: true, text: 'Tester', color: '#6a737d' },
                    ticks: { color: '#4a5568' },
                    grid: { color: '#e0e6ed' }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: { display: true, text: 'Total Cases', color: '#6a737d' },
                    ticks: { precision: 0, color: '#4a5568' },
                    grid: { color: '#e0e6ed' }
                }
            },
            plugins: {
                title: { display: false },
                legend: { position: 'top', labels: { color: '#4a5568' } },
                datalabels: {
                    formatter: (value) => value > 0 ? value : '',
                    color: '#fff',
                    font: { weight: 'bold' }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

/**
 * Renders the Consolidated Suite Status as an advanced Doughnut Chart with center text plugin.
 */
function renderSuitePieChart(metrics, suiteName) {
    const wrapper = document.getElementById('suiteConsolidatedChart').parentNode;
    let ctx = document.getElementById('suiteConsolidatedChart');

    if (ctx.tagName !== 'CANVAS') {
        wrapper.innerHTML = '<canvas id="suiteConsolidatedChart"></canvas>';
        ctx = document.getElementById('suiteConsolidatedChart');
    }

    if (consolidatedChartInstance) {
        consolidatedChartInstance.destroy();
    }

    document.getElementById('pieChartSuiteName').textContent = suiteName.toUpperCase();

    if (metrics.total === 0) {
        wrapper.innerHTML = `<div class="p-4 text-center text-gray-500">No data for the ${suiteName} suite.</div>`;
        return;
    }

    const chartData = [metrics.passed, metrics.failed, metrics.pending];
    const labels = ['Passed', 'Failed', 'Pending'];

    // Create gradients for each segment
    const canvas = ctx;
    const ctx2 = canvas.getContext('2d');

    const gradPass = ctx2.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradPass.addColorStop(0, '#34d399'); // lighter
    gradPass.addColorStop(1, STATUS_COLORS.Pass);

    const gradFail = ctx2.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradFail.addColorStop(0, '#fca5a5');
    gradFail.addColorStop(1, STATUS_COLORS.Fail);

    const gradPend = ctx2.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradPend.addColorStop(0, '#fde68a');
    gradPend.addColorStop(1, STATUS_COLORS.Pending);

    const backgroundColors = [gradPass, gradFail, gradPend];

    // A small plugin to render center text (pass rate)
    const centerTextPlugin = {
        id: 'centerTextPlugin',
        afterDraw(chart) {
            const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
            const meta = chart._metasets ? chart._metasets[0] : null;

            // compute pass rate
            const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            const passed = chart.data.datasets[0].data[0] || 0;
            const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

            ctx.save();
            ctx.font = '700 20px Inter, sans-serif';
            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const centerX = (left + right) / 2;
            const centerY = (top + bottom) / 2;
            ctx.fillText(`${passRate}%`, centerX, centerY - 8);

            ctx.font = '600 12px Inter, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText('Pass Rate', centerX, centerY + 14);
            ctx.restore();
        }
    };

    consolidatedChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: chartData,
                backgroundColor: backgroundColors,
                borderWidth: 1,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 10, padding: 10, color: '#4a5568' }
                },
                datalabels: {
                    formatter: (value, context) => {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        if (value === 0) return '';
                        const percentage = ((value / total) * 100).toFixed(0) + '%';
                        return percentage;
                    },
                    color: '#fff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                    font: { weight: '700', size: 11 }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        },
        plugins: [ChartDataLabels, centerTextPlugin]
    });
}

/**
 * Renders the Module Completion Status Stacked Bar Chart (Horizontal).
 */
function renderModuleCompletionChart(moduleMetrics, suiteName) {
    const ctx = document.getElementById('moduleCompletionChart');
    if (!ctx) return;

    if (moduleCompletionChartInstance) {
        moduleCompletionChartInstance.destroy();
    }

    document.getElementById('moduleChartSuiteName').textContent = suiteName.toUpperCase();

    const moduleNames = moduleMetrics.map(m => m.moduleName);
    const completed = moduleMetrics.map(m => m.completed);
    const pending = moduleMetrics.map(m => m.pending);

    if (moduleNames.length === 0) {
        ctx.parentNode.innerHTML = `<div class="p-4 text-center text-gray-500">No module data found for the ${suiteName} suite.</div>`;
        return;
    }

    moduleCompletionChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: moduleNames,
            datasets: [
                {
                    label: 'Completed (Pass + Fail)',
                    data: completed,
                    backgroundColor: STATUS_COLORS.Completed,
                    stack: 'Stack 0'
                },
                {
                    label: 'Not Completed (Pending)',
                    data: pending,
                    backgroundColor: STATUS_COLORS.NotCompleted,
                    stack: 'Stack 0'
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: { display: true, text: 'Total Cases', font: { size: 12 }, color: '#6a737d' },
                    beginAtZero: true,
                    ticks: { precision: 0, font: { size: 10 }, color: '#4a5568' },
                    grid: { color: '#e0e6ed' }
                },
                y: {
                    stacked: true,
                    display: true,
                    barPercentage: 0.9,
                    categoryPercentage: 0.8,
                    ticks: { font: { size: 12 }, color: '#4a5568' },
                    grid: { color: '#e0e6ed' }
                }
            },
            plugins: {
                title: { display: false },
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 8, padding: 8, font: { size: 10 }, color: '#4a5568' }
                },
                datalabels: {
                    formatter: (value) => value > 0 ? value : '',
                    color: (context) => context.dataset.backgroundColor === STATUS_COLORS.NotCompleted ? '#000' : '#fff',
                    font: { weight: 'bold', size: 9 }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

/**
 * NEW: Renders the Daily Test Execution Trend as a Bar + Line combo:
 * - Bars: daily counts
 * - Line: cumulative total
 */
function renderDailyTrendChart(trendData, suiteName) {
    const ctx = document.getElementById('dailyExecutionTrendChart');
    if (!ctx) return;

    if (dailyTrendChartInstance) {
        dailyTrendChartInstance.destroy();
    }

    document.getElementById('trendChartSuiteName').textContent = suiteName.toUpperCase();

    // Generate gradient for bar and line background
    const canvas = ctx;
    const ctx2 = canvas.getContext('2d');

    const barGrad = ctx2.createLinearGradient(0, 0, 0, canvas.height);
    barGrad.addColorStop(0, 'rgba(33,114,243,0.85)');
    barGrad.addColorStop(1, 'rgba(33,114,243,0.25)');

    const lineGrad = ctx2.createLinearGradient(0, 0, 0, canvas.height);
    lineGrad.addColorStop(0, 'rgba(33,114,243,0.35)');
    lineGrad.addColorStop(1, 'rgba(33,114,243,0.02)');

    dailyTrendChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: trendData.labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Executed (Daily)',
                    data: trendData.data,
                    backgroundColor: barGrad,
                    borderRadius: 6,
                    barPercentage: 0.6
                },
                {
                    type: 'line',
                    label: 'Cumulative',
                    data: trendData.cumulative,
                    borderColor: STATUS_COLORS.LineChart,
                    tension: 0.35,
                    fill: true,
                    backgroundColor: lineGrad,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: { display: true, text: 'Execution Date', color: '#6a737d' },
                    ticks: { color: '#4a5568', maxRotation: 45, minRotation: 45 },
                    grid: { color: '#e0e6ed' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Total Executed Cases', color: '#6a737d' },
                    ticks: { precision: 0, color: '#4a5568' },
                    grid: { color: '#e0e6ed' }
                }
            },
            plugins: {
                legend: { position: 'top', labels: { color: '#4a5568' } },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            }
        }
    });
}

/**
 * Main function to coordinate all chart rendering based on the selected suite.
 */
async function updateCharts(suite) {
    // 1. Render Tester Performance Chart (Bar Chart)
    const testerMetrics = await aggregateDataByTester(suite);
    renderTesterChart(testerMetrics, suite);

    // 2. Render Consolidated Suite Doughnut Chart and Update KPIs
    const suiteMetrics = await aggregateSuiteMetrics(suite);
    renderSuitePieChart(suiteMetrics, suite);
    updateKPIs(suiteMetrics);

    // 3. Render Module Completion Chart
    const moduleMetrics = await aggregateModuleCompletionMetrics(suite);
    renderModuleCompletionChart(moduleMetrics, suite);

    // 4. Render Daily Trend Chart (Bar + Line combo)
    const trendData = await aggregateDailyTrend(suite);
    renderDailyTrendChart(trendData, suite);
}

// Expose the main function globally
window.updateCharts = updateCharts;

/**
 * Export full dashboard page (body) as a PNG using html2canvas
 * - Uses scale:2 for better resolution
 * - Downloads automatically with a timestamped filename
 */
window.exportDashboardPNG = async function exportDashboardPNG() {
    if (typeof html2canvas === 'undefined') {
        alert('Export failed: html2canvas not found.');
        return;
    }

    try {
        // You can switch document.body -> document.querySelector('.container') if you want only the container area
        const target = document.body;
        // temporarily apply a white background to body for clean export
        const originalBg = target.style.background;
        target.style.background = '#ffffff';

        // Wait a tick for background update
        await new Promise(r => setTimeout(r, 80));

        const canvas = await html2canvas(target, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            logging: false,
            scrollY: -window.scrollY // ensure capture includes above-the-fold content consistently
        });

        // restore original bg
        target.style.background = originalBg;

        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `dashboard-export-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.png`;
        a.click();
    } catch (err) {
        console.error('Export failed', err);
        alert('Export failed. See console for details.');
    }
};
