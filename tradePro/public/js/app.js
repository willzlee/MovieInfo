// Stock Trading App
// Main client-side JavaScript

// Global state
const state = {
  user: null,
  stocks: new Map(),
  portfolio: [],
  transactions: [],
  selectedStock: null,
  websocket: null,
  stockPriceUpdates: new Map()
};

// DOM Elements - Authentication
const authSection = document.getElementById('auth-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginFormElement = document.getElementById('login-form-element');
const registerFormElement = document.getElementById('register-form-element');
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const showRegisterLink = document.getElementById('show-register-link');
const showLoginLink = document.getElementById('show-login-link');
const navUnauthenticated = document.getElementById('nav-unauthenticated');
const navAuthenticated = document.getElementById('nav-authenticated');
const logoutBtn = document.getElementById('logout-btn');
const userBalance = document.getElementById('user-balance');

// DOM Elements - App Content
const appContent = document.getElementById('app-content');
const portfolioView = document.getElementById('portfolio-view');
const tradeView = document.getElementById('trade-view');
const statementsView = document.getElementById('statements-view');
const portfolioLink = document.getElementById('portfolio-link');
const tradeLink = document.getElementById('trade-link');
const statementsLink = document.getElementById('statements-link');

// DOM Elements - Portfolio
const portfolioBalance = document.getElementById('portfolio-balance');
const portfolioValue = document.getElementById('portfolio-value');
const totalValue = document.getElementById('total-value');
const holdingsTbody = document.getElementById('holdings-tbody');

// DOM Elements - Trade
const marketTbody = document.getElementById('market-tbody');
const tradeFormContainer = document.getElementById('trade-form-container');
const tradeForm = document.getElementById('trade-form');
const tradeSymbol = document.getElementById('trade-symbol');
const tradeSymbolDisplay = document.getElementById('trade-symbol-display');
const tradeNameDisplay = document.getElementById('trade-name-display');
const tradePrice = document.getElementById('trade-price');
const tradePriceDisplay = document.getElementById('trade-price-display');
const tradeAction = document.getElementById('trade-action');
const buyTab = document.getElementById('buy-tab');
const sellTab = document.getElementById('sell-tab');
const tradeQuantity = document.getElementById('trade-quantity');
const tradeTotalDisplay = document.getElementById('trade-total-display');
const tradeBalanceDisplay = document.getElementById('trade-balance-display');
const tradeMessage = document.getElementById('trade-message');
const tradeModal = document.getElementById('trade-modal');
const tradeResultContent = document.getElementById('trade-result-content');

// DOM Elements - Statements
const statementBalance = document.getElementById('statement-balance');
const statementPortfolioValue = document.getElementById('statement-portfolio-value');
const statementTotalValue = document.getElementById('statement-total-value');
const transactionsTbody = document.getElementById('transactions-tbody');
const generateStatementBtn = document.getElementById('generate-statement-btn');
const statementModal = document.getElementById('statement-modal');
const statementExportContent = document.getElementById('statement-export-content');
const printStatementBtn = document.getElementById('print-statement-btn');
const downloadStatementBtn = document.getElementById('download-statement-btn');

// Close buttons for modals
const closeModalButtons = document.querySelectorAll('.close-modal');

// Initialize App
function initApp() {
  // Check if user is already logged in (via session)
  checkAuthStatus();
  
  // Set up event listeners
  setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
  // Auth navigation
  loginBtn.addEventListener('click', () => {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  });
  
  registerBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  });
  
  showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  });
  
  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  });
  
  // Auth forms
  loginFormElement.addEventListener('submit', handleLogin);
  registerFormElement.addEventListener('submit', handleRegister);
  logoutBtn.addEventListener('click', handleLogout);
  
  // Navigation
  portfolioLink.addEventListener('click', (e) => {
    e.preventDefault();
    showView(portfolioView, portfolioLink);
  });
  
  tradeLink.addEventListener('click', (e) => {
    e.preventDefault();
    showView(tradeView, tradeLink);
    loadStocks();
  });
  
  statementsLink.addEventListener('click', (e) => {
    e.preventDefault();
    showView(statementsView, statementsLink);
    loadTransactions();
  });
  
  // Trade
  tradeForm.addEventListener('submit', handleTrade);
  
  buyTab.addEventListener('click', () => {
    buyTab.classList.add('active');
    sellTab.classList.remove('active');
    tradeAction.value = 'buy';
    updateTradeTotal();
  });
  
  sellTab.addEventListener('click', () => {
    sellTab.classList.add('active');
    buyTab.classList.remove('active');
    tradeAction.value = 'sell';
    updateTradeTotal();
  });
  
  tradeQuantity.addEventListener('input', updateTradeTotal);
  
  // Statements
  generateStatementBtn.addEventListener('click', generateStatement);
  printStatementBtn.addEventListener('click', () => {
    window.print();
  });
  
  // Could be implemented with a proper PDF library
  downloadStatementBtn.addEventListener('click', () => {
    alert('In a production environment, this would generate a PDF download.');
  });
  
  // Close modals
  closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
      tradeModal.style.display = 'none';
      statementModal.style.display = 'none';
    });
  });
  
  // Close modal when clicking outside content
  window.addEventListener('click', (e) => {
    if (e.target === tradeModal) {
      tradeModal.style.display = 'none';
    }
    if (e.target === statementModal) {
      statementModal.style.display = 'none';
    }
  });
}

// Auth functions
async function checkAuthStatus() {
  try {
    // First, try a safer endpoint that doesn't trigger 401 errors in the console
    const stocksResponse = await fetch('/api/stocks');
    
    if (!stocksResponse.ok) {
      throw new Error('API server not responding');
    }
    
    // Then check authentication with credentials
    const response = await fetch('/api/portfolio', {
      credentials: 'include'
    });
    
    if (response.ok) {
      // User is authenticated
      const data = await response.json();
      handleSuccessfulAuth(data);
    } else {
      // User is not authenticated or session expired - this is normal for new visitors
      console.log('User not authenticated yet, showing auth forms');
      showAuthForms();
    }
  } catch (error) {
    console.error('Error checking authentication status:', error);
    showAuthForms();
  }
}

function showAuthForms() {
  authSection.style.display = 'block';
  appContent.style.display = 'none';
  navUnauthenticated.style.display = 'flex';
  navAuthenticated.style.display = 'none';
  
  // Default to showing login form
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
}

function handleSuccessfulAuth(data) {
  // Hide auth forms and show app content
  authSection.style.display = 'none';
  appContent.style.display = 'block';
  navUnauthenticated.style.display = 'none';
  navAuthenticated.style.display = 'flex';
  
  // Update user data in state
  state.user = data.data;
  
  // Show portfolio balance
  userBalance.textContent = formatCurrency(state.user.balance);
  
  // Default view is portfolio
  showView(portfolioView, portfolioLink);
  
  // Load portfolio data
  loadPortfolio();
  
  // Connect to WebSocket for real-time stock updates
  connectWebSocket();
}

async function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  
  if (!username || !password) {
    showMessage(loginMessage, 'Please fill in all fields', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Clear form and messages
      loginFormElement.reset();
      loginMessage.innerHTML = '';
      
      // Handle successful authentication
      handleSuccessfulAuth(data);
    } else {
      showMessage(loginMessage, data.message || 'Login failed', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showMessage(loginMessage, 'An error occurred while trying to log in', 'error');
  }
}

async function handleRegister(event) {
  event.preventDefault();
  
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  
  if (!username || !password || !confirmPassword) {
    showMessage(registerMessage, 'Please fill in all fields', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showMessage(registerMessage, 'Passwords do not match', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Clear form and messages
      registerFormElement.reset();
      registerMessage.innerHTML = '';
      
      // Handle successful authentication
      handleSuccessfulAuth(data);
    } else {
      showMessage(registerMessage, data.message || 'Registration failed', 'error');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showMessage(registerMessage, 'An error occurred while trying to register', 'error');
  }
}

async function handleLogout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    // Clear state
    state.user = null;
    state.stocks = new Map();
    state.portfolio = [];
    state.transactions = [];
    state.selectedStock = null;
    
    // Disconnect WebSocket
    if (state.websocket) {
      state.websocket.close();
      state.websocket = null;
    }
    
    // Show auth forms
    showAuthForms();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Navigation
function showView(view, link) {
  // Hide all views
  portfolioView.style.display = 'none';
  tradeView.style.display = 'none';
  statementsView.style.display = 'none';
  
  // Remove active class from all links
  portfolioLink.classList.remove('active');
  tradeLink.classList.remove('active');
  statementsLink.classList.remove('active');
  
  // Show the selected view and set active link
  view.style.display = 'block';
  if (link) link.classList.add('active');
}

// Portfolio
async function loadPortfolio() {
  try {
    const response = await fetch('/api/portfolio', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Update state
      state.user.balance = data.data.balance;
      state.portfolio = data.data.portfolio;
      
      // Calculate totals
      const portfolioTotal = state.portfolio.reduce((sum, item) => sum + item.totalValue, 0);
      
      // Update UI
      portfolioBalance.textContent = formatCurrency(state.user.balance);
      portfolioValue.textContent = formatCurrency(portfolioTotal);
      totalValue.textContent = formatCurrency(state.user.balance + portfolioTotal);
      userBalance.textContent = formatCurrency(state.user.balance);
      
      // Render holdings table
      renderHoldings();
    } else {
      console.error('Failed to load portfolio');
    }
  } catch (error) {
    console.error('Error loading portfolio:', error);
  }
}

function renderHoldings() {
  if (!state.portfolio || state.portfolio.length === 0) {
    holdingsTbody.innerHTML = `
      <tr class="empty-state">
        <td colspan="6">
          <div class="empty-message">
            <i class="fas fa-info-circle"></i>
            <p>You don't own any stocks yet. Head over to the Trade section to start investing!</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  let html = '';
  
  state.portfolio.forEach(holding => {
    html += `
      <tr>
        <td>${holding.symbol}</td>
        <td>${holding.name}</td>
        <td>${holding.quantity}</td>
        <td>${formatCurrency(holding.currentPrice)}</td>
        <td>${formatCurrency(holding.totalValue)}</td>
        <td class="actions">
          <button 
            class="btn btn-primary btn-sm" 
            onclick="initiateTrade('${holding.symbol}', 'buy')"
          >
            Buy
          </button>
          <button 
            class="btn btn-danger btn-sm" 
            onclick="initiateTrade('${holding.symbol}', 'sell')"
          >
            Sell
          </button>
        </td>
      </tr>
    `;
  });
  
  holdingsTbody.innerHTML = html;
}

// Stock Market and Trading
async function loadStocks() {
  try {
    marketTbody.innerHTML = `
      <tr class="loading-state">
        <td colspan="5">
          <div class="loading-spinner"></div>
          <p>Loading stock data...</p>
        </td>
      </tr>
    `;
    
    const response = await fetch('/api/stocks');
    
    if (response.ok) {
      const data = await response.json();
      
      // Update state
      state.stocks.clear();
      data.data.forEach(stock => {
        state.stocks.set(stock.symbol, stock);
      });
      
      renderStockTable();
    } else {
      marketTbody.innerHTML = `
        <tr class="empty-state">
          <td colspan="5">
            <div class="empty-message">
              <i class="fas fa-exclamation-circle"></i>
              <p>Failed to load stocks. Please try again later.</p>
            </div>
          </td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('Error loading stocks:', error);
    marketTbody.innerHTML = `
      <tr class="empty-state">
        <td colspan="5">
          <div class="empty-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>Error: ${error.message}</p>
          </div>
        </td>
      </tr>
    `;
  }
}

function renderStockTable() {
  if (!state.stocks || state.stocks.size === 0) {
    marketTbody.innerHTML = `
      <tr class="empty-state">
        <td colspan="5">
          <div class="empty-message">
            <i class="fas fa-info-circle"></i>
            <p>No stocks available at the moment. Please try again later.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  let html = '';
  
  state.stocks.forEach(stock => {
    // Get price change data if available
    const priceUpdate = state.stockPriceUpdates.get(stock.symbol);
    const changePercent = priceUpdate ? priceUpdate.changePercent : 0;
    const changeClass = changePercent >= 0 ? 'change-positive' : 'change-negative';
    const changeIcon = changePercent >= 0 ? 'fa-caret-up' : 'fa-caret-down';
    
    html += `
      <tr>
        <td>${stock.symbol}</td>
        <td>${stock.name}</td>
        <td>${formatCurrency(stock.price)}</td>
        <td>
          <div class="change-indicator ${changeClass}">
            <i class="fas ${changeIcon}"></i>
            <span>${changePercent ? changePercent.toFixed(2) + '%' : '0.00%'}</span>
          </div>
        </td>
        <td class="actions">
          <button 
            class="btn btn-primary btn-sm" 
            onclick="initiateTrade('${stock.symbol}', 'buy')"
          >
            Buy
          </button>
          <button 
            class="btn btn-danger btn-sm" 
            onclick="initiateTrade('${stock.symbol}', 'sell')"
            ${!isStockInPortfolio(stock.symbol) ? 'disabled' : ''}
          >
            Sell
          </button>
        </td>
      </tr>
    `;
  });
  
  marketTbody.innerHTML = html;
}

function connectWebSocket() {
  // Close existing connection if any
  if (state.websocket) {
    state.websocket.close();
  }
  
  // Create a new WebSocket connection
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/stocks`;
  
  state.websocket = new WebSocket(wsUrl);
  
  // Connection opened
  state.websocket.addEventListener('open', (event) => {
    console.log('Connected to stock updates');
    
    // Subscribe to all stocks
    state.websocket.send(JSON.stringify({
      type: 'subscribe',
      symbols: Array.from(state.stocks.keys())
    }));
  });
  
  // Listen for messages
  state.websocket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'stockList') {
      // Initial stock list
      message.data.forEach(stock => {
        state.stocks.set(stock.symbol, stock);
      });
      
      if (tradeView.style.display === 'block') {
        renderStockTable();
      }
    }
    else if (message.type === 'stockUpdate') {
      // Update stock price
      const { symbol, price, changePercent } = message.data;
      const stock = state.stocks.get(symbol);
      
      if (stock) {
        stock.price = price;
        state.stockPriceUpdates.set(symbol, { price, changePercent });
        
        // Update UI if trading that stock
        if (state.selectedStock && state.selectedStock.symbol === symbol) {
          tradePriceDisplay.textContent = formatCurrency(price);
          tradePrice.value = price;
          updateTradeTotal();
        }
        
        // Update stock table if visible
        if (tradeView.style.display === 'block') {
          renderStockTable();
        }
        
        // Update portfolio if owns this stock
        if (isStockInPortfolio(symbol)) {
          loadPortfolio();
        }
      }
    }
  });
  
  // Handle errors
  state.websocket.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
  });
  
  // Handle connection close
  state.websocket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed');
    
    // Attempt to reconnect after a delay
    setTimeout(() => {
      if (state.user) {
        connectWebSocket();
      }
    }, 5000);
  });
}

function isStockInPortfolio(symbol) {
  return state.portfolio.some(holding => holding.symbol === symbol && holding.quantity > 0);
}

// Trade functions
function initiateTrade(symbol, action) {
  const stock = state.stocks.get(symbol);
  if (!stock) return;
  
  // Set selected stock
  state.selectedStock = stock;
  
  // Update trade form
  tradeSymbol.value = symbol;
  tradeSymbolDisplay.textContent = symbol;
  tradeNameDisplay.textContent = stock.name;
  tradePrice.value = stock.price;
  tradePriceDisplay.textContent = formatCurrency(stock.price);
  tradeQuantity.value = 1;
  
  // Set action (buy/sell)
  tradeAction.value = action;
  if (action === 'buy') {
    buyTab.classList.add('active');
    sellTab.classList.remove('active');
  } else {
    buyTab.classList.remove('active');
    sellTab.classList.add('active');
  }
  
  // Show trade form
  tradeFormContainer.style.display = 'block';
  
  // Set max quantity if selling
  if (action === 'sell') {
    const holding = state.portfolio.find(h => h.symbol === symbol);
    if (holding) {
      tradeQuantity.max = holding.quantity;
    } else {
      tradeQuantity.max = 0;
    }
  } else {
    tradeQuantity.removeAttribute('max');
  }
  
  // Update balance display
  tradeBalanceDisplay.textContent = formatCurrency(state.user.balance);
  
  // Calculate total
  updateTradeTotal();
  
  // Scroll to form
  tradeFormContainer.scrollIntoView({ behavior: 'smooth' });
}

function updateTradeTotal() {
  const quantity = parseInt(tradeQuantity.value, 10) || 0;
  const price = parseFloat(tradePrice.value) || 0;
  const total = quantity * price;
  
  tradeTotalDisplay.textContent = formatCurrency(total);
  
  // Validate if user has enough balance for buying
  if (tradeAction.value === 'buy' && total > state.user.balance) {
    showMessage(tradeMessage, 'Insufficient funds for this purchase', 'error');
    document.getElementById('trade-submit').disabled = true;
  } 
  // Validate if user has enough shares for selling
  else if (tradeAction.value === 'sell') {
    const holding = state.portfolio.find(h => h.symbol === tradeSymbol.value);
    if (!holding || holding.quantity < quantity) {
      showMessage(tradeMessage, 'You don\'t have enough shares to sell', 'error');
      document.getElementById('trade-submit').disabled = true;
    } else {
      tradeMessage.innerHTML = '';
      document.getElementById('trade-submit').disabled = false;
    }
  } else {
    tradeMessage.innerHTML = '';
    document.getElementById('trade-submit').disabled = false;
  }
}

async function handleTrade(event) {
  event.preventDefault();
  
  const symbol = tradeSymbol.value;
  const action = tradeAction.value;
  const quantity = parseInt(tradeQuantity.value, 10);
  
  if (!symbol || !action || !quantity || quantity <= 0) {
    showMessage(tradeMessage, 'Please fill in all fields with valid values', 'error');
    return;
  }
  
  try {
    // Show loading state
    const submitBtn = document.getElementById('trade-submit');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading-spinner"></div>';
    
    const response = await fetch('/api/trade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        symbol,
        action,
        quantity
      }),
    });
    
    const data = await response.json();
    
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    
    if (response.ok) {
      // Update user balance
      state.user.balance = data.data.newBalance;
      userBalance.textContent = formatCurrency(state.user.balance);
      
      // Show success message in modal
      showTradeConfirmation(data.data.transaction, action);
      
      // Reset form
      tradeFormContainer.style.display = 'none';
      tradeForm.reset();
      
      // Refresh portfolio data
      loadPortfolio();
    } else {
      showMessage(tradeMessage, data.message || 'Trade failed', 'error');
    }
  } catch (error) {
    console.error('Trade error:', error);
    showMessage(tradeMessage, 'An error occurred while processing the trade', 'error');
    document.getElementById('trade-submit').disabled = false;
  }
}

function showTradeConfirmation(transaction, action) {
  // Format the trade confirmation in the modal
  const actionText = action === 'buy' ? 'Bought' : 'Sold';
  const actionClass = action === 'buy' ? 'success' : 'danger';
  
  tradeResultContent.innerHTML = `
    <h2 class="text-${actionClass}">Trade Successful</h2>
    <div class="trade-confirmation">
      <p class="confirmation-message">
        You have successfully ${actionText.toLowerCase()} ${transaction.quantity} 
        shares of ${transaction.symbol} at ${formatCurrency(transaction.price)} per share.
      </p>
      
      <div class="confirmation-details">
        <div class="detail-row">
          <span class="detail-label">Transaction Type:</span>
          <span class="detail-value text-${actionClass}">${actionText}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Stock:</span>
          <span class="detail-value">${transaction.symbol}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Quantity:</span>
          <span class="detail-value">${transaction.quantity} shares</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Price Per Share:</span>
          <span class="detail-value">${formatCurrency(transaction.price)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Amount:</span>
          <span class="detail-value">${formatCurrency(transaction.total)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Transaction Date:</span>
          <span class="detail-value">${formatDate(transaction.timestamp)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">New Balance:</span>
          <span class="detail-value">${formatCurrency(state.user.balance)}</span>
        </div>
      </div>
      
      <div class="confirmation-actions">
        <button class="btn" onclick="closeTradeModal()">Close</button>
        <button class="btn btn-primary" onclick="goToPortfolio()">View Portfolio</button>
      </div>
    </div>
  `;
  
  // Show the modal
  tradeModal.style.display = 'flex';
}

function closeTradeModal() {
  tradeModal.style.display = 'none';
}

function goToPortfolio() {
  closeTradeModal();
  showView(portfolioView, portfolioLink);
}

// Statements and Transaction History
async function loadTransactions() {
  try {
    transactionsTbody.innerHTML = `
      <tr class="loading-state">
        <td colspan="6">
          <div class="loading-spinner"></div>
          <p>Loading transaction history...</p>
        </td>
      </tr>
    `;
    
    const response = await fetch('/api/transactions', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Update state
      state.transactions = data.data;
      
      // Render transactions table
      renderTransactions();
      
      // Load statement summary data
      loadStatementSummary();
    } else {
      transactionsTbody.innerHTML = `
        <tr class="empty-state">
          <td colspan="6">
            <div class="empty-message">
              <i class="fas fa-exclamation-circle"></i>
              <p>Failed to load transactions. Please try again later.</p>
            </div>
          </td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('Error loading transactions:', error);
    transactionsTbody.innerHTML = `
      <tr class="empty-state">
        <td colspan="6">
          <div class="empty-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>Error: ${error.message}</p>
          </div>
        </td>
      </tr>
    `;
  }
}

function renderTransactions() {
  if (!state.transactions || state.transactions.length === 0) {
    transactionsTbody.innerHTML = `
      <tr class="empty-state">
        <td colspan="6">
          <div class="empty-message">
            <i class="fas fa-info-circle"></i>
            <p>You haven't made any transactions yet. Start trading to see your history here!</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  let html = '';
  
  state.transactions.forEach(transaction => {
    const actionClass = transaction.action === 'buy' ? 'text-primary' : 'text-danger';
    
    html += `
      <tr>
        <td>${formatDate(transaction.timestamp)}</td>
        <td class="${actionClass}">${transaction.action.toUpperCase()}</td>
        <td>${transaction.symbol}</td>
        <td>${transaction.quantity}</td>
        <td>${formatCurrency(transaction.price)}</td>
        <td>${formatCurrency(transaction.total)}</td>
      </tr>
    `;
  });
  
  transactionsTbody.innerHTML = html;
}

async function loadStatementSummary() {
  try {
    const response = await fetch('/api/statements', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Update UI
      statementBalance.textContent = formatCurrency(data.data.currentBalance);
      statementPortfolioValue.textContent = formatCurrency(data.data.portfolioValue);
      statementTotalValue.textContent = formatCurrency(data.data.totalValue);
    }
  } catch (error) {
    console.error('Error loading statement summary:', error);
  }
}

async function generateStatement() {
  try {
    const response = await fetch('/api/statements', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Generate statement HTML
      const statementHTML = generateStatementHTML(data.data);
      
      // Update the modal content
      statementExportContent.innerHTML = statementHTML;
      
      // Show the modal
      statementModal.style.display = 'flex';
    } else {
      alert('Failed to generate statement. Please try again later.');
    }
  } catch (error) {
    console.error('Error generating statement:', error);
    alert('An error occurred while generating the statement');
  }
}

function generateStatementHTML(data) {
  // Calculate period
  const today = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  
  // Format the statement
  return `
    <div class="statement-header">
      <h3>Account Statement</h3>
      <div class="statement-period">
        <span>Period: ${formatDate(startDate)} - ${formatDate(today)}</span>
      </div>
    </div>
    
    <div class="statement-account-info">
      <p><strong>Account Holder:</strong> ${data.username}</p>
      <p><strong>Account ID:</strong> ${data.userId}</p>
      <p><strong>Statement Date:</strong> ${formatDate(today)}</p>
    </div>
    
    <div class="statement-summary">
      <table>
        <tr>
          <th>Current Balance</th>
          <td>${formatCurrency(data.currentBalance)}</td>
        </tr>
        <tr>
          <th>Portfolio Value</th>
          <td>${formatCurrency(data.portfolioValue)}</td>
        </tr>
        <tr class="total-row">
          <th>Total Account Value</th>
          <td>${formatCurrency(data.totalValue)}</td>
        </tr>
      </table>
    </div>
    
    <div class="statement-transactions">
      <h4>Transaction History</h4>
      ${generateTransactionsTable(data.transactions)}
    </div>
    
    <div class="statement-disclaimer">
      <p><small>This statement is for informational purposes only. Stock data is simulated and should not be used for actual investment decisions.</small></p>
    </div>
  `;
}

function generateTransactionsTable(transactions) {
  if (!transactions || transactions.length === 0) {
    return '<p>No transactions during this period.</p>';
  }
  
  let html = `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Action</th>
          <th>Symbol</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  transactions.forEach(transaction => {
    html += `
      <tr>
        <td>${formatDate(transaction.timestamp)}</td>
        <td>${transaction.action.toUpperCase()}</td>
        <td>${transaction.symbol}</td>
        <td>${transaction.quantity}</td>
        <td>${formatCurrency(transaction.price)}</td>
        <td>${formatCurrency(transaction.total)}</td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  return html;
}

// Helper Functions
function showMessage(element, message, type) {
  element.innerHTML = message;
  element.className = 'form-message';
  
  if (type) {
    element.classList.add(type);
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Make some functions available globally for event handlers
window.initiateTrade = initiateTrade;
window.closeTradeModal = closeTradeModal;
window.goToPortfolio = goToPortfolio;