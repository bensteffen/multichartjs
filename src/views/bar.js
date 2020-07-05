import * as d3 from 'd3';

import { MultiChartView } from '../view.js'

/**
 * Class MultiChartBarView extends MultiChartView
 * Displays given data-set as bar-chart. Needs variables x, y.
 * @property {number} barWidthRatio Ratio between bar-width and (bar-width + gap-between-bars)
 * @property {number} minBarWidth Minimum bar-width [pixel]
 */
var MultiChartBarView = (function() { "use strict";
  MultiChartBarView.prototype = Object.create(MultiChartView.prototype)
  MultiChartBarView.prototype.constructor = MultiChartBarView;

  function MultiChartBarView(config) {  
    MultiChartView.call(this, config);
  }
  
  MultiChartBarView.prototype.buildView = function() {
    var data = this.data();
    this.barNumber = data.length;
    this.container.selectAll('rect').data(data).enter().append('rect')
      .classed('bar', true)
      .attr('data-id', function(d) { return d.id });
  }

  MultiChartBarView.prototype.calculateExtent = function(data) {
    var yExtent = d3.extent(data.map(function(d) { return d.y }));
    return {
      x: d3.extent(data.map(function(d) { return d.x })),
      y: [Math.min(0,yExtent[0]), Math.max(0,yExtent[1])]
    }
  }

  MultiChartBarView.prototype.update = function() {
    var self = this;

    var barWidthRatio = this.barWidthRatio || 0.618;
    var minBarWidth = this.minBarWidth || 2;
    var barSlotSize = this.domain.size.width/this.barNumber;
    var barWidth = Math.max(barWidthRatio*barSlotSize, minBarWidth);

    var getOffset = function(d) { 
      if (d.y >= 0) {
        return self.domain.toY(d.y);
      } else {
        return self.domain.toY(0);
      }
    };
    var getHeight = function(d) {
      if (d.y >= 0) {
        return self.domain.toY(0) - self.domain.toY(d.y);
      } else {
        return self.domain.toY(d.y) - self.domain.toY(0);
      }
    };


    this.container.selectAll('.bar').data(this.data())
      .attr('x', function(d, i) { return self.domain.toX(d.x) - 0.5*barWidth })
      .attr('y', getOffset)
      .attr('width', barWidth)
      .attr('height', getHeight)
  }

  return MultiChartBarView;
}());

export {
    MultiChartBarView
}