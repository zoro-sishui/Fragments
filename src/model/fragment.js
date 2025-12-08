// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

// Functions for working with fragment metadata/data using our DB
// This will use AWS backend if AWS_REGION is set, otherwise memory backend
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id = randomUUID(), ownerId, created = new Date(), updated = new Date(), type, size = 0 }) {
    if (!ownerId || !type) {
      throw new Error('ownerId and type are required');
    }
    if (typeof size !== 'number') {
      throw new Error('size must be a number');
    }
    if (size < 0) {
      throw new Error('size cannot be negative');
    }
    if (!Fragment.isSupportedType(type)) {
      throw new Error('unsupported content type');
    }

    this.id = id;
    this.ownerId = ownerId;
    this.created = created instanceof Date ? created.toISOString() : (created || new Date().toISOString());
    this.updated = updated instanceof Date ? updated.toISOString() : (updated || new Date().toISOString());
    this.type = type;
    this.size = size;
  }


  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    try {
      const fragments = await listFragments(ownerId, expand);
      if (expand) {
        return fragments.map(data => new Fragment(data));
      }
      return fragments;
    } catch (error) {
      throw new Error(`Unable to fetch fragments for user ${ownerId}: ${error.message}`);
    }
  }

  /**
   * Gets a fragment for the user by the given id.

// assignment 2
  static async ListFragments(ownerId, expand = false) {
  const fragmentsForUser = db[ownerId] || {};
  const ids = Object.keys(fragmentsForUser);

  if (!expand) return ids;  // just return IDs if not expanding

  // Return full metadata for each fragment
  return ids.map(id => {
    const { ownerId, type, created, updated, size } = fragmentsForUser[id];
    return { id, ownerId, type, created, updated, size };
  });
}

static async writeFragment(fragment) {
  if (!db[fragment.ownerId]) db[fragment.ownerId] = {};
  db[fragment.ownerId][fragment.id] = fragment;
}

static async readFragment(ownerId, id) {
  return db[ownerId]?.[id] || null;
}

static async deleteFragment(ownerId, id) {
  if (db[ownerId]) delete db[ownerId][id];
}

static async writeFragmentData(ownerId, id, data) {
  if (!db[ownerId] || !db[ownerId][id]) throw new Error('Fragment not found');
  db[ownerId][id].data = data;
  db[ownerId][id].size = data.length;
}

static async readFragmentData(ownerId, id) {
  if (!db[ownerId] || !db[ownerId][id]) throw new Error('Fragment not found');
  return db[ownerId][id].data || Buffer.from('');
}


  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    try {
      const data = await readFragment(ownerId, id);
      if (!data) {
        return null; // Return null instead of throwing when fragment not found
      }
      return new Fragment(data);
    } catch (error) {
      throw new Error(`Unable to fetch fragment ${id} for user ${ownerId}: ${error.message}`);
    }
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static async delete(ownerId, id) {
    try {
      await deleteFragment(ownerId, id);
    } catch (error) {
      throw new Error(`Unable to delete fragment ${id} for user ${ownerId}: ${error.message}`);
    }
  }

  /**
   * Saves the current fragment (metadata) to the database
   * @returns Promise<void>
   */
  async save() {
    try {
      this.updated = new Date().toISOString();
      await writeFragment(this);
    } catch (error) {
      throw new Error(`Unable to save fragment ${this.id}: ${error.message}`);
    }
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  async getData() {
    try {
      return await readFragmentData(this.ownerId, this.id);
    } catch (error) {
      throw new Error(`Unable to get fragment data ${this.id}: ${error.message}`);
    }
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data must be a Buffer');
    }
    try {
      this.size = data.length;
      this.updated = new Date().toISOString();
      await writeFragmentData(this.ownerId, this.id, data);
      await this.save();
    } catch (error) {
      throw new Error(`Unable to set fragment data ${this.id}: ${error.message}`);
    }
  }

  /**
   * Deletes the fragment's data and metadata from the database
   * @returns Promise<void>
   */
  async delete() {
    try {
      await deleteFragment(this.ownerId, this.id);
    } catch (error) {
      throw new Error(`Unable to delete fragment ${this.id}: ${error.message}`);
    }
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    // For text/plain, only return text/plain (not all text types)
    if (this.mimeType === 'text/plain') {
      return ['text/plain'];
    }
    
    const textTypes = ['text/plain', 'text/html', 'text/markdown', 'application/json'];
    const imageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'];

    if (this.isText) {
      return textTypes;
    }
    if (this.mimeType.startsWith('image/')) {
      return imageTypes;
    }
    return [this.mimeType];
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    try {
      const { type } = contentType.parse(value);
      const supportedTypes = [
        'text/plain',
        'text/html',
        'text/markdown',
        'text/csv',
        'application/json',
        'application/yaml',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
        'image/avif'
      ];
      return supportedTypes.includes(type);
    } catch {
      return false;
    }
  }
}

module.exports.Fragment = Fragment;