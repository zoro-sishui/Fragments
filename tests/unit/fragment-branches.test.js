/**
 * Extra branch tests for fragment.js
 */
const { Fragment } = require('../../src/model/fragment');

describe('Fragment additional branches', () => {
  test('ListFragments returns ids and expanded fragments', async () => {
    const f = new Fragment({ ownerId: 'userA', type: 'text/plain' });
    // Use the class's own in-memory helpers to populate and list
    await Fragment.writeFragment(f);
    const ids = await Fragment.ListFragments('userA');
    expect(ids).toContain(f.id);
    const expanded = await Fragment.ListFragments('userA', true);
    expect(expanded.find(x => x.id === f.id)).toMatchObject({ ownerId: 'userA', type: 'text/plain' });
  });

  test('readFragmentData throws when fragment missing', async () => {
    await expect(Fragment.readFragmentData('nouser', 'noid')).rejects.toThrow();
  });

  test('writeFragmentData throws when fragment missing', async () => {
    await expect(Fragment.writeFragmentData('nouser', 'noid', Buffer.from('abc'))).rejects.toThrow();
  });

  test('byId returns null when fragment absent', async () => {
    const result = await Fragment.byId('nouser', 'noid');
    expect(result).toBeNull();
  });

  test('image fragment formats include multiple image types', async () => {
    const img = new Fragment({ ownerId: 'imgUser', type: 'image/png' });
    expect(img.formats).toEqual(expect.arrayContaining(['image/jpeg', 'image/gif']));
  });

  test('formats returns only mimeType for application/json', async () => {
    const jsonFrag = new Fragment({ ownerId: 'jsonUser', type: 'application/json' });
    expect(jsonFrag.formats).toEqual(['application/json']);
  });

  test('isSupportedType returns false for invalid header value', () => {
    expect(Fragment.isSupportedType('not/a-type')).toBe(false);
  });
});
