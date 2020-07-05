import * as EsEval from 'eseval';

var MultiChartEval = (function() { "use strict";

  function makeMap(config) {
    if (!config) {
      return function(row) { return row };
    }
    return MultiChartEval.makeExtractor(config);
  }

  function makeExtractor(config) {
    if (!config) {
      return function(row) { return row };
    }
    if (typeof config === 'string') {
      return new EsEval.evaluator().setProgram(config).start();
    }
    if (typeof config === 'function') {
      return config;
    }
    return function(row, index) {
      var dataItem = {};
      Object.keys(config).forEach(function(dataField) {
          dataItem[dataField] = evalValue(config[dataField], row, index);
      });
      return dataItem;
    }
  }

  function makeFilter(config) {
    if (!config) {
      return function() { return true; };
    }
    if (typeof config === 'function') {
      return config;
    }
    if (config['binaryOperation']) {
      switch (config['binaryOperation']) {
        case '=':
          return function(row, index) {
            return evalValue(config['A'], row, index) === evalValue(config['B'], row, index);
          }
        case '<':
          return function(row, index) {
            return evalValue(config['A'], row, index) < evalValue(config['B'], row, index);
          }
        case '>':
          return function(row, index) {
            return evalValue(config['A'], row, index) > evalValue(config['B'], row, index);
          }
        case '<=':
          return function(row, index) {
            return evalValue(config['A'], row, index) <= evalValue(config['B'], row, index);
          }
        case '>=':
          return function(row, index) {
            return evalValue(config['A'], row, index) >= evalValue(config['B'], row, index);
          }
      }
    }
    if (config['within']) {
      return function(row, index) {
        return evalValue(config['A'], row, index) >= config['within'][0]
            && evalValue(config['A'], row, index) <= config['within'][1];
      }
    }
    return config;
  }
  
  function evalValue(valueExp, row, index) {
    if (row && index !== undefined) {
      if (valueExp === '$index') {
        return index;
      } else if (valueExp['select']) {
        var selectedValue = valueByFieldPath(row, JSON.parse(JSON.stringify(valueExp['select'])));
        if (typeof selectedValue === 'number') {
          return (valueExp['times'] || 1)*selectedValue;
        }
        return selectedValue;
      }
    }
    return valueExp;
  }


  function valueByFieldPath(obj, fieldPath) {
    if (typeof fieldPath === 'string') {
      fieldPath = [fieldPath];
    }
    var result = obj[fieldPath.shift()];
    if (fieldPath.length) {
      return valueByFieldPath(result, fieldPath);
    }
    return result;
  }

  return {
    makeMap: makeMap,
    makeExtractor: makeExtractor,
    makeFilter: makeFilter
  }
}());

export {
    MultiChartEval
}
