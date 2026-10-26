import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useToday } from './useToday';
afterEach(()=>{cleanup();vi.useRealTimers();});
it('updates at local midnight and after returning to a sleeping tab',()=>{
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026,9,25,23,59,59));
  const {result}=renderHook(()=>useToday());
  expect(result.current.getDate()).toBe(25);
  act(()=>vi.advanceTimersByTime(1000));
  expect(result.current.getDate()).toBe(26);
  vi.setSystemTime(new Date(2026,9,28,12));
  act(()=>window.dispatchEvent(new Event('focus')));
  expect(result.current.getDate()).toBe(28);
});
