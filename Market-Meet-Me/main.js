// --- GLOBALS ---
const stockArrays = {};
const stockDescriptions = {};
const API_KEY = 'API KEY HERE';
const PORTFOLIO_KEY = 'pretendPortfolio';
const TRADE_HISTORY_KEY = 'pretendTradeHistory';
const BANKROLL_KEY = 'pretendBankroll';

let portfolio = {};
let tradeHistory = [];
let tradeHistoryVisible = false;
let bankroll = 1000000;
let weeksToFetch = 2;

// --- UTILITY FUNCTIONS ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function parseEmbeddedCSV() {
    const csvText = document.getElementById('embeddedCSV').textContent.trim();
    const lines = csvText.split('\n');
    const header = lines[0].split(',');

    const symbolIndex = header.indexOf('Symbol');
    const sectorIndex = header.indexOf('GICS Sector');
    const subIndustryIndex = header.indexOf('GICS Sub-Industry');

    const categories = new Set();

    lines.slice(1).forEach(line => {
        const fields = line.split(',');
        const symbol = fields[symbolIndex]?.trim();
        const sector = fields[sectorIndex]?.trim();
        const subIndustry = fields[subIndustryIndex]?.trim();

        if (!symbol || !sector || !subIndustry) return;

        if (!stockArrays[sector]) stockArrays[sector] = [];
        stockArrays[sector].push(symbol);
        categories.add(sector);

        if (!stockArrays[subIndustry]) stockArrays[subIndustry] = [];
        stockArrays[subIndustry].push(symbol);
        categories.add(subIndustry);
    });

    return [...categories].sort();
}

function categorizeStocksFromCSV() {
    const csvText = document.getElementById('embeddedCSV').textContent.trim();
    const lines = csvText.split('\n');
    const header = lines[0].split(',');

    const symbolIndex = header.indexOf('Symbol');
    const securityIndex = header.indexOf('Security');
    const sectorIndex = header.indexOf('GICS Sector');
    const subIndustryIndex = header.indexOf('GICS Sub-Industry');

    const categories = new Set();

    lines.slice(1).forEach(line => {
        const fields = line.split(',');
        const symbol = fields[symbolIndex]?.trim();
        const name = fields[securityIndex]?.trim();
        const sector = fields[sectorIndex]?.trim();
        const subIndustry = fields[subIndustryIndex]?.trim();

        if (!symbol || !name || !sector || !subIndustry) return;

        stockDescriptions[symbol] = name;

        if (!stockArrays[sector]) stockArrays[sector] = [];
        stockArrays[sector].push(symbol);
        categories.add(sector);

        if (!stockArrays[subIndustry]) stockArrays[subIndustry] = [];
        stockArrays[subIndustry].push(symbol);
        categories.add(subIndustry);
    });

    return [...categories].sort();
}

function populateCategoryDropdown(categoryList) {
    const select = document.getElementById('stockArraySelectSelect');
    select.innerHTML = '<option value="">--Select--</option>';
    categoryList.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });
}

function populateTickerSuggestions() {
    const datalist = document.getElementById('tickerSuggestions');
    datalist.innerHTML = '';

    const csvText = document.getElementById('embeddedCSV').textContent.trim();
    const lines = csvText.split('\n');
    const header = lines[0].split(',');
    const symbolIndex = header.indexOf('Symbol');
    const securityIndex = header.indexOf('Security');

    lines.slice(1).forEach(line => {
        const fields = line.split(',');
        const ticker = fields[symbolIndex]?.trim();
        const name = fields[securityIndex]?.trim();

        if (ticker && name) {
            const option = document.createElement('option');
            option.value = ticker;
            option.label = name;
            datalist.appendChild(option);
        }
    });
}

function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// --- PORTFOLIO & TRADE HISTORY ---
function loadPortfolioFromStorage() {
    const stored = localStorage.getItem(PORTFOLIO_KEY);
    portfolio = stored ? JSON.parse(stored) : {};
}

function savePortfolioToStorage() {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
}

function loadTradeHistoryFromStorage() {
    const stored = localStorage.getItem(TRADE_HISTORY_KEY);
    tradeHistory = stored ? JSON.parse(stored) : [];
}

function saveTradeHistoryToStorage() {
    localStorage.setItem(TRADE_HISTORY_KEY, JSON.stringify(tradeHistory));
}

function clearPortfolioLocalStorage() {
    localStorage.removeItem(PORTFOLIO_KEY);
    localStorage.removeItem(TRADE_HISTORY_KEY);
    portfolio = {};
    tradeHistory = [];
    bankroll = 1000000;
    saveBankrollToStorage();
    if (document.getElementById('stocksContainer').dataset.showingPortfolio === "true") {
        showPortfolioInStocksContainer();
    }
    renderTradeHistoryView();
    closeHamburgerDropdown();
}

// --- PORTFOLIO & TRADE HISTORY ---
// Helper to calculate total portfolio value and unrealized P/L
function getPortfolioValueAndUnrealizedPL() {
    let value = 0, unrealized = 0;
    Object.values(portfolio).forEach(info => {
        if (info.quantity > 0) {
            value += info.quantity * info.lastPrice;
            unrealized += (info.lastPrice - info.avgBuyPrice) * info.quantity;
        }
    });
    return { value, unrealized };
}

function updatePortfolio(ticker, name, price, action, qty = 1) {
    if (!portfolio[ticker]) {
        portfolio[ticker] = { name, quantity: 0, avgBuyPrice: 0, lastPrice: price };
    }
    let info = portfolio[ticker];
    info.lastPrice = price;

    // Calculate trade P/L and cumulative P/L
    let tradePL = 0;
    let lastCumulativePL = tradeHistory.length > 0 ? (tradeHistory[tradeHistory.length - 1].cumulativePL || 0) : 0;

    if (action === 'sell' || action === 'sellAll') {
        // Use avgBuyPrice before this sell
        tradePL = (price - info.avgBuyPrice) * qty;
    }

    if (action === 'buy' || action === 'sell') {
        // Update portfolio before saving trade
        if (action === 'buy') {
            info.avgBuyPrice = ((info.avgBuyPrice * info.quantity) + (price * qty)) / (info.quantity + qty);
            info.quantity += qty;
            bankroll -= price * qty;
        } else if (action === 'sell') {
            info.quantity = Math.max(0, info.quantity - qty);
            if (info.quantity === 0) info.avgBuyPrice = 0;
            bankroll += price * qty;
        }
        // After portfolio update, get new values
        const { value: portfolioValueAfter, unrealized: unrealizedPLAfter } = getPortfolioValueAndUnrealizedPL();
        const tradeEntry = {
            ticker,
            name,
            action,
            quantity: qty,
            price,
            total: qty * price,
            date: new Date().toISOString(),
            bankrollAfter: bankroll,
            tradePL: action === 'sell' ? tradePL : 0,
            cumulativePL: action === 'sell' ? lastCumulativePL + tradePL : lastCumulativePL,
            note: '',
            portfolioValueAfter,
            unrealizedPLAfter
        };
        tradeHistory.push(tradeEntry);
        saveTradeHistoryToStorage();
    }

    if (action === 'sellAll') {
        const sellQty = info.quantity;
        if (sellQty > 0) {
            tradePL = (info.lastPrice - info.avgBuyPrice) * sellQty;
            bankroll += info.lastPrice * sellQty;
            info.quantity = 0;
            info.avgBuyPrice = 0;
            const { value: portfolioValueAfter, unrealized: unrealizedPLAfter } = getPortfolioValueAndUnrealizedPL();
            const tradeEntry = {
                ticker,
                name,
                action: 'sell',
                quantity: sellQty,
                price: info.lastPrice,
                total: sellQty * info.lastPrice,
                date: new Date().toISOString(),
                bankrollAfter: bankroll,
                tradePL: tradePL,
                cumulativePL: lastCumulativePL + tradePL,
                note: '',
                portfolioValueAfter,
                unrealizedPLAfter
            };
            tradeHistory.push(tradeEntry);
            saveTradeHistoryToStorage();
        }
    }

    savePortfolioToStorage();
    saveBankrollToStorage();
    if (document.getElementById('stocksContainer').dataset.showingPortfolio === "true") {
        showPortfolioInStocksContainer();
    }
    if (tradeHistoryVisible) {
        renderTradeHistoryView();
    }
}

// --- PERFORMANCE METRICS HELPERS ---
function stdDev(arr) {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (arr.length - 1);
    return Math.sqrt(variance);
}

function calculatePerformance() {
    let realized = 0, unrealized = 0, invested = 0;
    let wins = 0, losses = 0, totalPL = 0, tradeCount = 0;
    let largestWin = -Infinity, largestLoss = Infinity;
    let returns = [];
    let startBankroll = 1000000;
    let firstTradeDate = tradeHistory.length ? new Date(tradeHistory[0].date) : null;
    let lastTradeDate = tradeHistory.length ? new Date(tradeHistory[tradeHistory.length - 1].date) : null;
    let holdingPeriods = [];
    let sellDates = {};
    let buyDates = {};

    // Track holding periods by ticker
    tradeHistory.forEach(trade => {
        if (trade.action === 'buy') {
            if (!buyDates[trade.ticker]) buyDates[trade.ticker] = [];
            buyDates[trade.ticker].push(new Date(trade.date));
            invested += trade.total;
        }
        if (trade.action === 'sell' || trade.action === 'sellAll') {
            let pl = trade.tradePL;
            realized += pl;
            totalPL += pl;
            tradeCount++;
            if (pl > 0) wins++;
            if (pl < 0) losses++;
            if (pl > largestWin) largestWin = pl;
            if (pl < largestLoss) largestLoss = pl;
            returns.push(pl);

            // Holding period: match to earliest unmatched buy
            if (buyDates[trade.ticker] && buyDates[trade.ticker].length) {
                let buyDate = buyDates[trade.ticker].shift();
                let sellDate = new Date(trade.date);
                let daysHeld = (sellDate - buyDate) / (1000 * 60 * 60 * 24);
                holdingPeriods.push(daysHeld);
            }
        }
    });

    Object.values(portfolio).forEach(info => {
        if (info.quantity > 0) {
            unrealized += (info.lastPrice - info.avgBuyPrice) * info.quantity;
        }
    });

    // Calculate win rate and averages
    let winRate = tradeCount ? (wins / tradeCount * 100).toFixed(1) : '0.0';
    let avgPL = tradeCount ? (totalPL / tradeCount).toFixed(2) : '0.00';
    let sharpe = returns.length > 1
        ? (avgPL / (stdDev(returns) || 1)).toFixed(2)
        : 'N/A';

    // Calculate max drawdown (simplified)
    let maxDrawdown = 0, peak = startBankroll;
    let equity = startBankroll;
    tradeHistory.forEach(trade => {
        equity = trade.bankrollAfter + (trade.portfolioValueAfter || 0);
        if (equity > peak) peak = equity;
        let drawdown = (peak - equity);
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Annualized return (if enough data)
    let annualizedReturn = 'N/A';
    if (firstTradeDate && lastTradeDate && firstTradeDate < lastTradeDate) {
        let years = (lastTradeDate - firstTradeDate) / (365 * 24 * 60 * 60 * 1000);
        let totalReturn = ((bankroll + unrealized + invested - startBankroll) / startBankroll);
        annualizedReturn = years > 0 ? ((Math.pow(1 + totalReturn, 1 / years) - 1) * 100).toFixed(2) + '%' : 'N/A';
    }

    let avgHold = holdingPeriods.length
        ? (holdingPeriods.reduce((a, b) => a + b, 0) / holdingPeriods.length).toFixed(1)
        : 'N/A';

    return {
        realized: realized.toFixed(2),
        unrealized: unrealized.toFixed(2),
        total: (realized + unrealized).toFixed(2),
        invested: invested.toFixed(2),
        winRate,
        avgPL,
        largestWin: largestWin === -Infinity ? 'N/A' : largestWin.toFixed(2),
        largestLoss: largestLoss === Infinity ? 'N/A' : largestLoss.toFixed(2),
        sharpe,
        tradeCount,
        maxDrawdown: maxDrawdown.toFixed(2),
        annualizedReturn,
        avgHold
    };
}

// --- BANKROLL ---
function loadBankrollFromStorage() {
    const stored = localStorage.getItem(BANKROLL_KEY);
    bankroll = stored ? parseFloat(stored) : 1000000;
    updateBankrollDisplay();
}

function saveBankrollToStorage() {
    localStorage.setItem(BANKROLL_KEY, bankroll.toString());
    updateBankrollDisplay();
}

function updateBankrollDisplay() {
    const el = document.getElementById('bankrollDisplay');
    if (el) {
        el.textContent = `Available Cash: $${(bankroll ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (bankroll < 0) {
            el.style.background = '#E74C3C';
            el.style.border = '2px solid #C0392B';
            el.style.color = '#fff';
        } else if (bankroll === 0) {
            el.style.background = '#BDC3C7';
            el.style.border = '2px solid #7F8C8D';
            el.style.color = '#333';
        } else {
            el.style.background = '';
            el.style.border = '';
            el.style.color = '';
        }
    }
}

// --- UI & EVENT HELPERS ---
function showToast(message, duration = 3000) {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '30px';
        toastContainer.style.left = '50%';
        toastContainer.style.transform = 'translateX(-50%)';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.background = '#333';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.marginTop = '8px';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    toast.style.fontSize = '1em';
    toast.style.opacity = '0.95';
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
        if (!toastContainer.hasChildNodes()) {
            toastContainer.remove();
        }
    }, duration);
}

function clearLoadedStocks() {
    const stocksContainer = document.getElementById('stocksContainer');
    stocksContainer.innerHTML = '';
    stocksContainer.dataset.showingPortfolio = "false";
    const btn = document.getElementById('viewPortfolioBtn');
    if (btn) btn.textContent = "Show Portfolio";
    if (
        window.event &&
        window.event.target &&
        window.event.target.id === 'clearLoadedStocksBtn'
    ) {
        const categoryDropdown = document.getElementById('stockArraySelectSelect');
        if (categoryDropdown) {
            categoryDropdown.value = "";
        }
    }
}

function closeHamburgerDropdown() {
    document.getElementById('hamburgerDropdown').style.display = 'none';
}

// --- MAIN LOGIC ---
function renderPortfolioTable(stocksContainer, filteredPortfolio) {
    let table = `<table class="portfolio-table">
        <tr>
            <th>
                <button id="fetchAllPortfolioBtn" title="Fetch all portfolio stocks">&#x1F50E; Fetch All</button>
            </th>
            <th>Ticker</th>
            <th>Name</th>
            <th>Qty</th>
            <th>Avg Buy Price</th>
            <th>Last Price</th>
            <th>Total Value</th>
            <th>Return</th>
            <th style="min-width:220px;">Trade</th>
        </tr>`;
    filteredPortfolio.forEach(([ticker, info]) => {
        const safeName = info.name.replace(/'/g, "\\'");
        const ret = ((info.lastPrice - info.avgBuyPrice) * info.quantity).toFixed(2);
        let returnClass = '';
        if (info.quantity > 0) {
            returnClass = info.lastPrice > info.avgBuyPrice ? 'return-positive' : (info.lastPrice < info.avgBuyPrice ? 'return-negative' : 'return-neutral');
        }
        const totalValue = (info.quantity * info.lastPrice).toFixed(2);
        table += `<tr>
            <td>
                <button title="Quick Fetch" class="quick-fetch-btn"
                    onclick="getStockData('${ticker}')">
                    &#x1F50D;
                </button>
            </td>
            <td>${ticker}</td>
            <td>${info.name}</td>
            <td>${info.quantity.toFixed(4)}</td>
            <td>${info.avgBuyPrice.toFixed(2)}</td>
            <td class="last-price-cell">${info.lastPrice.toFixed(2)}</td>
            <td>${totalValue}</td>
            <td class="${returnClass} return-cell">${ret}</td>
            <td>
                <div style="display:flex;justify-content:center;align-items:center;gap:8px;">
                    <input type="number" min="1" value="" id="portfolioQty_${ticker}" placeholder="$" title="Dollar amount to buy">
                    <button class="buy-btn" title="Buy shares"
                        onclick="buyByDollarAmount('${ticker}','${safeName}',${info.lastPrice},'portfolioQty_${ticker}')">
                        Buy
                    </button>
                    <button class="sell-btn" title="Sell shares"
                        onclick="sellByDollarAmount('${ticker}','${safeName}',${info.lastPrice},'portfolioQty_${ticker}')">
                        Sell
                    </button>
                    <button class="sell-btn" title="Sell all shares"
                        onclick="updatePortfolio('${ticker}','${safeName}',${info.lastPrice},'sellAll')">
                        Sell All
                    </button>
                </div>
            </td>
        </tr>`;
    });
    table += '</table>';
    stocksContainer.innerHTML = table;
}

function showPortfolioInStocksContainer() {
    const stocksContainer = document.getElementById('stocksContainer');
    stocksContainer.innerHTML = '';
    stocksContainer.dataset.showingPortfolio = "true";
    const btn = document.getElementById('viewPortfolioBtn');
    if (btn) btn.textContent = "Hide Portfolio";
    const filteredPortfolio = Object.entries(portfolio).filter(([_, info]) => info.quantity > 0);
    if (filteredPortfolio.length === 0) {
        stocksContainer.innerHTML = '<div style="text-align:center;">No stocks in your portfolio.</div>';
        return;
    }
    const tickers = filteredPortfolio.map(([ticker, _]) => ticker);
    let fetchedDiv = document.getElementById('fetchedStocksContainer');
    if (!fetchedDiv) {
        fetchedDiv = document.createElement('div');
        fetchedDiv.id = 'fetchedStocksContainer';
    }
    fetchedDiv.innerHTML = '';
    getStockDataBatch(tickers, fetchedDiv).then(() => {
        renderPortfolioTable(stocksContainer, Object.entries(portfolio).filter(([_, info]) => info.quantity > 0));
        stocksContainer.appendChild(fetchedDiv);
        const fetchAllBtn = document.getElementById('fetchAllPortfolioBtn');
        if (fetchAllBtn) {
            fetchAllBtn.onclick = function () {
                fetchedDiv.innerHTML = '';
                getStockDataBatch(tickers, fetchedDiv).then(() => {
                    renderPortfolioTable(stocksContainer, Object.entries(portfolio).filter(([_, info]) => info.quantity > 0));
                    stocksContainer.appendChild(fetchedDiv); // <-- Add this line
                });
            };
        }
    });
    renderPortfolioTable(stocksContainer, filteredPortfolio);
    stocksContainer.appendChild(fetchedDiv);
}

// --- UI: TRADE HISTORY ---
function renderTradeHistoryView() {
    const container = document.getElementById('tradeHistoryContainer');
    if (!tradeHistoryVisible) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }
    container.style.display = 'block';

    // Calculate metrics
    const perf = calculatePerformance();
    const { value: portfolioValue, unrealized } = getPortfolioValueAndUnrealizedPL();

    // Show only the requested metrics
    let html = `
        <div class="performance-summary polished-summary">
            <h2>Performance Summary</h2>
            <div class="perf-row">
                <span>Total Invested:</span> <span>$${perf.invested}</span>
                <span>Current Value:</span> <span>$${portfolioValue.toFixed(2)}</span>
                <span>Unrealized P/L:</span> <span class="perf-unrealized">$${unrealized.toFixed(2)}</span>
                <span>Realized P/L:</span> <span class="perf-realized">$${perf.realized}</span>
            </div>
        </div>
        <h2 style="margin-top:24px;">Trade History</h2>
        <div style="max-height:220px; overflow-y:auto;">
            <table class="trade-history-table polished-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Ticker</th>
                        <th>Name</th>
                        <th>Action</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                        <th>P/L</th>
                        <th>Cumulative P/L</th>
                        <th>Bankroll</th>
                        <th>Portfolio Value</th>
                        <th>Unrealized P/L</th>
                    </tr>
                </thead>
                <tbody id="tradeHistoryRows">
    `;
    const maxToShow = 5;
    const totalTrades = tradeHistory.length;
    const lastTrades = tradeHistory.slice(-maxToShow).reverse();
    lastTrades.forEach(trade => {
        html += `<tr>
            <td>${new Date(trade.date).toLocaleString()}</td>
            <td>${trade.ticker}</td>
            <td>${trade.name}</td>
            <td class="action-${trade.action}">${trade.action.toUpperCase()}</td>
            <td>${trade.quantity.toFixed(4)}</td>
            <td>$${trade.price.toFixed(2)}</td>
            <td>$${trade.total.toFixed(2)}</td>
            <td class="${trade.tradePL > 0 ? 'return-positive' : (trade.tradePL < 0 ? 'return-negative' : 'return-neutral')}">${trade.tradePL ? trade.tradePL.toFixed(2) : ''}</td>
            <td>${trade.cumulativePL !== undefined ? trade.cumulativePL.toFixed(2) : ''}</td>
            <td>$${trade.bankrollAfter !== undefined ? trade.bankrollAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>
            <td>$${trade.portfolioValueAfter !== undefined ? trade.portfolioValueAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>
            <td>${trade.unrealizedPLAfter !== undefined ? trade.unrealizedPLAfter.toFixed(2) : ''}</td>
        </tr>`;
    });
    if (totalTrades > maxToShow) {
        html += `<tr id="tradeHistoryEllipsis" style="cursor:pointer;text-align:center;">
            <td colspan="12" style="font-size:1.5em;">&#8230;</td>
        </tr>`;
    }
    html += `</tbody></table></div>`;
    container.innerHTML = html;
    if (totalTrades > maxToShow) {
        document.getElementById('tradeHistoryEllipsis').onclick = function () {
            const rows = document.getElementById('tradeHistoryRows');
            rows.innerHTML = '';
            tradeHistory.slice().reverse().forEach(trade => {
                rows.innerHTML += `<tr>
                    <td>${new Date(trade.date).toLocaleString()}</td>
                    <td>${trade.ticker}</td>
                    <td>${trade.name}</td>
                    <td class="action-${trade.action}">${trade.action.toUpperCase()}</td>
                    <td>${trade.quantity.toFixed(4)}</td>
                    <td>$${trade.price.toFixed(2)}</td>
                    <td>$${trade.total.toFixed(2)}</td>
                    <td class="${trade.tradePL > 0 ? 'return-positive' : (trade.tradePL < 0 ? 'return-negative' : 'return-neutral')}">${trade.tradePL ? trade.tradePL.toFixed(2) : ''}</td>
                    <td>${trade.cumulativePL !== undefined ? trade.cumulativePL.toFixed(2) : ''}</td>
                    <td>$${trade.bankrollAfter !== undefined ? trade.bankrollAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>
                    <td>$${trade.portfolioValueAfter !== undefined ? trade.portfolioValueAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>
                    <td>${trade.unrealizedPLAfter !== undefined ? trade.unrealizedPLAfter.toFixed(2) : ''}</td>
                </tr>`;
            });
        };
    }
}

// --- STOCK DATA FETCHING ---
async function getStockDataBatch(tickerArray, renderContainer) {
    console.log('[getStockDataBatch] Called with tickers:', tickerArray);

    if (!renderContainer) {
        clearLoadedStocks();
        renderContainer = document.getElementById('stocksContainer');
    }

    const uniqueTickers = [...new Set(tickerArray)];
    console.log('[getStockDataBatch] Unique tickers:', uniqueTickers);

    const tickerString = uniqueTickers.join(',');
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${tickerString}?apikey=${API_KEY}&timeseries=${weeksToFetch * 7}`;
    console.log('[getStockDataBatch] Fetching URL:', url);

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('[getStockDataBatch] API response:', data);

        if (data.historical && data.symbol) {
            console.log('[getStockDataBatch] Single symbol response:', data.symbol);
            const stockName = stockDescriptions[data.symbol] || data.symbol;
            const historical = data.historical;
            if (Array.isArray(historical) && historical.length) {
                historical.reverse();
                if (weeksToFetch >= 16) {
                    const blockSize = 90;
                    for (let i = 0; i < historical.length; i += blockSize) {
                        const block = historical.slice(i, i + blockSize);
                        const blockLabel = `Q${Math.floor(i / blockSize) + 1}`;
                        renderStockBlock(data.symbol, stockName, block, blockLabel, renderContainer);
                    }
                } else {
                    renderStockBlock(data.symbol, stockName, historical, null, renderContainer);
                }
            }
            return;
        }

        if (Array.isArray(data.historicalStockList)) {
            console.log('[getStockDataBatch] Batch response for symbols:', data.historicalStockList.map(stock => stock.symbol));
            const returnedSymbols = new Set(data.historicalStockList.map(stock => stock.symbol));
            data.historicalStockList.forEach(stock => {
                const { symbol, historical } = stock;
                if (!Array.isArray(historical) || !historical.length) return;
                const stockName = stockDescriptions[symbol] || symbol;
                historical.reverse();
                if (portfolio[symbol]) {
                    portfolio[symbol].lastPrice = historical[historical.length - 1].close;
                }
                if (weeksToFetch >= 16) {
                    const blockSize = 90;
                    for (let i = 0; i < historical.length; i += blockSize) {
                        const block = historical.slice(i, i + blockSize);
                        const blockLabel = `Q${Math.floor(i / blockSize) + 1}`;
                        renderStockBlock(symbol, stockName, block, blockLabel, renderContainer);
                    }
                } else {
                    renderStockBlock(symbol, stockName, historical, null, renderContainer);
                }
            });

            const missingTickers = uniqueTickers.filter(ticker => !returnedSymbols.has(ticker));
            if (missingTickers.length) {
                console.warn('[getStockDataBatch] Missing tickers, will refetch in chunks:', missingTickers);
                const chunks = chunkArray(missingTickers, 5);
                for (const chunk of chunks) {
                    console.log('[getStockDataBatch] Refetching chunk:', chunk);
                    await getStockDataBatch(chunk, renderContainer);
                }
            }
            return;
        }

        console.warn('[getStockDataBatch] Unexpected API response format:', data);
        savePortfolioToStorage();
    } catch (error) {
        console.error('Error fetching batch stock data:', error);
    }
}

async function getStockData(stockTicker) {
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${stockTicker}?apikey=${API_KEY}&timeseries=${weeksToFetch * 7}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const stockData = data.historical;
        if (!stockData || !stockData.length) {
            console.warn(`No historical data available for ticker: ${stockTicker}`);
            return;
        }
        const stockName = stockDescriptions[stockTicker] || stockTicker;
        const stocksContainer = document.getElementById('stocksContainer');
        stockData.reverse();
        if (weeksToFetch >= 16) {
            const blockSize = 90;
            for (let i = 0; i < stockData.length; i += blockSize) {
                const block = stockData.slice(i, i + blockSize);
                const blockLabel = `Q${Math.floor(i / blockSize) + 1}`;
                renderStockBlock(stockTicker, stockName, block, blockLabel, stocksContainer);
            }
        } else {
            renderStockBlock(stockTicker, stockName, stockData, null, stocksContainer);
        }
    } catch (error) {
        console.error(`Error fetching stock data for ticker: ${stockTicker}`, error);
    }
}

function renderStockBlock(ticker, name, dataBlock, blockLabel, container) {
    const stockDiv = document.createElement('div');
    stockDiv.classList.add('stock');
    if (blockLabel) stockDiv.classList.add('quarterblock');
    stockDiv.innerHTML = `
        <h2>${ticker}${blockLabel ? ` - ${blockLabel}` : ''}</h2>
        <div class="description">${name}</div>
        <table>
            <tr><th>Date</th><th>Price</th><th>Change</th></tr>
        </table>
    `;
    container.appendChild(stockDiv);
    const stockTable = stockDiv.querySelector('table');
    let highest = -Infinity, lowest = Infinity;
    let highDate = null, lowDate = null;
    dataBlock.forEach(day => {
        if (day.close > highest) {
            highest = day.close;
            highDate = day.date;
        }
        if (day.close < lowest) {
            lowest = day.close;
            lowDate = day.date;
        }
    });
    const style = document.createElement('style');
    style.innerHTML = `
        .positive { background-color: #2ECC71; color: white; }
        .negative { background-color: #E74C3C; color: white; }
        .neutral { background-color: #BDC3C7; color: black; }
        .topweeks { border: 3px solid #F1C40F; }
        .lowestprice { background-color: #8E44AD; color: white; }
    `;
    document.head.appendChild(style);
    let previousPrice = null;
    dataBlock.forEach((day, index) => {
        const change = previousPrice !== null ? (day.close - previousPrice).toFixed(2) : '0.00';
        let rowClass = '';
        if (day.date === highDate) {
            rowClass = 'topweeks';
        } else if (day.date === lowDate) {
            rowClass = 'lowestprice';
        } else if (previousPrice !== null) {
            rowClass = day.close > previousPrice ? 'positive' : 'negative';
        } else {
            rowClass = 'neutral';
        }
        const row = document.createElement('tr');
        row.className = rowClass;
        row.innerHTML = `<td>${day.date}</td><td>${day.close}</td><td>${change}</td>`;
        stockTable.appendChild(row);
        previousPrice = day.close;
    });
    renderTradeControls(ticker, name, dataBlock[dataBlock.length - 1].close, stockDiv);
}

function renderTradeControls(ticker, name, lastPrice, container) {
    const safeName = name.replace(/'/g, "\\'");
    const controls = document.createElement('div');
    controls.className = 'trade-controls';
    controls.innerHTML = `
        <button class="sell-btn" title="Sell shares"
            onclick="sellByDollarAmount('${ticker}','${safeName}',${lastPrice},'tradeQty_${ticker}')">
            Sell
        </button>
        <input type="number" min="1" value="" id="tradeQty_${ticker}" placeholder="$" title="Dollar amount to trade">
        <button class="buy-btn" title="Buy shares"
            onclick="buyByDollarAmount('${ticker}','${safeName}',${lastPrice},'tradeQty_${ticker}')">
            Buy
        </button>
    `;
    container.appendChild(controls);
}

function buyByDollarAmount(ticker, name, lastPrice, inputId) {
    const dollarAmount = parseFloat(document.getElementById(inputId).value);
    if (isNaN(dollarAmount) || dollarAmount <= 0) {
        alert("Enter a valid dollar amount.");
        return;
    }
    const shares = dollarAmount / lastPrice;
    if (shares <= 0) {
        alert("Dollar amount too low to buy any shares.");
        return;
    }
    updatePortfolio(ticker, name, lastPrice, 'buy', shares);
    showToast(`Bought $${dollarAmount.toFixed(2)} of ${ticker} (${shares.toFixed(4)} shares)`);
}

function sellByDollarAmount(ticker, name, lastPrice, inputId) {
    const dollarAmount = parseFloat(document.getElementById(inputId).value);
    if (isNaN(dollarAmount) || dollarAmount <= 0) {
        alert("Enter a valid dollar amount.");
        return;
    }
    const shares = dollarAmount / lastPrice;
    if (shares <= 0) {
        alert("Dollar amount too low to sell any shares.");
        return;
    }
    updatePortfolio(ticker, name, lastPrice, 'sell', shares);
    showToast(`Sold $${dollarAmount.toFixed(2)} of ${ticker} (${shares.toFixed(4)} shares)`);
}

function loadSelectedStockArray() {
    const select = document.getElementById('stockArraySelectSelect');
    const selectedArrayName = select.value;
    if (!selectedArrayName) return;
    if (selectedArrayName === '__portfolio__') {
        showPortfolioInStocksContainer();
        return;
    }
    const selectedArray = stockArrays[selectedArrayName];
    if (!selectedArray || !selectedArray.length) return;
    const stocksContainer = document.getElementById('stocksContainer');
    stocksContainer.innerHTML = '';
    stocksContainer.dataset.showingPortfolio = "false";
    const uniqueTickers = [...new Set(selectedArray)];
    getStockDataBatch(uniqueTickers);
}

function updateWeeksToFetch() {
    const input = document.getElementById('weeksInput');
    weeksToFetch = parseInt(input.value);
    loadSelectedStockArray();
}

function fetchManualStock() {
    const input = document.getElementById('manualTicker').value.trim();
    if (!input) return;
    const clearBoard = document.getElementById('clearBoardToggle').checked;
    const ticker = input.toUpperCase();
    if (stockDescriptions.hasOwnProperty(ticker)) {
        if (clearBoard) {
            clearLoadedStocks();
        }
        getStockData(ticker);
    } else {
        if (clearBoard) {
            clearLoadedStocks();
        }
        lookupTickerByName(input, false);
    }
}

async function lookupTickerByName(name, clearBoard) {
    const url = `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(name)}&limit=1&exchange=NASDAQ&apikey=${API_KEY}`;
    const response = await fetch(url);
    const results = await response.json();
    if (results.length === 0) {
        alert(`No ticker found for "${name}".`);
        return;
    }
    const ticker = results[0].symbol;
    if (clearBoard) {
        document.getElementById('stocksContainer').innerHTML = '';
    }
    getStockData(ticker);
}

// --- EVENT HANDLERS ---
document.addEventListener('DOMContentLoaded', () => {
    loadPortfolioFromStorage();
    loadTradeHistoryFromStorage();
    loadBankrollFromStorage();
    categorizeStocksFromCSV();
    populateTickerSuggestions();
    const categories = parseEmbeddedCSV();
    populateCategoryDropdown(categories);
    renderTradeHistoryView();
    document.body.classList.add('dark-mode');

    // Hamburger menu
    const menuBtn = document.getElementById('hamburgerMenuBtn');
    const dropdown = document.getElementById('hamburgerDropdown');
    if (menuBtn && dropdown) {
        menuBtn.onclick = function () {
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        };
        window.addEventListener('click', function (e) {
            if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    // Trade History button
    const tradeHistoryBtn = document.getElementById('viewTradeHistoryBtn');
    if (tradeHistoryBtn) {
        tradeHistoryBtn.onclick = function () {
            tradeHistoryVisible = !tradeHistoryVisible;
            renderTradeHistoryView();
            tradeHistoryBtn.textContent = tradeHistoryVisible ? "Hide Trade History" : "Show Trade History";
        };
    }

    // Portfolio and clear loaded stocks buttons
    const portfolioBtn = document.getElementById('viewPortfolioBtn');
    if (portfolioBtn) {
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clearLoadedStocksBtn';
        clearBtn.textContent = 'Clear Loaded Stocks';
        clearBtn.style.marginRight = '8px';
        portfolioBtn.parentNode.insertBefore(clearBtn, portfolioBtn);
        clearBtn.onclick = clearLoadedStocks;
        portfolioBtn.onclick = function () {
            togglePortfolioView();
        };
    }

    // Manual ticker input
    const manualInput = document.getElementById('manualTicker');
    if (manualInput) {
        manualInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                fetchManualStock();
            }
        });
    }

    console.log('Page loaded. Please select a stock array to fetch data.');
});

// --- PORTFOLIO VIEW TOGGLE ---
async function togglePortfolioView() {
    const btn = document.getElementById('viewPortfolioBtn');
    const stocksContainer = document.getElementById('stocksContainer');
    const isShowing = stocksContainer.dataset.showingPortfolio === "true";
    if (isShowing) {
        stocksContainer.innerHTML = '';
        stocksContainer.dataset.showingPortfolio = "false";
        btn.textContent = "Show Portfolio";
    } else {
        showPortfolioInStocksContainer();
        btn.textContent = "Hide Portfolio";
    }
}