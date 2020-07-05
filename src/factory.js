import { MultiChartEval } from './eval.js'

import { MultiChart } from './chart.js'
import { MultiChartDataSet } from './data.js'
import { MultiChartDataScope } from './data.js'
import { MultiChartDataPipe } from './data.js'
import { MultiChartLinearDomain } from './domains/linear.js'
import { MultiChartLineView } from './views/line.js'
import { MultiChartAreaView } from './views/area.js'
import { MultiChartBarView } from './views/bar.js'
import { MultiChartMarkerView } from './views/marker.js'
import { MultiChartLabelView } from './views/label.js'
import { MultiChartAxisView } from './views/axis.js'
import { MultiChartCursorView } from './views/cursor.js'

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
      axis: MultiChartAxisView,
      cursor: MultiChartCursorView
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

export {
    MultiChartFactory
}
