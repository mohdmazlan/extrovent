import { describe, it, expect } from 'vitest';
import { normalizeIdentifier } from './auth';

describe('normalizeIdentifier', () => {
  it('trims and strips @', () => {
    expect(normalizeIdentifier('  @Alice  ')).toBe('alice');
    expect(normalizeIdentifier('alice@example.com')).toBe('alice@example.com');
  });
  it('lowercases', () => {
    expect(normalizeIdentifier('ALICE')).toBe('alice');
  });
});
