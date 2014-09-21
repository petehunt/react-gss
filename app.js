/** @jsx React.DOM */

var React = require('react');
var mq = require('react-responsive');
var {AutoLayout, Box} = require('./index');

var VerticalCenter = React.createClass({
  render: function() {
    return this.transferPropsTo(
      <AutoLayout>
        <Box name="inner" centerY="this.centerY">{this.props.children}</Box>
      </AutoLayout>
    );
  }
});

var App = React.createClass({
  render: function() {
    return (
      <div>
        <mq minWidth={960}>
          <AutoLayout top="window.top" bottom="window.bottom" left="window.left" right="window.right">
            <Box
              name="heading"
              left="this.left"
              right="this.right"
              top="this.top">
              <h1>Heading</h1>
            </Box>
            <Box
              name="leftNav"
              right="heading.left + 64"
              top="heading.bottom"
              left="this.left">
              <div>Left nav</div>
            </Box>
            <Box
              name="content"
              left="leftNav.right"
              right="this.right"
              top="leftNav.top"
              bottom="this.bottom">
              <VerticalCenter><div>Content</div></VerticalCenter>
            </Box>
          </AutoLayout>
        </mq>
        <mq maxWidth={960}>
          <AutoLayout top="window.top" bottom="window.bottom" left="window.left" right="window.right">
            <Box
              name="heading"
              left="this.left"
              right="this.right"
              top="this.top">
              <h1>Heading</h1>
            </Box>
            <Box
              name="leftNav"
              right="this.right"
              top="heading.bottom"
              left="this.left">
              <div>Left nav</div>
            </Box>
            <Box
              name="content"
              left="this.left"
              right="this.right"
              top="leftNav.bottom"
              bottom="this.bottom">
              <VerticalCenter><div>Content</div></VerticalCenter>
            </Box>
          </AutoLayout>
        </mq>
      </div>
    );
  }
});

GSS.once('afterLoaded', function() {
  React.renderComponent(<App />, document.body);
});
