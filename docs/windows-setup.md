# HGame – Local Development Setup

This guide explains how to prepare your system, install all dependencies, and run the full HGame monorepo locally. It includes Node/NVM installation, GTK setup for Node Canvas, and detailed steps to launch the entire project.

---

## 1. Requirements

### 1.1 Hedera Account

You must have an active Hedera account created using one of the following:

- HashPack Wallet
- Blade Wallet
- Ledger Nano (optional)

### 1.2 MetaMask

You must install the MetaMask browser extension and create/import an account:
[https://metamask.io/download/](https://metamask.io/download/)

### 1.3 Git

Install Git:
[https://git-scm.com/downloads](https://git-scm.com/downloads)

### 1.4 Node Version Manager (NVM)

Install NVM for Windows:
[https://github.com/coreybutler/nvm-windows/releases](https://github.com/coreybutler/nvm-windows/releases)

After installation, open PowerShell and run:

```bash
nvm install 22.21.0
nvm use 22.21.0
node -v
```

**Important:** Use Node version **22.21.0** for maximum compatibility with native dependencies.

---

## 2. Install GTK (Required for Node Canvas + Phaser)

Download GTK Runtime for Windows:
[https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases](https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases)

**Critical:** Install GTK to the default location: `C:\GTK`

Then verify that the following directory exists and is included in your System PATH:

```
C:\GTK\bin
```

If the path is missing:

1. Open System Settings
2. Go to "Advanced System Settings"
3. Open "Environment Variables"
4. Edit the PATH variable
5. Add: `C:\GTK\bin`
6. Restart your terminal

**Alternative:** If you already installed GTK to a different location (e.g., `C:\Program Files\GTK3-Runtime Win64`), create a symbolic link as Administrator:

```powershell
New-Item -ItemType SymbolicLink -Path "C:\GTK" -Target "C:\Program Files\GTK3-Runtime Win64"
```

---

## 3. Configure Visual Studio Build Tools

If you have Visual Studio 2022 installed, configure npm to use it:

```bash
npm config set msvs_version 2022
```

If you don't have Visual Studio, download and install **Visual Studio Build Tools**:
[https://visualstudio.microsoft.com/downloads/](https://visualstudio.microsoft.com/downloads/)

During installation, select:

- ✅ **Desktop development with C++**
- ✅ **Windows 10/11 SDK**

---

## 4. Project Structure

```
HGame/
 ├── FrontEnd/             Angular Web Application
 ├── GamePlay/             Phaser Game Client + Game Server
 ├── projects/
 │    └── client/          Micro-frontend Angular client
 ├── server/               Backend server (Node.js)
 ├── shared/               Shared TypeScript models and logic
 └── package.json
```

---

## 5. Dependency Installation(`Execute these commands in this order.`)

Open a terminal inside the root folder:

```bash
cd HGame
```

### 5.1 Install root dependencies

```bash
npm install
```

### 5.2 Install FrontEnd dependencies

```bash
cd FrontEnd
npm install
cd ..
```

### 5.3 Install GamePlay dependencies

```bash
cd GamePlay
npm install
```

### 5.4 Install shared dependencies

```bash
cd projects/shared
npm install
cd ..
```

### 5.5 Install projects/client dependencies

```bash
cd client
npm install
cd ..
```

### 5.6 Install server dependencies

```bash
cd server
npm install
cd ..
```

Your monorepo is now fully installed.

---

## 6. Development Commands

### 6.1 Start all applications at once

In the root `package.json`, the following script is defined:

```json
  "dev:all": "concurrently --names \"FrontEnd,GamePlay\" --prefix-colors \"yellow,cyan\" \"npm run dev:frontend\" \"npm run dev:gameplay\""
```

Run everything with:

```bash
cd HGame
npm run dev:all
```

---

## 7. Access the Application Locally

After the servers are running:

### Web Application (FrontEnd + GamePlay)

```
http://localhost:3000
```

You must be logged into MetaMask to use the Web3 features.

---

## 8. Technology Stack

HGame is built using a modern full-stack architecture combining:

- **Frontend**: Angular with module federation for micro-frontends
- **Game Engine**: Phaser 3 for 2D game rendering and mechanics
- **Blockchain**: Hedera network integration with Web3 wallet support
- **Real-time Communication**: Socket.io for multiplayer networking
- **Backend**: Node.js/Express server with game state management
- **Build Tools**: Webpack, Vite, and TypeScript for development workflow

---

## 9. Troubleshooting

### Canvas or GTK errors

Ensure `C:\GTK\bin` is present in your PATH and restart your terminal after adding it.

### Node.js version issues

If you encounter native module build errors, ensure you're using Node.js 22.21.0:

```bash
nvm use 22.21.0
node -v
```

Then clean and reinstall:

```bash
npm cache clean --force
rm -r -fo node_modules
rm package-lock.json
npm install
```

### MetaMask connection problems

- MetaMask must be installed
- The browser must allow popups
- You must be logged in before opening the app

### Phaser or game crashes

Disable hardware acceleration in the browser if necessary.

---

## 10. Summary

After completing this guide, you will have:

- NVM + Node 18 LTS installed
- GTK installed and configured for Node Canvas
- Visual Studio Build Tools configured
- All project dependencies installed across the monorepo
- The full platform running locally on:

```
http://localhost:3000
```
