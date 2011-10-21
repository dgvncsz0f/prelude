var jsdom   = require("jsdom");
var prelude = require("prelude.js");
var jQuery  = require("jquery");

describe("PRELUDE.deploy", function () {

  it("should bind to submit and click events", function () {
    var tag = jQuery();
    spyOn(tag, "bind");
    prelude.deploy(tag);
    expect(tag.bind).toHaveBeenCalledWith("submit", jasmine.any(Function))
    expect(tag.bind).toHaveBeenCalledWith("click", jasmine.any(Function))
  });

});

describe("PRELUDE.event handling", function () {

  var body;
  beforeEach(function () {
    body = jQuery("body");
    prelude.deploy(body);
    prelude.set("jQuery", jQuery);
  });

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
    expect(jQuery.ajax).toHaveBeenCalledWith("/foo/bar", { method: "GET",
                                                           dataType: "json",
                                                           done: jasmine.any(Function),
                                                           fail: jasmine.any(Function),
                                                           success: jasmine.any(Function),
                                                           failure: jasmine.any(Function)
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
    expect(jQuery.ajax).toHaveBeenCalledWith("/foo/bar", { method: "POST",
                                                           data: form.serialize(),
                                                           dataType: "json",
                                                           done: jasmine.any(Function),
                                                           fail: jasmine.any(Function),
                                                           success: jasmine.any(Function),
                                                           failure: jasmine.any(Function)
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

  beforeEach(function () {
    prelude.set("jQuery", jQuery);
  });

  it("should define success and failure handler", function () {
    spyOn(jQuery, "ajax");
    prelude.ajax("/foo/bar");
    expect(jQuery.ajax).toHaveBeenCalledWith("/foo/bar", { done: jasmine.any(Function),
                                                           fail: jasmine.any(Function),
                                                           success: jasmine.any(Function),
                                                           failure: jasmine.any(Function)
                                                         });
  });

  it("should not override handlers when they are defined", function () {
    spyOn(jQuery, "ajax");
    prelude.ajax("/foo/bar", { done: 1, fail: 2 });
    expect(jQuery.ajax).toHaveBeenCalledWith("/foo/bar", { done: 1,
                                                           fail: 2,
                                                           success: 1,
                                                           failure: 2
                                                         });
  });

});

describe("PRELUDE.load_widget", function () {

  var widget;

  beforeEach(function () {
    prelude.set("jQuery", jQuery);
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
    prelude.load_widget(widget, target);
    expect(target.get(0).innerHTML).toBe("jasmine example");
  });

  it("should load all javascripts defined in the widget", function () {
    widget.imports.javascripts.push("/foo/bar.js");
    widget.imports.javascripts.push("/bar/foo.js");
    var target = jQuery("<div>");
    spyOn(jQuery, "getScript");
    prelude.load_widget(widget, target);
    expect(jQuery.getScript).toHaveBeenCalledWith("/foo/bar.js");
    expect(jQuery.getScript).toHaveBeenCalledWith("/bar/foo.js");
  });

  it("should load all stylesheets files defined in the widget", function () {
    widget.imports.stylesheets.push("/foo/bar.css");
    widget.imports.stylesheets.push("/bar/foo.css");
    var target = jQuery("<div>");
    prelude.load_widget(widget, target);
    expect(jQuery("link:first").attr("href")).toBe("/foo/bar.css");
    expect(jQuery("link:last").attr("href")).toBe("/bar/foo.css");
  });

});

describe("signals and slots", function () {

  beforeEach(function () {
    prelude.clear_slots();
  });

  it("emit should notify listeners", function () {
    var sentinel = false;
    prelude.slot("foobar", function (e) {
      sentinel = e;
    });
    prelude.emit("foobar", true);
    expect(sentinel).toBe(true);
  });

});