import createManager from '../src/main/api/reloader/manager';
import Reloader from '../src/main/api/reloader/reloader';

describe('ReloadManager', () => {
  let manager;

  beforeEach(() => {
    manager = createManager();
  });

  describe('#add and #get', () => {
    it('should add and retrieve a reloader', () => {
      const callback = jest.fn();
      const reloader = new Reloader({
        name: 'test-reloader',
        callback,
        interval: 1000,
      });

      manager.add(reloader);
      expect(manager.get('test-reloader')).toBe(reloader);
    });

    it('should return undefined for non-existent reloader', () => {
      expect(manager.get('non-existent')).toBeUndefined();
    });

    it('should store multiple reloaders', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      const reloader1 = new Reloader({
        name: 'reloader-1',
        callback: callback1,
        interval: 1000,
      });

      const reloader2 = new Reloader({
        name: 'reloader-2',
        callback: callback2,
        interval: 2000,
      });

      const reloader3 = new Reloader({
        name: 'reloader-3',
        callback: callback3,
        interval: 3000,
      });

      manager.add(reloader1);
      manager.add(reloader2);
      manager.add(reloader3);

      expect(manager.get('reloader-1')).toBe(reloader1);
      expect(manager.get('reloader-2')).toBe(reloader2);
      expect(manager.get('reloader-3')).toBe(reloader3);
    });

    it('should overwrite reloader with same name', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const reloader1 = new Reloader({
        name: 'test',
        callback: callback1,
        interval: 1000,
      });

      const reloader2 = new Reloader({
        name: 'test',
        callback: callback2,
        interval: 2000,
      });

      manager.add(reloader1);
      manager.add(reloader2);

      expect(manager.get('test')).toBe(reloader2);
      expect(manager.get('test')).not.toBe(reloader1);
    });
  });

  describe('#removeByName', () => {
    it('should remove a reloader by name', () => {
      const callback = jest.fn();
      const reloader = new Reloader({
        name: 'test-reloader',
        callback,
        interval: 1000,
      });

      manager.add(reloader);
      expect(manager.get('test-reloader')).toBe(reloader);

      manager.removeByName('test-reloader');
      expect(manager.get('test-reloader')).toBeUndefined();
    });

    it('should not error when removing non-existent reloader', () => {
      expect(() => {
        manager.removeByName('non-existent');
      }).not.toThrow();
    });

    it('should only remove specified reloader', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const reloader1 = new Reloader({
        name: 'reloader-1',
        callback: callback1,
        interval: 1000,
      });

      const reloader2 = new Reloader({
        name: 'reloader-2',
        callback: callback2,
        interval: 1000,
      });

      manager.add(reloader1);
      manager.add(reloader2);

      manager.removeByName('reloader-1');

      expect(manager.get('reloader-1')).toBeUndefined();
      expect(manager.get('reloader-2')).toBe(reloader2);
    });
  });

  describe('#removeByReloader', () => {
    it('should remove a reloader by reloader object', () => {
      const callback = jest.fn();
      const reloader = new Reloader({
        name: 'test-reloader',
        callback,
        interval: 1000,
      });

      manager.add(reloader);
      expect(manager.get('test-reloader')).toBe(reloader);

      manager.removeByReloader(reloader);
      expect(manager.get('test-reloader')).toBeUndefined();
    });

    it('should only remove the specified reloader object', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const reloader1 = new Reloader({
        name: 'reloader-1',
        callback: callback1,
        interval: 1000,
      });

      const reloader2 = new Reloader({
        name: 'reloader-2',
        callback: callback2,
        interval: 1000,
      });

      manager.add(reloader1);
      manager.add(reloader2);

      manager.removeByReloader(reloader1);

      expect(manager.get('reloader-1')).toBeUndefined();
      expect(manager.get('reloader-2')).toBe(reloader2);
    });
  });

  describe('typical usage patterns', () => {
    it('should manage multiple credential reloaders', () => {
      const refreshCallback1 = jest.fn();
      const refreshCallback2 = jest.fn();

      const reloader1 = new Reloader({
        name: 'awsaml-123456789',
        callback: refreshCallback1,
        interval: 3600000,
        role: 'arn:aws:iam::123456789:role/MyRole1',
      });

      const reloader2 = new Reloader({
        name: 'awsaml-987654321',
        callback: refreshCallback2,
        interval: 3600000,
        role: 'arn:aws:iam::987654321:role/MyRole2',
      });

      manager.add(reloader1);
      manager.add(reloader2);

      expect(manager.get('awsaml-123456789')).toBe(reloader1);
      expect(manager.get('awsaml-987654321')).toBe(reloader2);

      // Remove first reloader when user logs out
      manager.removeByName('awsaml-123456789');

      expect(manager.get('awsaml-123456789')).toBeUndefined();
      expect(manager.get('awsaml-987654321')).toBe(reloader2);
    });

    it('should handle reloader replacement', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const reloader1 = new Reloader({
        name: 'session-1',
        callback: callback1,
        interval: 1000,
        role: 'role-a',
      });

      manager.add(reloader1);
      expect(manager.get('session-1')).toBe(reloader1);

      // Replace with new reloader for same session
      const reloader2 = new Reloader({
        name: 'session-1',
        callback: callback2,
        interval: 2000,
        role: 'role-b',
      });

      manager.add(reloader2);
      expect(manager.get('session-1')).toBe(reloader2);
    });
  });
});
