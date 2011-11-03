var WIDGETS2 = (function () {
  jQuery("#widgets-2").bind("click", function (e) {
    if (e.target !== undefined) {
      var target = jQuery(e.target);
      if (target.attr("id") === "widgets-2-link") {
        alert(target.attr("href"));
        e.preventDefault();
      }
    }
  });

  return({});
})();
