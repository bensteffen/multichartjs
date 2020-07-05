import * as d3 from 'd3';

import { MultiChartFactory } from './factory.js'

/**
 * Class MultiChartDomain
 * The abstract "connection" between the data and the pixel-space. Uses d3 domains and scales.
 * Holds a list of views.
 */
var MultiChartDomain = (function() { "use strict";
  function MultiChartDomain(config) {
    var self = this;

    this.name = name || 'domain';
    this.views = [];
  
    this.margin = { left: 25, right: 25, top: 25, bottom: 25 };
  
    this.xLimits = 'auto'; this.xMin = 'auto'; this.xMax = 'auto';
    this.yLimits = 'auto'; this.yMin = 'auto'; this.yMax = 'auto';

    if (config) {
      Object.keys(config).forEach(function(key) {
        self[key] = config[key];
      });
    }
  }

  MultiChartDomain.prototype.build = function(chart) {
    var self = this;

    this.chart = chart;

    this.container = this.chart.canvas.append('g').classed(this.name, true);

    if (this.buildViews) {
      this.buildViews.forEach(function(buildConfig) {
        self.views.push(MultiChartFactory.build(buildConfig.config, 'view', buildConfig.type));
      });
    }

    this.views.forEach(function(view) {
      view.build(self);
    });
  }

  MultiChartDomain.prototype.toX = function(value) {
    if (value === '$min') {
      value = this.xExtent[0];
    }
    if (value === '$max') {
      value = this.xExtent[1];
    }
    return this.xDomain(value);
  }

  MultiChartDomain.prototype.toY = function(value) {
    if (value === '$min') {
      value = this.yExtent[0];
    }
    if (value === '$max') {
      value = this.yExtent[1];
    }
    return this.yDomain(value);
  }

  MultiChartDomain.prototype.update = function() {
    this.updateSize();
    this.updateExtent();
    this.updateScales();

    this.xDomain.range([0, this.size.width]);
    this.yDomain.range([this.size.height, 0]);

    this.container.attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this.views.forEach(function(view) {
      view.update();
    });
  }

  MultiChartDomain.prototype.addView = function(view) {
    this.views.push(view);
  }

  MultiChartDomain.prototype.updateSize = function() {
    this.size = {
      width: this.chart.size.width - this.margin.left - this.margin.right,
      height: this.chart.size.height - this.margin.top - this.margin.bottom
    }
  }

  MultiChartDomain.prototype.updateExtent = function() {
    var xExtent = this.xLimits;
    var yExtent = this.yLimits;
    if (xExtent === 'auto' || yExtent === 'auto') {
      var extents = this.views.map(function(view) { return view.extent; });
      if (xExtent === 'auto') {
        xExtent = d3.extent(extents.map(function(extent) { return extent.x }).reduce(function(a,b) { return a.concat(b) }));
      }
      if (yExtent === 'auto') {
        yExtent = d3.extent(extents.map(function(extent) { return extent.y }).reduce(function(a,b) { return a.concat(b) }));
      }
    }

    if (this.xMin !== 'auto') {
      xExtent[0] = this.xMin;
    }
    if (this.xMax !== 'auto') {
      xExtent[1] = this.xMax;
    }
    if (this.yMin !== 'auto') {
      yExtent[0] = this.yMin;
    }
    if (this.yMax !== 'auto') {
      yExtent[1] = this.yMax;
    }

    if (this.xSpace) {
      xExtent = MultiChartDomain.addSpace(xExtent, this.xSpace);
    }
    if (this.ySpace) {
      yExtent = MultiChartDomain.addSpace(yExtent, this.ySpace);
    }

    if (this.xInvert) {
      xExtent.reverse();
    }
    if (this.yInvert) {
      yExtent.reverse();
    }

    this.xExtent = xExtent;
    this.yExtent = yExtent;
  }

  MultiChartDomain.addSpace = function(extent, space) {
    if (typeof space === 'number') {
      return [extent[0]-space, extent[1]+space];
    }
    if (space.match(/%$/)) {
      space = (extent[1] - extent[0])*parseFloat(space.replace(/%$/,''))/100;
      return [extent[0]-space, extent[1]+space];
    } else {
      return extent;
    }
  }

  MultiChartDomain.prototype.updateScales = function() { }

  return MultiChartDomain;
}());

export {
    MultiChartDomain
}
