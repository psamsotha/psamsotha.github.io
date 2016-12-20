'use strict';

(function (doc) {
  $(doc).foundation();

  /**
   * Menu toggle on small screens.
   */
  $('.topbar-nav-label').on('click', function (e) {
    e.preventDefault();
    $('.topbar-nav').toggleClass('collapse');
    $(this).toggleClass('topbar-nav-open');
  });

  /**
   * Set active nav item
   */
   var page = $('.site-header').attr('data-page');
   $('.topbar-nav-item').each(function (index, el) {
     var el = $(el);
     if (el.attr('title') === page) {
       el.addClass('active');
     }
   });


   /**
    * Make link clicks open new tab
    */
   function handleLinks() {
     var host = location.hostname;
     $('a').each(function (index, el) {
       if (el.hostname !== host && el.hostname !== '') {
         $(el).attr('target', '_blank');
       } else {
         console.log(el);
         console.log(el.hostname);
       }
     })
   }
   handleLinks();
})(document);

