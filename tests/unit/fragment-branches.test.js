/**
 * Extra branch tests for fragment.js
 */
const { Fragment } = require('../../src/model/fragment');

describe('Fragment additional branches', () => {
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
