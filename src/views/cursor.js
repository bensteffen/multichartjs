import { MultiChartView } from '../view.js'

var MultiChartCursorView = (function() { "use strict";
  MultiChartCursorView.prototype = Object.create(MultiChartView.prototype)
  MultiChartCursorView.prototype.constructor = MultiChartCursorView;

  function MultiChartCursorView(name) {  
    MultiChartView.call(this, name);
  }
  
  MultiChartCursorView.prototype.buildView = function() {
    this.scale = this.scale || 'x';
    this.cursor = this.container.selectAll('line')
      .data(this.getCursorData()).enter()
      .append('line');
  }

  MultiChartCursorView.prototype.update = function() {
    var self = this;
    this.cursor.data(this.getCursorData()).enter();
    var start, stop;
    switch(this.scale) {
      case 'x':
        start = this.start || this.domain.yExtent[0];
        stop  = this.stop  || this.domain.yExtent[1];
        this.cursor
          .attr('x1', function(d) { return self.domain.toX(d.position) })
          .attr('y1', this.domain.toY(start))
          .attr('x2', function(d) { return self.domain.toX(d.position) })
          .attr('y2', this.domain.toY(stop) )
        break;
      case 'y':
        start = this.start || this.domain.xExtent[0];
        stop  = this.stop  || this.domain.xExtent[1];
        this.cursor
          .attr('x1', this.domain.toX(start))
          .attr('y1', function(d) { return self.domain.toY(d.position) })
          .attr('x2', this.domain.toX(stop ))
          .attr('y2', function(d) { return self.domain.toY(d.position) })
        break;
    }
  }

  MultiChartCursorView.prototype.getCursorData = function() {
    if (this.position === undefined || this.position === null) {
      return this.data();
    } else {
      if (!Array.isArray(this.position)) {
        return [{ position: this.position }];
      } else {
        return this.position.map(function(p) { return { position: p }; });
      }
    }
  }

  return MultiChartCursorView;
}());

export {
    MultiChartCursorView
}
