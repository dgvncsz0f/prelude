// Copyright (c) 2011, Diego Souza
// All rights reserved.

// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the <organization> nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

var jQuery;
var PRELUDE = (function () {

  var my_jQuery = jQuery;
  var ehandlers = {};

  /* Defines internal parameters of the prelude class. Currently these
   * are available:
   *
   *   jQuery: the jQuery object to use;
   */
  var set = function (k, v) {
    if (k === "jQuery") {
      my_jQuery = v;
    }
  };

  var dialog_handler = function (options) {
    var html = my_jQuery("<div>");
    html.get(0).innerHTML = options.content;

    var buttons = [];
    for (var b in options.buttons) {
      if (options.buttons.hasOwnProperty(b)) {
        buttons.push({ text: b.text,
                       click: function () {
                         if (b.cancel || b.ok) {
                           my_jQuery(this).dialog("close");
                         } else if (b.action) {
                           ajax(b.action, { method: "POST",
                                            data: my_jQuery(this).serialize(),
                                            dataType: "json",
                                          });
                         }
                       }
                     });
      }
    }
    
    my_jQuery(html).dialog({ title: options.request.title || options.title,
                             buttons: buttons
                           });
  };

  var render_handler = function (options) {
    var target = options.request.target || my_jQuery(options.target);
    if (target.length) {
      target.get(0).innerHTML = options.content;
    }
  };

  var failure_handler = function (xhr, status) {
    emit("async.fail", status);
  };
 
  /* The output handler follows this protocol:
   *
   *  - content-type: Either dialog or render;
   *  
   *  Options for dialog:
   * 
   *    - title: Pretty obvious;
   * 
   *    - buttons: An array of objects with the `text' of the button
   *               and the type of button. The type might be one of:
   *               ok, cancel or action. The later takes an URL that
   *               will receive a POST request with the contents of
   *               the dialog serialized;
   *
   *    - content: The HTML content to be shown;
   *
   *
   *  Options for render:
   *
   *    - target: A CSS locator of the tag that this content should be put into;
   *
   *    - content: The HTML content to be shown;
   *
   *  Examples:
   *
   *    { "content-type": "render", target: "#foobar", content: "it works!" }
   */
  var action_lookup = function (type) {
    if (type === "dialog") {
      return(dialog_handler);
    } else if (type === "render") {
      return(render_handler);
    } else {
      return(failure_handler);
    }
  };

  var output_handler = function (json) {
    if (json.request === undefined) {
      json.request = {};
    }
    action_lookup(json["content-type"])(json);
    emit("async.done", json);
  };

  /* Performs an ajax request, using the default fail and failure
   * handlers. Notice that you may override done and failures, but
   * then this has no difference to jQuery.ajax method.
   *
   * Please refer to jQuery.ajax documentation for information.
   */
  var ajax = function (url, options0) {
    var options     = options0 || {};
    options.done = options.done || output_handler;
    options.fail = options.fail || failure_handler;
    options.success = options.done;
    options.failure = options.fail;
    return(my_jQuery.ajax(url, options));
  };

  /* Reads tags attributes, performing the ajax request and optionally
   * defining the destination target for the result.
   *
   * The behavior depends on the tag name, roughly as follows:
   *
   *   + A: uses href attribute for URL and performs a GET request;
   *
   *   + FORM: uses action attribute for URL and uses method attribute
   *   to define the HTTP method to use (defaults to POST);
   *
   *   + Others: uses data-href attribute for URL and data-method to
   *   define the HTTP method to use (defaults to GET);
   */
  var tag_handler = function (src, dst) {
    var tagname  = src.get(0).nodeName.toLowerCase();
    var settings = (dst ? {target: dst} : {});
    var mydone   = function (json) {
      var args = Array.prototype.slice.call(arguments, 0);
      json.request  = { target: dst,
                        source: src
                      };
      output_handler.apply(this, args);
    };
    if (tagname === "a") {
      ajax(src.attr("href"), { method: "GET",
                               dataType: "json",
                               done: mydone
                             });
    } else if (tagname === "form") {
      ajax(src.attr("action"), { method: src.attr("method") || "GET",
                                 data: src.serialize(),
                                 dataType: "json",
                                 done: mydone
                               });
    } else {
      ajax(src.attr("data-href"), { method: src.attr("data-method") || "GET",
                                    data: src.serialize(),
                                    dataType: "json",
                                    done: mydone
                                  });
    }
  };

  var link_handler = function (e) {
    if (e.target) {
      var target = my_jQuery(e.target);
      if (target.attr("data-prelude") === "on") {
        tag_handler(target);
        e.preventDefault();
      }
    }
  };

  var submit_handler = function (e) {
    if (e.target) {
      var target = my_jQuery(e.target);
      if (target.attr("data-prelude") === "on") {
        tag_handler(target);
        e.preventDefault();
      }
    }
  };

  /* Deploys event listener on the given jquery object. Only objects
   * with data-prelude=on attribute will be handled. On those, the
   * event propagation will not stop but the default action is
   * prevented.
   *
   * The default is to listen for click and submit events.
   *
   * Alternatively, you may create tags with class="auto-async"
   * attribute. On those, prelude invokes the tag_handler function
   * automatically using that node as the target (for eventual render
   * responses). You may use this to auto fetch content using the ajax
   * mechanism provided by this library.
   */
  var deploy = function (root) {
    root.bind("submit", submit_handler);
    root.bind("click", link_handler);
    root.find(".auto-async").each(function () {
      var tag = my_jQuery(this);
      tag_handler(tag, tag);
    });
  };

  var load_content = function (c, target) {
    if (c.html) {
      target.get(0).innerHTML = c.html;
    }
  };

  var load_javascript = function (s) {
    my_jQuery.getScript(s);
  };

  var load_stylesheet = function (s) {
    var link = my_jQuery("<link>");
    link.attr("type", "text/css");
    link.attr("rel", "stylesheet");
    link.attr("href", s);
    my_jQuery("head").append(link);
  };

  /* Loads a widget, as specified by the w object. The object is as
   * follows:
   *
   *   content:
   *
   *      html: The inline html code of this widget;
   *
   *   imports:
   *
   *      javascripts: An array of javascript urls to be loaded. The
   *                   order is not preserved, though.
   *
   *      stylesheets: An array of stylesheet urls to be loaded. The
   *                   order is not preserved, though.
   *
   * The target is a jQuery element that will receive the widget
   * content.
   */
  var load_widget = function (w, target) {
    load_content(w.content, target);

    for (var j in w.imports.javascripts) {
      if (w.imports.javascripts.hasOwnProperty(j)) {
        load_javascript(w.imports.javascripts[j]);
      }
    }
    for (var s in w.imports.stylesheets) {
      if (w.imports.stylesheets.hasOwnProperty(s)) {
        load_stylesheet(w.imports.stylesheets[s]);
      }
    }

    emit("widget", w);
  };

  var slot_autoasync = function (json) {
    if (json.request.target && json.request.source) {
      if (json.request.source.hasClass("auto-async")) {
        json.request.target.find(".auto-async").each(function () {
          var tag = my_jQuery(this);
          tag_handler(tag, tag);
        });
      }
    }
  };

  var emit = function (signal, e) {
    var fs = ehandlers[signal] || [];
    for (var k=0; k<fs.length; k+=1) {
      fs[k](e);
    }

    // builtin handlers
    if (signal === "async.done") {
      slot_autoasync(e);
    }
  };

  /* Listen for particular events. */
  var slot = function (event, f) {
    var fs = ehandlers[event] || [];
    fs.push(f);
    ehandlers[event] = fs;
  };

  var clear_slots = function () {
    ehandlers = {};
  };

  return({ "set": set,
           "deploy": deploy,
           "ajax": ajax,
           "load_widget": load_widget,
           "tag_handler": tag_handler,
           "slot": slot,
           "emit": emit,
           "clear_slots": clear_slots
         });
})();

// nodejs stuff
var module;
if (module !== undefined) {
  if (module.exports) module.exports = PRELUDE;
}