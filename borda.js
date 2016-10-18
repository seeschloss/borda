var ClockHand = function(element, radius) {
	this.element = element;
	this.radius = radius;

	var _currentDegrees = undefined;
};

ClockHand.prototype.setAngle = function(degrees) {
	this.element.setAttribute('transform', "rotate(" + degrees + ", " + this.radius + ", " + this.radius + ")");
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
			var duration = 100; // milliseconds
			var ticks = 10;
			var tickLength = duration/ticks;
			var stepAngle = difference/ticks;

			var that = this;
			var currentAngle = this._currentDegrees;

			this.moving = true;
			var advanceOneStep = function() {
				currentAngle += stepAngle;
				that.setAngle(currentAngle);

				if (currentAngle < (that._currentDegrees + difference)) {
					setTimeout(advanceOneStep, tickLength);
				} else {
					that._currentDegrees = degrees % 360;
					that.moving = false;
				}
			};
			advanceOneStep();
		}
	}

	return this;
};

var Clock = function(element) {
	this.svgNS = element.namespaceURI;
	this.element = element;

	this._base = "sexagesimal";
	this._radius = 50;

	this.showHoursHand = true;
	this.showHoursTicks = true;
	this.showHoursDigits = true;

	this.showMinutesHand = false;
	this.showMinutesTicks = false;
	this.showMinutesDigits = false;

	this._rotateDigits = false;

	this.showSecondsHand = true;
};

Clock.prototype.base = function(_) {
	if (!arguments.length) return this._base;
	this._base = _;

	switch (this._base) {
		case "sexagesimal":
			this.digits([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
			break;
		case "decimal":
			this.digits([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
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
		case "decimal":
			if (this.showMinutesDigits) {
				this.drawNumbers([10, 20, 30, 40, 50, 60, 70, 80, 90, 00], 0.3, "minute");
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
	}

	var hours = document.createElementNS(this.svgNS, "line");
	hours.classList.add("hours");
	hours.classList.add("hand");
	hours.setAttribute("x1", this._radius);
	hours.setAttribute("y1", this._radius * 0.4);
	hours.setAttribute("x2", this._radius);
	hours.setAttribute("y2", this._radius);
	this.element.appendChild(hours);
	this.hours = new ClockHand(hours, this._radius);

	var minutes = document.createElementNS(this.svgNS, "line");
	minutes.classList.add("minutes");
	minutes.classList.add("hand");
	minutes.setAttribute("x1", this._radius);
	minutes.setAttribute("y1", this._radius * 0.1);
	minutes.setAttribute("x2", this._radius);
	minutes.setAttribute("y2", this._radius);
	this.element.appendChild(minutes);
	this.minutes = new ClockHand(minutes, this._radius);

	if (this.showSecondsHand) {
		var seconds = document.createElementNS(this.svgNS, "line");
		seconds.classList.add("seconds");
		seconds.classList.add("hand");
		seconds.setAttribute("x1", this._radius);
		seconds.setAttribute("y1", this._radius * 0.1);
		seconds.setAttribute("x2", this._radius);
		seconds.setAttribute("y2", this._radius);
		this.element.appendChild(seconds);
		this.seconds = new ClockHand(seconds, this._radius);
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
	var sexagesimalSeconds = Math.floor(time.getTime() / 1000)
		- (time.getTimezoneOffset() * 60);
	// We need only seconds precision here, so the hand moves
	// at one second intervals instead of continously. Using
	// absolute time since epoch will prevent jumps due to CSS
	// transitions around midnight.

	var hours = sexagesimalSeconds / 3600;
	var minutes = sexagesimalSeconds / 60;

	if (this.hours) {
		var hoursAngle = (hours % 12) / 12 * 360;
		this.hours.advanceTo(hoursAngle);
	}

	if (this.minutes) {
		var minutesAngle = (minutes % 60) / 60 * 360;
		this.minutes.advanceTo(minutesAngle);
	}

	if (this.seconds) {
		var secondsAngle = (sexagesimalSeconds % 60) / 60 * 360;
		this.seconds.advanceTo(secondsAngle);
	}

	return this;
};

Clock.prototype.adjustHandsDecimal = function(time) {
	var sexagesimalSeconds = (time.getTime() / 1000)
		- (time.getTimezoneOffset() * 60);
	// Taking milliseconds into account is absolutely necessary
	// here, as decimal seconds are slightly shorter than sexagesimal
	// seconds. If we only have sexagesimal second precision, then
	// the decimal seconds hand will sometimes skip a second, one out
	// of eight ticks or so (because a decimal second is ~0.8 sexagesimal
	// seconds).

	var decimalDay = (sexagesimalSeconds / (3600 * 24))

	var decimalHours = decimalDay * 10;
	var decimalMinutes = (decimalHours - Math.floor(decimalHours)) * 100;

	if (this.hours) {
		var hoursAngle = (decimalHours % 10) / 10 * 360;;
		this.hours.advanceTo(hoursAngle);
	}

	if (this.minutes) {
		var minutesAngle = (decimalMinutes % 100) / 100 * 360;
		this.minutes.advanceTo(minutesAngle);
	}

	if (this.seconds) {
		var secondsAngle = (decimalDay * 100000 % 100) / 100 * 360;

		// Round angle so the hand moves at one decimal second
		// intervals rather than continously. The timer needs to
		// be fast enough, anything less than 100ms will show
		// jitter.
		secondsAngle = Math.floor(secondsAngle / 3.6) * 3.6;
		this.seconds.advanceTo(secondsAngle);
	}

	return this;
};

Clock.prototype.adjustHands = function(time) {
	switch (this._base) {
		case "sexagesimal":
			return this.adjustHandsSexagesimal(time);
		case "decimal":
			return this.adjustHandsDecimal(time);
	}

	return this;
};

Clock.prototype.start = function() {
	var that = this;
	this.timer = setInterval(function() {
		that.adjustHands(new Date());
	}, 50);

	return this;
};

