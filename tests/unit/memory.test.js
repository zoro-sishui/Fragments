//nst { Fragment } = require('../../src/model/fragment');

const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('../../src/model/data/memory');

describe('Memory Database', () => {
  const ownerId = 'test-user-123';
  const fragmentId = 'test-fragment-123';
  
  const mockFragment = {
    id: fragmentId,
    ownerId: ownerId,
    created: '2023-01-01T00:00:00.000Z',
    updated: '2023-01-01T00:00:00.000Z',
    type: 'text/plain',
    size: 11
  };

  const mockData = Buffer.from('hello world');

  describe('writeFragment and readFragment', () => {
    test('writeFragment stores fragment metadata', async () => {
      await expect(writeFragment(mockFragment)).resolves.toBeUndefined();
    });

    test('readFragment retrieves stored fragment metadata', async () => {
      await writeFragment(mockFragment);
      const result = await readFragment(ownerId, fragmentId);
      expect(result).toEqual(mockFragment);
    });

    test('readFragment returns undefined for non-existent fragment', async () => {
      const result = await readFragment(ownerId, 'non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('writeFragmentData and readFragmentData', () => {
    test('writeFragmentData stores fragment data', async () => {
      await expect(writeFragmentData(ownerId, fragmentId, mockData)).resolves.toBeUndefined();
    });

    test('readFragmentData retrieves stored fragment data', async () => {
      await writeFragmentData(ownerId, fragmentId, mockData);
      const result = await readFragmentData(ownerId, fragmentId);
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe('hello world');
    });

    test('readFragmentData returns undefined for non-existent data', async () => {
      const result = await readFragmentData(ownerId, 'non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('listFragments', () => {
    beforeEach(async () => {
      // Clean up and add test data
      await deleteFragment(ownerId, fragmentId);
      await writeFragment(mockFragment);
    });

    test('listFragments returns array of fragment IDs by default', async () => {
      const result = await listFragments(ownerId);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain(fragmentId);
    });

    test('listFragments returns expanded fragment objects when expand=true', async () => {
      const result = await listFragments(ownerId, true);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toEqual(mockFragment);
    });

    test('listFragments returns empty array for user with no fragments', async () => {
      const result = await listFragments('user-with-no-fragments');
      expect(result).toEqual([]);
    });
  });

  describe('deleteFragment', () => {
    test('deleteFragment removes fragment metadata and data', async () => {
      await writeFragment(mockFragment);
      await writeFragmentData(ownerId, fragmentId, mockData);
      
      await expect(deleteFragment(ownerId, fragmentId)).resolves.toBeUndefined();
      
      const fragment = await readFragment(ownerId, fragmentId);
      const data = await readFragmentData(ownerId, fragmentId);
      
      expect(fragment).toBeUndefined();
      expect(data).toBeUndefined();
    });

    test('deleteFragment handles non-existent fragment gracefully', async () => {
      await expect(deleteFragment(ownerId, 'non-existent-id')).resolves.toBeUndefined();
    });
  });
});