import Path from 'path';
import FS from 'fs';
import storage from '../src/main/api/storage';

describe('Storage', () => {
  const testDir = Path.resolve(__dirname, 'data');
  const testFile = Path.resolve(testDir, 'test-storage.json');

  beforeEach(() => {
    // Clean up test file before each test
    if (FS.existsSync(testFile)) {
      FS.unlinkSync(testFile);
    }
  });

  afterAll(() => {
    // Clean up after all tests
    if (FS.existsSync(testFile)) {
      FS.unlinkSync(testFile);
    }
  });

  describe('#set and #get', () => {
    it('should set and retrieve a value', () => {
      const store = storage(testFile);
      store.set('testKey', 'testValue');
      expect(store.get('testKey')).toBe('testValue');
    });

    it('should persist data to disk', () => {
      const store1 = storage(testFile);
      store1.set('persistedKey', 'persistedValue');

      // Create new instance that reads from same file
      const store2 = storage(testFile);
      expect(store2.get('persistedKey')).toBe('persistedValue');
    });

    it('should handle complex objects', () => {
      const store = storage(testFile);
      const complexValue = {
        nested: {
          key: 'value',
          array: [1, 2, 3],
        },
        boolean: true,
        number: 42,
      };
      store.set('complexKey', complexValue);
      expect(store.get('complexKey')).toEqual(complexValue);
    });

    it('should handle arrays', () => {
      const store = storage(testFile);
      const arrayValue = [
        { name: 'item1', url: 'http://example.com' },
        { name: 'item2', url: 'http://example2.com' },
      ];
      store.set('arrayKey', arrayValue);
      expect(store.get('arrayKey')).toEqual(arrayValue);
    });

    it('should return null for non-existent keys', () => {
      const store = storage(testFile);
      expect(store.get('nonExistentKey')).toBeNull();
    });

    it('should overwrite existing values', () => {
      const store = storage(testFile);
      store.set('overwriteKey', 'value1');
      expect(store.get('overwriteKey')).toBe('value1');

      store.set('overwriteKey', 'value2');
      expect(store.get('overwriteKey')).toBe('value2');
    });
  });

  describe('#delete', () => {
    it('should delete a key', () => {
      const store = storage(testFile);
      store.set('deleteKey', 'deleteValue');
      expect(store.get('deleteKey')).toBe('deleteValue');

      store.delete('deleteKey');
      expect(store.get('deleteKey')).toBeNull();
    });

    it('should persist deletion to disk', () => {
      const store1 = storage(testFile);
      store1.set('persistDeleteKey', 'persistDeleteValue');
      store1.delete('persistDeleteKey');

      // Create new instance that reads from same file
      const store2 = storage(testFile);
      expect(store2.get('persistDeleteKey')).toBeNull();
    });

    it('should not error when deleting non-existent keys', () => {
      const store = storage(testFile);
      expect(() => {
        store.delete('nonExistentDeleteKey');
      }).not.toThrow();
    });
  });

  describe('initialization', () => {
    it('should handle missing file gracefully', () => {
      const store = storage(testFile);
      expect(store.get('anyKey')).toBeNull();
    });

    it('should handle empty file gracefully', () => {
      // Create empty file
      FS.writeFileSync(testFile, '', 'utf8');

      const store = storage(testFile);
      expect(store.get('anyKey')).toBeNull();
    });

    it('should load existing JSON file', () => {
      const initialData = { existingKey: 'existingValue' };
      FS.writeFileSync(testFile, JSON.stringify(initialData), 'utf8');

      const store = storage(testFile);
      expect(store.get('existingKey')).toBe('existingValue');
    });
  });

  describe('multiple keys', () => {
    it('should manage multiple keys independently', () => {
      const store = storage(testFile);
      store.set('key1', 'value1');
      store.set('key2', 'value2');
      store.set('key3', 'value3');

      expect(store.get('key1')).toBe('value1');
      expect(store.get('key2')).toBe('value2');
      expect(store.get('key3')).toBe('value3');
    });

    it('should preserve other keys when updating one', () => {
      const store = storage(testFile);
      store.set('key1', 'value1');
      store.set('key2', 'value2');

      store.set('key1', 'newValue1');

      expect(store.get('key1')).toBe('newValue1');
      expect(store.get('key2')).toBe('value2');
    });

    it('should preserve other keys when deleting one', () => {
      const store = storage(testFile);
      store.set('key1', 'value1');
      store.set('key2', 'value2');

      store.delete('key1');

      expect(store.get('key1')).toBeNull();
      expect(store.get('key2')).toBe('value2');
    });
  });
});
