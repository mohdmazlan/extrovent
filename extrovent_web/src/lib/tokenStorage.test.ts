import { describe, it, expect } from 'vitest';
import { validateToken } from './tokenStorage';

function mkToken(exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: '123', exp }));
  return `${header}.${payload}.sig`;
}

describe('validateToken', () => {
  it('rejects expired token', () => {
    const expired = mkToken(Math.floor(Date.now()/1000) - 3600);
    expect(validateToken(expired)).toBe(false);
  });
  it('accepts unexpired token', () => {
    const good = mkToken(Math.floor(Date.now()/1000) + 3600);
    expect(validateToken(good)).toBe(true);
  });
  it('rejects malformed', () => {
    expect(validateToken('not.jwt')).toBe(false);
    expect(validateToken('')).toBe(false);
  });
});
