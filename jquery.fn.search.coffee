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

    highlightText = (obj, pattern, className='highlight') ->
        innerHighlight = (node, pattern) ->
            skip = 0
            if node.nodeType is 3
                pos = node.data.search(regex)
                if pos >= 0 and node.data.length > 0
                    match = node.data.match(regex)
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
                    i += innerHighlight(node.childNodes[i], pattern)
                    i++
            return skip

        regex = (if typeof pattern is 'string' then new RegExp(pattern, 'i') else pattern)

        obj.each ->
            innerHighlight @, pattern


    removeHighlight = (obj, className) ->
        obj.find("span.#{className}").each(->
            parent = @parentNode
            parent.replaceChild @firstChild, @
            parent.normalize()
        ).end()


    # Default effects
    Effects =
        fade:
            on: (hits, misses, pattern) ->
                misses.css opacity: 0.3

            off: (hits, misses) ->
                @css opacity: 1


        hide:
            on: (hits, misses, pattern) ->
                misses.hide()

            off: (hits, misses) ->
                @show()

    Commands =
        effect: (state, effect) ->
            $.extend Effects, effect

        enable: (state) ->
            if not state.enabled
                highlight state.hits
                state.enabled = true

        disable: (state) ->
            if state.enabled
                removeHighlight state.hits
                state.enabled = false

        search: (state, pattern) ->
            options = state.options

            if typeof (filter = options.filter) is 'string'
                filter = Filters[filter]


            # No effects by default..
            effect = null
            highlight = options.highlight
            highlightClass = options.highlightClass

            # Single effect
            if typeof (key = options.effect) is 'string'
                effect = Effects[key]

            # Array of effects
            else if typeof $.isArray(key)
                effect =
                    on: (args...) ->
                        for e in key
                            Effects[e].on args...
                        return

                    off: (args...) ->
                        for e in key
                            Effects[e].off args...
                        return

            # Custom object with `on` and `off` methods
            else if typeof key is 'object'
                effect = key

            # Turn off previous effects
            if effect then effect.off.call @, state.hits, state.misses

            # Remove highlighting is enabled
            if highlight
                context = state.hits
                if options.matchOn
                    context = state.hits.find options.matchOn
                removeHighlight context, highlightClass

            # Do attempt to match nothing..
            if pattern
                # Lightly wrap the filter, so pattern is available in the filter
                # function
                state.hits = @filter (idx) ->
                    context = @
                    if options.matchOn
                        context = $(@).find options.matchOn
                    filter.call context, pattern, idx

                state.misses = @not state.hits

                # Add highlighting if enabled
                if highlight
                    context = state.hits
                    if options.matchOn
                        context = state.hits.find options.matchOn
                    highlightText context, pattern, highlightClass
            else
                state.hits = $()
                state.misses = $()

            # Turn on effects for new results
            if effect then effect.on.call @, state.hits, state.misses


    Filters =
        text: (pattern) ->
            $(this).text().search(new RegExp(pattern, 'ig')) >= 0


    defaultOptions =
        effect: 'fade' # fade, hide, [], <object>
        fadeTo: 0.3
        highlight: true
        highlightClass: 'highlight'
        filter: 'text' # text, function
        matchOn: null

    DATA_KEY = 'jquery.fn.search'

    # The selected group represents the full sets of elements to search
    $.fn.search = (definedOptions, args...) ->
        # Nothing to do..
        if not @length then return @

        # Ensure the search has been setup
        if not (state = @data DATA_KEY) and definedOptions and not $.isPlainObject(definedOptions)
            throw new Error('Commands cannot be used until search has been setup')

        # Check for a command
        if typeof(definedOptions) is 'string'
            if (command = Commands[definedOptions])
                command.call @, state, args...
            return @
       
        options = $.extend {}, defaultOptions, definedOptions

        # If this already has state, disable it
        if state then Commands.disable @, state
        @data DATA_KEY,
            options: options
            hits: $()
            misses: $()
)
