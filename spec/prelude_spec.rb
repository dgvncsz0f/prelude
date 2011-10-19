require "rspec"
require "prelude"

describe :prelude_type do

  it "should return an instance of RenderType when :render is given" do
    prelude_type(:render).should be_instance_of RenderType
  end

  it "should return an instance of DialogType when :dialog is given" do
    prelude_type(:dialog).should be_instance_of DialogType
  end

  it "should raise an exception when type is unknown" do
    lambda { prelude_type(:foobar) }.should raise_error
  end

end

describe :DialogType do

  describe "attributes" do
    
    it "should define attributes properly" do
      DialogType.new.attributes.should include(:title, :content)
    end

  end

  context "buttons" do

    before(:each) do
      @d = DialogType.new
    end

    it "ok_button should change buttons list" do
      @d.ok_button.dump.should == {:buttons => [{:ok => true, :text => "Ok"}]}
    end

    it "cancel_button should change buttons list" do
      @d.cancel_button.dump.should == {:buttons => [{:cancel => true, :text => "Cancel"}]}
    end

    it "action_button should change buttons list" do
      @d.action_button("Foobar", "/foo/bar").dump.should == {:buttons => [{:action => "/foo/bar", :text => "Foobar"}]}
    end

  end

end

describe :RenderType do

  describe "attributes" do
    
    it "should define attributes properly" do
      RenderType.new.attributes.should include(:content, :target)
    end

  end

end

describe :BaseType do

  describe "initialize" do

    it "should initialize @attributes to an empty hash" do
      BaseType.new.dump == {}
    end

  end

  context "no attribute defined" do

    it "should use default handler when name is not listed as a valid attribute" do
      lambda { BaseType.new.foobar }.should raise_error(NoMethodError)
    end

    it "respond_to? should return false when name is not listed as a valid attribute" do
      BaseType.new.respond_to?(:foobar).should be_false
    end
  end

  context "attribute is defined" do

    before(:each) do
      @bt = BaseType.new
      @bt.stub(:attributes).and_return([:foobar])
    end

    it "should define a new entry in the @attributes hash when that name is defined on attributes list" do
      @bt.foobar(10).should == @bt
      @bt.dump.should == { :foobar => 10 }
    end

    it "respond_to? should return true when name is listed as a valid attribute" do
      @bt.respond_to?(:foobar).should be_true
    end

  end
  
end
