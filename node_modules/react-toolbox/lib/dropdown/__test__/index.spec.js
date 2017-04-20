'use strict';

var _expect = require('expect');

var _expect2 = _interopRequireDefault(_expect);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactAddonsTestUtils = require('react-addons-test-utils');

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _theme = require('../theme.scss');

var _theme2 = _interopRequireDefault(_theme);

var _Dropdown = require('../Dropdown');

var _Dropdown2 = _interopRequireDefault(_Dropdown);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Dropdown', function () {
  describe('#renderValue', function () {
    var source = [{ value: 'EN-gb', label: 'England' }, { value: 'ES-es', label: 'Spain', disabled: true }, { value: 'TH-th', label: 'Thailand', disabled: true }, { value: 'EN-en', label: 'USA' }];
    it('renders dropdown item with disabled style', function () {
      var tree = (0, _reactAddonsTestUtils.renderIntoDocument)(_react2.default.createElement(_Dropdown2.default, { theme: _theme2.default, source: source }));
      var disabled = (0, _reactAddonsTestUtils.scryRenderedDOMComponentsWithClass)(tree, _theme2.default.disabled);
      (0, _expect2.default)(disabled.length).toEqual(2);
    });
    it('does not call onChange callback when disabled dorpdown item is clicked', function () {
      var spy = _sinon2.default.spy();
      var tree = (0, _reactAddonsTestUtils.renderIntoDocument)(_react2.default.createElement(_Dropdown2.default, {
        theme: _theme2.default,
        source: source,
        value: source[0].value,
        onChange: spy
      }));
      var disabled = (0, _reactAddonsTestUtils.scryRenderedDOMComponentsWithClass)(tree, _theme2.default.disabled);
      (0, _expect2.default)(spy.called).toEqual(false);
      _reactAddonsTestUtils.Simulate.click(disabled[0]);
      (0, _expect2.default)(spy.called).toEqual(false);
      var selected = (0, _reactAddonsTestUtils.scryRenderedDOMComponentsWithClass)(tree, _theme2.default.selected);
      _reactAddonsTestUtils.Simulate.click(selected[0]);
      (0, _expect2.default)(spy.called).toEqual(true);
    });
  });
});