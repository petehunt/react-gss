var React = require('react');

var cloneWithProps = require('react/lib/cloneWithProps');

function invariant(cond, message) {
  if (!cond) {
    throw new Error('Invariant Violation: ' + message);
  }
}

function interpolateIDs(constraints, mapping) {
  // TODO: use a real parser for better errors etc
  for (var key in mapping) {
    constraints = constraints.replace(new RegExp(key + '\\[', 'g'), mapping[key] + '[');
  }
  return constraints;
}

var LAYOUT_KEYS = {
  'width': 'width',
  'height': 'height',
  'left': 'left',
  'right': 'right',
  'top': 'top',
  'bottom': 'bottom',
  'centerX': 'center-x',
  'centerY': 'center-y'
};

function normalizeKeys(s) {
  for (var key in LAYOUT_KEYS) {
    s = s.replace(new RegExp(key, 'g'), LAYOUT_KEYS[key]);
  }
  return s;
}

var Box = React.createClass({
  render: function() {
    return React.Children.only(this.props.children);
  }
});

var idSeed = 0;

var AutoLayout = React.createClass({
  componentWillMount: function() {
    invariant(typeof GSS !== 'undefined', 'GSS not set up on the page');
    var engine = GSS.engines[0];
    invariant(engine, 'GSS is not ready yet');
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

  getConstraintsForProps: function(props) {
    var constraints = '';
    for (var key in props) {
      if (LAYOUT_KEYS[key]) {
        var value = props[key].trim();
        var beginning = value.length >= 2 ? value.slice(0, 2) : '';

        if (beginning !== '==' && beginning !== '>=' && beginning !== '<=') {
          value = '== ' + value;
        }

        constraints += props.name + '[' + LAYOUT_KEYS[key] + '] ' + normalizeKeys(value) + ';\n';
      }
    }
    return constraints;
  },

  getConstraints: function() {
    // lets build up the stylesheet mmkay
    var constraints = this.props.constraints;

    constraints += this.getConstraintsForProps(this.props);

    React.Children.forEach(this.props.children, function(box) {
      constraints += this.getConstraintsForProps(box.props);
    }, this);

    constraints = interpolateIDs(constraints, this.getMapping());
    console.log('generated constraints:',constraints);
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
      React.DOM.div(null, children)
    );
  }
});

module.exports = {
  AutoLayout: AutoLayout,
  Box: Box
};
