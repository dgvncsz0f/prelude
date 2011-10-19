Gem::Specification.new do |spec|
  spec.name             = "prelude"
  spec.version          = "0.0.1"
  spec.summary          = "Prelude javascript framework"
  spec.authors          = ["Diego Souza"]
  spec.email            = "dsouza+prelude@bitforest.org"
  spec.homepage         = "http://github.com/dsouza/prelude"
  spec.files            = Dir["lib/**/*.rb"]
  spec.test_files       = Dir["spec/**/*spec*.rb"]
  spec.extra_rdoc_files = ["LICENSE", "README.org"]
  spec.description      = <<-EOF
    Prelude follows the principle of Facebook's primer javascript API. By mapping user interactions patterns is helping us boost most of the site functionality with minimum javascript development, as we can generalize most of them.

    There are probably much overlapping with the Facebook's primer API. The main difference is that we use jQuery underneath while they are using Haste + Bootloader.

    If you know primer library, there won't be much news here, other than using jQuery underneath. The purposes, therefore, is not reduce javascript size to the minimum possible, but to reduce greatly development time/cost.
  EOF

  spec.add_development_dependency("rspec")
end
