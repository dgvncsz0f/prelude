default: test

include makefile.vars

.PHONY: tests
test: spec jspec

.PHONY: spec
spec: check_binaries
	$(bin_rspec) spec/

.PHONY: jspec
jspec: check_binaries
	$(bin_env) NODE_PATH=$$NODE_PATH:javascript/ $(bin_jasmine) jspec/