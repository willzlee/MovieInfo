const express = require('express');
const path = require('path');
const http = require('http');
const cors = require('cors');
const session = require('express-session');
const WebSocket = require('ws');

// Initialize Express app
const app = express();
const httpServer = http.createServer(app);

// Set up WebSocket server for real-time stock updates
const wss = new WebSocket.Server({ 
  server: httpServer,
  path: '/ws/stocks'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware for user authentication
app.use(session({
  secret: 'stock-trading-app-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// In-memory data store (would be replaced with a database in production)
const users = new Map();
const stocks = new Map();
const transactions = new Map();
let nextUserId = 1;
let nextTransactionId = 1;

// Initialize some default stocks
stocks.set('AAPL', { 
  symbol: 'AAPL', 
  name: 'Apple Inc.', 
  price: 175.45,
  lastUpdated: new Date()
});
stocks.set('MSFT', { 
  symbol: 'MSFT', 
  name: 'Microsoft Corporation', 
  price: 340.27,
  lastUpdated: new Date()
});
stocks.set('GOOGL', { 
  symbol: 'GOOGL', 
  name: 'Alphabet Inc.', 
  price: 138.21,
  lastUpdated: new Date()
});
stocks.set('AMZN', { 
  symbol: 'AMZN', 
  name: 'Amazon.com Inc.', 
  price: 175.35,
  lastUpdated: new Date()
});
stocks.set('META', { 
  symbol: 'META', 
  name: 'Meta Platforms Inc.', 
  price: 481.74,
  lastUpdated: new Date()
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected to stock updates');
  
  // Send initial stock data
  ws.send(JSON.stringify({
    type: 'stockList',
    data: Array.from(stocks.values())
  }));
  
  // Handle client messages
  ws.on('message', (messageBuffer) => {
    const message = messageBuffer.toString();
    const data = JSON.parse(message);
    console.log('Received:', data);
    
    // Handle different message types
    if (data.type === 'subscribe' && data.symbols) {
      // Client wants to subscribe to specific stock symbols
      ws.subscribedSymbols = data.symbols;
      console.log(`Client subscribed to: ${data.symbols.join(', ')}`);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected from stock updates');
  });
});

// Function to simulate real-time stock price changes
function updateStockPrices() {
  for (const [symbol, stock] of stocks.entries()) {
    // Simulate a random price change within ±2%
    const changePercent = (Math.random() * 4) - 2; // -2% to +2%
    const changeAmount = stock.price * (changePercent / 100);
    
    // Update the stock price
    stock.price = Math.max(parseFloat((stock.price + changeAmount).toFixed(2)), 0.01);
    stock.lastUpdated = new Date();
    
    // Broadcast the update to all connected clients
    const update = {
      type: 'stockUpdate',
      data: {
        symbol,
        price: stock.price,
        changePercent: parseFloat(changePercent.toFixed(2)),
        lastUpdated: stock.lastUpdated
      }
    };
    
    wss.clients.forEach((client) => {
      // Only send to clients who are subscribed to this symbol or to all stocks
      if (client.readyState === client.OPEN && 
          (!client.subscribedSymbols || client.subscribedSymbols.includes(symbol))) {
        client.send(JSON.stringify(update));
      }
    });
  }
}

// Update stock prices every 3 seconds
setInterval(updateStockPrices, 3000);

// Routes
// 1. User Authentication
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }
  
  // Check if username already exists
  for (const user of users.values()) {
    if (user.username === username) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
  }
  
  // Create new user
  const userId = String(nextUserId++);
  const newUser = {
    id: userId,
    username,
    password, // In a real app, this would be hashed
    balance: 10000.00, // Start with $10,000
    portfolio: {},
    transactions: []
  };
  
  users.set(userId, newUser);
  
  // Set session
  req.session.userId = userId;
  
  // Return user data (excluding password)
  const { password: _, ...userData } = newUser;
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: userData
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }
  
  // Find user by username
  let foundUser = null;
  for (const user of users.values()) {
    if (user.username === username) {
      foundUser = user;
      break;
    }
  }
  
  // Check if user exists and password matches
  if (!foundUser || foundUser.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
  
  // Set session
  req.session.userId = foundUser.id;
  
  // Return user data (excluding password)
  const { password: _, ...userData } = foundUser;
  res.json({
    success: true,
    message: 'Login successful',
    data: userData
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logout successful' });
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const user = users.get(req.session.userId);
  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }
  
  req.user = user;
  next();
};

// 2. Stock Data API
app.get('/api/stocks', (req, res) => {
  res.json({
    success: true,
    data: Array.from(stocks.values())
  });
});

app.get('/api/stocks/:symbol', (req, res) => {
  const { symbol } = req.params;
  const stock = stocks.get(symbol.toUpperCase());
  
  if (!stock) {
    return res.status(404).json({ success: false, message: 'Stock not found' });
  }
  
  res.json({
    success: true,
    data: stock
  });
});

// 3. User Portfolio
app.get('/api/portfolio', isAuthenticated, (req, res) => {
  // Get user's portfolio
  const portfolio = [];
  
  for (const [symbol, quantity] of Object.entries(req.user.portfolio)) {
    if (quantity > 0) {
      const stock = stocks.get(symbol);
      if (stock) {
        portfolio.push({
          symbol,
          name: stock.name,
          quantity,
          currentPrice: stock.price,
          totalValue: parseFloat((quantity * stock.price).toFixed(2))
        });
      }
    }
  }
  
  res.json({
    success: true,
    data: {
      balance: req.user.balance,
      portfolio
    }
  });
});

// 4. Trading API
app.post('/api/trade', isAuthenticated, (req, res) => {
  const { action, symbol, quantity } = req.body;
  
  if (!action || !symbol || !quantity) {
    return res.status(400).json({ 
      success: false, 
      message: 'Action, symbol, and quantity are required' 
    });
  }
  
  if (!['buy', 'sell'].includes(action.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Action must be either "buy" or "sell"'
    });
  }
  
  const stock = stocks.get(symbol.toUpperCase());
  if (!stock) {
    return res.status(404).json({ success: false, message: 'Stock not found' });
  }
  
  const numQuantity = parseInt(quantity, 10);
  if (isNaN(numQuantity) || numQuantity <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be a positive number'
    });
  }
  
  // Get the user and their portfolio
  const user = req.user;
  user.portfolio = user.portfolio || {};
  
  // Process buy order
  if (action.toLowerCase() === 'buy') {
    const cost = parseFloat((stock.price * numQuantity).toFixed(2));
    
    // Check if user has enough balance
    if (user.balance < cost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds'
      });
    }
    
    // Update user's balance
    user.balance = parseFloat((user.balance - cost).toFixed(2));
    
    // Update user's portfolio
    user.portfolio[symbol] = (user.portfolio[symbol] || 0) + numQuantity;
    
    // Create transaction record
    const transactionId = String(nextTransactionId++);
    const transaction = {
      id: transactionId,
      userId: user.id,
      action: 'buy',
      symbol,
      quantity: numQuantity,
      price: stock.price,
      total: cost,
      timestamp: new Date()
    };
    
    transactions.set(transactionId, transaction);
    user.transactions.push(transactionId);
    
    res.json({
      success: true,
      message: `Successfully bought ${numQuantity} shares of ${symbol}`,
      data: {
        transaction,
        newBalance: user.balance,
        portfolio: user.portfolio
      }
    });
  }
  // Process sell order
  else if (action.toLowerCase() === 'sell') {
    // Check if user owns enough shares
    if (!user.portfolio[symbol] || user.portfolio[symbol] < numQuantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient shares of ${symbol} to sell`
      });
    }
    
    const revenue = parseFloat((stock.price * numQuantity).toFixed(2));
    
    // Update user's balance
    user.balance = parseFloat((user.balance + revenue).toFixed(2));
    
    // Update user's portfolio
    user.portfolio[symbol] -= numQuantity;
    
    // Create transaction record
    const transactionId = String(nextTransactionId++);
    const transaction = {
      id: transactionId,
      userId: user.id,
      action: 'sell',
      symbol,
      quantity: numQuantity,
      price: stock.price,
      total: revenue,
      timestamp: new Date()
    };
    
    transactions.set(transactionId, transaction);
    user.transactions.push(transactionId);
    
    res.json({
      success: true,
      message: `Successfully sold ${numQuantity} shares of ${symbol}`,
      data: {
        transaction,
        newBalance: user.balance,
        portfolio: user.portfolio
      }
    });
  }
});

// 5. Transaction History and Statements
app.get('/api/transactions', isAuthenticated, (req, res) => {
  // Get all transactions for the user
  const userTransactions = req.user.transactions
    .map(id => transactions.get(id))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  res.json({
    success: true,
    data: userTransactions
  });
});

app.get('/api/statements', isAuthenticated, (req, res) => {
  // Get all transactions for the user
  const userTransactions = req.user.transactions
    .map(id => transactions.get(id))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Calculate portfolio value
  let portfolioValue = 0;
  for (const [symbol, quantity] of Object.entries(req.user.portfolio)) {
    if (quantity > 0) {
      const stock = stocks.get(symbol);
      if (stock) {
        portfolioValue += parseFloat((quantity * stock.price).toFixed(2));
      }
    }
  }
  
  // Generate statement data
  const statement = {
    userId: req.user.id,
    username: req.user.username,
    currentBalance: req.user.balance,
    portfolioValue,
    totalValue: parseFloat((req.user.balance + portfolioValue).toFixed(2)),
    transactions: userTransactions
  };
  
  res.json({
    success: true,
    data: statement
  });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket endpoint available at ws://0.0.0.0:${PORT}/ws/stocks`);
});