import { MultiChartDomain } from '../domain.js'

/**
 * Class MultiChartLinearDomain extends MultiChartDomain
 * A liner "connection" between the data and the pixel-space.
 */
var MultiChartLinearDomain = (function() { "use strict";
  MultiChartLinearDomain.prototype = Object.create(MultiChartDomain.prototype);
  MultiChartLinearDomain.prototype.constructor = MultiChartDomain;

  function MultiChartLinearDomain(name) {
    MultiChartDomain.call(this, name);
  }

  MultiChartLinearDomain.prototype.updateScales = function() {
    this.xDomain = d3.scale.linear().domain(this.xExtent); 
    this.yDomain = d3.scale.linear().domain(this.yExtent); 
  }

  return MultiChartLinearDomain;
}());

export {
    MultiChartLinearDomain
}
