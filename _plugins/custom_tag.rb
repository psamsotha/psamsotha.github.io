
class CustomTag < Liquid::Tag
  def initialize(tag_name, input, tokens)
    super
  end

  def render(context)
    <<-MARKUP.strip
    <div>
      <h1 style="color:blue;text-decoration:underline">
        Hello Custom Tag!
      </h1>
    </div>
    MARKUP
  end
end

Liquid::Template.register_tag('custom_tag', CustomTag)
