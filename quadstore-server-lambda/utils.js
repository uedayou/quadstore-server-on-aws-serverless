'use strict';

const xml = require('xml');
const { Readable } = require('stream');

function bindingToXmlBindings(value, key) {
  let xmlValue;
  if (value.termType === 'Literal') {
    const literal = value;
    xmlValue = { literal: literal.value };
    const { language } = literal;
    const { datatype } = literal;
    if (language) {
      xmlValue.literal = [{ _attr: { 'xml:lang': language }}, xmlValue.literal ];
    } else if (datatype && datatype.value !== 'http://www.w3.org/2001/XMLSchema#string') {
      xmlValue.literal = [{ _attr: { datatype: datatype.value }}, xmlValue.literal ];
    }
  } else if (value.termType === 'BlankNode') {
    xmlValue = { bnode: value.value };
  } else {
    xmlValue = { uri: value.value };
  }
  return { binding: [{ _attr: { name: key.slice(1) }}, xmlValue ]};
}

exports.getXmlStringFronBindings = async function(results) {
  const data = new Readable();
  data._read = () => {
    // Do nothing
  };

  // Write head
  const root = xml.element({ _attr: { xlmns: 'http://www.w3.org/2005/sparql-results#' }});
  xml({ sparql: root }, { stream: true, indent: '  ', declaration: true })
    .on('data', chunk => data.push(`${chunk}\n`));
  if (results.type === 'bindings' && results.variables.length > 0) {
    root.push({ head: results.variables
      .map(variable => ({ variable: { _attr: { name: variable.slice(1) }}})) });
  }

  if (results.type === 'bindings') {
    const xmlElems = xml.element({});
    root.push({ results: xmlElems });

    for (const item of results.items) {
      const result = [];
      for (const [key, value] of Object.entries(item)) {
        if (value.value && key.startsWith('?')) {
          result.push(bindingToXmlBindings(value, key.slice(1)));
        }
      }
      xmlElems.push({ result });
    }
    xmlElems.close();
    root.close();
    setImmediate(() => data.push(null));
  }

  let xmlString = "";
  for await (const chunk of data) {
    xmlString += chunk;
  }
  return xmlString;
}

function bindingToJsonBindings(value) {
  if (value.termType === 'Literal') {
    const literal = value;
    const jsonValue = { value: literal.value, type: 'literal' };
    const { language } = literal;
    const { datatype } = literal;
    if (language) {
      jsonValue['xml:lang'] = language;
    } else if (datatype && datatype.value !== 'http://www.w3.org/2001/XMLSchema#string') {
      jsonValue.datatype = datatype.value;
    }
    return jsonValue;
  }
  if (value.termType === 'BlankNode') {
    return { value: value.value, type: 'bnode' };
  }
  return { value: value.value, type: 'uri' };
}

exports.getJsonStringFromBindings = function(results) {
  const head = {};
  if (results.type === 'bindings' && results.variables.length > 0) {
    head.vars = results.variables.map(variable => variable.slice(1));
  }
  const bindings = [];
  if (results.type === 'bindings') {
    for (const item of results.items) {
      const obj = {};
      for (const [key, value] of Object.entries(item)) {
        if (value.value && key.startsWith('?')) {
          obj[key.slice(1)] = bindingToJsonBindings(value);
        }
      }
      bindings.push(obj);
    }
  }
  const jsonResults = {
    head,
    results: {bindings}
  };
  return JSON.stringify(jsonResults);
}
