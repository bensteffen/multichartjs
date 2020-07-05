import * as d3 from 'd3';

import { MultiChartView } from '../view.js'

/**
 * Class MultiChartMarkerView extends MultiChartView
 * Displays labels. Needs variables x, y.
 * @property {string} shape Options: "circle" | "cross" | "diamond" | "square" | "triangle-down" | "triangle-up"
 */
var MultiChartMarkerView = (function() { "use strict";
  MultiChartMarkerView.prototype = Object.create(MultiChartView.prototype);
  MultiChartMarkerView.prototype.constructor = MultiChartMarkerView;

  function MultiChartMarkerView(name) {
    MultiChartView.call(this, name);
  }

  MultiChartMarkerView.prototype.buildView = function() {
    this.markers = this.container.selectAll('path');
    this.markers.data(this.data()).enter().append('path')
      .attr('data-id', function(d) { return d.id })
      .attr("d", d3.svg.symbol().type(this.shape || 'circle'))
  }

  MultiChartMarkerView.prototype.update = function() {
    var self = this;

    if (!this.container) return;

    this.container.selectAll('path').data(this.data())
      .attr("transform", function(d) {
        return "translate(" + self.domain.toX(d.x) + "," + self.domain.toY(d.y) + ")"
      });
  }

  return MultiChartMarkerView;
}());

export {
    MultiChartMarkerView
}