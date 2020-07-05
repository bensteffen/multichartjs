import { MultiChartFactory } from './factory.js'

import { MultiChartEval } from './eval.js'

/**
 * Class MultiChartDataSet
 * Recieves raw chart-data via method //setRaw//. Reshaped (property //map//) and
 * filtered (property //filter//) data can be retrieved via method //getData//.
 * To add and reference additional mapped and filtered data, scopes (see //MultiChartDataScope)
 * can be appended. To retrieve scope-data with name "my-scope" use getData("my-scope").
 */
var MultiChartDataSet = (function() { "use strict";

  function MultiChartDataSet(config) {
    var self = this;

    this.scopes = [];

    if (config) {
      Object.keys(config).forEach(function(key) {
        switch (key) {
          case 'buildScopes':
            config.buildScopes.forEach(function(buildConfig) {
              self.scopes.push(MultiChartFactory.build(buildConfig, 'scope'));
            });
            break;
          default:
            self[key] = config[key];
        }
      });
      this.update();
    }
  }

  MultiChartDataSet.prototype.setRaw = function(raw) {
    this.raw = raw;
    this.update();
  }

  MultiChartDataSet.prototype.update = function() {
    var self = this;

    this.scopes.forEach(function(scope) {
      scope.dataSet = self;
      scope.update();
    });
  }

  MultiChartDataSet.prototype.addScope = function(scope) {
    scope.dataSet = this;
    this.scopes.push(scope);
    scope.update();
  }

  MultiChartDataSet.prototype.getData = function(scopeName) {
    if (!scopeName) {
      if (Array.isArray(this.raw)) {
        return this.raw
          .map(MultiChartEval.makeMap(this.map))
          .filter(MultiChartEval.makeFilter(this.filter));
      } else {
        return this.raw
      }
    }
    var scope = this.scopes.filter(function(s) { return s.name === scopeName }).pop();
    if (scope) {
      return scope.data;
    }
  }
  
  return MultiChartDataSet;
}());

/**
 * Class MultiChartDataScope
 * Uses pipes (see //MultiChartDataPipe//) to obtain a "scope" on the data. Scopes are named
 * and can be referenced using this name (//<a-data-set>.getData(<scope-name>)//).
 */
var MultiChartDataScope = (function() { "use strict";
  function MultiChartDataScope(config) {
    var self = this;

    this.pipes = [];

    if (config) {
      Object.keys(config).forEach(function(key) {
        switch (key) {
          case 'buildPipes':
            config.buildPipes.forEach(function(buildConfig) {
              self.pipes.push(MultiChartFactory.build(buildConfig, 'pipe'));
            });
            break;
          default:
            self[key] = config[key];
        }
      });
      this.update();
    }
  }

  MultiChartDataScope.prototype.addPipe = function(pipe) {
    this.pipes.push(pipe);
    this.update();
  }

  MultiChartDataScope.prototype.update = function() {
    if (!this.dataSet || !this.dataSet.raw) return;
    this.data = MultiChartDataPipe.pipeData(this.pipes, MultiChartDataScope.cloneData(this.dataSet.getData()));
  }

  MultiChartDataScope.cloneData = function(data) {
    return JSON.parse(JSON.stringify(data));
  }

  return MultiChartDataScope;
}());
  
/**
 * Class MultiChartDataPipe
 * Transforms incoming data using its //map// and //filter// property. Map and fillter can be passed
 * as function or as configuration-object (//MultiChartEvaluator// creates functions from these objects).
 */
var MultiChartDataPipe = (function() { "use strict";
  function MultiChartDataPipe(config) {
    var self = this;

    if (config) {
      Object.keys(config).forEach(function(key) {
        self[key] = config[key];
      });
    }
  }

  MultiChartDataPipe.prototype.transform = function(data) {
    var mapper = MultiChartEval.makeMap(this.map);
    var filterer = MultiChartEval.makeFilter(this.filter);
    if (Array.isArray(data)) {
      return data.map(mapper).filter(filterer);
    } else {
      return mapper(data).filter(filterer);
    }
  }

  MultiChartDataPipe.pipeData = function(pipes, data) {
    pipes.forEach(function(pipe) {
      data = pipe.transform(data);
    });
    return data;
  }

  return MultiChartDataPipe;
}());

export {
    MultiChartDataSet,
    MultiChartDataScope,
    MultiChartDataPipe
}
