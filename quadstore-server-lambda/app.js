const path = require('path');
const fs = require('fs-extra');
const AdmZip = require('adm-zip');
const RdfStore = require('quadstore').RdfStore;
const newEngine = require('@comunica/actor-init-sparql').newEngine;
const leveldown = require('leveldown');
const dataFactory = require('n3').DataFactory;

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
};


async function getSparqlResult(queryString, format) {
  let resultFormat = "application/sparql-results+json";
  let contentType = "application/json";
  if (format=="xml") {
    resultFormat = "application/sparql-results+xml";
    contentType = "text/xml";
  }

  let store, result, body, statusCode = 400;
  try {
    store = new RdfStore(
      leveldown('/tmp/'+dir),
      { dataFactory }
    );
    const myEngine = newEngine();
    result = await myEngine.query(
      queryString,
      { sources: [store] }
    );
    const stream = await myEngine.resultToString(
      result,
      resultFormat
    );
    body = await getStringByReadString(stream.data);
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

function getStringByReadString(stream) {
  return new Promise((resolve, reject)=>{
    let data = "";
    stream.on("data", chunk => data += chunk);
    stream.on("end", () => resolve(data));
    stream.on("error", error => reject(error));
  });
}
