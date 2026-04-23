// Production config: all backend endpoints are served by the same origin through
// the admin-panel nginx reverse proxy (see nginx.conf). Relative URLs avoid
// baking host/port into the bundle and make the image portable between envs.
//
// For local dev, copy the file shown in the comments below into this path and
// the umi dev server's proxy (config/proxy.ts) will take over.

export const WS_URL = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';

// Free-IM-Server API — same origin, nginx proxies /api/* → 127.0.0.1:10002
export const API_URL = '';

// Free-IM-Chat chat-api — nginx proxies /third_admin/* & /third/* → 127.0.0.1:10008
export const CHAT_URL = '';

// Free-IM-Chat admin-api — nginx proxies /complete_admin/* → 127.0.0.1:10009
export const ACCOUNT_URL = '';
