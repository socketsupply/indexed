import test from 'socket:test'
import process from 'socket:process'
import Indexed from './index.js'

const db = await Indexed.open('test')

test('open', async t => {
  const databases = await window.indexedDB.databases()
  console.log(databases.length, 'some databases')
  for (const { name } of databases) await Indexed.drop(name)
  console.log((await window.indexedDB.databases()).length, 'no databases')
  t.ok(db, 'created db')
})

test('drop table', async t => {
  let db2 = await Indexed.open('test2')
  t.ok(db2, 'created db')
  await db2.put('foo', 100)
  await Indexed.drop('test2')
  db2 = await Indexed.open('test2')
  t.equal((await db2.count()).data, 0, 'test2 has 0 rows after being dropped')
})

test('put', async t => {
  const { err } = await db.put('foo', 100)
  t.ok(!err, 'a value was added to the database')
})

test('get/has', async t => {
  {
    const { err, data } = await db.get('foo')
    t.ok(!err, 'no error getting value')
    t.ok(data === 100, 'the same value put was retrieved')
  }
  {
    const { err, data } = await db.has('foo')
    t.ok(!err, 'no error getting value')
    t.ok(data === true, 'the store has the key')
  }
})

test('get a key that does not exist', async t => {
  const { err } = await db.get('quxx')
  t.ok(err, 'no such key')
})

test('delete', async t => {
  const { err } = await db.del('foo')
  t.ok(!err, 'the key was successfully deleted')
})

test('batch puts', async t => {
  const { err } = await db.batch([
    { type: 'put', key: 'a', value: 1 },
    { type: 'put', key: 'b', value: 2 }
  ])

  t.ok(!err, 'batch with two puts successfully committed')
  t.equal((await db.count()).data, 100022, 'two items counted')
})

test('get from batch', async t => {
  {
    const { err, data } = await db.get('a')
    t.ok(!err, 'no error retrieving first key committed with last batch')
    t.ok(data === 1, 'the correct value from the first put was retrieved')
  }

  {
    const { err, data } = await db.get('b')
    t.ok(!err, 'no error retrieving second key committed with last batch')
    t.ok(data === 2, 'the correct value from the second put was retrieved')
  }
})

test('put perf...', async t => {
  const DATA = {
    squadName: 'Super hero squad',
    homeTown: 'Metro City',
    formed: 2016,
    secretBase: 'Super tower',
    active: true,
    members: [
      {
        name: 'Molecule Man',
        age: 29,
        secretIdentity: 'Dan Jukes',
        powers: ['Radiation resistance', 'Turning tiny', 'Radiation blast']
      },
      {
        name: 'Madame Uppercut',
        age: 39,
        secretIdentity: 'Jane Wilson',
        powers: [
          'Million tonne punch',
          'Damage resistance',
          'Superhuman reflexes'
        ]
      },
      {
        name: 'Eternal Flame',
        age: 1000000,
        secretIdentity: 'Unknown',
        powers: [
          'Immortality',
          'Heat Immunity',
          'Inferno',
          'Teleportation',
          'Interdimensional travel'
        ]
      }
    ]
  }

  const MAX = 100_000
  const now = Date.now()

  for (let i = 0; i < MAX; i++) {
    await db.put('K' + i, DATA)
  }

  t.ok(true, `PUT TIME: ${Date.now() - now}ms`)
})

test('get perf...', async t => {
  const MAX = 100_000
  const now = Date.now()

  for (let i = 0; i < MAX; i++) {
    await db.get('K' + i)
  }

  t.ok(true, `GET TIME: ${Date.now() - now}ms`)
})

test('read range', async t => {
  for (let i = 0; i < 20; i++) {
    await db.put('KX' + i, {})
  }

  // eslint-disable-next-line
  await new Promise(async resolve => {
    const { err, events } = await db.read({
      gt: 'KX',
      lt: 'KXÿ'
    })

    t.ok(!err, 'an iterator was successfully created')
    t.ok(events, 'an events object was recieved')

    let items = 0
    const now = Date.now()

    events.ondata = (key, value) => {
      items++
    }

    events.onerror = err => {
      t.ok(false, '', `an error occurred ${err.message}`)
    }

    events.onend = () => {
      t.equal(items, 20, `${items} total items`)
      t.ok(true, `${Date.now() - now}ms to read ${items} rows`)
      resolve()
    }
  })

  // eslint-disable-next-line
  await new Promise(async resolve => {
    const { err, events } = await db.read({
      gt: 'KX1',
      lt: 'KX1ÿ'
    })

    t.ok(!err, 'an iterator was successfully created')
    t.ok(events, 'an events object was recieved')

    let items = 0
    const now = Date.now()

    events.ondata = (key, value) => {
      items++
    }

    events.onerror = err => {
      t.ok(false, '', `an error occurred ${err.message}`)
    }

    events.onend = () => {
      t.equal(items, 10, `${items} total items (gt)`)
      t.ok(true, `${Date.now() - now}ms to read ${items} rows`)
      resolve()
    }
  })

  // eslint-disable-next-line
  await new Promise(async resolve => {
    const { err, events } = await db.read({
      gte: 'KX1',
      lte: 'KX1ÿ'
    })

    t.ok(!err, 'an iterator was successfully created')
    t.ok(events, 'an events object was recieved')

    let items = 0
    const now = Date.now()

    events.ondata = (key, value) => {
      items++
    }

    events.onerror = err => {
      t.ok(false, '', `an error occurred ${err.message}`)
    }

    events.onend = () => {
      t.equal(items, 11, `${items} total items (gte)`)
      t.ok(true, `${Date.now() - now}ms to read ${items} rows`)
      resolve()
    }
  })
})

test('readall...', async t => {
  const { err, data } = await db.readAll()
  t.ok(!err, 'no errors reading all')
  t.ok(data.size > 100_000, 'got all records')
})

test('cleanup', t => {
  process.exit(0)
})
