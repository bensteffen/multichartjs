import * as d3 from 'd3';

import { MultiChartFactory } from './factory.js'

/**
 * Class MultiChart
 * The actual chart object that holds domains and views on the given data-set.
 */
var MultiChart = (function() { "use strict";
  function MultiChart(config) {
    var self = this;
  
    this.parent = null;
    this.canvas = null;
    this.dataSet = null;
    this.domains = [];
    this.pipes = [];

    if (config) {
      Object.keys(config).forEach(function(key) {
        switch (key) {
          case 'parent':
            self.setParent(config.parent);
            break;
          case 'domains': 
            config.domains.forEach(function(domain) {
              self.addDomain(domain);
            });
            break;
          default:
            self[key] = config[key];
        }
      });
    }
  }
  
  MultiChart.prototype.build = function(parent) {
    var self = this;

    if (this.buildDomains) {
      this.buildDomains.forEach(function(buildConfig) {
        self.addDomain(MultiChartFactory.build(buildConfig.config, 'domain', buildConfig.type));
      });
    }

    if (parent) {
      this.setParent(parent);
    }

    if (this.parent) {

      this.clean();

      this.canvas = d3.select(this.parent).append('svg')
        .style({ width: '100%', height: '100%' });
      this.domains.forEach(function(domain) {
        domain.build(self);
      });

    }
  };

  MultiChart.prototype.update = function() {
    if (!this.parent || !this.canvas) return;

    this.updateSize();

    this.domains.forEach(function(domain) {
      domain.update();
    });
  }

  MultiChart.prototype.setDataSet = function(dataSet) {
    this.dataSet = dataSet;
  }

  MultiChart.prototype.addDomain = function(domain) {
    this.domains.push(domain);
  };

  MultiChart.prototype.addPipe = function(pipe) {
    this.pipes.push(pipe);
  };

  MultiChart.prototype.setParent = function(parent) {
    if (!parent) return;

    var self = this;

    this.parent = parent;
    var rs = new ResizeObserver(function() { 
      self.update();
    });
    rs.observe(parent);
  };

  MultiChart.prototype.updateSize = function() {
    this.size = {
      width: this.parent.getBoundingClientRect().width,
      height: this.parent.getBoundingClientRect().height
    }
  }

  MultiChart.prototype.reset = function() {
    this.clean();
    this.dataSet = null;
    this.domains = [];
    this.pipes = [];
  };

  MultiChart.prototype.clean = function() {
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
  };

  MultiChart.prototype.findView = function(name) {
    var self = this;
    var view = null;
    self.domains.forEach(function(domain) {
      var result = domain.views.filter(function(v) { return v.name === name }).pop();
      if (result) {
        view = result;
        return;
      }
    });
    return view;
  }
  
  return MultiChart;
}());

export {
    MultiChart
}
