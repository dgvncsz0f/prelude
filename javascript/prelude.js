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
  var my_jQuery   = jQuery;

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

  var new_instance = function (root) {
    var c_handlers  = {};
    var core_events = { "async_done": [],
                        "async_fail": [],
                        "widget_load": []
                      };

    var emit = function (signal, args) {
      var handlers = core_events[signal] || [];
      for (var k=0; k<handlers.length; k+=1) {
        handlers[k].apply(null, args);
      }
      root.trigger(signal, args);
    };

    var slot = function (signal, f) {
      root.bind(signal + ".prelude", f);
    };

    var render_handler = function (options) {
      var target = options.request.target || my_jQuery(options.target);
      if (target.length) {
        target.get(0).innerHTML = options.content;
      }
    };

    var sequence_handler = function (options, cc) {
      for (var rsp in options.sequence) {
        if (options.sequece.hasOwnProperty(rsp)) {
          var seqitem = options.sequece[rsp];
          seqitem.request = options.request;
          cc(seqitem);
        }
      }
    };

    var failure_handler = function (xhr, status) {
      emit("async_fail", [status]);
    };
    
    /* The output handler follows this protocol:
     *
     *  - content-type: Either render, sequence or a custom handler registered;
     *  
     *  Options for render:
     *
     *    - target: A CSS locator of the tag that this content should be put into;
     *
     *    - content: The HTML content to be shown;
     * 
     *  Options for sequence:
     *
     *    - sequece: A list of actions to execute (any of the types above);
     *
     *  Examples:
     *
     *    { "content-type": "render", target: "#foobar", content: "it works!" }
     */
    var action_lookup = function (type) {
      if (type === "render") {
        return(render_handler);
      } else if (type === "sequence") {
        return(sequence_handler);
      } else {
        return(c_handlers[type] || failure_handler);
      }
    };

    var response_handler = function (json) {
      if (json.request === undefined) {
        json.request = {};
      }
      action_lookup(json["content-type"])(json, response_handler);
      emit("async_done", [json]);
    };

    /* Performs an ajax request, using the default fail and failure
     * handlers. Notice that you may override done and failures, but
     * then this has no difference to jQuery.ajax method.
     *
     * Please refer to jQuery.ajax documentation for information.
     */
    var ajax = function (url, options0) {
      var options     = options0 || {};
      options.done    = options.done || response_handler;
      options.fail    = options.fail || failure_handler;
      options.success = options.done;
      options.error   = options.fail;
      return(my_jQuery.ajax(url, options));
    };

    /* Reads tags attributes, performing the ajax request and optionally
     * defining the destination target for the result.
     */
    var tag_handler = function (src, dst) {
      var tagname  = src.get(0).nodeName.toLowerCase();
      var settings = (dst ? {target: dst} : {});
      var mydone   = function (json) {
        var args = Array.prototype.slice.call(arguments, 0);
        json.request  = { target: dst,
                          source: src
                        };
        response_handler.apply(this, args);
      };
      if (tagname === "a") {
        ajax(src.attr("href"), { type: "GET",
                                 dataType: "json",
                                 done: mydone
                               });
      } else if (tagname === "form") {
        ajax(src.attr("action"), { type: src.attr("method") || "GET",
                                   data: src.serialize(),
                                   dataType: "json",
                                   done: mydone
                                 });
      } else {
        ajax(src.attr("data-href"), { type: src.attr("data-method") || "GET",
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

    /* Registers a new output handler. Output handlers are responsible
     * for processing server responses in a reply of a ajax request
     * done by prelude.
     */
    var register_rsphandler = function (name, f) {
      if (c_handlers[name] !== undefined) {
        throw("there is handler already for: "+ name);
      }
      c_handlers[name] = f;
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

      emit("widget_load", [w, target]);
    };

    var undeploy = function () {
      root.unbind(".prelude");
    };

    // core event handlers
    core_events["async_done"].push(function (json) {
      if (json.request.target && json.request.source) {
        json.request.target.find(".auto-async").each(function () {
          var tag = my_jQuery(this);
          tag_handler(tag, tag);
        });
      }
    });
    core_events["widget_load"].push(function (w, target) {
      target.find(".auto-async").each(function () {
        var tag = my_jQuery(this);
        tag_handler(tag, tag);
      });
    });

    root.bind("submit.prelude", submit_handler);
    root.bind("click.prelude", link_handler);
    root.find(".auto-async").each(function () {
      var tag = my_jQuery(this);
      tag_handler(tag, tag);
    });

    return({ "ajax": ajax,
             "undeploy": undeploy,
             "load_widget": load_widget,
             "tag_handler": tag_handler,
             "slot": slot,
             "emit": emit,
             "register_rsphandler": register_rsphandler,
             "response_handler": response_handler
           });
  };

  var instances = {};

  /* Deploys event listener on the given jquery object. Only objects
   * with data-prelude=on attribute will be handled. On those, the
   * event propagation will not stop but the default action is
   * prevented.
   */
  var deploy = function (name, root) {
    instances[name] = new_instance(root);
    return(instances[name]);
  };

  var instance = function (x) {
    return(instances[x]);
  };

  return({ "deploy": deploy,
           "instance": instance,
           "set": set
         });

})();

// nodejs stuff
var module;
if (module !== undefined) {
  if (module.exports) module.exports = PRELUDE;
}