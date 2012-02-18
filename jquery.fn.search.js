var __slice = Array.prototype.slice;

(function(factory) {
  if (typeof exports === 'object') {
    return factory(require('jquery'));
  } else if (typeof define === 'function' && define.amd) {
    return define(['jquery'], factory);
  } else {
    return factory(jQuery);
  }
})(function($) {
  var CACHE_KEY, Effects, Filters, defaultOptions, highlightText, innerHighlight, isArray, isFunction, isObject, isRegExp, isString, performSearch, removeHighlight, setupOptions, toString;
  CACHE_KEY = 'jquery.fn.search';
  toString = Object.prototype.toString;
  isArray = $.isArray;
  isFunction = $.isFunction;
  isObject = function(obj) {
    return obj === Object(obj);
  };
  isRegExp = function(obj) {
    return toString.call(obj) === '[object RegExp]';
  };
  isString = function(obj) {
    return toString.call(obj) === '[object String]';
  };
  Filters = {
    text: function(pattern, regexp) {
      return $(this).text().search(regexp) >= 0;
    }
  };
  Effects = {
    highlight: {
      on: function(hits, misses, pattern, regexp, options) {
        var context, p, _i, _len, _results;
        if (pattern) {
          context = hits;
          if (options.filterOn) context = hits.find(options.filterOn);
          if (isArray(pattern)) {
            _results = [];
            for (_i = 0, _len = pattern.length; _i < _len; _i++) {
              p = pattern[_i];
              _results.push(highlightText(context, p, options.highlightClass));
            }
            return _results;
          } else {
            return highlightText(context, pattern, options.highlightClass);
          }
        }
      },
      off: function(hits, misses, pattern, regexp, options) {
        var context;
        if (pattern) {
          context = hits;
          if (options.filterOn) context = hits.find(options.filterOn);
          return removeHighlight(context, options.highlightClass);
        }
      }
    },
    fade: {
      on: function(hits, misses, pattern, regexp, options) {
        var rootElement;
        misses.css({
          opacity: options.fadeOpacity
        });
        rootElement = this.parent();
        return hits.each(function(index) {
          return $(this).parentsUntil(rootElement).css({
            opacity: 1
          });
        });
      },
      off: function() {
        return this.css({
          opacity: 1
        });
      }
    },
    hide: {
      on: function(hits, misses) {
        var rootElement;
        misses.hide();
        rootElement = this.parent();
        return hits.each(function(index) {
          return $(this).parentsUntil(rootElement).show();
        });
      },
      off: function() {
        return this.show();
      }
    }
  };
  innerHighlight = function(node, pattern, regexp, className) {
    var endBit, i, match, middleBit, middleClone, pos, skip, spanNode;
    skip = 0;
    if (node.nodeType === 3) {
      pos = node.data.search(regexp);
      if (pos >= 0 && node.data.length > 0) {
        match = node.data.match(regexp);
        spanNode = document.createElement('span');
        spanNode.className = className;
        middleBit = node.splitText(pos);
        endBit = middleBit.splitText(match[0].length);
        middleClone = middleBit.cloneNode(true);
        spanNode.appendChild(middleClone);
        middleBit.parentNode.replaceChild(spanNode, middleBit);
        skip = 1;
      }
    } else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
      i = 0;
      while (i < node.childNodes.length) {
        i += innerHighlight(node.childNodes[i], pattern, regexp, className);
        i++;
      }
    }
    return skip;
  };
  highlightText = function(obj, pattern, className) {
    var regexp;
    regexp = new RegExp(pattern, 'i');
    return obj.each(function() {
      return innerHighlight(this, pattern, regexp, className);
    });
  };
  removeHighlight = function(obj, className) {
    return obj.find("span." + className).each(function() {
      var parent;
      parent = this.parentNode;
      parent.replaceChild(this.firstChild, this);
      return parent.normalize();
    }).end();
  };
  defaultOptions = {
    filter: 'text',
    effect: ['fade', 'highlight'],
    fadeOpacity: 0.3,
    highlightClass: 'highlight',
    filterOn: null
  };
  setupOptions = function(obj, options) {
    var e, effect, effects, filter, _i, _len;
    if (options == null) options = {};
    options = $.extend({}, defaultOptions, options);
    filter = options.filter;
    effect = options.effect;
    if (isString(filter) && Filters[filter]) {
      filter = Filters[filter];
    } else if (!isFunction(filter)) {
      throw new TypeError("" + filter + " is an unsupported filter");
    }
    if (isString(effect = options.effect) && Effects[effect]) {
      effect = Effects[effect];
    } else if (isArray(effect)) {
      effects = [];
      for (_i = 0, _len = effect.length; _i < _len; _i++) {
        e = effect[_i];
        if (isString(e) && Effects[e]) {
          effects.push(Effects[e]);
        } else if (!isObject(e)) {
          throw new TypeError("" + e + " is an unsupported effect");
        } else {
          effects.push(e);
        }
      }
      effect = {
        on: function() {
          var args, e, _j, _len2;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          for (_j = 0, _len2 = effects.length; _j < _len2; _j++) {
            e = effects[_j];
            e.on.apply(this, args);
          }
        },
        off: function() {
          var args, e, _j, _len2;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          for (_j = 0, _len2 = effects.length; _j < _len2; _j++) {
            e = effects[_j];
            e.off.apply(this, args);
          }
        }
      };
    } else if (!isObject(effect)) {
      throw new TypeError("" + effect + " is an unsupported effect");
    }
    return obj.data(CACHE_KEY, {
      hits: $(),
      misses: $(),
      options: options,
      filter: filter,
      effect: effect
    });
  };
  performSearch = function(obj, pattern, regexp, cache) {
    var hits, misses, options;
    hits = cache.hits;
    misses = cache.misses;
    options = cache.options;
    if (cache.effect && cache.prevPattern) {
      cache.effect.off.call(obj, hits, misses, cache.prevPattern, cache.prevRegexp, options);
    }
    cache.prevPattern = pattern;
    cache.prevRegexp = regexp;
    if (pattern) {
      hits = obj.filter(function(idx) {
        var context;
        context = this;
        if (options.filterOn) context = $(context).find(options.filterOn);
        return cache.filter.call(context, pattern, regexp, idx);
      });
      misses = obj.not(hits);
      if (cache.effect) {
        cache.effect.on.call(obj, hits, misses, pattern, regexp, options);
      }
    } else {
      hits = $();
      misses = $();
    }
    cache.hits = hits;
    return cache.misses = misses;
  };
  return $.fn.search = function(pattern, regexp) {
    var cache;
    if (isString(pattern) || isArray(pattern)) {
      if (!(cache = this.data(CACHE_KEY))) setupOptions(this);
      if (!regexp) {
        regexp = new RegExp((isString(pattern) ? pattern : pattern.join('|')), 'i');
      }
      performSearch(this, pattern, regexp, cache);
    } else if (pattern && !isObject(pattern)) {
      throw new TypeError('Options must be null or an object');
    } else {
      setupOptions(this, pattern);
    }
    return this;
  };
});
