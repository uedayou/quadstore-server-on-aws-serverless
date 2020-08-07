'use strict';

const n3 = require('n3');
const fs = require('fs-extra');
const path = require('path');
const RdfStore = require('quadstore').RdfStore;
const leveldown = require('leveldown');
const dataFactory = require('n3').DataFactory;

const dbPath = "./sparql-db";

(async () => {
  const args = process.argv.slice(2);

  let filePath = args[0];
  const format = args[1] || 'text/turtle';
  if (!filePath) return;

  if (fs.existsSync(dbPath)) fs.removeSync(dbPath);

  const store = new RdfStore(leveldown(dbPath), { dataFactory });
  filePath = path.resolve(process.cwd(), filePath);

  const fileReader = fs.createReadStream(filePath);
  const streamParser = new n3.StreamParser({ format });

  await store.putStream(fileReader.pipe(streamParser));
  await store.close();
})();