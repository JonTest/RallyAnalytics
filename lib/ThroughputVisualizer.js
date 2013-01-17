// Generated by CoffeeScript 1.3.3
(function() {
  var ThroughputVisualizer, Time, lumenize, utils,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  if (typeof exports !== "undefined" && exports !== null) {
    lumenize = require('../lib/lumenize');
  } else {
    lumenize = require('/lumenize');
  }

  utils = lumenize.utils, Time = lumenize.Time;

  ThroughputVisualizer = (function(_super) {

    __extends(ThroughputVisualizer, _super);

    function ThroughputVisualizer() {
      this.onSnapshotsReceieved = __bind(this.onSnapshotsReceieved, this);

      this._gotSnapshotsToSubtract = __bind(this._gotSnapshotsToSubtract, this);

      this._gotSnapshots = __bind(this._gotSnapshots, this);

      this.onNewDataAvailable = __bind(this.onNewDataAvailable, this);
      return ThroughputVisualizer.__super__.constructor.apply(this, arguments);
    }

    /*
      @cfg {String} tz The timezone for analysis in the form like `America/New_York`
      @cfg {String} [validFromField = "_ValidFrom"]
      @cfg {String} [validToField = "_ValidTo"]
      @cfg {String} [uniqueIDField = "ObjectID"]
      @cfg {String} granularity 'month', 'week', 'quarter', etc. Use Time.MONTH, Time.WEEK, etc.
      @cfg {Number} numberOfPeriodsToShow
      @cfg {String[]} [fieldsToSum=[]] It will track the count automatically but it can keep a running sum of other fields also
    */


    ThroughputVisualizer.prototype.initialize = function() {
      ThroughputVisualizer.__super__.initialize.call(this);
      if (this.config.validFromField == null) {
        this.config.validFromField = '_ValidFrom';
      }
      this.config.lumenizeCalculatorConfig.validFromField = this.config.validFromField;
      this.config.lumenizeCalculatorConfig.validToField = this.config.validToField;
      this.config.lumenizeCalculatorConfig.uniqueIDField = this.config.uniqueIDField;
      this.config.lumenizeCalculatorConfig.granularity = this.config.granularity;
      this.config.lumenizeCalculatorConfig.fieldsToSum = this.config.fieldsToSum;
      this.config.lumenizeCalculatorConfig.asterixToDateTimePeriod = false;
      return this.LumenizeCalculatorClass = lumenize.TransitionsCalculator;
    };

    ThroughputVisualizer.prototype.onNewDataAvailable = function() {
      var criteria, queryConfig;
      queryConfig = {
        'X-RallyIntegrationName': 'ThroughputVisualizer (prototype)',
        'X-RallyIntegrationVendor': 'Rally Red Pill',
        'X-RallyIntegrationVersion': '0.1.0',
        workspaceOID: this.projectAndWorkspaceScope.workspaceOID
      };
      if (this.upToDateISOString == null) {
        this.upToDateISOString = '2011-12-01T00:00:00.000Z';
      }
      this.analyticsQuery = new TransitionsAnalyticsQuery(queryConfig, this.upToDateISOString, this.config.transitionsPredicate);
      this.analyticsQueryToSubtract = new TransitionsAnalyticsQuery(queryConfig, this.upToDateISOString, this.config.transitionsToSubtractPredicate);
      if (this.projectAndWorkspaceScope.projectScopingUp) {
        this.analyticsQuery.scope('Project', this.projectAndWorkspaceScope.projectOIDsInScope);
        this.analyticsQueryToSubtract.scope('Project', this.projectAndWorkspaceScope.projectOIDsInScope);
      } else if (this.projectAndWorkspaceScope.projectScopingDown) {
        this.analyticsQuery.scope('_ProjectHierarchy', this.projectAndWorkspaceScope.projectOID);
        this.analyticsQueryToSubtract.scope('_ProjectHierarchy', this.projectAndWorkspaceScope.projectOID);
      } else {
        this.analyticsQuery.scope('Project', this.projectAndWorkspaceScope.projectOID);
        this.analyticsQueryToSubtract.scope('Project', this.projectAndWorkspaceScope.projectOID);
      }
      this.analyticsQuery.type(this.config.type);
      this.analyticsQueryToSubtract.type(this.config.type);
      this.analyticsQuery.pagesize(300);
      if (this.config.asOf != null) {
        criteria = {};
        criteria[this.config.validFromField] = {
          $lt: this.getAsOfISOString()
        };
        this.analyticsQuery.additionalCriteria(criteria);
        this.analyticsQueryToSubtract.additionalCriteria(criteria);
      }
      if (this.config.debug) {
        this.analyticsQuery.debug();
        this.analyticsQueryToSubtract.debug();
        console.log('Requesting data...');
      }
      this.gotSnapshots = false;
      this.gotSnapshotsToSubtract = false;
      this.analyticsQuery.getPage(this._gotSnapshots);
      return this.analyticsQueryToSubtract.getPage(this._gotSnapshotsToSubtract);
    };

    ThroughputVisualizer.prototype._gotSnapshots = function(snapshots, startOn, endBefore) {
      this.snapshots = snapshots;
      this.startOn = startOn;
      this.endBefore = endBefore;
      this.gotSnapshots = true;
      return this.onSnapshotsReceieved();
    };

    ThroughputVisualizer.prototype._gotSnapshotsToSubtract = function(snapshotsToSubtract, startOnToSubtract, endBeforeToSubtract) {
      this.snapshotsToSubtract = snapshotsToSubtract;
      this.startOnToSubtract = startOnToSubtract;
      this.endBeforeToSubtract = endBeforeToSubtract;
      this.gotSnapshotsToSubtract = true;
      return this.onSnapshotsReceieved();
    };

    ThroughputVisualizer._truncateTo = function(s, isoString, validFromField) {
      var out, row, _i, _len;
      out = [];
      for (_i = 0, _len = s.length; _i < _len; _i++) {
        row = s[_i];
        if (row[validFromField] <= isoString) {
          out.push(row);
        }
      }
      return out;
    };

    ThroughputVisualizer.prototype.onSnapshotsReceieved = function(snapshots, startOn, endBefore, queryInstance, snapshotsToSubtract) {
      var asOfISOString;
      if (queryInstance == null) {
        queryInstance = null;
      }
      if (!(this.gotSnapshots && this.gotSnapshotsToSubtract)) {
        return;
      }
      utils.assert(this.startOn === this.startOnToSubtract, 'startOn for the snapshots and snapshotsToSubtract should match.');
      startOn = this.startOn;
      if (this.endBefore <= this.endBeforeToSubtract) {
        endBefore = this.endBefore;
        snapshotsToSubtract = ThroughputVisualizer._truncateTo(this.snapshotsToSubtract, endBefore, this.config.validFromField);
        snapshots = this.snapshots;
      } else {
        endBefore = this.endBeforeToSubtract;
        this.endBefore = endBefore;
        snapshots = ThroughputVisualizer._truncateTo(this.snapshots, endBefore, this.config.validFromField);
        snapshotsToSubtract = this.snapshotsToSubtract;
      }
      if (snapshots.length > 0 || snapshotsToSubtract > 0) {
        this.dirty = true;
      } else {
        this.dirty = false;
      }
      this.lastQueryReceivedMilliseconds = new Date().getTime();
      this.upToDateISOString = endBefore;
      this.deriveFieldsOnSnapshots(snapshots);
      this.deriveFieldsOnSnapshots(snapshotsToSubtract);
      asOfISOString = this.getAsOfISOString();
      if (asOfISOString < endBefore) {
        endBefore = asOfISOString;
      }
      this.updateCalculator(snapshots, startOn, endBefore, snapshotsToSubtract);
      this.updateVisualization();
      if (!((this.config.asOf != null) && this.upToDateISOString < this.config.asOf)) {
        if (this.analyticsQuery.hasMorePages() || this.analyticsQueryToSubtract.hasMorePages()) {
          return this.onNewDataAvailable();
        } else {
          return this.newDataExpected(void 0, this.config.refreshIntervalMilliseconds);
        }
      }
    };

    ThroughputVisualizer.prototype.getHashForCache = function() {
      var hashObject, hashString, out, salt, userConfig;
      hashObject = {};
      userConfig = utils.clone(this.userConfig);
      delete userConfig.debug;
      delete userConfig.periodsToShow;
      hashObject.userConfig = userConfig;
      hashObject.projectAndWorkspaceScope = this.projectAndWorkspaceScope;
      hashObject.workspaceConfiguration = this.workspaceConfiguration;
      salt = 'Throughput v0.2.75';
      salt = Math.random().toString();
      hashString = JSON.stringify(hashObject);
      out = md5(hashString + salt);
      return out;
    };

    ThroughputVisualizer.prototype.updateVisualizationData = function() {
      var calculatorResults, categories, countValues, data, f, highestTimePeriod, highestTimeString, ids, index, lowestTimePeriod, row, series, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
      calculatorResults = this.lumenizeCalculator.getResults();
      if (calculatorResults.length === 0) {
        this.visualizationData = null;
        this.createVisualizationCB(this.visualizationData);
        return;
      }
      if (this.config.debug) {
        console.log(calculatorResults);
      }
      highestTimeString = this.getAsOfISOString();
      lowestTimePeriod = new Time(highestTimeString, this.config.granularity, this.config.tz).addInPlace(-1 * this.config.numberOfPeriodsToShow + 1).toString();
      highestTimePeriod = new Time(highestTimeString, this.config.granularity, this.config.tz).toString();
      categories = [];
      ids = [];
      countValues = [];
      series = [];
      for (_i = 0, _len = calculatorResults.length; _i < _len; _i++) {
        row = calculatorResults[_i];
        if ((lowestTimePeriod <= (_ref = row.timePeriod) && _ref <= highestTimePeriod)) {
          categories.push(row.timePeriod);
          ids.push(row.ids);
          countValues.push(row.count_values);
        }
      }
      categories[categories.length - 1] += '*';
      _ref1 = this.config.fieldNames;
      for (index = _j = 0, _len1 = _ref1.length; _j < _len1; index = ++_j) {
        f = _ref1[index];
        data = [];
        for (_k = 0, _len2 = calculatorResults.length; _k < _len2; _k++) {
          row = calculatorResults[_k];
          if ((lowestTimePeriod <= (_ref2 = row.timePeriod) && _ref2 <= highestTimePeriod)) {
            data.push(row[f]);
          }
        }
        series.push({
          name: this.config.seriesNames[index],
          data: data
        });
      }
      this.visualizationData = {
        categories: categories,
        series: series,
        ids: ids,
        countValues: countValues
      };
      return this.createVisualizationCB(this.visualizationData);
    };

    ThroughputVisualizer.prototype.updateVisualization = function() {
      var chart, index, s, series, _i, _len, _ref;
      this.updateVisualizationData();
      chart = this.visualizations.chart;
      series = chart.series;
      _ref = this.visualizationData.series;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        s = _ref[index];
        series[index].setData(s.data, false);
      }
      chart.xAxis[0].setCategories(categories, false);
      return chart.redraw();
    };

    return ThroughputVisualizer;

  })(VisualizerBase);

  this.ThroughputVisualizer = ThroughputVisualizer;

}).call(this);