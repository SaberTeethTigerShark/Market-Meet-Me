### How to Use This Program

This application is contained within a single HTML file, including embedded styling and scripting. To launch the program, simply open the `index.html` file in any modern web browser.

#### API Activation

To enable data retrieval features, you must obtain an API key from [Financial Modeling Prep](https://financialmodelingprep.com). The free tier currently allows up to 250 API calls on the free tier and more on paid tiers.

Once you have your API key:

1. Open the `index.html` file using a text editor such as Notepad or Notepad++.
2. Locate the following line (approximately line 778):

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
- **Purpose**: Select a predefined stock category (e.g., sector or sub-industry).
- **How to use**: Choose a category from the dropdown to load all associated stocks.

---

### 🔹 `#stocksContainer`
- **Purpose**: Display fetched stock data.
- **How to use**: This section updates automatically when stocks are fetched. No direct interaction needed.

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
//  highlighting the highest and lowest closing days.

---