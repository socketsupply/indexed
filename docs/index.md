# Indexed API

## `getStore(db, loc, type = 'readwrite')`

Helper function to create a transaction and object store.

| Parameter | Type            | Description                                   |
|-----------|-----------------|-----------------------------------------------|
| `db`      | `IDBDatabase`   | The indexedDB database.                       |
| `loc`     | `string`        | The location or name of the object store.     |
| `type`    | `string`, optional | The type of transaction (default is 'readwrite'). |

**Returns:** An object containing the transaction and object store.

---

## `getRange(o)`

Helper function to create an IDBKeyRange based on the provided options.

| Parameter | Type     | Description                                      |
|-----------|----------|--------------------------------------------------|
| `o`       | `Object` | Options object containing lt, gt, lte, and gte properties. |

**Returns:** An `IDBKeyRange` object.

---

## `class Indexed`

Class representing an IndexedDB wrapper.

### Constructor

### `Indexed(loc)`

Constructor for the Indexed class.

| Parameter | Type     | Description                              |
|-----------|----------|------------------------------------------|
| `loc`     | `string` | The location or name of the object store. |

---

### Static Methods

#### `async open(...args)`

Static method to open an IndexedDB database.

| Parameter | Type  | Description                      |
|-----------|-------|----------------------------------|
| `...args` | `...*` | Arguments passed to the constructor. |

**Returns:** A promise resolving to an instance of the Indexed class.

#### `async drop(loc)`

Static method to delete an IndexedDB database.

| Parameter | Type     | Description                              |
|-----------|----------|------------------------------------------|
| `loc`     | `string` | The location or name of the object store. |

**Returns:** A promise resolving to an object with data or error information.

---

### Instance Methods

#### `async init()`

Initializes the IndexedDB instance.

**Returns:** A promise resolving to the initialized instance of the Indexed class.

#### `async count()`

Counts the number of records in the object store.

**Returns:** A promise resolving to an object with data or error information.

#### `async has(key)`

Checks if a record with the given key exists in the object store.

| Parameter | Type | Description                     |
|-----------|------|---------------------------------|
| `key`     | `*`  | The key to check for existence.  |

**Returns:** A promise resolving to an object with data or error information.

#### `async get(key)`

Retrieves the value of a record with the given key from the object store.

| Parameter | Type | Description                           |
|-----------|------|---------------------------------------|
| `key`     | `*`  | The key of the record to retrieve.     |

**Returns:** A promise resolving to an object with data or error information.

#### `async put(key, value)`

Puts a key-value pair into the object store.

| Parameter | Type | Description                           |
|-----------|------|---------------------------------------|
| `key`     | `*`  | The key of the record.                 |
| `value`   | `*`  | The value of the record.               |

**Returns:** A promise resolving to an object with data or error information.

#### `async del(key)`

Deletes a record with the given key from the object store.

| Parameter | Type | Description                           |
|-----------|------|---------------------------------------|
| `key`     | `*`  | The key of the record to delete.       |

**Returns:** A promise resolving to an object with data or error information.

#### `async batch(ops)`

Performs a batch operation on the object store.

| Parameter | Type           | Description                                 |
|-----------|----------------|---------------------------------------------|
| `ops`     | `Array<Object>` | An array of operations (put or del) to perform in the batch. |

**Returns:** A promise resolving to an object with data or error information.

#### `async readAll(opts)`

Reads all records from the object store based on the provided options.

| Parameter | Type   | Description                              |
|-----------|--------|------------------------------------------|
| `opts`    | `Object` | Options for reading records.              |

**Returns:** A promise resolving to an object with data or error information.

#### `async read(opts = {})`

Reads records from the object store based on the provided options.

| Parameter | Type   | Description                              |
|-----------|--------|------------------------------------------|
| `opts`    | `Object`, optional | Options for reading records (default is an empty object). |

**Returns:** A promise resolving to an object with data or error information.
