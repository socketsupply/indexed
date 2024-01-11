/**
 * Helper function to create a transaction and object store.
 * @param {IDBDatabase} db - The indexedDB database.
 * @param {string} loc - The location or name of the object store.
 * @param {string} [type='readwrite'] - The type of transaction (default is 'readwrite').
 * @returns {Object} - An object containing the transaction and object store.
 */
const getStore = (db, loc, type = 'readwrite') => {
  try {
    const tx = db.transaction(loc, type);
    return { tx, store: tx.objectStore(loc) };
  } catch (error) {
    return Promise.reject({ err: error });
  }
}

/**
 * Helper function to create an IDBKeyRange based on the provided options.
 * @param {Object} o - Options object containing lt, gt, lte, and gte properties.
 * @returns {IDBKeyRange} - An IDBKeyRange object.
 */
const getRange = o => {
  const exLower = typeof o.lt !== 'undefined'
  const exUpper = typeof o.gt !== 'undefined'

  const range = window.IDBKeyRange

  if ((o.lte || o.lt) && (o.gte || o.gt)) {
    const args = [
      o.gte || o.gt,
      o.lte || o.lt,
      exLower,
      exUpper
    ]

    return range.bound(...args)
  }

  if (o.lte || o.lt) {
    return range.upperBound(o.lte || o.lt, exLower)
  }

  if (o.gte || o.gt) {
    return range.lowerBound(o.gte || o.gt, exUpper)
  }
}

export class Indexed {
  constructor (loc) {
    this._loc = loc
    this._db = null
  }

  /**
   * Static method to open an IndexedDB database.
   * @param {...*} args - Arguments passed to the constructor.
   * @returns {Promise<Indexed>} - A promise resolving to an instance of the Indexed class.
   */
  static async open (...args) {
    const indexed = new Indexed(...args)
    return await indexed.init()
  }

  /**
   * Static method to delete an IndexedDB database.
   * @param {string} loc - The location or name of the object store.
   * @returns {Promise<Object>} - A promise resolving to an object with data or error information.
   */
  static async drop (loc) {
    return new Promise(resolve => {
      const r = window.indexedDB.deleteDatabase(loc)
      r.onsuccess = () => resolve({ data: true })
      r.onerror = event => resolve({ err: event.target })
      r.onblocked = event => resolve({ err: event.target })
    })
  }

  /**
   * Initializes the IndexedDB instance.
   * @returns {Promise<Indexed>} - A promise resolving to the initialized instance of the Indexed class.
   */
  init () {
    return new Promise(resolve => {
      const r = window.indexedDB.open(this._loc)
      const loc = this._loc

      r.onerror = event => {
        throw event.target
      }

      r.onupgradeneeded = (event) => {
        this._db = event.target.result
        const opts = { keyPath: 'key' }
        const store = this._db.createObjectStore(loc, opts)

        store.transaction.oncomplete = event => {
          resolve(this)
        }
      }

      r.onsuccess = (event) => {
        this._db = event.target.result
        resolve(this)
      }
    })
  }

  /**
   * Counts the number of records in the object store.
   * @returns {Promise<Object>} - A promise resolving to an object with data or error information.
   */
  count () {
    return new Promise(resolve => {
      const { store } = getStore(this._db, this._loc)
      const r = store.count()
      r.onsuccess = () => resolve({ data: r.result || 0 })
      r.onerror = event => resolve({ err: event.target })
      r.onblocked = event => resolve({ err: event.target })
    })
  }

  /**
   * Checks if a record with the given key exists in the object store.
   * @param {*} key - The key to check for existence.
   * @returns {Promise<Object>} - A promise resolving to an object with data or error information.
   */
  has (key) {
    return new Promise(resolve => {
      const { store } = getStore(this._db, this._loc)
      const r = store.get(key)
      r.onerror = event => {
        if (Indexed.onerror) Indexed.onerror(event.target)
        resolve({ err: event.target })
      }
      r.onsuccess = function (event) {
        resolve({ data: typeof this.result !== 'undefined' })
      }
    })
  }

  /**
   * Retrieves the value of a record with the given key from the object store.
   * @param {*} key - The key of the record to retrieve.
   * @returns {Promise<Object>} - A promise resolving to an object with data or error information.
   */
  get (key) {
    return new Promise(resolve => {
      const { store } = getStore(this._db, this._loc, 'readonly')
      const r = store.get(key)
      r.onerror = event => {
        if (Indexed.onerror) Indexed.onerror(event.target)
        resolve({ err: event.target })
      }
      r.onsuccess = function (event) {
        if (typeof this.result === 'undefined') {
          return resolve({ err: new Error('Not Found') })
        }
        resolve({ data: this.result.value })
      }
    })
  }

  /**
   * Puts a key-value pair into the object store.
   * @param {*} key - The key of the record.
   * @param {*} value - The value of the record.
   * @returns {Promise<Object>} - A promise resolving to an object with data or error information.
   */
  put (key, value) {
    return new Promise(resolve => {
      const { store } = getStore(this._db, this._loc)
      const r = store.put({ key, value })
      r.onerror = event => {
        if (Indexed.onerror) Indexed.onerror(event.target)
        resolve({ err: event.target })
      }
      r.onsuccess = event => resolve({})
    })
  }

  /**
   * Deletes a record with the given key from the object store.
   * @param {*} key - The key of the record to delete.
   * @returns {Promise<Object>} - A promise resolving to an object with data or error information.
   */
  del (key) {
    return new Promise(resolve => {
      const { store } = getStore(this._db, this._loc)
      const r = store.delete(key)
      r.onerror = event => {
        if (Indexed.onerror) Indexed.onerror(event.target)
        resolve({ err: event.target })
      }
      r.onsuccess = event => resolve({})
    })
  }

  /**
   * Performs a batch operation on the object store.
   * @param {Array<Object>} ops - An array of operations (put or del) to perform in the batch.
   * @returns {Promise<Object>} - A promise resolving to an object with data or error information.
   */
  batch (ops) {
    return new Promise(resolve => {
      const { tx, store } = getStore(this._db, this._loc)
      tx.onerror = event => {
        if (Indexed.onerror) Indexed.onerror(event.target)
        resolve({ err: event.target })
      }
      tx.oncomplete = event => resolve({})

      const eachOp = op => {
        if (op.type === 'put') {
          store.put({ key: op.key, value: op.value })
        }

        if (op.type === 'del') {
          store.delete(op.key)
        }
      }

      ops.forEach(eachOp)
    })
  }

  /**
   * Reads all records from the object store based on the provided options.
   * @param {Object} opts - Options for reading records.
   * @returns {Promise<Object>} - A promise resolving to an object with data or error information.
   */
  readAll (opts) {
    return new Promise(resolve => {
      this.read(opts).then(({ events }) => {
        const rows = new Map()
        events.onerror = err => {
          if (Indexed.onerror) Indexed.onerror(err)
          resolve({ err })
        }
        events.ondata = (key, value) => rows.set(key, value)
        events.onend = () => resolve({ data: rows })
      })
    })
  }

  /**
   * Reads records from the object store based on the provided options.
   * @param {Object} [opts={}] - Options for reading records.
   * @returns {Promise<Object>} - A promise resolving to an object with data or error information.
   */
  read (opts = {}) {
    return new Promise(resolve => {
      const { store } = getStore(this._db, this._loc, 'readonly')
      const r = store.openCursor(getRange(opts), opts.reverse ? 'prevunique' : undefined)
      const events = {}
      let count = 0
      resolve({ events })

      function onError (event) {
        if (Indexed.onerror) Indexed.onerror(event.target)
        if (events.onerror) events.onerror(event.target)
      }

      async function onSuccess (event) {
        const cursor = event.target.result

        if (cursor) {
          const r = store.get(this.result.key)

          r.onerror = event => {
            if (Indexed.onerror) Indexed.onerror(event.target)
            if (events.onerror) events.onerror(event.target)
          }

          r.onsuccess = function (event) {
            if (events.ondata) events.ondata(this.result.key, this.result.value)

            if (opts.limit && (count++ === (opts.limit - 1))) {
              if (events.onend) return events.onend()
              return
            }
            cursor.continue()
          }
        } else {
          if (events.onend) events.onend()
        }
      }

      r.onerror = onError
      r.onsuccess = onSuccess
    })
  }
}

export default Indexed
