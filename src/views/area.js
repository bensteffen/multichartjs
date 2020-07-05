import * as d3 from 'd3';

import { MultiChartView } from '../view.js'

/**
 * Class MultiChartAreaView extends MultiChartView
 * Displays given data-set as area-plot. Needs variables x, y.
 */
var MultiChartAreaView = (function() { "use strict";
  MultiChartAreaView.prototype = Object.create(MultiChartView.prototype)
  MultiChartAreaView.prototype.constructor = MultiChartAreaView;

  function MultiChartAreaView(name) {  
    MultiChartView.call(this, name);
  }
  
  MultiChartAreaView.prototype.buildView = function() {
    var self = this;

    this.path = this.container.append('path')
      .datum(this.data());

    this.dFactory = d3.svg.line()
      .x(function(d) { return self.domain.toX(d.x) })
      .y(function(d) { return self.domain.toY(d.y) });
  }

  MultiChartAreaView.prototype.update = function() {
    var data = this.data();
    var first = data.shift();
    var last = data.pop();
    var d = this.dFactory(this.data());
    var base = this.domain.yExtent[0];
    d = d.replace(/^M/, 'M' + this.domain.toX(first.x) + ',' + this.domain.toY(base) + 'L');
    d += 'L' + this.domain.toX(last.x) + ',' + this.domain.toY(base) + 'Z';
    this.path.attr('d', d);
  }

  return MultiChartAreaView;
}());

export {
    MultiChartAreaView
}