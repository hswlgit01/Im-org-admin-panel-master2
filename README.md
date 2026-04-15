# Freechat-Admin

## Installing dependencies

Install `node_modules`:

```bash
pnpm i
```

## Modify config

> Modify the request address to your own OpenIM Server IP in the following files

```javascript
// src/config/index.ts
export const WS_URL = 'wss://your-server-ip:10001';
export const API_URL = 'http://your-server-ip:10002';
export const CHAT_URL = 'http://your-server-ip:10008';
export const ACCOUNT_URL = 'http://your-server-ip:10009';
```

### Start project

```bash
pnpm run start
```

### Build project

```bash
pnpm run build
```
