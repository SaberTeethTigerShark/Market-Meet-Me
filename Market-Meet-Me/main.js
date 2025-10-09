const stockArrays = {};
const stockDescriptions = {};

// Set your API key here
const API_KEY = 'API KEY HERE';

//  function toggleDarkMode()
//  Toggles the website's theme between light and dark modes by adding or removing the dark-mode CSS class from the <body> element.

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}


//
//  parseEmbeddedCSV
//  Parses CSV data embedded in the DOM element with ID 'embeddedCSV',
//  categorizes stock symbols by sector and sub-industry, and returns a sorted list of all unique categories found.
//

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

//
// categorizeStocksFromCSV()
// Parses embedded CSV data to map stock symbols to their names, categorize them by sector and sub-industry,
// and return a sorted list of all unique categories.
//
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

//
//  populateCategoryDropdown(categoryList)
//  Populates a dropdown menu with category options using the provided list, resetting its contents before insertion.
//
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

//
//  populateTickerSuggestions()
//  Generates autocomplete suggestions for stock tickers by parsing embedded CSV data and populating
//  a datalist element with ticker-name pairs.
//
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

//
//  loadSelectedStockArray()
//  Loads the selected stock category from a dropdown, deduplicates its tickers, and fetches their data in a single batch.
//
function loadSelectedStockArray() {
    const select = document.getElementById('stockArraySelectSelect');
    const selectedArrayName = select.value;

    if (!selectedArrayName) return;

    const selectedArray = stockArrays[selectedArrayName];
    if (!selectedArray || !selectedArray.length) return;

    const stocksContainer = document.getElementById('stocksContainer');
    stocksContainer.innerHTML = '';

    // Deduplicate tickers before fetching
    const uniqueTickers = [...new Set(selectedArray)];

    // Fetch all tickers in one batch
    getStockDataBatch(uniqueTickers);
}

//
//  lookupTickerByName(name, clearBoard)
//  Searches for a NASDAQ ticker symbol by company name using an external API,
//  optionally clears the display, and fetches stock data if found.
//
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

//
//  updateWeeksToFetch()
//  Updates the global `weeksToFetch` value based on user input and reloads the currently selected stock array accordingly.
//
let weeksToFetch = 2; // Default to 2 weeks
function updateWeeksToFetch() {
    const input = document.getElementById('weeksInput');
    weeksToFetch = parseInt(input.value);
    console.log(`Weeks to fetch updated to: ${weeksToFetch}`);

    // Refetch the selected stock array
    loadSelectedStockArray();
}

//
//  fetchManualStock()
//  Attempts to fetch stock data using a manually entered ticker symbol,
//  falling back to name-based lookup if no direct match is found.
//
function fetchManualStock() {
    const input = document.getElementById('manualTicker').value.trim();
    if (!input) return;

    const clearBoard = document.getElementById('clearBoardToggle').checked;

    // Try direct ticker match first
    const ticker = input.toUpperCase();
    if (stockDescriptions.hasOwnProperty(ticker)) {
        if (clearBoard) {
            document.getElementById('stocksContainer').innerHTML = '';
        }
        getStockData(ticker);
    } else {
        // Fallback to lookup by name
        lookupTickerByName(input, clearBoard);
    }
}

//
//  getStockData(stockTicker)
//  Fetches historical stock data for a given ticker, reverses it chronologically,
//  and renders it in blocks based on the selected time range.
//
async function getStockData(stockTicker) {
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${stockTicker}?apikey=${API_KEY}&timeseries=${weeksToFetch * 7}`;
    try {
        console.log('Fetching stock data for ticker:', stockTicker);
        const response = await fetch(url);
        const data = await response.json();
        console.log('Stock data for ticker:', stockTicker, data);

        const stockData = data.historical;
        if (!stockData || !stockData.length) {
            console.warn(`No historical data available for ticker: ${stockTicker}`);
            return;
        }

        const stockName = stockDescriptions[stockTicker] || stockTicker;
        const stocksContainer = document.getElementById('stocksContainer');

        // Reverse to show oldest first
        stockData.reverse();

        // If weeksToFetch >= 16, split into 90-day blocks
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

//
//  chunkArray(array, size)
//  Splits an array into smaller chunks of a specified size and returns them as a new array of arrays.
//

function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

//
//  getStockDataBatch(tickerArray)
//  Fetches historical stock data for multiple tickers in a single API call, renders each dataset,
//  and recursively retries any missing tickers in manageable chunks.
//

async function getStockDataBatch(tickerArray) {
    const uniqueTickers = [...new Set(tickerArray)];
    const tickerString = uniqueTickers.join(',');
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${tickerString}?apikey=${API_KEY}&timeseries=${weeksToFetch * 7}`;

    try {
        console.log('Fetching batch stock data for:', tickerString);
        const response = await fetch(url);
        const data = await response.json();
        console.log('Batch stock data:', data);

        const stocksContainer = document.getElementById('stocksContainer');

        if (!Array.isArray(data.historicalStockList)) {
            console.warn('Unexpected batch format:', data);
            return;
        }

        const returnedSymbols = new Set(data.historicalStockList.map(stock => stock.symbol));

        // Render returned stocks
        data.historicalStockList.forEach(stock => {
            const { symbol, historical } = stock;
            if (!Array.isArray(historical) || !historical.length) {
                console.warn(`No historical data available for ticker: ${symbol}`);
                return;
            }

            const stockName = stockDescriptions[symbol] || symbol;
            historical.reverse();

            if (weeksToFetch >= 16) {
                const blockSize = 90;
                for (let i = 0; i < historical.length; i += blockSize) {
                    const block = historical.slice(i, i + blockSize);
                    const blockLabel = `Q${Math.floor(i / blockSize) + 1}`;
                    renderStockBlock(symbol, stockName, block, blockLabel, stocksContainer);
                }
            } else {
                renderStockBlock(symbol, stockName, historical, null, stocksContainer);
            }
        });

        // If some tickers were skipped, retry them in chunks
        const missingTickers = uniqueTickers.filter(ticker => !returnedSymbols.has(ticker));
        if (missingTickers.length) {
            console.warn('Retrying missing tickers in chunks:', missingTickers);
            const chunks = chunkArray(missingTickers, 10); // Adjust chunk size as needed

            for (const chunk of chunks) {
                await getStockDataBatch(chunk); // Recursive call for chunked retry
            }
        }

    } catch (error) {
        console.error('Error fetching batch stock data:', error);
    }
}

//
//  renderStockBlock(ticker, name, dataBlock, blockLabel, container)
//  Renders a visual block of stock data with dynamic styling for price changes,
//  highlighting the highest and lowest closing days.
//

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

    // Identify highest and lowest prices in this block
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
                            .positive {
                                background-color: #2ECC71;
                                color: white;
                            }
                            .negative {
                                background-color: #E74C3C;
                                color: white;
                            }
                            .neutral {
                                background-color: #BDC3C7;
                                color: black;
                            }
                            .topweeks {
                                border: 3px solid #F1C40F;
                            }
                            .lowestprice {
                                background-color: #8E44AD;
                                color: white;
                            }
                        `;
    document.head.appendChild(style);

    let previousPrice = null;
    dataBlock.forEach((day, index) => {
        const change = previousPrice !== null ? (day.close - previousPrice).toFixed(2) : '—';
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

// Replace your portfolio object and functions with this version
const PORTFOLIO_KEY = 'pretendPortfolio';
let portfolio = {};

// loadPortfolioFromStorage();
// Load portfolio from localStorage
function loadPortfolioFromStorage() {
    const stored = localStorage.getItem(PORTFOLIO_KEY);
    portfolio = stored ? JSON.parse(stored) : {};
}

// savePortfolioToStorage();
// Save portfolio to localStorage
function savePortfolioToStorage() {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
}

// clearPortfolioLocalStorage();
// Clear portfolio from localStorage and reset

function clearPortfolioLocalStorage() {
    localStorage.removeItem(PORTFOLIO_KEY);
    portfolio = {};
    // If portfolio is shown in stocksContainer, clear it
    if (document.getElementById('stocksContainer').dataset.showingPortfolio === "true") {
        showPortfolioInStocksContainer();
    }
    closeHamburgerDropdown();
}

// updatePortfolio(ticker, name, price, action, qty = 1);
// Update portfolio based on buy/sell actions

function updatePortfolio(ticker, name, price, action, qty = 1) {
    if (!portfolio[ticker]) {
        portfolio[ticker] = { name, quantity: 0, avgBuyPrice: 0, lastPrice: price };
    }
    let info = portfolio[ticker];
    info.lastPrice = price;
    if (action === 'buy') {
        info.avgBuyPrice = ((info.avgBuyPrice * info.quantity) + (price * qty)) / (info.quantity + qty);
        info.quantity += qty;
    } else if (action === 'sell') {
        info.quantity = Math.max(0, info.quantity - qty);
        if (info.quantity === 0) info.avgBuyPrice = 0;
    } else if (action === 'sellAll') {
        info.quantity = 0;
        info.avgBuyPrice = 0;
    }
    savePortfolioToStorage();
    // If portfolio view is active, refresh it
    if (document.getElementById('stocksContainer').dataset.showingPortfolio === "true") {
        showPortfolioInStocksContainer();
    }
}

// renderTradeControls(ticker, name, lastPrice, container);
// Render buy/sell controls for a stock
function renderTradeControls(ticker, name, lastPrice, container) {
    const controls = document.createElement('div');
    controls.className = 'trade-controls';
    controls.innerHTML = `
        <button class="sell-btn" title="Sell shares"
    onclick="updatePortfolio('${ticker}','${name}',${lastPrice},'sell',parseFloat(document.getElementById('tradeQty_${ticker}').value)||1)">
    Sell
</button>
        <input type="number" min="1" value="" id="tradeQty_${ticker}" placeholder="$" title="Dollar amount to trade">
        <button class="buy-btn" title="Buy shares"
            onclick="buyByDollarAmount('${ticker}','${name}',${lastPrice},'tradeQty_${ticker}')">
            Buy
        </button>
    `;
    container.appendChild(controls);
}

// buyByDollarAmount(ticker, name, lastPrice, inputId);
// Buy shares based on dollar amount input
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
}

// showPortfolioInStocksContainer();
// Display the portfolio in the stocks container

function showPortfolioInStocksContainer() {
    const stocksContainer = document.getElementById('stocksContainer');
    stocksContainer.innerHTML = '';
    stocksContainer.dataset.showingPortfolio = "true";

    const btn = document.getElementById('viewPortfolioBtn');
    if (btn) btn.textContent = "Hide Portfolio";

    // Filter out stocks with zero quantity
    const filteredPortfolio = Object.entries(portfolio).filter(([ticker, info]) => info.quantity > 0);
    if (filteredPortfolio.length === 0) {
        stocksContainer.innerHTML = '<div style="text-align:center;">No stocks in your portfolio.</div>';
        return;
    }
    let table = `<table class="portfolio-table">
        <tr>
            <th></th>
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
        const ret = ((info.lastPrice - info.avgBuyPrice) * info.quantity).toFixed(2);
        let returnClass = '';
        if (info.quantity > 0) {
            returnClass = info.lastPrice > info.avgBuyPrice ? 'return-positive' : (info.lastPrice < info.avgBuyPrice ? 'return-negative' : 'return-neutral');
        }
        const totalValue = (info.quantity * info.lastPrice).toFixed(2);
        table += `<tr>
            <td>
                <button title="Quick Fetch" style="padding:4px 10px; font-size:1rem; border-radius:6px; border:none; background:#3498db; color:#fff; cursor:pointer;"
                    onclick="getStockData('${ticker}')">
                    &#x1F50D;
                </button>
            </td>
            <td>${ticker}</td>
            <td>${info.name}</td>
            <td>${info.quantity.toFixed(4)}</td>
            <td>${info.avgBuyPrice.toFixed(2)}</td>
            <td>${info.lastPrice.toFixed(2)}</td>
            <td>${totalValue}</td>
            <td class="${returnClass}">${ret}</td>
            <td>
                <div style="display:flex;justify-content:center;align-items:center;gap:8px;">
                    <input type="number" min="1" value="" id="portfolioQty_${ticker}" placeholder="$" title="Dollar amount to buy">
                    <button class="buy-btn" title="Buy shares"
                        onclick="buyByDollarAmount('${ticker}','${info.name}',${info.lastPrice},'portfolioQty_${ticker}')">
                        Buy
                    </button>
                    <button class="sell-btn" title="Sell shares"
                        onclick="updatePortfolio('${ticker}','${info.name}',${info.lastPrice},'sell',parseFloat(document.getElementById('portfolioQty_${ticker}').value)||1)">
                        Sell
                    </button>
                    <button class="sell-btn" title="Sell all shares"
                        onclick="updatePortfolio('${ticker}','${info.name}',${info.lastPrice},'sellAll')">
                        Sell All
                    </button>
                </div>
            </td>
        </tr>`;
    });
    table += '</table>';
    stocksContainer.innerHTML = table;
}


// loadSelectedStockArray();
// Handle category selection (show portfolio if selected)
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

// Hamburger menu logic
document.addEventListener('DOMContentLoaded', () => {
    // Hamburger menu open/close
    const menuBtn = document.getElementById('hamburgerMenuBtn');
    const dropdown = document.getElementById('hamburgerDropdown');
    menuBtn.onclick = function () {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    };
    window.addEventListener('click', function (e) {
        if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
});

// closeHamburgerDropdown();
// Close hamburger dropdown

function closeHamburgerDropdown() {
    document.getElementById('hamburgerDropdown').style.display = 'none';
}

// togglePortfolioView();
// Toggle portfolio view in stocks container
function togglePortfolioView() {
    const btn = document.getElementById('viewPortfolioBtn');
    const stocksContainer = document.getElementById('stocksContainer');
    const isShowing = stocksContainer.dataset.showingPortfolio === "true";
    if (isShowing) {
        // Hide portfolio: clear container and reset flag
        stocksContainer.innerHTML = '';
        stocksContainer.dataset.showingPortfolio = "false";
        btn.textContent = "Show Portfolio";
    } else {
        // Show portfolio and bulk fetch latest prices
        const tickers = Object.entries(portfolio)
            .filter(([_, info]) => info.quantity > 0)
            .map(([ticker, _]) => ticker);
        if (tickers.length > 0) {
            getStockDataBatch(tickers);
        }
        showPortfolioInStocksContainer();
        btn.textContent = "Hide Portfolio";
    }
}

//  Initializes the page on load by enabling dark mode, parsing embedded CSV data,
//  categorizing stocks, and populating both ticker suggestions and the category dropdown.

document.addEventListener('DOMContentLoaded', () => {
    loadPortfolioFromStorage();
    console.log('Page loaded. Please select a stock array to fetch data.');

    // Apply dark mode once
    document.body.classList.add('dark-mode');

    // Parse CSV and categorize stocks
    categorizeStocksFromCSV();

    // Populate ticker suggestions
    populateTickerSuggestions();

    // Populate category dropdown
    const categories = parseEmbeddedCSV();
    populateCategoryDropdown(categories);
});