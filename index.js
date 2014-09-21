var React = require('react');

var cloneWithProps = require('react/lib/cloneWithProps');

function invariant(cond, message) {
  if (!cond) {
    throw new Error('Invariant Violation: ' + message);
  }
}

function merge() {
  var a = {};
  Array.prototype.slice.call(arguments).forEach(function(x) {
    for (var k in x) {
      if (!x.hasOwnProperty(k)) {
        continue;
      }
      a[k] = x[k];
    }
  });
  return a;
}

var LAYOUT_KEYS = {
  'width': 'width',
  'height': 'height',
  'left': 'left',
  'right': 'right',
  'top': 'top',
  'bottom': 'bottom',
  'centerX': 'center-x',
  'centerY': 'center-y',
  'intrinsicHeight': 'intrinsic-height'
};

function interpolateIDsAndNormalizeKeys(constraints, mapping) {
  // TODO: use a real parser for better errors etc
  return constraints.replace(/([\w\d_-]+)\[([\w\d_-]+)\]/g, function(match, name, propertyName) {
    invariant(LAYOUT_KEYS[propertyName], 'Invalid layout property name: ' + propertyName);
    invariant(mapping[name], 'Unknown Box or AutoLayout name: ' + name);
    return mapping[name] + '[' + LAYOUT_KEYS[propertyName] + ']';
  });
}

var Box = React.createClass({
  render: function() {
    return React.Children.only(this.props.children);
  }
});

var idSeed = 0;
var foucStylesheetAdded = false;

var AutoLayout = React.createClass({
  componentWillMount: function() {
    if (!foucStylesheetAdded && typeof document !== 'undefined') {
      var styleNode = document.createElement('style');
      styleNode.type = 'text/css';
      styleNode.innerText = '.react-gss__auto-layout { visibility: hidden; }\n.gss-ready .react-gss__auto-layout { visibility: visible; }';
      document.head.appendChild(styleNode);
      foucStylesheetAdded = true;
    }

    invariant(typeof GSS !== 'undefined', 'GSS not set up on the page');
    var engine = GSS.engines[0];
    invariant(engine, 'GSS is not ready yet. Did you forget GSS.once(\'afterLoaded\', ...) ?');
    this.styleSheet = new GSS.StyleSheet({engine: engine, engineId: engine.id});
  },

  componentDidMount: function() {
    var constraints = this.getConstraints();
    this.styleSheet.addRules(GSS.compile(constraints));
    this.lastConstraints = constraints;
  },

  componentDidUpdate: function() {
    var constraints = this.getConstraints();
    if (this.lastConstraints != constraints) {
      this.styleSheet.destroyRules();
      this.styleSheet.addRules(GSS.compile(constraints));
      this.lastConstraints = constraints;
    }
  },

  componentWillUnmount: function() {
    this.styleSheet.destroyRules();
  },

  getDefaultProps: function() {
    return {name: 'this', constraints: ''};
  },

  getConstraintsForProps: function(props, layoutKeysOnly) {
    var constraints = '';
    for (var key in props) {
      // TODO: warn about this where the descriptor is constructed (in 0.12?)
      invariant(
        !layoutKeysOnly || (key === 'name' || key === 'children' || LAYOUT_KEYS[key]),
        'Unknown layout prop: ' + key
      );
      if (LAYOUT_KEYS[key]) {
        var value = props[key].trim();
        var beginning = value.length >= 2 ? value.slice(0, 2) : '';

        if (beginning !== '==' && beginning !== '>=' && beginning !== '<=') {
          value = '== ' + value;
        }

        constraints += props.name + '[' + key + '] ' + value + ';\n';
      }
    }
    constraints = interpolateIDsAndNormalizeKeys(constraints, this.getMapping());
    return constraints;
  },

  getConstraints: function() {
    // lets build up the stylesheet mmkay
    var constraints = this.props.constraints;

    constraints += this.getConstraintsForProps(this.props, false);

    React.Children.forEach(this.props.children, function(box) {
      var boxProps = box.props;
      var autoIntrinsicHeight = (
        !boxProps.hasOwnProperty('height') &&
          !(boxProps.hasOwnProperty('top') && boxProps.hasOwnProperty('bottom'))
      );
      if (autoIntrinsicHeight) {
        boxProps = merge(box.props, {
          height: boxProps.name + '[intrinsicHeight]'
        });
      }

      constraints += this.getConstraintsForProps(boxProps, true);
    }, this);

    return constraints;
  },

  getSelector: function(component) {
    var node = component.getDOMNode();

    if (!node.hasAttribute('id')) {
      node.id = 'autoLayout' + (idSeed++);
    }

    return '#' + node.id;
  },

  getMapping: function() {
    var mapping = {
      'window': '::window'
    };
    React.Children.forEach(this.props.children, function(box) {
      mapping[box.props.name] = this.getSelector(this.refs[box.props.name]);
    }, this);

    mapping[this.props.name] = this.getSelector(this);

    return mapping;
  },

  render: function() {
    var children = React.Children.map(this.props.children, function(box) {
      return cloneWithProps(box, {
        children: box.props.children,
        key: box.props.name,
        ref: box.props.name
      });
    });

    return this.transferPropsTo(
      React.DOM.div({className: 'react-gss__auto-layout'}, children)
    );
  }
});

module.exports = {
  AutoLayout: AutoLayout,
  Box: Box
};
