# DocGuard Vault (CryptoHashVault) 🛡️⛓️

**DocGuard Vault** (also known as *CryptoHashVault*) is a premium, decentralized web application that secures files using cryptographic hashes, immutable blockchain ledgers, and location-lock constraints. It ensures files (such as land deeds, academic certificates, medical records, or sensitive contracts) cannot be tampered with, rollbacked, or verified outside of specified geographical boundaries.

---

## 🚀 Key Features

*   **Keccak-256 Hashing:** Files are hashed locally in the browser, ensuring privacy by design.
*   **Immutable Logging:** Hashes are permanently recorded to Polygon/Ethereum smart contracts to detect any future tampering.
*   **Location Lock Security (Geofencing):** Restricts document verification to a specific GPS coordinate and radius (e.g. 100 meters). Perfect for site-specific documents.
*   **Premium Glassmorphic UI:** A dark-obsidian theme utilizing `Outfit` (headings) and `Plus Jakarta Sans` (body) typography, animated neon glow indicators, and clean SVG visual graphics.
*   **Custom File Dropzones:** Drag-and-drop file inputs showing file metadata and live upload progress.
*   **Ledger Search Filter:** Live search controls on the audit logs dashboard to query transactions by hash or uploader.
*   **Local Mock Mode:** Test all features (uploading, signing, verifying, location lock checks, audit logs) instantly in-memory without requiring MetaMask balance or smart contract deployments.

---

## 📂 Project Structure

```bash
CryptoHashVault/
├── DocGuardVault-main/             # React Frontend Application
│   ├── public/                     # HTML entry & SEO metadata 
│   └── src/                        # Component views, styling (App.css), & assets
└── DocGuardVault-BackEnd-master/   # Node.js/Express Backend Server
    ├── contracts/                  # Solidity Smart Contracts
    ├── index.js                    # Live blockchain production API
    └── index-local.js              # Local mock memory API
```

---

## 🛠️ Installation & Setup

Ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Backend Configuration

Navigate to the backend directory:
```bash
cd DocGuardVault-BackEnd-master
```

Install dependencies:
```bash
npm install
```

#### Running Options:
*   **Local Mode (Recommended for testing):** Starts an in-memory mock ledger on port `5000` (so you don't need real MetaMask funds or deployed contracts):
    ```bash
    npm run start:local
    ```
*   **Live Blockchain Mode:** Configure a `.env` file with your credentials:
    ```ini
    CONTRACT_ADDRESS=0xYourDeployedContractAddress
    PRIVATE_KEY=your_private_key
    RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your-api-key
    PORT=5000
    ```
    Then start the server:
    ```bash
    npm start
    ```

---

### 2. Frontend Configuration

Navigate to the frontend directory:
```bash
cd ../DocGuardVault-main
```

Install dependencies:
```bash
npm install
```

Start the React development server:
```bash
npm start
```
The application will launch automatically at [http://localhost:3000](http://localhost:3000).

---

## 🔒 How Location Lock Works

1.  **Enabling the Lock:** When uploading a file, check the **🔒 Enable Location Lock** box.
2.  **GPS Capture:** Click **Capture Location** to request GPS coordinates from your browser.
3.  **Boundary radius:** Select a boundary radius (between 10m and 1000m) using the slider.
4.  **Upload:** Click upload and sign the transaction with MetaMask.
5.  **Verification Check:** During verification, the app requests the verifier's current GPS coordinates. The backend checks if the coordinates are within the specified boundary radius. If the coordinates are outside, verification fails.