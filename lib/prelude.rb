#! /usr/bin/env ruby

# Copyright (c) 2011, Diego Souza
# All rights reserved.

# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#     * Redistributions of source code must retain the above copyright
#       notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above copyright
#       notice, this list of conditions and the following disclaimer in the
#       documentation and/or other materials provided with the distribution.
#     * Neither the name of the <organization> nor the
#       names of its contributors may be used to endorse or promote products
#       derived from this software without specific prior written permission.

# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
# ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
# DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
# ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

class BaseType

  def initialize
    @json = {}
  end

  def dump
    @json
  end

  def attributes
    []
  end

  def attributes!(&proc)
    @json = proc.call(@json)
  end

  def method_missing(name, *value, &proc)
    symname = name.to_sym
    if (attributes.include?(symname))
      @json[symname] = value.first
      return(self)
    end
    super
  end

  def respond_to?(name)
    attributes.include?(name.to_sym) || super
  end

end

class RenderType < BaseType

  def initialize
    super
    attributes! do |attrs|
      attrs["content-type"] = "render"
      attrs
    end
  end

  def attributes
    [ :target, :content ]
  end

end

class SequeceType < BaseType

  def initialize
    super
    attributes! do |attrs|
      attrs["content-type"] = "sequence"
      attrs
    end
  end

  def attributes
    [ :sequence ]
  end

  def chain(action)
    attributes! do |attrs|
      sequence = attrs[:sequence] || []
      sequence << action
      attrs[:sequence] = sequence
      attrs
    end
  end

end

class CustomType < BaseType

  def initialize(type)
    super
    attributes! do |attrs|
      attrs["content-type"] = type
      attrs
    end
  end

  def method_missing(name, *value, &proc)
    symname = name.to_sym
    @json[symname] = value.first
    return(self)
  end

  def respond_to?(name)
    true
  end


end

# Instantiate a new prelude type. The type defines the action you will
# perform on the client.
#
# Currently it supports the following types:
#
#   * :render 
#   * :dialog
#   * :sequence
#   * :custom
#
# In order to know what attributes each support, refer to prelude.js
# file which describes the protocol and should be used as source of
# truth.
def prelude_type(t)
  case t
    when :render
      RenderType.new
    when :sequence
      SequenceType.new
    else
      CustomType.new(t)
  end
end
