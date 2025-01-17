/* global angular:false,console:false */
(function () {
  'use strict';

  angular.module('app', ['ng', 'knalli.angular-vertxbus'])
  .config(function(vertxEventBusProvider, vertxEventBusServiceProvider) {
    vertxEventBusProvider
    .useDebug(true)
    .useUrlServer('http://localhost:8080');
    vertxEventBusServiceProvider.useDebug(true);
  })
  .run(function ($rootScope, vertxEventBus, vertxEventBusService, $interval) {
    $rootScope.sessionIsValid = false;

    $rootScope.moduleStats = {
      wrapper: {},
      service: {}
    };
    $interval(function () {
      try {
        $rootScope.moduleStats.wrapper.readyState = vertxEventBus.readyState();
        $rootScope.moduleStats.service.readyState = vertxEventBusService.readyState();
        $rootScope.moduleStats.service.getConnectionState = vertxEventBusService.getConnectionState();
        $rootScope.moduleStats.service.isEnabled = vertxEventBusService.isEnabled();
        $rootScope.moduleStats.service.isConnected = vertxEventBusService.isConnected();
      } catch (e) {}
    }, 1000);
  })
  .filter('eventBusState', function () {
    var states = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
    return function (value) {
      return states[value] || value;
    };
  })
  .controller('MyController', function($scope, vertxEventBusService) {
    var holder = {};
    $scope.timeServiceActive = false;
    $scope.registerTimeService = function () {
      holder.timeServiceDeconstructor = vertxEventBusService.on('what-time-is-it', function (data) {
        $scope.currentDateTime = new Date(data.time);
      });
      $scope.timeServiceActive = true;
    };
    $scope.deregisterTimeService = function () {
      holder.timeServiceDeconstructor();
      holder.timeServiceDeconstructor = undefined;
      $scope.timeServiceActive = false;
    };
    $scope.deregisterTimeService2x = function () {
      holder.timeServiceDeconstructor();
      holder.timeServiceDeconstructor();
      holder.timeServiceDeconstructor = undefined;
      $scope.timeServiceActive = false;
    };

    $scope.timeServiceActive = false;
    $scope.registerTimeService = function () {
      holder.timeServiceDeconstructor = vertxEventBusService.on('what-time-is-it', function (data) {
        $scope.currentDateTime = new Date(data.time);
      });
      $scope.timeServiceActive = true;
    };
    $scope.deregisterTimeService = function () {
      holder.timeServiceDeconstructor();
      holder.timeServiceDeconstructor = undefined;
      $scope.timeServiceActive = false;
    };
  });
}());
