var WIDGETS2 = (function () {
  jQuery("#widgets-2-link").bind("click", function (e) {
    var target = jQuery(e.target);
    alert(target.attr("href"));
    e.preventDefault();
  });

  return({});
})();
