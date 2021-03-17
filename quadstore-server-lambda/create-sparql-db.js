'use strict';

const fs = require('fs-extra');
const path = require('path');
const leveldown = require('leveldown');
const { Quadstore } = require('quadstore');
const { DataFactory, StreamParser } = require('n3');
const { newEngine } = require('quadstore-comunica');

const dbPath = "./sparql-db";

(async () => {
  const args = process.argv.slice(2);

  let filePath = args[0];
  const format = args[1] || 'text/turtle';
  if (!filePath) {
    return;
  }
  try {
    if (fs.existsSync(dbPath)) fs.removeSync(dbPath);
    const store = new Quadstore({
      backend: leveldown(dbPath),
      dataFactory: DataFactory,
      comunica: newEngine(),
    });
    await store.open();
    const scope = await store.initScope();
    filePath = path.resolve(process.cwd(), filePath);
    const fileReader = fs.createReadStream(filePath);
    const streamParser = new StreamParser({ format });
    await store.putStream(fileReader.pipe(streamParser), { scope });
    await store.close();
  } catch (e) {
    console.error(e);
  }
})();