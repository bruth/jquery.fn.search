#
# jQuery.fn.search
# (c) 2011 Byron Ruth <b@devel.io>
# License: See LICENSE file
# Version: 0.1
# Date: February 16, 2012
#
# Text highlighting code originally conceived by:
#
# jQuery.fn.highlight
# (c) 2009 Johann Burkard <jb@eaio.com>
# MIT License
#

((factory) ->
    if typeof exports is 'object'
        # Node/CommonJS
        factory(require('jquery'))
    else if typeof define is 'function' and define.amd
        # AMD
        define ['jquery'], factory
    else
        # Expect jQuery to be in the global namespace
        factory(jQuery)
)(($) ->

    CACHE_KEY = 'jquery.fn.search'

    toString = Object::toString

    # Consistent names..
    isArray = $.isArray
    isFunction = $.isFunction
    isObject = (obj) -> obj is Object(obj)
    isRegExp = (obj) -> toString.call(obj) is '[object RegExp]'
    isString = (obj) -> toString.call(obj) is '[object String]'

    Filters =
        text: (pattern, regexp) ->
            $(this).text().search(regexp) >= 0

    Effects =
        highlight:
            on: (hits, misses, pattern, regexp, options) ->
                if pattern
                    context = hits
                    if options.filterOn
                        context = hits.find options.filterOn
                    if isArray(pattern)
                        for p in pattern
                            highlightText context, p, options.highlightClass
                    else
                        highlightText context, pattern, options.highlightClass

            off: (hits, misses, pattern, regexp, options) ->
                if pattern
                    context = hits
                    if options.filterOn
                        context = hits.find options.filterOn
                    removeHighlight context, options.highlightClass

        fade:
            on: (hits, misses, pattern, regexp, options) ->
                misses.css opacity: options.fadeOpacity
                # Ensure hiding the misses don't result in shadowing any hits
                rootElement = @parent()
                hits.each (index) ->
                    $(@).parentsUntil(rootElement).css opacity: 1

            off: ->
                @css opacity: 1

        hide:
            on: (hits, misses) ->
                misses.hide()
                # Ensure hiding the misses don't result in shadowing any hits
                rootElement = @parent()
                hits.each (index) ->
                    $(@).parentsUntil(rootElement).show()

            off: ->
                @show()

    # Performs the actual work of slice up text nodes and replacing
    # them with span elements
    innerHighlight = (node, pattern, regexp, className) ->
        skip = 0
        if node.nodeType is 3
            pos = node.data.search(regexp)
            if pos >= 0 and node.data.length > 0
                match = node.data.match(regexp)
                spanNode = document.createElement('span')
                spanNode.className = className
                middleBit = node.splitText(pos)
                endBit = middleBit.splitText(match[0].length)
                middleClone = middleBit.cloneNode(true)
                spanNode.appendChild middleClone
                middleBit.parentNode.replaceChild spanNode, middleBit
                skip = 1
        else if node.nodeType is 1 and node.childNodes and not /(script|style)/i.test(node.tagName)
            i = 0

            while i < node.childNodes.length
                i += innerHighlight(node.childNodes[i], pattern, regexp, className)
                i++
        return skip


    # For highlight effect..
    highlightText = (obj, pattern, className) ->
        regexp = new RegExp(pattern, 'i')
        obj.each ->
            innerHighlight @, pattern, regexp, className


    removeHighlight = (obj, className) ->
        obj.find("span.#{className}").each(->
            parent = @parentNode
            parent.replaceChild @firstChild, @
            parent.normalize()
        ).end()


    defaultOptions =
        filter: 'text'
        effect: ['fade', 'highlight']
        fadeOpacity: 0.3
        highlightClass: 'highlight'
        filterOn: null


    setupOptions = (obj, options={}) ->
        options = $.extend {}, defaultOptions, options

        filter = options.filter
        effect = options.effect

        # Built-in filter
        if isString(filter) and Filters[filter]
            filter = Filters[filter]
        # Custom object with `on` and `off` methods
        else if not isFunction(filter)
            throw new TypeError("#{filter} is an unsupported filter")

        # Built-in effect
        if isString(effect = options.effect) and Effects[effect]
            effect = Effects[effect]
        # Array of effects
        else if isArray(effect)
            effects = []
            for e in effect
                if isString(e) and Effects[e]
                    effects.push Effects[e]
                else if not isObject(e)
                    throw new TypeError("#{e} is an unsupported effect")
                else
                    effects.push(e)

            effect =
                on: (args...) ->
                    e.on.apply(@, args) for e in effects
                    return

                off: (args...) ->
                    e.off.apply(@, args) for e in effects
                    return
        # Custom object with `on` and `off` methods
        else if not isObject(effect)
            throw new TypeError("#{effect} is an unsupported effect")

        # Cache the current state
        obj.data CACHE_KEY,
            hits: $()
            misses: $()
            options: options
            filter: filter
            effect: effect


    performSearch = (obj, pattern, regexp, cache) ->
        hits = cache.hits
        misses = cache.misses
        options = cache.options

        # Turn off previous effects
        if cache.effect and cache.prevPattern
            cache.effect.off.call obj, hits, misses, cache.prevPattern, cache.prevRegexp, options

        # Now that the effect has been turned off, update cache of the, now,
        # previous pattern
        cache.prevPattern = pattern
        cache.prevRegexp = regexp

        # Do not attempt to match nothing if nothing
        if pattern
            # Lightly wrap the filter, so pattern is available in the filter
            # function
            hits = obj.filter (idx) ->
                context = @
                if options.filterOn
                    context = $(context).find options.filterOn
                cache.filter.call context, pattern, regexp, idx

            misses = obj.not hits
            # Turn on effects for new results
            if cache.effect
                cache.effect.on.call obj, hits, misses, pattern, regexp, options
        else
            hits = $()
            misses = $()

        # Update cache with new hits and misses
        cache.hits = hits
        cache.misses = misses


    # The extension
    $.fn.search = (pattern, regexp) ->
        if isString(pattern) or isArray(pattern)
            # Ensure the options has been setup
            if not (cache = @data CACHE_KEY) then setupOptions @
            if not regexp
                regexp = new RegExp((if isString(pattern) then pattern else pattern.join('|')), 'i')
            performSearch @, pattern, regexp, cache
        else if pattern and not isObject(pattern)
            throw new TypeError('Options must be null or an object')
        else
            setupOptions @, pattern
        return @

)
