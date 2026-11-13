import { describe, expect, it } from 'vitest';
import { connectionPhase, retryDelay, serviceState } from './connectionPhase';

describe('connection phase', () => {
  it('is fresh before any phone has connected, whatever the service does', () => {
    expect(connectionPhase({})).toBe('fresh');
    expect(connectionPhase({ isReady: true })).toBe('fresh');
    expect(connectionPhase({ isError: true })).toBe('fresh');
  });

  it('is connected while the phone is connected', () => {
    expect(connectionPhase({ isConnected: true, isReady: false })).toBe('connected');
  });

  it('is waiting after the phone left, also while registering again or failing to reach the service', () => {
    expect(connectionPhase({ isDisconnected: true })).toBe('waiting');
    expect(connectionPhase({ isDisconnected: true, isReady: true })).toBe('waiting');
    expect(connectionPhase({ isDisconnected: true, isError: true })).toBe('waiting');
  });
});

describe('service state', () => {
  it('reports ready, connecting and error', () => {
    expect(serviceState({ isReady: true })).toBe('ready');
    expect(serviceState({ isConnected: true })).toBe('ready');
    expect(serviceState({})).toBe('connecting');
    expect(serviceState({ isError: true, isDisconnected: true })).toBe('error');
  });
});

describe('retry delay', () => {
  it('grows from 2 s and stops at 60 s', () => {
    expect([0, 1, 2, 3, 4, 5, 10].map(retryDelay)).toEqual([2000, 4000, 8000, 16000, 32000, 60000, 60000]);
  });
});
