'use strict';

var _expect = require('expect');

var _expect2 = _interopRequireDefault(_expect);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _reactAddonsTestUtils = require('react-addons-test-utils');

var _reactAddonsTestUtils2 = _interopRequireDefault(_reactAddonsTestUtils);

var _reactCssThemr = require('react-css-themr');

var _identifiers = require('../../identifiers.js');

var _Chip = require('../Chip');

var _tooltip = require('../../tooltip');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Avatar = function Avatar(_ref) {
  var title = _ref.title;
  return _react2.default.createElement(
    'span',
    null,
    title
  );
}; // eslint-disable-line react/prop-types
var Chip = (0, _reactCssThemr.themr)(_identifiers.CHIP)((0, _Chip.chipFactory)(Avatar));

describe('Chip', function () {
  describe('with avatar', function () {
    it('adds the avatar class to the element', function () {
      var tree = _reactAddonsTestUtils2.default.renderIntoDocument(_react2.default.createElement(
        Chip,
        { theme: { avatar: 'avatar-class' } },
        _react2.default.createElement(Avatar, { title: 'Test' }),
        _react2.default.createElement(
          'span',
          null,
          'Test'
        )
      ));
      var chip = _reactAddonsTestUtils2.default.findRenderedComponentWithType(tree, Chip);
      var chipNode = _reactDom2.default.findDOMNode(chip);
      (0, _expect2.default)(chipNode.className).toMatch(/\bavatar-class\b/);
    });

    it('works with non-flat children', function () {
      var TooltippedChip = (0, _tooltip.tooltipFactory)()(Chip);
      var tree = _reactAddonsTestUtils2.default.renderIntoDocument(_react2.default.createElement(
        TooltippedChip,
        { theme: { avatar: 'avatar-class' }, tooltip: 'Test tooltip' },
        _react2.default.createElement(Avatar, { title: 'Test' }),
        _react2.default.createElement(
          'span',
          null,
          'Test'
        )
      ));
      var chip = _reactAddonsTestUtils2.default.findRenderedComponentWithType(tree, Chip);
      var chipNode = _reactDom2.default.findDOMNode(chip);
      (0, _expect2.default)(chipNode.className).toMatch(/\bavatar-class\b/);
    });
  });

  describe('without avatar', function () {
    it('does not add avatar class to the element', function () {
      var tree = _reactAddonsTestUtils2.default.renderIntoDocument(_react2.default.createElement(
        Chip,
        { theme: { avatar: 'avatar-class' } },
        _react2.default.createElement(
          'span',
          null,
          'Test'
        )
      ));
      var chip = _reactAddonsTestUtils2.default.findRenderedComponentWithType(tree, Chip);
      var chipNode = _reactDom2.default.findDOMNode(chip);
      (0, _expect2.default)(chipNode.className).toNotMatch(/\bavatar-class\b/);
    });
  });
});