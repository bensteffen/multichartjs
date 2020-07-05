import * as d3 from 'd3';

import { MultiChartView } from '../view.js'

/**
 * Class MultiChartLineView extends MultiChartView
 * Displays given data-set or scope as line.  Needs variables x, y.
 */
var MultiChartLineView = (function() { "use strict";
  MultiChartLineView.prototype = Object.create(MultiChartView.prototype)
  MultiChartLineView.prototype.constructor = MultiChartLineView;

  function MultiChartLineView(name) {  
    MultiChartView.call(this, name);
  }
  
  MultiChartLineView.prototype.buildView = function() {
    var self = this;

    this.path = this.container.append('path')
      .datum(this.data());

    this.dFactory = d3.svg.line()
      .x(function(d) { return self.domain.toX(d.x) })
      .y(function(d) { return self.domain.toY(d.y) });
  }

  MultiChartLineView.prototype.update = function() {
    this.path.attr('d', this.dFactory);
  }

  return MultiChartLineView;
}());

export {
    MultiChartLineView
}