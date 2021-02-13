

(function($) {
    'use strict';
    
    $('.gallery__masonry__activation').imagesLoaded(function () {
        // filter items on button click
        $('.gallery__menu').on('click', 'button', function () {
            var filterValue = $(this).attr('data-filter');
            $grid.isotope({
              filter: filterValue
            });
        });

        // change is-checked class on buttons
        $('.gallery__menu button').on('click', function () {
            $('.gallery__menu button').removeClass('is-checked');
            $(this).addClass('is-checked');
            var selector = $(this).attr('data-filter');
            remclass();
            $containerpage.isotope({
              filter: selector
            });
            return false;
        });

        
        function remclass() {
          // $('#rm').removeClass('hidden');
          $("[id='rm']").removeClass('hidden');
      };
        // init Isotope
        var $grid = $('.masonry__wrap').isotope({
            itemSelector: '.gallery__item',
            percentPosition: true,
            transitionDuration: '0.7s',
            masonry: {
              // use outer width of grid-sizer for columnWidth
              columnWidth: '.gallery__item',
            }
        });
    });

})(jQuery);

