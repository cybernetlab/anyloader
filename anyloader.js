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

  var isDeferred = function(obj) {
    return (obj instanceof $.Deferred) || _.isFunction(obj.then);
  };

  return function(methods, context) {
    if (!_.isObject(methods)) methods = {};

    var load = function() {
      // get function arguments
      var args = Array.prototype.slice.call(arguments, 0);
      var result = [];

      _.each(args, function(arg) {
        if (arg == null) return; // next argument
        arg = load.parse.apply(load.context, [arg]);
        if (arg == null) return; // next argument

        if (!isDeferred(arg)) {
          if (_.isArray(arg) && _.isFunction(load['create:element'])) {
            var deferred = $.Deferred();
            $.when
              .apply(load.context, _.map(arg, load['create:element'], load.context))
              .done(function() {
                var arr = _.toArray(arguments);
                if (_.isFunction(load.create)) arr = load.create.apply(load.context, [arr]);
                deferred.resolve(arr);
              });
            result.push(deferred);
            return; // next argument;
          }

          var childFactories = _.filter(_.keys(arg), function(key) {
            return _.isFunction(load['create:' + key]);
          });
          if (childFactories.length > 0) {
            var deferred = $.Deferred();
            var childValues = _.map(childFactories, function(key) {
              return load['create:' + key].apply(load.context, [arg[key]])
            });
            $.when
              .apply(load.context, childValues)
              .done(function() {
                _.extend(arg, _.object(childFactories, _.toArray(arguments)));
                if (_.isFunction(load.create)) arg = load.create.apply(load.context, [arg]);
                deferred.resolve(arg);
              });
            result.push(deferred);
            return;
          }

          if (_.isFunction(load.create)) {
            arg = load.create.apply(load.context, [arg]);
            if (arg == null) return; // next argument
          };
        }
        result.push(arg);
      });

      if (_.isEmpty(result)) result.push(null);
      return $.when.apply(load.context, result);
    };

    load.defaults = {
      'parse:json': function(arg) {
        try {
          return $.parseJSON(arg.replace(/[\n\r\t]/g, ''));
        } catch(SyntaxError) {
          return null;
        }
      },

      'parse:html': function(arg) {
        try {
          arg = $(arg);
          var filtered = arg.filter(SELECTOR);
          if (filtered.length > 0) return filtered;
          return arg;
        } catch(SyntaxError) {
          return null;
        }
      },

      'parse:uri': function(arg) {
        var deferred = $.Deferred();
        $.ajax({ url: arg }).done(function(text, status) {
          if (status == 'success') {
            // result should be an object (in case of JSON file) or HTML
            if (_.isObject(text) || _.isString(text)) {
              var result = load.parse.apply(load.context, [text]);
              if (isDeferred(result)) {
                result.done(function(obj) { deferred.resolve(obj); });
              } else {
                deferred.resolve(result);
              }
            } else {
              deferred.reject('wrong object in ' + arg);
            }
          } else {
            deferred.reject('error while loading object from ' + arg);
          }
        }).fail(function() {
          deferred.reject('error while loading object from ' + arg);
        });
        return deferred;
      },

      'parse:jquery': function(arg) {
        var obj = {};
        var arr = [];
        arg.each(function() {
          var $this = $(this);
          var name = $this.attr('name') || $this.attr('id') || $this.data('name');
          var content = $.trim($this.html());
          (name) ? obj[name] = content : arr.push(content);
        });
        return (_.isEmpty(obj)) ? arr : obj;
      },

      parse: function(arg) {
        if (arg == null) return null; // next argument

        if (_.isString(arg)) {
          if (NON_URL.test(arg)) {
            // argument is JSON or HTML string
            arg = load['parse:json'].apply(load.context, [arg]) ||
                  load['parse:html'].apply(load.context, [arg]);
          } else {
            // argument is URI string
            arg = load['parse:uri'].apply(load.context, [arg]);
            if (isDeferred(arg)) return arg;
          }
        }

        if (arg == null) return null; // next argument

        if (arg instanceof $) {
          // argument is jQuery object
          return load['parse:jquery'].apply(load.context, [arg]);
        };

        return arg;
      }
    };

    _.extend(load, load.defaults, methods);
    load.context = context || load;

    return load;
  }
}));
