(function(root, factory) {

  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery', 'underscore'], factory);
  } else if (typeof exports !== 'undefined') {
    // Node.js or CommonJS
    factory(require('jquery'), require('underscore'));
  } else {
    // browser
    root.LoaderFactory = factory(root.jQuery || root.Zepto || root.ender || root.$, root._);
  }

}(this, function($, _) {
  'use strict';

  var SELECTOR = '[name],[id],[data-name]';
  var NON_URL = /[{}<>\[\]]/;

  return function(options) {
    if (!_.isObject(options)) options = {};
    if (_.has(options, 'create') && !_.isFunction(options.create)) {
      throw new Error('create callback should be a function');
    }
    if (_.has(options, 'parse') && !_.isFunction(options.parse)) {
      throw new Error('parse callback should be a function');
    }

    var load = function() {
      // get function arguments
      var args = Array.prototype.slice.call(arguments, 0);
      var result = [];

      _.each(args, function(arg) {
        if (arg == null) return; // next argument

        if (_.isString(arg)) {
          if (NON_URL.test(arg)) {
            // argument is JSON or HTML string
            try {
              arg = $.parseJSON(arg.replace(/[\n\r\t]/g, ''));
            } catch(SyntaxError) {
              if (options.parse) {
                arg = options.parse(arg);
              } else {
                try {
                  arg = $(arg);
                  var filtered = arg.filter(SELECTOR);
                  if (filtered.length > 0) arg = filtered;
                } catch(SyntaxError) {
                  arg = null;
                }
              }
            }
          } else {
            // argument is URI string
            var deferred = $.Deferred();
            $.ajax({ url: arg }).done(function(text, status) {
              if (status == 'success') {
                // result should be an object (in case of JSON file) or HTML
                if (_.isObject(text) || _.isString(text) && NON_URL.test(text)) {
                  load(text).done(function(obj) { deferred.resolve(obj); });
                } else {
                  deferred.reject('wrong object in ' + arg);
                }
              } else {
                deferred.reject('error while loading object from ' + arg);
              }
            }).fail(function() {
              deferred.reject('error while loading object from ' + arg);
            });
            result.push(deferred);
            return; // next argument
          }
        };

        if (arg instanceof $) {
          // argument is jQuery object
          var obj = {};
          var arr = [];
          arg.each(function() {
            var $this = $(this);
            var name = $this.attr('name') || $this.attr('id') || $this.data('name');
            var content = $.trim($this.html());
            (name) ? obj[name] = content : arr.push(content);
          });
          arg = (_.isEmpty(obj)) ? arr : obj;
        };

        if (options.create) {
          arg = options.create(arg);
          if (arg == null) return; // next argument
        };

        result.push(arg);
      });

      if (_.isEmpty(result)) result.push(null);
      return $.when.apply(this, result);
    };

    return load;
  }
}));
