if (!("classList" in document.createElementNS("http://www.w3.org/2000/svg","g"))) {
	var descr = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'classList');
	Object.defineProperty(SVGElement.prototype, 'classList', descr);

	// This probably shouldn't be done like this, after all we're
	// modifying things that might be used by other JS libraries
	// on the same page, but...
}

var ClockTimer = function() {
	this.callbacks = {};
	this.timer = null;
	this.interval = null;
};

ClockTimer.prototype.start = function(interval) {
	this.interval = interval;
	var that = this;
	this.timer = setInterval(function() {
		that.callback();
	}, this.interval);
};

ClockTimer.prototype.stop = function() {
	clearInterval(this.timer);
	this.timer = null;
	this.interval = null;
};

ClockTimer.prototype.callback = function() {
	var time = new Date();
	var timestamp = time.getTime();

	var elementsToSuspend = [];
	var callbacksToCall = [];

	for (var id in this.callbacks) {
		if (this.callbacks[id].last + this.interval < timestamp + this.interval) {
			callbacksToCall.push(this.callbacks[id]);

			if (this.callbacks[id].svg !== undefined && this.callbacks[id].svg.suspendRedraw !== undefined) {
				elementsToSuspend.push(this.callbacks[id].svg);
			}
		}
	};

	elementsToSuspend.forEach(function(element) {
		element.suspendHandleID = element.suspendRedraw(this.interval);
	});

	callbacksToCall.forEach(function(callback) {
		callback.last = timestamp;
		callback.func(time);
	});

	elementsToSuspend.forEach(function(element) {
		element.unsuspendRedraw(element.suspendHandleID);
	});
};

ClockTimer.prototype.minInterval = function() {
	var min = undefined;
	for (var id in this.callbacks) {
		var interval = this.callbacks[id].interval;

		if (min === undefined || interval < min) {
			min = interval;
		}
	};

	return min;
};

ClockTimer.prototype.addCallback = function(f, interval, svg) {
	var rand = Math.floor(Math.random() * 1024 * 1024 * 1024);
	this.callbacks[rand] = {
		func: f,
		interval: interval,
		last: 0
	};

	if (svg && svg.ownerSVGElement !== undefined) {
		this.callbacks[rand].svg = svg.ownerSVGElement;
	}

	var min = this.minInterval();
	if (min != this.interval) {
		this.stop();
		this.start(min);
	}

	if (!this.timer) {
		this.start();
	}

	return rand;
};

ClockTimer.prototype.removeCallback = function(id) {
	if (this.callbacks[id] !== undefined) {
		delete this.callbacks[id];
	}

	if (Object.keys(this.callbacks).length === 0) {
		this.stop();
	}
};

ClockTimer = new ClockTimer();


var ClockHand = function(element, radius, margin) {
	this.element = element;
	this.radius = radius;
	this.margin = margin;

	var _currentDegrees = undefined;
};

ClockHand.prototype.setAngle = function(degrees) {
	if (degrees !== undefined) {
		var radians = (degrees - 90) / 180 * Math.PI;

		var x = (this.radius - this.margin) * Math.cos(radians) + this.radius;
		var y = (this.radius - this.margin) * Math.sin(radians) + this.radius;

		this.element.setAttribute('x1', x);
		this.element.setAttribute('y1', y);
	}
};

ClockHand.prototype.advanceTo = function(degrees) {
	if (degrees != this._currentDegrees) {
		var difference = ((degrees+360) - this._currentDegrees) % 360;
		// We need the real absolute difference in degrees, to allow
		// smooth movement even when going from 355° to 5°

		if (this._currentDegrees === undefined || difference < 1) {
			// No need to do things smoothly if the angle is so small
			this.setAngle(degrees);
			this._currentDegrees = degrees;
		} else if (!this.moving) {
			var duration = 70; // milliseconds
			var ticks = 5;
			var tickLength = duration/ticks;
			var stepAngle = difference/ticks;

			var that = this;
			var currentAngle = this._currentDegrees;

			this.moving = true;

			var start = undefined;
			var advanceOneStep = function(timestamp) {
				if (start === undefined) {
					start = timestamp;
				}

				var progress = (timestamp - start) / duration;
				currentAngle += (stepAngle * progress);

				that.setAngle(currentAngle);

				if (currentAngle < (that._currentDegrees + difference)) {
					window.requestAnimationFrame(advanceOneStep);
				} else {
					that.setAngle(degrees);
					that._currentDegrees = degrees;
					that.moving = false;
				}
			};
			window.requestAnimationFrame(advanceOneStep);
		}
	}

	return this;
};

var Clock = function(element) {
	this.svgNS = element.namespaceURI;
	this.element = element;

	this.base("sexagesimal");
	this._radius = 50;
	this._offset = -1 * (new Date()).getTimezoneOffset() * 60;

	this.showHoursHand = true;
	this.showHoursTicks = true;
	this.showHoursDigits = true;

	this.showMinutesHand = false;
	this.showMinutesTicks = false;
	this.showMinutesDigits = false;

	this._smooth = false;

	this._rotateDigits = false;

	this.showSecondsHand = true;

	this.lastTick = undefined;
};

Clock.prototype.offset = function(_) {
	if (!arguments.length) return this._offset;
	this._offset = +_;
	return this;
};

Clock.prototype.base = function(_) {
	if (!arguments.length) return this._base;
	this._base = _;

	switch (this._base) {
		case "sexagesimal":
			this.digits([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
			break;
		case "24":
			this.digits([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0]);
			break;
		case "decimal":
			this.digits([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
			break;
		case "hexadecimal":
			this.digits([1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', 'E', 'F', 0]);
			break;
	}

	return this;
};

Clock.prototype.radius = function(_) {
	if (!arguments.length) return this._radius;
	this._radius = +_;
	return this;
};

Clock.prototype.hoursHand = function(_) {
	if (!arguments.length) return this.showHoursHand;
	this.showHoursHand = !!_;
	return this;
};

Clock.prototype.minutesHand = function(_) {
	if (!arguments.length) return this.showMinutesHand;
	this.showMinutesHand = !!_;
	return this;
};

Clock.prototype.hoursTicks = function(_) {
	if (!arguments.length) return this.showHoursTicks;
	this.showHoursTicks = !!_;
	return this;
};

Clock.prototype.minutesTicks = function(_) {
	if (!arguments.length) return this.showMinutesTicks;
	this.showMinutesTicks = !!_;
	return this;
};

Clock.prototype.hoursDigits = function(_) {
	if (!arguments.length) return this.showHoursDigits;
	this.showHoursDigits = !!_;
	return this;
};

Clock.prototype.minutesDigits = function(_) {
	if (!arguments.length) return this.showMinutesDigits;
	this.showMinutesDigits = !!_;
	return this;
};

Clock.prototype.secondsHand = function(_) {
	if (!arguments.length) return this.showSecondsHand;
	this.showSecondsHand = !!_;
	return this;
};

Clock.prototype.smooth = function(_) {
	if (!arguments.length) return this._smooth;
	this._smooth = !!_;
	return this;
};

Clock.prototype.rotateDigits = function(_) {
	if (!arguments.length) return this._rotateDigits;
	this._rotateDigits = !!_;
	return this;
};

Clock.prototype.digits = function(_) {
	if (!arguments.length) return this._digits;
	this._digits = _;
	return this;
};

Clock.prototype.draw = function() {
	this.element.classList.add("clock");
	this.element.classList.add(this._base);

	var face = document.createElementNS(this.svgNS, "circle");
	face.classList.add("face");
	face.setAttribute("cx", this._radius);
	face.setAttribute("cy", this._radius);
	face.setAttribute("r", this._radius);
	this.element.appendChild(face);

	switch (this._base) {
		case "sexagesimal":
			if (this.showMinutesDigits) {
				this.drawNumbers([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 0], 0.3, "minute");
			}
			if (this.showMinutesTicks) {
				this.drawTicks(60, 0.06, "minute");
			}

			if (this.showHoursDigits) {
				this.drawNumbers(this._digits, 0.175, "hour");
			}
			if (this.showHoursTicks) {
				this.drawTicks(12, 0.08, "hour");
			}
			break;
		case "24":
			if (this.showMinutesDigits) {
				this.drawNumbers([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 0], 0.3, "minute");
			}
			if (this.showMinutesTicks) {
				this.drawTicks(60, 0.06, "minute");
			}

			if (this.showHoursDigits) {
				this.drawNumbers(this._digits, 0.175, "hour");
			}
			if (this.showHoursTicks) {
				this.drawTicks(12, 0.08, "hour");
			}
			break;
		case "decimal":
			if (this.showMinutesDigits) {
				this.drawNumbers([10, 20, 30, 40, 50, 60, 70, 80, 90, '00'], 0.3, "minute");
			}
			if (this.showMinutesTicks) {
				this.drawTicks(100, 0.06, "minute");
			}

			if (this.showHoursDigits) {
				this.drawNumbers(this._digits, 0.175, "hour");
			}
			if (this.showHoursTicks) {
				this.drawTicks(10, 0.08, "hour");
			}
			break;
		case "hexadecimal":
			if (this.showMinutesDigits) {
				this.drawNumbers([1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', 'E', 'F', 0], 0.3, "minute");
			}
			if (this.showMinutesTicks) {
				// There are 256 minutes in an hexadecimal hour
				// but 128 ticks is more reasonable
				this.drawTicks(128, 0.06, "minute");
			}

			if (this.showHoursDigits) {
				this.drawNumbers(this._digits, 0.175, "hour");
			}
			if (this.showHoursTicks) {
				this.drawTicks(16, 0.08, "hour");
			}
			break;
	}

	var hours = document.createElementNS(this.svgNS, "line");
	hours.classList.add("hours");
	hours.classList.add("hand");
	hours.setAttribute("x1", this._radius);
	hours.setAttribute("y1", this._radius * 0.4);
	hours.setAttribute("x2", this._radius);
	hours.setAttribute("y2", this._radius);
	this.element.appendChild(hours);
	this.hoursHand = new ClockHand(hours, this._radius, this._radius * 0.4);

	var minutes = document.createElementNS(this.svgNS, "line");
	minutes.classList.add("minutes");
	minutes.classList.add("hand");
	minutes.setAttribute("x1", this._radius);
	minutes.setAttribute("y1", this._radius * 0.1);
	minutes.setAttribute("x2", this._radius);
	minutes.setAttribute("y2", this._radius);
	this.element.appendChild(minutes);
	this.minutesHand = new ClockHand(minutes, this._radius, this._radius * 0.1);

	if (this.showSecondsHand) {
		var seconds = document.createElementNS(this.svgNS, "line");
		seconds.classList.add("seconds");
		seconds.classList.add("hand");
		seconds.setAttribute("x1", this._radius);
		seconds.setAttribute("y1", this._radius * 0.1);
		seconds.setAttribute("x2", this._radius);
		seconds.setAttribute("y2", this._radius);
		this.element.appendChild(seconds);
		this.secondsHand = new ClockHand(seconds, this._radius, this._radius * 0.1);
	}

	return this;
};

Clock.prototype.drawTicks = function(n, length, cl) {
	var degrees = 360 / n;

	for (var i = degrees; i <= 360; i += degrees) {
		var line = document.createElementNS(this.svgNS, "line");
		line.classList.add("tick");
		if (cl) {
			line.classList.add(cl);
		}
		line.setAttribute("x1", this._radius);
		line.setAttribute("y1", 0);
		line.setAttribute("x2", this._radius);
		line.setAttribute("y2", this._radius * length);
		line.setAttribute("transform", "rotate(" + i + ", " + this._radius + ", " + this._radius + ")");

		this.element.appendChild(line);
	}

	return this;
};

Clock.prototype.drawNumbers = function(numbers, distance, cl) {
	var degrees = 360 / numbers.length;

	var n = 0;
	for (var i = degrees; i <= 360; i += degrees, n++) {
		var outerWrapper = document.createElementNS(this.svgNS, "g");
		outerWrapper.classList.add("letter");
		if (cl) {
			outerWrapper.classList.add(cl);
		}
		outerWrapper.setAttribute("transform", "rotate(" + i + ", " + this._radius + ", " + this._radius + ")");

		var innerWrapper = document.createElementNS(this.svgNS, "g");

		innerWrapper.setAttribute("transform", "translate(" + this._radius + ", " + (this._radius * distance) + ")");
		
		var text = document.createElementNS(this.svgNS, "text");
		text.textContent = numbers[n];
		if (!this._rotateDigits) {
			text.setAttribute("transform", "rotate(-" + i + ")");
			text.setAttribute("dominant-baseline", "central");
		} else {
			text.setAttribute("transform", "translate(0, " + (this._radius * 0.05) + ")");
		}
		text.style.textAnchor = "middle";
		
		innerWrapper.appendChild(text);
		outerWrapper.appendChild(innerWrapper);
		this.element.appendChild(outerWrapper);
	}

	return this;
};

Clock.prototype.adjustHandsSexagesimal = function(time) {
	var sexagesimalSeconds = (time.getTime() / 1000)
		+ this._offset;

	if (!this._smooth) {
		sexagesimalSeconds = Math.floor(sexagesimalSeconds);
		// We need only seconds precision here, so the hand moves
		// at one second intervals instead of continously.
	}

	var hours = (sexagesimalSeconds / 3600) % 24;
	var minutes = (sexagesimalSeconds / 60) % 60;

	if (this.lastTick != sexagesimalSeconds || this._smooth) {
		if (this.hoursHand) {
			var hoursAngle = (hours % 12) / 12 * 360;
			this.hoursHand.advanceTo(hoursAngle);
		}

		if (this.minutesHand) {
			var minutesAngle = (minutes) / 60 * 360;
			this.minutesHand.advanceTo(minutesAngle);
		}

		if (this.secondsHand) {
			var secondsAngle = (sexagesimalSeconds % 60) / 60 * 360;
			this.secondsHand.advanceTo(secondsAngle);
		}

		if (this.lastTick != Math.floor(sexagesimalSeconds)) {
			this.lastTick = Math.floor(sexagesimalSeconds);

			var h = (hours % 24) < 10 ? '0' + Math.floor(hours % 24) : Math.floor(hours % 24);
			var m = (minutes % 60) < 10 ? '0' + Math.floor(minutes % 60) : Math.floor(minutes % 60);
			var s = (sexagesimalSeconds % 60) < 10 ? '0' + Math.floor(sexagesimalSeconds % 60) : Math.floor(sexagesimalSeconds % 60);
			this._string = h + ":" + m + ":" + s;

			this.hours = Math.floor(hours % 24);
			this.minutes = Math.floor(minutes % 60);
			this.seconds = Math.floor(sexagesimalSeconds % 60);

			this.tickEvent();
		}
	}

	return this;
};

Clock.prototype.adjustHands24 = function(time) {
	var sexagesimalSeconds = (time.getTime() / 1000)
		+ this._offset;

	if (!this._smooth) {
		sexagesimalSeconds = Math.floor(sexagesimalSeconds);
		// We need only seconds precision here, so the hand moves
		// at one second intervals instead of continously.
	}

	var hours = sexagesimalSeconds / 3600;
	var minutes = sexagesimalSeconds / 60;

	if (this.lastTick != sexagesimalSeconds || this._smooth) {
		if (this.hoursHand) {
			var hoursAngle = (hours % 24) / 24 * 360;
			this.hoursHand.advanceTo(hoursAngle);
		}

		if (this.minutesHand) {
			var minutesAngle = (minutes % 60) / 60 * 360;
			this.minutesHand.advanceTo(minutesAngle);
		}

		if (this.secondsHand) {
			var secondsAngle = (sexagesimalSeconds % 60) / 60 * 360;
			this.secondsHand.advanceTo(secondsAngle);
		}

		if (this.lastTick != Math.floor(sexagesimalSeconds)) {
			this.lastTick = Math.floor(sexagesimalSeconds);

			var h = (hours % 24) < 10 ? '0' + Math.floor(hours % 24) : Math.floor(hours % 24);
			var m = (minutes % 60) < 10 ? '0' + Math.floor(minutes % 60) : Math.floor(minutes % 60);
			var s = (sexagesimalSeconds % 60) < 10 ? '0' + Math.floor(sexagesimalSeconds % 60) : Math.floor(sexagesimalSeconds % 60);
			this._string = h + ":" + m + ":" + s;

			this.hours = Math.floor(hours % 24);
			this.minutes = Math.floor(minutes % 60);
			this.seconds = Math.floor(sexagesimalSeconds % 60);

			this.tickEvent();
		}
	}

	return this;
};

Clock.prototype.adjustHandsDecimal = function(time) {
	var sexagesimalSeconds = (time.getTime() / 1000)
		+ 560.921;
		// Paris meridian is exactly 9 minutes and 20.921
		// seconds east of Greenwich, which is the reference
		// for Unix time returned by time.getTime()
	
	// Taking milliseconds into account is absolutely necessary
	// here, as decimal seconds are slightly shorter than sexagesimal
	// seconds. If we only have sexagesimal second precision, then
	// the decimal seconds hand will sometimes skip a second, one out
	// of eight ticks or so (a decimal second is ~0.8 sexagesimal
	// seconds).
	
	// Clock offset is not taken into account here, because it
	// doesn't make sense to use it as decimal time is fundamentally
	// not affected by time zones, it only has standard time which is
	// supposed to be used around the world. Hypothetical time zones
	// would have to be different from the current 24 timezones anyway.

	var decimalDay = (sexagesimalSeconds / (3600 * 24))

	var decimalHours = decimalDay * 10;
	var decimalMinutes = (decimalHours - Math.floor(decimalHours)) * 100;
	var decimalSeconds = decimalDay * 100000;

	if (this.lastTick != decimalSeconds || this._smooth) {
		if (this.hoursHand) {
			var hoursAngle = (decimalHours % 10) / 10 * 360;;
			this.hoursHand.advanceTo(hoursAngle);
		}

		if (this.minutesHand) {
			var minutesAngle = (decimalMinutes % 100) / 100 * 360;
			this.minutesHand.advanceTo(minutesAngle);
		}

		if (this.secondsHand) {
			var secondsAngle = (decimalSeconds % 100) / 100 * 360;

			if (!this._smooth) {
				// Round angle so the hand moves at one decimal second
				// intervals rather than continously. The timer needs to
				// be fast enough, anything less than 100ms will show
				// jitter.
				secondsAngle = Math.floor(secondsAngle / 3.6) * 3.6;
			}
			this.secondsHand.advanceTo(secondsAngle);
		}

		if (this.lastTick != Math.floor(decimalSeconds)) {
			this.lastTick = Math.floor(decimalSeconds);

			var m = (decimalMinutes % 100) < 10 ? '0' + Math.floor(decimalMinutes % 100) : Math.floor(decimalMinutes % 100);
			var s = (decimalSeconds % 100) < 10 ? '0' + Math.floor(decimalSeconds % 100) : Math.floor(decimalSeconds % 100);

			this._string = Math.floor(decimalHours % 10)
				   + "," + m
				   + "," + s;

			this.hours = Math.floor(decimalHours % 10);
			this.minutes = Math.floor(decimalMinutes % 100);
			this.seconds = Math.floor(decimalSeconds % 100);

			this.tickEvent();
		}
	}

	return this;
};

Clock.prototype.adjustHandsHexadecimal = function(time) {
	var sexagesimalSeconds = (time.getTime() / 1000)
		+ this._offset;

	// Taking milliseconds into account is absolutely necessary
	// here, as hexadecimal seconds are longer than sexagesimal
	// seconds.

	var hexadecimalDay = (sexagesimalSeconds / (3600 * 24))

	var hexadecimalHours = hexadecimalDay * 16;
	var hexadecimalMaximes = (hexadecimalHours - Math.floor(hexadecimalHours)) * 16;
	var hexadecimalMinutes = (hexadecimalMaximes - Math.floor(hexadecimalMaximes)) * 16;
	var hexadecimalSeconds = (hexadecimalMinutes - Math.floor(hexadecimalMinutes)) * 16;

	if (this.lastTick != hexadecimalSeconds || this._smooth) {
		if (this.hoursHand) {
			var hoursAngle = (hexadecimalHours % 16) / 16 * 360;;
			this.hoursHand.advanceTo(hoursAngle);
		}

		if (this.minutesHand) {
			var minutesAngle = (hexadecimalMaximes % 16) / 16 * 360;
			this.minutesHand.advanceTo(minutesAngle);
		}

		if (this.secondsHand) {
			// We're actually displaying hexadecimal minutes here, moving
			// the hand once every hexadecimal second. So the tick length
			// stays useful, but the hand position also shows something
			// more useful than just the 16 seconds in a minute.
			var secondsAngle = (hexadecimalMinutes % 16) / 16 * 360;

			if (!this._smooth) {
				// Round angle so the hand moves at one second
				// intervals rather than continously. The timer needs to
				// be fast enough, anything less than 100ms will show
				// jitter.
				secondsAngle = Math.floor(secondsAngle / 1.40625) * 1.40625;
			}
			this.secondsHand.advanceTo(secondsAngle);
		}

		if (this.lastTick != Math.floor(hexadecimalSeconds)) {
			this.lastTick = Math.floor(hexadecimalSeconds);

			this._string = (Math.floor(hexadecimalHours % 16).toString(16)
				   + "_" + Math.floor(hexadecimalMaximes).toString(16)
				   + ""  + Math.floor(hexadecimalMinutes).toString(16)
				   + "_" + Math.floor(hexadecimalSeconds).toString(16)).toUpperCase();

			this.hours = Math.floor(hexadecimalSeconds % 16);
			this.minutes = Math.floor(hexadecimalMaximes);
			this.seconds = Math.floor(hexadecimalSeconds);

			this.tickEvent();
		}
	}

	return this;
};

Clock.prototype.tickEvent = function() {
	if (CustomEvent && this.element.dispatchEvent) {
		this.element.dispatchEvent(new CustomEvent('clockTick', { 'detail' : this }));
	}
}

Clock.prototype.toString = function() {
	return this._string;
};

Clock.prototype.adjustHands = function(time) {
	switch (this._base) {
		case "sexagesimal":
			return this.adjustHandsSexagesimal(time);
		case "24":
			return this.adjustHands24(time);
		case "decimal":
			return this.adjustHandsDecimal(time);
		case "hexadecimal":
			return this.adjustHandsHexadecimal(time);
	}

	return this;
};

Clock.prototype.start = function() {
	var that = this;

	var interval = 50;
	switch (this.base) {
		case "decimal":
			interval = 54;
			// an exact multiple of 864ms (1 decimal second)
			break;
		case "hexadecimal":
			interval = 60;
			// close to a 22nd of 131.8359375ms (1 hexa second)
			break;
	}

	this.timer = ClockTimer.addCallback(function(time) {
		that.adjustHands(time);
	}, interval, this.element);

	return this;
};

Clock.prototype.stop = function() {
	ClockTimer.removeCallback(this.timer);
	this.timer = undefined;

	return this;
};

Clock.prototype.display = function(date) {
	this.adjustHands(date);

	return this;
};

