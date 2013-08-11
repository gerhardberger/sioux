;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var $ = require('sioux-global');

window.onload = function () {
};
},{"sioux-global":2}],2:[function(require,module,exports){
require('node-touch')();

function SiouxGlobal (selector, parentElement) {
	var self = this;

	if (!parentElement) parentElement = document;
	var elems = parentElement.querySelectorAll(selector);

	for (var i = 0; i < elems.length; i++) {
		var elem = elems[i];
		if (!elem.classList.contains('touch')) elem.classList.add('touch');
	}

	self._elems = elems;
	self.element = elems.length === 1 ? elems[0] : elems;

	return self;
}

SiouxGlobal.prototype.on = function(eventName, handler) {
	var self = this;
	for (var i = 0; i < self._elems.length; i++) {
		self._elems[i].addEventListener(eventName, handler, false);
	}
	return self;
};

SiouxGlobal.prototype.off = function(eventName, handler) {
	var self = this;
	for (var i = 0; i < self._elems.length; i++) {
		self._elems[i].removeEventListener(eventName, handler, false);
	}
	return self;
};

SiouxGlobal.prototype.css = function(prop, val) {
	var self = this;
	if (val) {
		for (var i = 0; i < self._elems.length; i++)
			self._elems[i].style[prop] = val;
		return self;
	}

	for (var ix in prop) {
		for (var i = 0; i < self._elems.length; i++)
			self._elems[i].style[ix] = prop[ix];
	}

	return self;
};


function helper (selector, parentElement) { 
	return (new SiouxGlobal(selector, parentElement));
}

helper.isTouchDevice = !!('ontouchstart' in window);

module.exports = helper;
},{"node-touch":3}],3:[function(require,module,exports){
require('node-inserted')('touch');

var TAP_BOUND_X = 15;
var TAP_BOUND_Y = 15;

function isInBounds (touch, element) {
	var left   = element.offsetLeft
		, top    = element.offsetTop
		, right  = left + element.offsetWidth
		, bottom = top + element.offsetHeight
	;
	return (touch.pageX > left && touch.pageX < right && touch.pageY > top && touch.pageY < bottom);
}

if (!window.isTouchDevice) window.isTouchDevice = !!('ontouchstart' in window);

module.exports = function () {

document.addEventListener('inserted', function (event) {
	if (event.animationName !== 'touchNodeInserted') return;
	var elem = event.inserted;
	var _tapStartTouch = { pageX: undefined, pageY: undefined };

	if (!window.isTouchDevice) {
		elem.addEventListener('mouseover', function (event) {
			this.classList.add('hover');
		}, false);
		elem.addEventListener('mouseout', function (event) {
			this.classList.remove('hover');
		}, false);

		return;
	}
	var handler = function (event) {
		event.preventDefault();
	};
	elem.addEventListener('mouseenter', handler, false);
	elem.addEventListener('mousemove', handler, false);
	elem.addEventListener('mouseleave', handler, false);

	elem.addEventListener('touchstart', function (event) {
		this.classList.add('hover');

		_tapStartTouch.pageX = event.changedTouches[0].pageX;
		_tapStartTouch.pageY = event.changedTouches[0].pageY;
	}, false);

	elem.addEventListener('touchend', function (event) {
		this.classList.remove('hover');

		if (!_tapStartTouch.pageX && !_tapStartTouch.pageY) return;

		var x = Math.abs(event.changedTouches[0].pageX - _tapStartTouch.pageX);
		var y = Math.abs(event.changedTouches[0].pageY - _tapStartTouch.pageY);

		if (x < TAP_BOUND_X && y < TAP_BOUND_Y) {
			var tapEvent = new Event('tap');
			tapEvent.initEvent('tap', true, true);
			elem.dispatchEvent(tapEvent);
		}

		_tapStartTouch.pageX = undefined;
		_tapStartTouch.pageY = undefined;
	}, false);

	// Touch leave event
	var touchleaveHandler = function (event) {
		var touch = event.touches[0] || event.changedTouches[0];
		if (!isInBounds(touch, elem)) {
			var leaveEvent = new Event('touchleave');
			leaveEvent.initEvent('touchleave', true, true);

			elem.dispatchEvent(leaveEvent);
			elem.removeEventListener('touchmove', touchleaveHandler, false);
		}
	};
	elem.addEventListener('touchmove', touchleaveHandler, false);
	elem.addEventListener('touchend', function (event) {
		elem.addEventListener('touchmove', touchleaveHandler, false);
	}, false);

	// Tap event
	elem.addEventListener('touchleave', function (event) {
		_tapStartTouch.pageX = undefined;
		_tapStartTouch.pageY = undefined;
	}, false);

	// Swipe event

	var swipeStarted = false;
	var startTouch, prevTouch;
	var startX = 0, startY = 0;
	var direction = '';
	var d = 0;
	elem.addEventListener('touchstart', function (event) {
		startX = event.changedTouches[0].clientX;
		startY = event.changedTouches[0].clientY;
		startTouch = event.changedTouches[0];
	}, false);

	elem.addEventListener('touchmove', function (event) {
		var dx = event.changedTouches[0].clientX - startX;
		var dy = event.changedTouches[0].clientY - startY;
		var swipeEvent = new Event('swipe');

		if (swipeStarted) {
			swipeEvent.initEvent('swipemove', true, true);
			swipeEvent.startTouch = startTouch;
			swipeEvent.prevTouch = prevTouch;
			swipeEvent.changedTouch = event.changedTouches[0];
			prevTouch = event.changedTouches[0];

			if (direction === 'RIGHT' || direction === 'LEFT') {
				if (dx !== d) {
					swipeEvent.direction = direction;
					swipeEvent.delta = direction === 'RIGHT' ? dx : -dx;
					d = dx;
					elem.dispatchEvent(swipeEvent);
				}
			}
			else {
				if (dy !== d) {
					swipeEvent.direction = direction;
					swipeEvent.delta = direction === 'DOWN' ? dy : -dy;
					d = dy;
					elem.dispatchEvent(swipeEvent);
				}
			}

			return;
		}

		swipeStarted = true;
		swipeEvent.initEvent('swipestart', true, true);
		swipeEvent.startTouch = startTouch;
		swipeEvent.changedTouch = event.changedTouches[0];
		prevTouch = event.changedTouches[0];

		if (Math.abs(dx) > Math.abs(dy)) {
			direction = dx > 0 ? 'RIGHT' : 'LEFT';
			swipeEvent.delta = dx > 0 ? dx : -dx;
			d = dx;
		}
		else {
			direction = dy > 0 ? 'DOWN' : 'UP';
			swipeEvent.delta = dy > 0 ? dy : -dy;
			d = dy;
		}
		swipeEvent.direction = direction;
		elem.dispatchEvent(swipeEvent);
	}, false);

	elem.addEventListener('touchend', function (event) {
		if (!swipeStarted) return;

		var swipeEvent = new Event('swipeend');
		swipeEvent.initEvent('swipeend', true, true);
		swipeEvent.startTouch = startTouch;
		swipeEvent.prevTouch = prevTouch;
		swipeEvent.changedTouch = event.changedTouches[0];

		swipeEvent.direction = direction;
		swipeEvent.delta = Math.abs(d);
		elem.dispatchEvent(swipeEvent);

		swipeStarted = false;
		
	}, false);

}, false);

};
},{"node-inserted":4}],4:[function(require,module,exports){
module.exports = function (className) {

if (!className) className = 'inserted';
var css = '@keyframes ' + className + 'NodeInserted { from { clip: rect(1px, auto, auto, auto); } to { clip: rect(0px, auto, auto, to); } } @-moz-keyframes ' + className + 'NodeInserted { from { clip: rect(1px, auto, auto, auto); } to { clip: rect(0px, auto, auto, auto); } } @-webkit-keyframes ' + className + 'NodeInserted { from { clip: rect(1px, auto, auto, auto); } to { clip: rect(0px, auto, auto, auto); } } @-ms-keyframes ' + className + 'NodeInserted { from { clip: rect(1px, auto, auto, auto); } to { clip: rect(0px, auto, auto, auto); } } @-o-keyframes ' + className + 'NodeInserted { from { clip: rect(1px, auto, auto, auto); }	to { clip: rect(0px, auto, auto, auto); } } .' + className + ' {	animation-duration: 0.001s;	-o-animation-duration: 0.001s;	-ms-animation-duration: 0.001s; -moz-animation-duration: 0.001s; -webkit-animation-duration: 0.001s; animation-name: ' + className + 'NodeInserted; -o-animation-name: ' + className + 'NodeInserted; -ms-animation-name: ' + className + 'NodeInserted; -moz-animation-name: ' + className + 'NodeInserted; -webkit-animation-name: ' + className + 'NodeInserted;}';
var elem = document.createElement('style');
var text = document.createTextNode(css);
elem.appendChild(text);

if (document.head.childNodes.length)
	document.head.insertBefore(elem, document.head.childNodes[0]);
else document.head.appendChild(elem);


insertListener = function (event) {
	if (!(event.animationName === className +'NodeInserted' && !event.target.dataset['inserted'])) return;
	event.target.dataset['inserted'] = true;
	var insertEvent = new Event('inserted');
	insertEvent.initEvent('inserted', false, true);
	insertEvent.inserted = event.target;
	insertEvent.animationName = event.animationName;

	if (event.target.parentNode) event.target.parentNode.dispatchEvent(insertEvent);
	document.dispatchEvent(insertEvent);
};

document.addEventListener("animationstart", insertListener, false);
document.addEventListener("MSAnimationStart", insertListener, false);
document.addEventListener("webkitAnimationStart", insertListener, false);

};
},{}]},{},[1])
;