# Borda #
Borda is a JavaScript class for drawing animated SVG clocks, with enough parameters
to allow customising the look of the clock while trying not to get in the way of
CSS styling.

## Usage ##

<dl>
  <dt>new Clock(element)</dt>
  <dd>Creates a clock using the given SVG element.</dd>
  <dd><i>element</i> should be a container SVG element, either <code>g</code> or directly the <code>svg</code> node.</dd>
</dl>

```html
<svg>
   <g id="clock"></g>
</svg>
<script>
  var clock = new Clock(document.querySelector("#clock"));
</script>
```

<dl>
  <dt>.draw()</dt>
  <dd>Creates the various SVG elements used for the clock.</dd>

  <dt>.start()</dt>
  <dd>Starts the clock, using actual browser time.</dd>
  
  <dt>.stop()</dt>
  <dd>Stops the clock.</dd>
  
  <dt>.display(Date)</dt>
  <dd>Displays time of given date on the clock.</dd>
</dl>

### Parameters ###

<dl>
  <dt>.radius(int)</dt>
  <dd>Radius of the clock face, in pixels (default <code>50</code>).</dd>

  <dt>.base(string)</dt>
  <dd>Clock base, can be "sexagesimal" (regular clocks), "24" (24-hour clock face) or "decimal" (French revolutionary time) (default <code>sexagesimal</code>).</dd>

  <dt>.hoursTicks(bool)</dt>
  <dd>Show hours ticks (12 for sexagesimal clocks, 24 for 24-hour clocks, 10 for decimal clocks) (default <code>true</code>).</dd>

  <dt>.hoursDigits(bool)</dt>
  <dd>Show hours digits (default <code>true</code>).</dd>

  <dt>.minutesHand(bool)</dt>
  <dd>Show minutes hand (default <code>true</code>).</dd>

  <dt>.minutesTicks(bool)</dt>
  <dd>Show minutes ticks (60 for sexagesimal clocks, 100 for decimal clocks) (default <code>false</code>).</dd>

  <dt>.minutesDigits(bool)</dt>
  <dd>Show minutes digits (0-55 for sexagesimal clocks by default, 00-90 for decimal clocks) (default <code>false</code>).</dd>

  <dt>.secondsHand(bool)</dt>
  <dd>Show seconds hand (default <code>true</code>).</dd>

  <dt>.rotateDigits(bool)</dt>
  <dd>Rotate digits so they follow the face's curvature (default <code>false</code>).</dd>

  <dt>.digits(array)</dt>
  <dd>Specify the digits to use for the hours. All array elements will be evenly spaced along the clock face, ending at top center.</dd>
  <dd>You could have a clock with roman numerals by passing <code>['I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']</code> to this option, or only four digits by passing <code>[3, 6, 9, 12]</code> (default is arabic numerals depending on clock base).</dd>
</dl>

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
