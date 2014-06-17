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
  var NON_URI = /[{}<>\[\]]/;
  var URI = /^(?:(https?:\/\/.*)|(?:url\(\s*'([^']*)'\s*\))|(?:url\(\s*"([^"]*)"\s*\))|(?:url\(\s*([^)]*)\s*\)))/;

  var isDeferred = function(obj) {
    return (obj instanceof $.Deferred) || _.isFunction(obj.then);
  };

  return function(options, context) {
    if (!_.isObject(options)) options = {};

    var load = function() {
      var result = [];

      _.each(_.toArray(arguments), function(arg) {
        if (arg == null) return; // next argument
        arg = load.parse.apply(load.context, [arg]);
        if (arg == null) return; // next argument

        if (!isDeferred(arg)) {
          // if parsed argument is array and we have create:element callback
          if (_.isArray(arg) && _.isFunction(load['create:element'])) {
            // create master deferred for all array elements
            var deferred = $.Deferred();
            $.when
              .apply(load.context, _.map(arg, load['create:element'], load.context))
              .done(function() {
                // get all processed array elements in arr
                var arr = _.toArray(arguments);
                // if we have create callback, call it for entire result array
                if (_.isFunction(load.create)) arr = load.create.apply(load.context, [arr]);
                // and resolve master deferred
                deferred.resolve(arr);
              });
            result.push(deferred);
            return; // next argument;
          }

          // if parsed argument is plain object
          if (_.isObject(arg)) {
            // get a list of object keys for which we have appropriate callback
            var hasCallback = _.filter(_.keys(arg), function(key) {
              return _.isFunction(load['create:' + key]);
            });
            if (hasCallback.length > 0) {
              // if we have at least one specific callback - create master deferred
              var deferred = $.Deferred();
              // parse all values with callbacks
              var values = _.map(hasCallback, function(key) {
                return load['create:' + key].apply(load.context, [arg[key]])
              });
              $.when
                .apply(load.context, values)
                .done(function() {
                  // get all processed keys in result object
                  _.extend(arg, _.object(hasCallback, _.toArray(arguments)));
                  // if we have create callback, call it for entire result object
                  if (_.isFunction(load.create)) arg = load.create.apply(load.context, [arg]);
                  // and resolve master deferred
                  deferred.resolve(arg);
                });
              result.push(deferred);
              return;
            }
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

    load.parsers = {
      'parse:string': function(arg) {
        return _.isString(arg) ? arg : null;
      },

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
        var uri = arg.match(URI);
        if (uri == null) return null;
        uri = uri[1] || uri[2] || uri[3] || uri[4]
        $.ajax({ url: uri }).done(function(text, status) {
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
              // deferred.reject('wrong object in ' + arg);
              deferred.resolve(arg);
            }
          } else {
            // deferred.reject('error while loading object from ' + arg);
            deferred.resolve(arg);
          }
        }).fail(function() {
          // deferred.reject('error while loading object from ' + arg);
          deferred.resolve(arg);
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

      'parse:array': function(arg) { return arg; },

      'parse:object': function(arg) { return arg; },

      parse: function(arg) {
        if (arg == null) return null; // next argument
        if (_.isString(arg)) {
          if (NON_URI.test(arg)) {
            // argument is JSON or HTML string
            arg = load['parse:json'].apply(load.context, [arg]) ||
                  load['parse:html'].apply(load.context, [arg]);
          } else {
            // argument is URI string
            arg = load['parse:uri'].apply(load.context, [arg]) ||
                  load['parse:string'].apply(load.context, [arg]);
            if (isDeferred(arg)) return arg;
          }
        }

        if (arg == null) return null; // next argument
        if (arg instanceof $) arg = load['parse:jquery'].apply(load.context, [arg]);

        if (arg == null) return null; // next argument
        if (_.isArray(arg)) arg = load['parse:array'].apply(load.context, [arg]);

        if (_.isObject(arg)) arg = load['parse:object'].apply(load.context, [arg]);

        return arg;
      }
    };

    _.extend(load, load.parsers, options);
    load.context = context || load;

    return load;
  }
}));
