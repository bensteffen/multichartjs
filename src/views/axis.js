import * as d3 from 'd3';

import { MultiChartView } from '../view.js'

/**
 * Class MultiChartAxisView extends MultiChartView
 * Shows (depending on the scale property) an x- or y-axis.
 * @property {string} scale Options: "x" | "y"
 * @property {string} position Options if scale = "x": "left" | "right"; if scale == "y": "top" | "bottom"
 * @property {string} orient Options: "left" | "right" | "top" | "bottom" (normally same as orient)
 * @property {integer} innerTickSize
 * @property {integer} outerTickSize
 * @property {integer} tickPadding distance [pixels] to tick labels
 */
var MultiChartAxisView = (function() { "use strict";
  MultiChartAxisView.prototype = Object.create(MultiChartView.prototype)
  MultiChartAxisView.prototype.constructor = MultiChartAxisView;  

  function MultiChartAxisView(config) {
    MultiChartView.call(this, config);
  }

  MultiChartAxisView.prototype.buildView = function() {
    this.axisFactory = d3.svg.axis()
      .orient(this.orient || 'bottom')
      .innerTickSize(this.innerTickSize || 0)
      .outerTickSize(this.tickSize || 0)
      .tickPadding(this.tickPadding || 5);

    if (this.tickFormat) {
      var formatType = this.tickFormat.type || 'number';
      var formatters, localeFormat;
      if (this.tickFormat.locale === 'en' || !this.tickFormat.locale) {
        formatters = {
          number: function(f) { return d3.format(f) },
          time: function(f) { return d3.time.format(f) }
        }
      } else {
        localeFormat = this.getLocaleFormat(this.tickFormat.locale);
        formatters = {
          number: function(f) { return localeFormat.numberFormat(f) },
          time: function(f) { return localeFormat.timeFormat(f) }
        }
      }
      this.axisFactory.tickFormat(formatters[formatType](this.tickFormat.format));
    }

    if (this.tickNumber) {
      this.axisFactory.ticks(this.tickNumber);
    }

    this.axisGroup = this.container.append('g').attr('class', 'axis');
    if (this.label) {
      this.labelElement = this.axisGroup.append('text');
    }
  }

  MultiChartAxisView.prototype.update = function() {
    if (this.scale === 'x') {
      this.axisFactory.scale(this.domain.xDomain);
      if (this.gridLines) this.axisFactory.innerTickSize(-this.domain.size.height);
      if (this.labelElement) {
        this.updateLabel();
      }
    } else if (this.scale === 'y') {
      this.axisFactory.scale(this.domain.yDomain);  
      if (this.gridLines) this.axisFactory.innerTickSize(-this.domain.size.width);
      if (this.labelElement) {
        this.updateLabel();
      }
    }
    this.axisGroup.call(this.axisFactory);
    if (this.position === 'bottom') {
      this.axisGroup.attr('transform', 'translate(0, ' + this.domain.size.height + ')');
    }
    if (this.position === 'right') {
      this.axisGroup.attr('transform', 'translate(' + this.domain.size.width + ',0)');
    }
  }

  MultiChartAxisView.prototype.updateLabel = function() {
    this.labelElement.text(this.label.content);
    var textWidth = this.labelElement.node().getBBox().width;

    var labelDistance = this.label.distance || 32;
    var x, y, rotate;
    if (this.scale === 'x') {
      var xMin = this.domain.toX(this.domain.xExtent[0]);
      var xMax = this.domain.toX(this.domain.xExtent[1]);
      x = 0.5*(xMax - xMin) - 0.5*textWidth;
      y = labelDistance;

      rotate = this.label.rotate || 0;
    } else {
      if (this.position !== 'right') labelDistance = -labelDistance;
      x = labelDistance;

      var yMin = this.domain.toY(this.domain.yExtent[0]);
      var yMax = this.domain.toY(this.domain.yExtent[1]);
      y = 0.5*(yMin - yMax) - 0.5*textWidth;

      rotate = this.label.rotate || -90;
    }

    this.labelElement.attr('transform', 'translate(' + x + ',' + y + ') rotate(' + rotate + ')');
  }

  MultiChartAxisView.prototype.getLocaleFormat = function(locale) {
    switch (locale) {
      case 'de':
        return d3.locale({
          "decimal": ",",
          "thousands": ".",
          "grouping": [3],
          "currency": ["€", ""],
          "dateTime": "%a %b %e %X %Y",
          "date": "%d.%m.%Y",
          "time": "%H:%M:%S",
          "periods": ["AM", "PM"],
          "days": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
          "shortDays": ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
          "months": ["Jannuar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
          "shortMonths": ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
        });
    }
  }

  return MultiChartAxisView;
}());

export {
    MultiChartAxisView
}
