### How to Use This Program

This application is contained within a single HTML file, including embedded styling and scripting. To launch the program, simply open the `index.html` file in any modern web browser.

#### API Activation

To enable data retrieval features, you must obtain an API key from [Financial Modeling Prep](https://financialmodelingprep.com). The free tier currently allows up to 250 API calls on the free tier and more on paid tiers.

Once you have your API key:

1. Open the `main.js` file using a text editor such as Notepad or Notepad++.
2. Locate the following line (approximately line 5):

   const API_KEY = 'API KEY HERE';

3. Replace `'API KEY HERE'` with your actual API key, enclosed in single quotes.

#### Final Steps

Save the file and reload it in your browser. The program will now be fully functional.

Enjoy exploring the data—happy viewing!

-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

Functionality:

### 🔹 `#manualStockInput`
- **Purpose**: Fetch data for a single stock.
- **How to use**: Type a ticker or company name into the input field, then click **Fetch**. If “Clear previous stocks” is checked, it wipes the current display before loading the new one.

---

### 🔹 `#weeksSelector`
- **Purpose**: Choose how many weeks of historical data to fetch.
- **How to use**: Select a time range from the dropdown. This triggers a refresh of the current stock category.

---

### 🔹 `#darkModeToggle`
- **Purpose**: Toggle between light and dark themes.
- **How to use**: Click the button to switch modes instantly.

---

### 🔹 `#stockArraySelect`
- **Purpose**: Select a predefined stock category (e.g., sector or sub-industry), or view your portfolio.
- **How to use**: Choose a category from the dropdown to load all associated stocks. Select **Portfolio** to view your holdings.

---

### 🔹 `#stocksContainer`
- **Purpose**: Display fetched stock data and portfolio information.
- **How to use**: This section updates automatically when stocks are fetched or when the portfolio is viewed. No direct interaction needed.

---

### 🔹 Portfolio Management
- **Purpose**: Track, buy, and sell stocks in a pretend portfolio.
- **How to use**: Use the trade controls shown with each stock or in the portfolio view to buy or sell shares by dollar amount. Portfolio is saved automatically and can be viewed or hidden.

---

### 🔹 Trade Controls
- **Purpose**: Buy or sell shares of a stock by dollar amount.
- **How to use**: Enter a dollar amount and click **Buy** or **Sell**. Controls are available in both stock blocks and the portfolio table.

---

### 🔹 Hamburger Menu
- **Purpose**: Access additional options and controls.
- **How to use**: Click the hamburger icon to open or close the dropdown menu.

---

### 🔹 Clear Loaded Stocks Button
- **Purpose**: Instantly clear all loaded stock data from the display.
- **How to use**: Click the **Clear Loaded Stocks** button (located next to the Show/Hide Portfolio button) to remove all currently displayed stocks and reset the category dropdown.

---

### 🔹 Toast Notifications
- **Purpose**: Show feedback messages for actions like buying or selling stocks.
- **How to use**: Toasts appear automatically when you perform actions such as trades.

---

### 🔹 Bankroll Display
- **Purpose**: Shows your available cash for trading.
- **How to use**: The bankroll updates automatically as you buy or sell stocks. Negative, zero, or positive balances are visually highlighted.

---

### 🔹 Trade History View
- **Purpose**: View your recent trades and performance summary.
- **How to use**: Click **Show Trade History** to see your last 5 trades and overall performance. Click the ellipsis (…) to expand and view all trades.

---

-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

In-Program Function Documentation

//  function toggleDarkMode()
//  Toggles the website's theme between light and dark modes by adding or removing the dark-mode CSS class from the <body> element.

---

//  parseEmbeddedCSV()
//  Parses CSV data embedded in the DOM element with ID 'embeddedCSV',
//  categorizes stock symbols by sector and sub-industry, and returns a sorted list of all unique categories found.

---

// categorizeStocksFromCSV()
// Parses embedded CSV data to map stock symbols to their names, categorize them by sector and sub-industry,
// and return a sorted list of all unique categories.

---

// populateCategoryDropdown(categoryList)
// Populates a dropdown menu with category options using the provided list, resetting its contents before insertion.

---

// populateTickerSuggestions()
//  Generates autocomplete suggestions for stock tickers by parsing embedded CSV data and populating
//  a datalist element with ticker-name pairs.

---

//  loadSelectedStockArray()
//  Loads the selected stock category from a dropdown, deduplicates its tickers, and fetches their data in a single batch.
//  If "Portfolio" is selected, displays the user's portfolio instead.

---

//  lookupTickerByName(name, clearBoard)
//  Searches for a NASDAQ ticker symbol by company name using an external API,
//  optionally clears the display, and fetches stock data if found.

---

//  updateWeeksToFetch()
//  Updates the global `weeksToFetch` value based on user input and reloads the currently selected stock array accordingly.

---

//  fetchManualStock()
//  Attempts to fetch stock data using a manually entered ticker symbol,
//  falling back to name-based lookup if no direct match is found.

---

// getStockData(stockTicker)
// Fetches historical stock data for a given ticker, reverses it chronologically,
// and renders it in blocks based on the selected time range.

---

//  chunkArray(array, size)
//  Splits an array into smaller chunks of a specified size and returns them as a new array of arrays.

---

//  getStockDataBatch(tickerArray)
//  Fetches historical stock data for multiple tickers in a single API call, renders each dataset,
//  and recursively retries any missing tickers in manageable chunks.

---

//  renderStockBlock(ticker, name, dataBlock, blockLabel, container)
//  Renders a visual block of stock data with dynamic styling for price changes,
//  highlighting the highest and lowest closing days, and includes trade controls for each stock.

---

//  loadPortfolioFromStorage()
//  Loads the user's portfolio from localStorage.

---

//  savePortfolioToStorage()
//  Saves the user's portfolio to localStorage.

---

//  clearPortfolioLocalStorage()
//  Clears the portfolio from localStorage and resets the in-memory portfolio.

---

//  updatePortfolio(ticker, name, price, action, qty = 1)
//  Updates the portfolio based on buy/sell actions, recalculates average buy price, and refreshes the portfolio view if active.

---

//  renderTradeControls(ticker, name, lastPrice, container)
//  Renders buy/sell controls for a stock, allowing trades by dollar amount.

---

//  buyByDollarAmount(ticker, name, lastPrice, inputId)
//  Buys shares based on a user-entered dollar amount.

---

//  sellByDollarAmount(ticker, name, lastPrice, inputId)
//  Sells shares based on a user-entered dollar amount.

---

//  showPortfolioInStocksContainer()
//  Displays the user's portfolio in the stocks container, including trade controls and quick fetch buttons.

---

//  closeHamburgerDropdown()
//  Closes the hamburger dropdown menu.

---

//  togglePortfolioView()
//  Toggles the portfolio view in the stocks container.

---

//  calculatePerformance()
//  Calculates realized and unrealized profit/loss for the portfolio and trade history.

---

//  loadTradeHistoryFromStorage()
//  Loads the user's trade history from localStorage.

---

//  saveTradeHistoryToStorage()
//  Saves the user's trade history to localStorage.

---

//  renderTradeHistoryView()
//  Renders the trade history and performance summary in the trade history container.

---

//  showToast(message, duration)
//  Displays a temporary toast notification with the given message.

---

//  loadBankrollFromStorage()
//  Loads the user's bankroll (cash balance) from localStorage.

---

//  saveBankrollToStorage()
//  Saves the user's bankroll to localStorage.

---

//  updateBankrollDisplay()
//  Updates the bankroll display element with the current cash balance and highlights status.

---

//  clearLoadedStocks()
//  Clears all loaded stock data from the display, resets the portfolio view state, and (if triggered by the Clear Loaded Stocks button) resets the category dropdown selection.

---

-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

Page Initialization
- On page load, enables dark mode, loads the portfolio and trade history, parses and categorizes stocks, populates ticker suggestions and category dropdown, and sets up all controls and event listeners.

---