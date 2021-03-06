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
  'intrinsicHeight': 'intrinsic-height',
  'intrinsicWidth': 'intrinsic-width'
};

function interpolateIDsAndNormalizeKeys(constraints, mapping) {
  // TODO: use a real parser for better errors etc
  return constraints.replace(/(\w[\w\d_-]+)\.(\w[\w\d_-]+)/g, function(match, name, propertyName) {
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

var AutoLayout = React.createClass({
  getInitialState: function() {
    return {layoutCompleted: false};
  },

  componentWillMount: function() {
    invariant(typeof GSS !== 'undefined', 'GSS not set up on the page');
    var engine = GSS.engines[0];
    invariant(engine, 'GSS is not ready yet. Did you forget GSS.once(\'afterLoaded\', ...) ?');
    invariant(!GSS.config.observe, 'You cannot use GSS in observe mode. Did you set observe: false in GSS_CONFIG?');
    this.styleSheet = new GSS.StyleSheet({engine: engine, engineId: engine.id});
  },

  componentDidMount: function() {
    var constraints = this.getConstraints();
    this.styleSheet.addRules(GSS.compile(constraints));
    this.lastConstraints = constraints;

    GSS.on('display', this.handleDisplay);
  },

  handleDisplay: function() {
    if (this.isMounted() && !this.state.layoutCompleted) {
      this.setState({layoutCompleted: true});
    }
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

        constraints += props.name + '.' + key + ' ' + value + ';\n';
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
      constraints += this.getConstraintsForProps(box.props, true);
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
      invariant(box.props.name, 'Box requires a name');
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
      React.DOM.div({style: {visibility: this.state.layoutCompleted ? 'visible' : 'hidden'}}, children)
    );
  }
});

module.exports = {
  AutoLayout: AutoLayout,
  Box: Box
};
