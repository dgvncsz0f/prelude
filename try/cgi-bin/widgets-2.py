#!/usr/bin/env python
# -*- mode: python; -*-
# -*- coding: utf-8 -*-

import cgi
import json

print("Content-Type: application/json; charset=utf-8\n")

form     = cgi.FieldStorage()
callback = form.getfirst("callback", "callback")
content  = file("../widgets-2.html", "r").read()
widget   = { "content": { "html": content
                        },
             "imports": { "javascripts": ["/javascripts/widgets-2.js"],
                          "stylesheets": ["/stylesheets/widgets-2.css"]
                        }
           }
print("%s(%s);" % (callback, json.dumps(widget)))
