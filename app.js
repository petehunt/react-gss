/** @jsx React.DOM */

var React = require('react');
var mq = require('react-responsive');
var {AutoLayout, Box} = require('./index');

var App = React.createClass({
  render: function() {
    return (
      <AutoLayout left="window.left" right="window.right" top="window.top" bottom="window.bottom">
        <Box name="header" height="header.intrinsicHeight" top="this.top" left="this.left" right="this.right"><h1>This is the header</h1></Box>
        <Box name="leftNav" top="header.bottom" left="this.left" bottom="this.bottom" width="64">
          <div style={{border: '1px solid black'}}>This is the left nav</div>
        </Box>
        <Box name="content" left="leftNav.right + 10" top="leftNav.top" bottom="leftNav.bottom" right="this.right">
          <AutoLayout name="contentLayout" style={{border: '1px solid red'}}>
            <Box left="contentLayout.left" height="col1.intrinsicHeight" centerX="contentLayout.centerX" name="col1" centerY="contentLayout.centerY"><span style={{border: '1px solid gray'}}>Content here</span></Box>
          </AutoLayout>
        </Box>
      </AutoLayout>
    );
  }
});

GSS.once('afterLoaded', function() {
  React.renderComponent(<App />, document.body);
});
