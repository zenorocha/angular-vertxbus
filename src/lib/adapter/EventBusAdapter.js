import {moduleName} from '../../config.js';

import BaseAdapter from './BaseAdapter';
import ConnectionConfigHolder from './../support/ConnectionConfigHolder';

/**
 * @ngdoc service
 * @module vertx
 * @name EventBus
 *
 * @description
 * This is the interface of `EventBus`. It is not included.
 */

/**
 * @ngdoc method
 * @module vertx
 * @methodOf EventBus
 * @name .#close
 */

/**
 * @ngdoc method
 * @module vertx
 * @methodOf EventBus
 * @name .#send
 *
 * @param {string} address target address
 * @param {object} message payload message
 * @param {function=} replyHandler optional callback
 */

/**
 * @ngdoc method
 * @module vertx
 * @methodOf EventBus
 * @name .#publish
 *
 * @param {string} address target address
 * @param {object} message payload message
 */

/**
 * @ngdoc method
 * @module vertx
 * @methodOf EventBus
 * @name .#registerHandler
 *
 * @param {string} address target address
 * @param {function} handler callback handler
 */

/**
 * @ngdoc method
 * @module vertx
 * @methodOf EventBus
 * @name .#unregisterHandler
 *
 * @param {string} address target address
 * @param {function} handler callback handler to be removed
 */

/**
 * @ngdoc method
 * @module vertx
 * @propertyOf EventBus
 * @name .#onopen
 *
 * Defines the callback called on opening the connection.
 */

/**
 * @ngdoc method
 * @module vertx
 * @propertyOf EventBus
 * @name .#onclose
 *
 * Defines the callback called on closing the connection.
 */

/**
 * @ngdoc method
 * @module vertx
 * @propertyOf EventBus
 * @name .#onerror
 *
 * Defines the callback called on any error.
 */

export default class EventBusAdapter extends BaseAdapter {

  constructor(EventBus, $timeout, $log, $q, {
    enabled,
    debugEnabled,
    initialConnectEnabled,
    connectionConfig,
    reconnectEnabled,
    sockjsReconnectInterval,
    sockjsOptions
    }) {
    super($q);
    // actual EventBus type
    this.EventBus = EventBus;
    this.$timeout = $timeout;
    this.$log = $log;
    this.$q = $q;
    this.options = {
      enabled,
      debugEnabled,
      initialConnectEnabled,
      connectionConfig,
      reconnectEnabled,
      sockjsReconnectInterval,
      sockjsOptions
    };
    this.disconnectTimeoutEnabled = true;
    if (initialConnectEnabled) {
      // asap create connection
      this.connect();
    }
  }

  /**
   * @ngdoc method
   * @module knalli.angular-vertxbus
   * @methodOf knalli.angular-vertxbus.vertxEventBus
   * @name .#configureConnect
   *
   * @description
   * Reconfigure the connection details.
   *
   * @param {string} urlServer see {@link knalli.angular-vertxbus.vertxEventBusProvider#methods_useUrlServer vertxEventBusProvider.useUrlServer()}
   * @param {string} [urlPath=/eventbus] see {@link knalli.angular-vertxbus.vertxEventBusProvider#methods_useUrlPath vertxEventBusProvider.useUrlPath()}
   */
  configureConnection(urlServer, urlPath = '/eventbus') {
    this.options.connectionConfig = new ConnectionConfigHolder({urlServer, urlPath});
    return this;
  }

  connect() {
    // connect promise
    let deferred = this.$q.defer();
    // currently valid url
    let url = `${this.options.connectionConfig.urlServer}${this.options.connectionConfig.urlPath}`;
    if (this.options.debugEnabled) {
      this.$log.debug(`[Vert.x EB Stub] Enabled: connecting '${url}'`);
    }
    // Because we have rebuild an EventBus object (because it have to rebuild a SockJS object)
    // we must wrap the object. Therefore, we have to mimic the behavior of onopen and onclose each time.
    this.instance = new this.EventBus(url, this.options.sockjsOptions);
    this.instance.onopen = () => {
      if (this.options.debugEnabled) {
        this.$log.debug('[Vert.x EB Stub] Connected');
      }
      if (angular.isFunction(this.onopen)) {
        this.onopen();
      }
      deferred.resolve();
    };
    // instance onClose handler
    this.instance.onclose = () => {
      if (this.options.debugEnabled) {
        this.$log.debug(`[Vert.x EB Stub] Reconnect in ${this.options.sockjsReconnectInterval}ms`);
      }
      if (angular.isFunction(this.onclose)) {
        this.onclose();
      }
      this.instance = undefined;

      if (!this.disconnectTimeoutEnabled) {
        // reconnect required asap
        if (this.options.debugEnabled) {
          this.$log.debug('[Vert.x EB Stub] Reconnect immediately');
        }
        this.disconnectTimeoutEnabled = true;
        this.connect();
      } else if (this.options.reconnectEnabled) {
        // automatic reconnect after timeout
        if (this.options.debugEnabled) {
          this.$log.debug(`[Vert.x EB Stub] Reconnect in ${this.options.sockjsReconnectInterval}ms`);
        }
        this.$timeout((() => this.connect()), this.options.sockjsReconnectInterval);
      }
    };
    // instance onError handler
    this.instance.onerror = (message) => {
      if (angular.isFunction(this.onerror)) {
        this.onerror(message);
      }
    };
    return deferred.promise;
  }

  /**
   * @ngdoc method
   * @module knalli.angular-vertxbus
   * @methodOf knalli.angular-vertxbus.vertxEventBus
   * @name .#reconnect
   *
   * @description
   * Reconnects the underlying connection.
   *
   * Unless a connection is open, it will connect using a new one.
   *
   * If a connection is already open, it will close this one and opens a new one. If `immediately` is `true`, the
   * default timeout for reconnect will be skipped.
   *
   * @param {boolean} [immediately=false] optionally enforce a reconnect asap instead of using the timeout
   */
  reconnect(immediately = false) {
    if (this.instance && this.instance.state === this.EventBus.OPEN) {
      if (immediately) {
        this.disconnectTimeoutEnabled = false;
      }
      this.instance.close();
    } else {
      this.connect();
    }
  }

  /**
   * @ngdoc method
   * @module knalli.angular-vertxbus
   * @methodOf knalli.angular-vertxbus.vertxEventBus
   * @name .#close
   *
   * @description
   * Closes the underlying connection.
   *
   * Note: If automatic reconnection is active, a new connection will be established after the {@link knalli.angular-vertxbus.vertxEventBusProvider#methods_useReconnect reconnect timeout}.
   *
   * See also:
   * - {@link EventBus#methods_close EventBus.close()}
   */
  close() {
    if (this.instance) {
      this.instance.close();
    }
  }

  /**
   * @ngdoc method
   * @module knalli.angular-vertxbus
   * @methodOf knalli.angular-vertxbus.vertxEventBus
   * @name .#send
   *
   * @description
   * Sends a message
   *
   * See also:
   * - {@link EventBus#methods_send EventBus.send()}
   *
   * @param {string} address target address
   * @param {object} message payload message
   * @param {function=} replyHandler optional callback
   * @param {function=} failureHandler optional callback (since Vert.x 3.0.0)
   */
  send(address, message, replyHandler, failureHandler) {
    if (this.instance) {
      this.instance.send(address, message, replyHandler, failureHandler);
    }
  }

  /**
   * @ngdoc method
   * @module knalli.angular-vertxbus
   * @methodOf knalli.angular-vertxbus.vertxEventBus
   * @name .#publish
   *
   * @description
   * Publishes a message
   *
   * See also:
   * - {@link EventBus#methods_publish EventBus.publish()}
   *
   * @param {string} address target address
   * @param {object} message payload message
   */
  publish(address, message) {
    if (this.instance) {
      this.instance.publish(address, message);
    }
  }

  /**
   * @ngdoc method
   * @module knalli.angular-vertxbus
   * @methodOf knalli.angular-vertxbus.vertxEventBus
   * @name .#registerHandler
   *
   * @description
   * Registers a listener
   *
   * See also:
   * - {@link EventBus#methods_registerHandler EventBus.registerHandler()}
   *
   * @param {string} address target address
   * @param {function} handler callback handler
   */
  registerHandler(address, handler) {
    if (this.instance) {
      this.instance.registerHandler(address, handler);
      // and return the deregister callback
      let deconstructor = () => {
        this.unregisterHandler(address, handler);
      };
      deconstructor.displayName = `${moduleName}.wrapper.eventbus.registerHandler.deconstructor`;
      return deconstructor;
    }
  }

  /**
   * @ngdoc method
   * @module knalli.angular-vertxbus
   * @methodOf knalli.angular-vertxbus.vertxEventBus
   * @name .#unregisterHandler
   *
   * @description
   * Removes a registered a listener
   *
   * See also:
   * - {@link EventBus#methods_unregisterHandler EventBus.unregisterHandler()}
   *
   * @param {string} address target address
   * @param {function} handler callback handler to be removed
   */
  unregisterHandler(address, handler) {
    if (this.instance && this.instance.state === this.EventBus.OPEN) {
      this.instance.unregisterHandler(address, handler);
    }
  }

  /**
   * @ngdoc method
   * @module knalli.angular-vertxbus
   * @methodOf knalli.angular-vertxbus.vertxEventBus
   * @name .#readyState
   *
   * @description
   * Returns the current connection state
   *
   * @returns {number} value of vertx-eventbus connection states
   */
  readyState() {
    if (this.instance) {
      return this.instance.state;
    } else {
      return this.EventBus.CLOSED;
    }
  }

  get state() {
    return this.readyState();
  }

  // private
  getOptions() {
    // clone options
    return angular.extend({}, this.options);
  }

}
