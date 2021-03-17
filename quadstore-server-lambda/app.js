const path = require('path');
const fs = require('fs-extra');
const leveldown = require('leveldown');
const { DataFactory } = require('n3');
const { newEngine } = require('quadstore-comunica');
const { Quadstore } = require('quadstore');
const utils = require('./utils');

const dir = `sparql-db`;

exports.lambdaHandler = async (event, context) => {
  let query, 
      format, 
      body = "Error", 
      contentType = "text/plain", 
      statusCode = 400;
  try {
    format = event.queryStringParameters.format || "json";
    query = event.queryStringParameters.query;
    if (query) {
      if (!fs.existsSync('/tmp/'+dir)) {
        console.log("copy db to /tmp/"+dir);
        fs.copySync(path.join("./", dir), '/tmp/'+dir);
      }
      let results = await getSparqlResult(
        decodeURIComponent(query),
        format
      );
      body = results.body;
      contentType = results.contentType;
      statusCode = results.statusCode;
    }
  } catch (err) {
    console.error(err);
  }
  return {
    statusCode,
    body,
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,GET",
      "Content-Type": contentType
    }
  }
}

async function getSparqlResult(queryString, format) {
  let resultFormat = "application/sparql-results+json";
  let contentType = "application/json";
  if (format.match(/xml/i)) {
    resultFormat = "application/sparql-results+xml";
    contentType = "text/xml";
  }

  let store, body, statusCode = 400;
  try {
    store = new Quadstore({
      backend: leveldown('/tmp/'+dir),
      dataFactory: DataFactory,
      comunica: newEngine(),
    });
    await store.open();
    const results = await store.sparql(queryString);

    if (format.match(/xml/i)) {
      body = await utils.getXmlStringFronBindings(results);
    } else {
      body = utils.getJsonStringFromBindings(results);
    }
    statusCode = 200;
  } catch(err) {
    console.error(err);
    body = "Error";
    contentType = "text/plain";
  } finally {
    if (store) await store.close();
  }
  return { body, contentType, statusCode };
}
