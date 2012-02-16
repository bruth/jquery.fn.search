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
  var Commands, DATA_KEY, Effects, Filters, defaultOptions, highlightText, removeHighlight;
  highlightText = function(obj, pattern, className) {
    var innerHighlight, regex;
    if (className == null) className = 'highlight';
    innerHighlight = function(node, pattern) {
      var endBit, i, match, middleBit, middleClone, pos, skip, spanNode;
      skip = 0;
      if (node.nodeType === 3) {
        pos = node.data.search(regex);
        if (pos >= 0 && node.data.length > 0) {
          match = node.data.match(regex);
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
          i += innerHighlight(node.childNodes[i], pattern);
          i++;
        }
      }
      return skip;
    };
    regex = (typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern);
    return obj.each(function() {
      return innerHighlight(this, pattern);
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
  Effects = {
    fade: {
      on: function(hits, misses, pattern) {
        return misses.css({
          opacity: 0.3
        });
      },
      off: function(hits, misses) {
        return this.css({
          opacity: 1
        });
      }
    },
    hide: {
      on: function(hits, misses, pattern) {
        return misses.hide();
      },
      off: function(hits, misses) {
        return this.show();
      }
    }
  };
  Commands = {
    effect: function(state, effect) {
      return $.extend(Effects, effect);
    },
    enable: function(state) {
      if (!state.enabled) {
        highlight(state.hits);
        return state.enabled = true;
      }
    },
    disable: function(state) {
      if (state.enabled) {
        removeHighlight(state.hits);
        return state.enabled = false;
      }
    },
    search: function(state, pattern) {
      var context, effect, filter, highlight, highlightClass, key, options;
      options = state.options;
      if (typeof (filter = options.filter) === 'string') filter = Filters[filter];
      effect = null;
      highlight = options.highlight;
      highlightClass = options.highlightClass;
      if (typeof (key = options.effect) === 'string') {
        effect = Effects[key];
      } else if (typeof $.isArray(key)) {
        effect = {
          on: function() {
            var args, e, _i, _len, _ref;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            for (_i = 0, _len = key.length; _i < _len; _i++) {
              e = key[_i];
              (_ref = Effects[e]).on.apply(_ref, args);
            }
          },
          off: function() {
            var args, e, _i, _len, _ref;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            for (_i = 0, _len = key.length; _i < _len; _i++) {
              e = key[_i];
              (_ref = Effects[e]).off.apply(_ref, args);
            }
          }
        };
      } else if (typeof key === 'object') {
        effect = key;
      }
      if (effect) effect.off.call(this, state.hits, state.misses);
      if (highlight) {
        context = state.hits;
        if (options.matchOn) context = state.hits.find(options.matchOn);
        removeHighlight(context, highlightClass);
      }
      if (pattern) {
        state.hits = this.filter(function(idx) {
          context = this;
          if (options.matchOn) context = $(this).find(options.matchOn);
          return filter.call(context, pattern, idx);
        });
        state.misses = this.not(state.hits);
        if (highlight) {
          context = state.hits;
          if (options.matchOn) context = state.hits.find(options.matchOn);
          highlightText(context, pattern, highlightClass);
        }
      } else {
        state.hits = $();
        state.misses = $();
      }
      if (effect) return effect.on.call(this, state.hits, state.misses);
    }
  };
  Filters = {
    text: function(pattern) {
      return $(this).text().search(new RegExp(pattern, 'ig')) >= 0;
    }
  };
  defaultOptions = {
    effect: 'fade',
    fadeTo: 0.3,
    highlight: true,
    highlightClass: 'highlight',
    filter: 'text',
    matchOn: null
  };
  DATA_KEY = 'jquery.fn.search';
  return $.fn.search = function() {
    var args, command, definedOptions, options, state;
    definedOptions = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (!this.length) return this;
    if (!(state = this.data(DATA_KEY)) && definedOptions && !$.isPlainObject(definedOptions)) {
      throw new Error('Commands cannot be used until search has been setup');
    }
    if (typeof definedOptions === 'string') {
      if ((command = Commands[definedOptions])) {
        command.call.apply(command, [this, state].concat(__slice.call(args)));
      }
      return this;
    }
    options = $.extend({}, defaultOptions, definedOptions);
    if (state) Commands.disable(this, state);
    return this.data(DATA_KEY, {
      options: options,
      hits: $(),
      misses: $()
    });
  };
});
