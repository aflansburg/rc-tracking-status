## Tracking Status Web App - Rough Country

React web app to display Rough Country tracking information aggregated from multiple providers.
The intent of this application is to provide comprehensive and updated information that can help identify potential shipment issues.

## Requirements
Requires the rc-tracking-api service to be running and the correct hostname or IP address to be provided to getTracking.js
The API server address and port should be specified in ```src/data/settings.json```

```npm install``` to install all dependencies

## Build
1. Run ```npm run build``` to create build folder
2. Copy web.config file to ```./build/``` directory (for IIS 6+ only)