#!/usr/bin/env python
# -*- mode: python; -*-
# -*- coding: utf-8 -*-

import cgi
import json

print("Content-Type: application/json; charset=utf-8\n")

form     = cgi.FieldStorage()
callback = form.getfirst("callback", "callback")
content  = file("../widgets-1.html", "r").read()
widget   = { "content": { "html": content
                        },
             "imports": { "javascripts": [],
                          "stylesheets": []
                        }
           }
print("%s(%s);" % (callback, json.dumps(widget)))
