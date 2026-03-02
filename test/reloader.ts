import { jest } from '@jest/globals'

import Reloader from '../src/main/api/reloader/reloader';

describe('Reloader', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with required properties', () => {
      const callback = jest.fn();
      const reloader = new Reloader({
        name: 'test-reloader',
        callback,
        interval: 3600000,
      });

      expect(reloader.name).toBe('test-reloader');
      expect(reloader.callback).toBe(callback);
      expect(reloader.interval).toBe(3600000);
      expect(reloader.role).toBe('');
      expect(reloader.intervalId).toBeNull();
    });

    it('should initialize with role when provided', () => {
      const callback = jest.fn();
      const reloader = new Reloader({
        name: 'test-reloader',
        callback,
        interval: 3600000,
        role: 'test-role',
      });

      expect(reloader.role).toBe('test-role');
    });
  });

  describe('#start', () => {
    it('should start the interval', () => {
      const callback = jest.fn();
      const reloader = new Reloader({
        name: 'test',
        callback,
        interval: 1000,
      });

      reloader.start();
      expect(reloader.intervalId).not.toBeNull();
    });

    it('should call callback at interval', () => {
      const callback = jest.fn();
      const reloader = new Reloader({
        name: 'test',
        callback,
        interval: 1000,
      });

      reloader.start();
      jest.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });

  describe('#stop', () => {
    it('should stop the interval', () => {
      const callback = jest.fn();
      const reloader = new Reloader({
        name: 'test',
        callback,
        interval: 1000,
      });

      reloader.start();
      jest.advanceTimersByTime(500);
      reloader.stop();
      jest.advanceTimersByTime(1000);

      // Callback should only be called once (for first interval)
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('#restart', () => {
    it('should stop and start the interval', () => {
      const callback = jest.fn();
      const reloader = new Reloader({
        name: 'test',
        callback,
        interval: 1000,
      });

      reloader.start();
      jest.advanceTimersByTime(500);
      const originalIntervalId = reloader.intervalId;

      reloader.restart();
      const newIntervalId = reloader.intervalId;

      // Interval ID should change
      expect(newIntervalId).not.toBe(originalIntervalId);

      // Callback should not be called yet (reset timer)
      jest.advanceTimersByTime(500);
      expect(callback).not.toHaveBeenCalled();

      // Callback should be called at new interval
      jest.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('#setCallback', () => {
    it('should update the callback for next restart', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const reloader = new Reloader({
        name: 'test',
        callback: callback1,
        interval: 1000,
      });

      reloader.start();
      jest.advanceTimersByTime(1000);
      expect(callback1).toHaveBeenCalledTimes(1);

      // Change callback and restart
      reloader.setCallback(callback2);
      reloader.restart();

      jest.advanceTimersByTime(1000);
      expect(callback1).toHaveBeenCalledTimes(1); // No additional calls
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('#setResponse and #getResponse', () => {
    it('should store and retrieve response', () => {
      const callback = jest.fn();
      const reloader = new Reloader({
        name: 'test',
        callback,
        interval: 1000,
      });

      const testResponse = { data: 'test', timestamp: 12345 };
      reloader.setResponse(testResponse);

      expect(reloader.getResponse()).toEqual(testResponse);
    });

    it('should return undefined if response not set', () => {
      const callback = jest.fn();
      const reloader = new Reloader({
        name: 'test',
        callback,
        interval: 1000,
      });

      expect(reloader.getResponse()).toBeUndefined();
    });

    it('should update response when setResponse called multiple times', () => {
      const callback = jest.fn();
      const reloader = new Reloader({
        name: 'test',
        callback,
        interval: 1000,
      });

      const response1 = { version: 1 };
      const response2 = { version: 2 };

      reloader.setResponse(response1);
      expect(reloader.getResponse()).toEqual(response1);

      reloader.setResponse(response2);
      expect(reloader.getResponse()).toEqual(response2);
    });
  });

  describe('typical usage', () => {
    it('should handle credential refresh cycle', () => {
      const refreshCallback = jest.fn();
      const reloader = new Reloader({
        name: 'credential-refresher',
        callback: refreshCallback,
        interval: 3600000, // 1 hour
        role: 'arn:aws:iam::123456789:role/MyRole',
      });

      // Simulate: start refreshing
      reloader.start();
      expect(refreshCallback).not.toHaveBeenCalled();

      // After 1 hour, credentials refreshed
      jest.advanceTimersByTime(3600000);
      expect(refreshCallback).toHaveBeenCalledTimes(1);

      // Update response after refresh
      const newResponse = { Credentials: { AccessKeyId: 'AKIA...' } };
      reloader.setResponse(newResponse);
      expect(reloader.getResponse()).toEqual(newResponse);

      // After another hour, refresh again
      jest.advanceTimersByTime(3600000);
      expect(refreshCallback).toHaveBeenCalledTimes(2);
    });
  });
});
