# Snapora browser extension

Snapora is a Manifest V3 browser extension built with React, TypeScript, and Vite.

## Development

Install dependencies and start the Vite development server:

```sh
npm install
npm run dev
```

## Build and load the extension

Build the extension package:

```sh
Compress-Archive -Path .\dist\* -DestinationPath .\snapora-v1.0.0.zip -Force
```

In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the generated `dist` directory. The toolbar action opens the extension popup.
