import { MultiChartView } from '../view.js'

/**
 * Class MultiChartLabelView extends MultiChartView
 * Displays labels. Needs variables x, y, label.
 * @property {number} rotate Angle [degree] of label rotation
 * @property {integer} offset Global label offset [pixel] in y-direction
 */
var MultiChartLabelView = (function() { "use strict";
  MultiChartLabelView.prototype = Object.create(MultiChartView.prototype);
  MultiChartLabelView.prototype.constructor = MultiChartLabelView;

  function MultiChartLabelView(name) {
    MultiChartView.call(this, name);
  }

  MultiChartLabelView.prototype.buildView = function() {
    this.labels = this.container.selectAll('text');
    this.labels.data(this.data()).enter().append('text')
      .classed('label', true)
      .attr('data-id', function(d) { return d.id });
  }

  MultiChartLabelView.prototype.update = function() {
    var self = this;
    var rotate = this.rotate || 0;
    var offset = this.offset || -5;

    this.container.selectAll('text').data(this.data())
      .attr('transform', function(d) {
        return 'translate(' + self.domain.toX(d.x) + ',' + (self.domain.toY(d.y) + (d.offset || offset)) + ') rotate(' + rotate + ')'
      })
      .text(function(d) { return d.label });
  }

  return MultiChartLabelView;
}());

export {
    MultiChartLabelView
}
