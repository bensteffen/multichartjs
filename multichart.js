
/**
 * Class MultiChartDataSet
 * Recieves raw chart-data via method //setRaw//. Reshaped (property //map//) and
 * filtered (property //filter//) data can be retrieved via method //getData//.
 * To add and reference additional mapped and filtered data, scopes (see //MultiChartDataScope)
 * can be appended. To retrieve scope-data with name "my-scope" use getData("my-scope").
 */
var MultiChartDataSet = (function() { "use strict";

  function MultiChartDataSet(config) {
    var self = this;

    this.scopes = [];

    if (config) {
      Object.keys(config).forEach(function(key) {
        switch (key) {
          case 'buildScopes':
            config.buildScopes.forEach(function(buildConfig) {
              self.scopes.push(MultiChartFactory.build(buildConfig, 'scope'));
            });
            break;
          default:
            self[key] = config[key];
        }
      });
      this.update();
    }
  }

  MultiChartDataSet.prototype.setRaw = function(raw) {
    this.raw = raw;
    this.update();
  }

  MultiChartDataSet.prototype.update = function() {
    var self = this;

    this.scopes.forEach(function(scope) {
      scope.dataSet = self;
      scope.update();
    });
  }

  MultiChartDataSet.prototype.addScope = function(scope) {
    scope.dataSet = this;
    this.scopes.push(scope);
    scope.update();
  }

  MultiChartDataSet.prototype.getData = function(scopeName) {
    if (!scopeName) {
      if (Array.isArray(this.raw)) {
        return this.raw
          .map(MultiChartEval.makeMap(this.map))
          .filter(MultiChartEval.makeFilter(this.filter));
      } else {
        return this.raw
      }
    }
    var scope = this.scopes.filter(function(s) { return s.name === scopeName }).pop();
    if (scope) {
      return scope.data;
    }
  }
  
  return MultiChartDataSet;
}());

/**
 * Class MultiChartDataScope
 * Uses pipes (see //MultiChartDataPipe//) to obtain a "scope" on the data. Scopes are named
 * and can be referenced using this name (//<a-data-set>.getData(<scope-name>)//).
 */
var MultiChartDataScope = (function() { "use strict";
  function MultiChartDataScope(config) {
    var self = this;

    this.pipes = [];

    if (config) {
      Object.keys(config).forEach(function(key) {
        switch (key) {
          case 'buildPipes':
            config.buildPipes.forEach(function(buildConfig) {
              self.pipes.push(MultiChartFactory.build(buildConfig, 'pipe'));
            });
            break;
          default:
            self[key] = config[key];
        }
      });
      this.update();
    }
  }

  MultiChartDataScope.prototype.addPipe = function(pipe) {
    this.pipes.push(pipe);
    this.update();
  }

  MultiChartDataScope.prototype.update = function() {
    if (!this.dataSet || !this.dataSet.raw) return;
    this.data = MultiChartDataPipe.pipeData(this.pipes, MultiChartDataScope.cloneData(this.dataSet.getData()));
  }

  MultiChartDataScope.cloneData = function(data) {
    return JSON.parse(JSON.stringify(data));
  }

  return MultiChartDataScope;
}());
  
/**
 * Class MultiChartDataPipe
 * Transforms incoming data using its //map// and //filter// property. Map and fillter can be passed
 * as function or as configuration-object (//MultiChartEvaluator// creates functions from these objects).
 */
var MultiChartDataPipe = (function() { "use strict";
  function MultiChartDataPipe(config) {
    var self = this;

    if (config) {
      Object.keys(config).forEach(function(key) {
        self[key] = config[key];
      });
    }
  }

  MultiChartDataPipe.prototype.transform = function(data) {
    var mapper = MultiChartEval.makeMap(this.map);
    var filterer = MultiChartEval.makeFilter(this.filter);
    if (Array.isArray(data)) {
      return data.map(mapper).filter(filterer);
    } else {
      return mapper(data).filter(filterer);
    }
  }

  MultiChartDataPipe.pipeData = function(pipes, data) {
    pipes.forEach(function(pipe) {
      data = pipe.transform(data);
    });
    return data;
  }

  return MultiChartDataPipe;
}());

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

  return MultiChart;
}());

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

/**
 * Class MultiChartView
 * Parent class of all views. Establishs connection to its parent domain. Offers a general method
 * to calculate its extent.
 */
var MultiChartView = (function() { "use strict";

  function MultiChartView(config) {
    var self = this;
    
    this.name = '';
    if (config) {
      Object.keys(config).forEach(function(key) {
        self[key] = config[key];
      });
    }
  }

  MultiChartView.prototype.extract = function(extractor) {
    this.extractor = extractor;
  }

  MultiChartView.prototype.setDataSet = function(dataSet) {
    this.dataSet = dataSet;
    this.extent = this.calculateExtent(this.data());
  }

  MultiChartView.prototype.data = function() {
    return this.dataSet.getData(this.scope).filter(MultiChartEval.makeFilter(this.filter)).map(this.extractor);
  }

  MultiChartView.prototype.calculateExtent = function(data) {
    return {
      x: d3.extent(data.map(function(d) { return d.x })),
      y: d3.extent(data.map(function(d) { return d.y }))
    }
  }

  MultiChartView.prototype.build = function(domain) {
    this.domain = domain;
    this.setDataSet(domain.chart.dataSet);

    this.container = domain.container.append('g').classed(this.name, true);

    this.buildView();
  }

  return MultiChartView;
}());

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
      .tickPadding(this.tickPadding || 5)
      // .tickFormat(this.tickFormat || d3.format('d'))

    if (this.tickNumber) {
      this.axisFactory.ticks(this.tickNumber);
    }

    this.axisGroup = this.container.append('g').attr('class', 'axis');
  }

  MultiChartAxisView.prototype.update = function() {
    if (this.scale === 'x') {
      this.axisFactory.scale(this.domain.xDomain);
      if (this.gridLines) this.axisFactory.innerTickSize(-this.domain.size.height);
    } else if (this.scale === 'y') {
      this.axisFactory.scale(this.domain.yDomain);  
      if (this.gridLines) this.axisFactory.innerTickSize(-this.domain.size.width);
    }
    this.axisGroup.call(this.axisFactory);
    if (this.position === 'bottom') {
      this.axisGroup.attr('transform', 'translate(0, ' + this.domain.size.height + ')');
    }
    if (this.position === 'right') {
      this.axisGroup.attr('transform', 'translate(' + this.domain.size.width + ',0)');
    }
  }

  return MultiChartAxisView;
}());

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
    d = d.replace(/^M/, 'M' + this.domain.toX(first.x) + ',' + this.domain.toY(0) + 'L');
    d += 'L' + this.domain.toX(last.x) + ',' + this.domain.toY(0) + 'Z';
    this.path.attr('d', d);
  }

  return MultiChartAreaView;
}());

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

    this.container.selectAll('path').data(this.data())
      .attr("transform", function(d) {
        return "translate(" + self.domain.toX(d.x) + "," + self.domain.toY(d.y) + ")"
      });
  }

  return MultiChartMarkerView;
}());

var MultiChartFactory = (function() { "use strict";
  var constructors = {
    chart: MultiChart,
    dataSet: MultiChartDataSet,
    scope: MultiChartDataScope,
    pipe: MultiChartDataPipe,
    domain: {
      linear: MultiChartLinearDomain
    },
    view: {
      line: MultiChartLineView,
      area: MultiChartAreaView,
      bar: MultiChartBarView,
      marker: MultiChartMarkerView,
      label: MultiChartLabelView,
      axis: MultiChartAxisView
    }
  }

  var build = function(config, type, subtype) {
    if (typeof config === 'string') {
      config = JSON.parse(config);
    }
    Object.keys(config).forEach(function(key) {
      if (key === 'buildMap') {
        config.map = MultiChartEval.makeMap(config.buildMap);
      }
      if (key === 'buildExtractor') {
        config.extractor = MultiChartEval.makeExtractor(config.buildExtractor);
      }
      if (key === 'buildFilter') {
        config.filter = MultiChartEval.makeFilter(config.buildFilter);
      }
    })
    if (subtype) {
      return new constructors[type][subtype](config);
    } else {
      return new constructors[type](config);
    }
  }

  var register = function(elementContructor, type, subtype) {
    if (subtype) {
      constructors[type][subtype] = elementContructor;
    } else {
      constructors[type] = elementContructor;
    }
  }

  return {
    build: build,
    register: register
  };
}());

var MultiChartEval = (function() { "use strict";

  function makeMap(config) {
    if (!config) {
      return function(row) { return row };
    }
    return MultiChartEval.makeExtractor(config);
  }

  function makeExtractor(config) {
    return function(row, index) {
      var dataItem = {};
      Object.keys(config).forEach(function(dataField) {
          dataItem[dataField] = evalValue(config[dataField], row, index);
      });
      return dataItem;
    }
  }

  function makeFilter(config) {
    if (!config) {
      return function() { return true; };
    }
    if (config['binaryOperation']) {
      switch (config['binaryOperation']) {
        case '=':
          return function(row, index) {
            return evalValue(config['A'], row, index) === evalValue(config['B'], row, index);
          }
        case '<':
          return function(row, index) {
            return evalValue(config['A'], row, index) < evalValue(config['B'], row, index);
          }
        case '>':
          return function(row, index) {
            return evalValue(config['A'], row, index) > evalValue(config['B'], row, index);
          }
        case '<=':
          return function(row, index) {
            return evalValue(config['A'], row, index) <= evalValue(config['B'], row, index);
          }
        case '>=':
          return function(row, index) {
            return evalValue(config['A'], row, index) >= evalValue(config['B'], row, index);
          }
      }
    }
    if (config['within']) {
      return function(row, index) {
        return evalValue(config['A'], row, index) >= config['within'][0]
            && evalValue(config['A'], row, index) <= config['within'][1];
      }
    }
    return config;
  }
  
  function evalValue(valueExp, row, index) {
    if (row && index !== undefined) {
      if (valueExp === '$index') {
        return index;
      } else if (valueExp['select']) {
        var selectedValue = valueByFieldPath(row, JSON.parse(JSON.stringify(valueExp['select'])));
        if (typeof selectedValue === 'number') {
          return (valueExp['times'] || 1)*selectedValue;
        }
        return selectedValue;
      }
    }
    return valueExp;
  }


  function valueByFieldPath(obj, fieldPath) {
    if (typeof fieldPath === 'string') {
      fieldPath = [fieldPath];
    }
    var result = obj[fieldPath.shift()];
    if (fieldPath.length) {
      return valueByFieldPath(result, fieldPath);
    }
    return result;
  }

  return {
    makeMap: makeMap,
    makeExtractor: makeExtractor,
    makeFilter: makeFilter
  }
}());

module.exports = MultiChart;
