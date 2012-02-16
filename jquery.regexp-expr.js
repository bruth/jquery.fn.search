(function($) {

    $.expr[':'].regex = function(elem, index, meta, stack) {
        return $(elem).text().search(new RegExp(meta[3], 'ig')) >= 0;
    };

})(jQuery);
