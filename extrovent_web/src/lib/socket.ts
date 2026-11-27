import { getRefreshToken } from './apiClient';

export type SocketHandler = (data: unknown) => void;

// @ts-ignore optional dep — polling fallback used if missing
export function createSocket(url: string | undefined, onMessage: SocketHandler, onTyping?: SocketHandler): { disconnect: () => void } | null {
  if (!url) return null;
  try {
    // dynamic import to keep build working even if not installed yet
    // fallback: try to load socket.io-client via dynamic import
    // @ts-ignore
    import(/* @vite-ignore */ 'socket.io-client').then(({ io: ioClient }) => {
      const socket = (ioClient as (url: string, opts: unknown) => { on: (ev: string, cb: (d: unknown)=>void)=>void; emit: (ev: string, d: unknown)=>void; disconnect: ()=>void; auth: unknown })(url, {
        auth: { token: getRefreshToken() },
        transports: ['websocket'],
      });
      socket.on('message', onMessage);
      socket.on('typing', (d: unknown) => onTyping?.(d));
      socket.on('new_message', onMessage);
      // expose for fallback polling cancel
      (window as unknown as Record<string, unknown>).__extrovent_socket = socket;
    }).catch(() => {});
    return { disconnect: () => {} };
  } catch {
    return null;
  }
}
