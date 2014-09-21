/** @jsx React.DOM */

var React = require('react');
var {AutoLayout, Box} = require('./index');

var VerticalCenter = React.createClass({
  render: function() {
    return this.transferPropsTo(
      <AutoLayout>
        <Box name="inner" centerY="this[centerY]">{this.props.children}</Box>
      </AutoLayout>
    );
  }
});

var App = React.createClass({
  render: function() {
    return (
      <AutoLayout top="window[top]" bottom="window[bottom]" left="window[left]" right="window[right]">
        <Box
          name="heading"
          left="this[left]"
          right="this[right]"
          top="this[top]">
          <h1>Heading</h1>
        </Box>
        <Box
          name="leftNav"
          right="heading[left] + 64"
          top="heading[bottom]"
          left="this[left]">
          <div>Left nav</div>
        </Box>
        <Box
          name="content"
          left="leftNav[right]"
          right="this[right]"
          top="leftNav[top]"
          bottom="this[bottom]">
          <VerticalCenter><div>Content</div></VerticalCenter>
        </Box>
      </AutoLayout>
    );
  }
});

GSS.once('afterLoaded', function() {
  React.renderComponent(<App />, document.body);
});
