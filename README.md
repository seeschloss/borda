# Borda #
Borda is a JavaScript class for drawing animated SVG clocks, with enough parameters
to allow customising the look of the clock while trying not to get in the way of
CSS styling.

## Usage ##

### new Clock(element) ###
Creates a clock using the given SVG element.

```html
<svg>
   <g id="clock"></g>
</svg>
<script>
  var clock = new Clock(document.querySelector("#clock"));
</script>
```

### .draw() ###
Creates the various SVG elements used for the clock.

### .start() ###
Starts the clock.

### Parameters ###

#### .radius(int) ####
Radius of the clock face, in pixels (default `50`).

#### .base(string) ####
Clock base, can be "sexagesimal" (regular clocks) or "decimal" (to display French revolutionary time) (default `sexagesimal`).

#### .hoursTicks(bool) ####
Show hours ticks (12 for sexagesimal clocks, 10 for decimal clocks) (default `true`).

#### .hoursDigits(bool) ####
Show hours digits (default `true`).

#### .minutesHand(bool) ####
Show minutes hand (default `true`).

#### .minutesTicks(bool) ####
Show minutes ticks (60 for sexagesimal clocks, 100 for decimal clocks) (default `false`).

#### .minutesDigits(bool) ####
Show minutes digits (0-55 for sexagesimal clocks by default, 00-90 for decimal clocks) (default `false`).

#### .secondsHand(bool) ####
Show seconds hand (default `true`).

#### .rotateDigits(bool) ####
Rotate digits so they follow the face's curvature (default `false`).

#### .digits(array) ####
Specify the digits to use for the hours. All array elements will be evenly spaced along the clock face, ending at top center.   
You could have a clock with roman numerals by passing `['I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']`
to this option, or only four digits by passing `[3, 6, 9, 12]` (default is arabic numerals depending on clock base).

## Examples ##

### Regular modern clock ###
```javascript
new Clock(element)
  .draw().start();
```
![](https://down.xn--wda.fr/2016-10-18/s6BY1QIZa.png)

### Roman numerals ###
```javascript
new Clock(element)
  .digits(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'])
  .rotateDigits(true)
  .secondsHand(false)
  .draw().start();
```
![](https://down.xn--wda.fr/2016-10-18/3JXFSnZ7wt.png)

### French revolutionary clock ###
```javascript
new Clock(element)
  .base("decimal")
  .minutesTicks(true)
  .minutesDigits(true)
  .draw().start();
```
![](https://down.xn--wda.fr/2016-10-18/4YkCwt01nK.png)
