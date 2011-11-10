var jsdom   = require("jsdom");
var prelude = require("prelude.js");
var jQuery  = require("jquery");

describe("PRELUDE", function () {
  prelude.set("jQuery", jQuery);

  var body, instance;
  beforeEach(function () {
    body = jQuery("body");
    instance = prelude.deploy("main", body);
  });

  afterEach(function () {
    instance.undeploy();
    instance = undefined;
  });

  describe("PRELUDE.deploy", function () {

    it("should bind to submit and click events", function () {
      var tag   = jQuery();
      var dummy = {each: function () {}};
      spyOn(tag, "bind");
      spyOn(tag, "find").andReturn(dummy);
      prelude.deploy("main", tag);
      expect(tag.bind).toHaveBeenCalledWith("submit.prelude", jasmine.any(Function));
      expect(tag.bind).toHaveBeenCalledWith("click.prelude", jasmine.any(Function));
      expect(tag.find).toHaveBeenCalledWith(".auto-async");
    });

    it("should define a new entry on instances", function () {
      expect(prelude.instance("main")).not.toBe(undefined);
    });


  });

  describe("PRELUDE.undeploy", function () {

    it("should remove all event handlers", function () {
      instance.slot("foobar", function () {
        expect(true).toBe(false);
      });
      instance.undeploy();
      instance.emit("foobar");
    });

    it("should not handle click events", function () {
      var evt  = jQuery.Event("click");
      var atag = jQuery("<a>foo</a>");
      atag.attr("href", "/foo/bar");
      atag.attr("data-prelude", "on");
      body.append(atag);
      spyOn(jQuery, "ajax");
      instance.undeploy();
      atag.trigger(evt);
      expect(evt.isDefaultPrevented()).toBe(false);
      expect(jQuery.ajax).not.toHaveBeenCalled();
    });

    it("should remove from instances", function () {
      instance.undeploy();
      expect(prelude.instance("main")).toBe(undefined);
    });

  });

  describe("PRELUDE.event handling", function () {

    it("should handle click events that contains data-prelude=on", function () {
      var evt  = jQuery.Event("click");
      var atag = jQuery("<a>foo</a>");
      atag.attr("href", "/foo/bar");
      atag.attr("data-prelude", "on");
      body.append(atag);
      evt.target = atag.get(0);
      spyOn(jQuery, "ajax");
      atag.trigger(evt);
      expect(evt.isDefaultPrevented()).toBe(true);
      expect(jQuery.ajax).toHaveBeenCalledWith("/foo/bar", { type: "GET",
                                                             dataType: "json",
                                                             done: jasmine.any(Function),
                                                             fail: jasmine.any(Function),
                                                             success: jasmine.any(Function),
                                                             error: jasmine.any(Function)
                                                           });
    });

    it("should not handle click events if data-prelude/=on", function () {
      var evt  = jQuery.Event("click");
      var atag = jQuery("<a>foo</a>");
      atag.attr("href", "/foo/bar");
      body.append(atag);
      spyOn(jQuery, "ajax");
      atag.trigger(evt);
      expect(evt.isDefaultPrevented()).toBe(false);
      expect(jQuery.ajax).not.toHaveBeenCalled();
    });

    it("should handle click events if data-prelude=on", function () {
      var evt   = jQuery.Event("submit");
      var input = jQuery("<input>");
      var form  = jQuery("<form>");
      form.attr("action", "/foo/bar");
      form.attr("method", "POST");
      form.attr("data-prelude", "on");
      input.attr("type", "text");
      input.attr("name", "foo");
      input.attr("value", "bar");
      form.append(input);
      body.append(form);
      spyOn(jQuery, "ajax");
      form.trigger(evt);
      expect(evt.isDefaultPrevented()).toBe(true);
      expect(jQuery.ajax).toHaveBeenCalledWith("/foo/bar", { type: "POST",
                                                             data: form.serialize(),
                                                             dataType: "json",
                                                             done: jasmine.any(Function),
                                                             fail: jasmine.any(Function),
                                                             success: jasmine.any(Function),
                                                             error: jasmine.any(Function)
                                                           });
    });

    it("should not handle click events if data-prelude/=on", function () {
      var evt   = jQuery.Event("submit");
      var input = jQuery("<input>");
      var form  = jQuery("<form>");
      form.attr("action", "/foo/bar");
      form.attr("method", "POST");
      input.attr("type", "text");
      input.attr("name", "foo");
      input.attr("value", "bar");
      form.append(input);
      body.append(form);
      spyOn(jQuery, "ajax");
      form.trigger(evt);
      expect(evt.isDefaultPrevented()).toBe(false);
      expect(jQuery.ajax).not.toHaveBeenCalled();
    });

  });

  describe("PRELUDE.ajax", function () {

    it("should define success and failure handler", function () {
      spyOn(jQuery, "ajax");
      instance.ajax("/foo/bar");
      expect(jQuery.ajax).toHaveBeenCalledWith("/foo/bar", { done: jasmine.any(Function),
                                                             fail: jasmine.any(Function),
                                                             success: jasmine.any(Function),
                                                             error: jasmine.any(Function)
                                                           });
    });

    it("should not override handlers when they are defined", function () {
      spyOn(jQuery, "ajax");
      instance.ajax("/foo/bar", { done: 1, fail: 2 });
      expect(jQuery.ajax).toHaveBeenCalledWith("/foo/bar", { done: 1,
                                                             fail: 2,
                                                             success: 1,
                                                             error: 2
                                                           });
    });

  });

  describe("PRELUDE.load_widget", function () {

    var widget;
    beforeEach(function () {
      widget = { content: { html: ""
                          },
                 imports: { javascripts: [],
                            stylesheets: []
                          }
               };
    });

    it("should load content into the target", function () {
      widget.content.html = "jasmine example";
      var target = jQuery("<div>");
      instance.load_widget(widget, target);
      expect(target.get(0).innerHTML).toBe("jasmine example");
    });

    it("should load all javascripts defined in the widget", function () {
      widget.imports.javascripts.push("/foo/bar.js");
      widget.imports.javascripts.push("/bar/foo.js");
      var target = jQuery("<div>");
      spyOn(jQuery, "getScript");
      instance.load_widget(widget, target);
      expect(jQuery.getScript).toHaveBeenCalledWith("/foo/bar.js");
      expect(jQuery.getScript).toHaveBeenCalledWith("/bar/foo.js");
    });

    it("should load all stylesheets files defined in the widget", function () {
      widget.imports.stylesheets.push("/foo/bar.css");
      widget.imports.stylesheets.push("/bar/foo.css");
      var target = jQuery("<div>");
      instance.load_widget(widget, target);
      expect(jQuery("link:first").attr("href")).toBe("/foo/bar.css");
      expect(jQuery("link:last").attr("href")).toBe("/bar/foo.css");
    });

  });

  describe("signals and slots", function () {

    it("emit should notify listeners", function () {
      var sentinel = false;
      instance.slot("foobar", function (e, flag) {
        sentinel = flag;
      });
      instance.emit("foobar", true);
      expect(sentinel).toBe(true);
    });
  });

});
