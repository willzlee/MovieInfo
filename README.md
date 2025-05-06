# Video Info App

## Backend Server (port 5009)
```
# In one terminal window
node app.js
```

## Development Server (port 5001)
```
# In another terminal window
npx webpack serve --host 0.0.0.0 --port 5001
```

## Production Build
```
# The built files will be served by the main Express server
npx webpack
```

## Accessing the App
Development version: http://localhost:5001
Production version: http://localhost:5009
