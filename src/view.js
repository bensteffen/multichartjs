import * as d3 from 'd3';

import { MultiChartEval } from './eval.js'

/**
 * Class MultiChartView
 * Parent class of all views. Establishs connection to its parent domain. Offers a general method
 * to calculate its extent.
 */
var MultiChartView = (function() { "use strict";

  function MultiChartView(config) {
    var self = this;
    
    this.name = '';
    if (config) {
      Object.keys(config).forEach(function(key) {
        self[key] = config[key];
      });
    }
  }

  MultiChartView.prototype.extract = function(extractor) {
    this.extractor = extractor;
  }

  MultiChartView.prototype.setDataSet = function(dataSet) {
    this.dataSet = dataSet;
    this.extent = this.calculateExtent(this.data());
  }

  MultiChartView.prototype.data = function() {
    var filter = MultiChartEval.makeFilter(this.filter);
    var extractor = MultiChartEval.makeExtractor(this.extractor);
    return this.dataSet.getData(this.scope).filter(filter).map(extractor);
  }

  MultiChartView.prototype.calculateExtent = function(data) {
    if (data.length < 2) {
      return { x: undefined, y: undefined };
    };
    return {
      x: d3.extent(data.map(function(d) { return d.x })),
      y: d3.extent(data.map(function(d) { return d.y }))
    }
  }

  MultiChartView.prototype.build = function(domain) {
    this.domain = domain;
    this.setDataSet(domain.chart.dataSet);

    this.container = domain.container.append('g').classed(this.name, true);

    this.buildView();
  }

  return MultiChartView;
}());

export {
    MultiChartView
}
