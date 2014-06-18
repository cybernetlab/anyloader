# AnyLoader

AnyLoader is a small JavaScript library for loading object and arrays from anythere. Sources supported for loading:

* URL, pointed to HTML or JSON file
* string containing HTML or JSON
* jQuery nodeset
* plain JavaScript object or array

## Requirements

`anyloader` requires `underscore` and `jquery`.

## Usage

`anyloader` provides `LoaderFactory` function to global namespace (or via `amd` if you use `require.js`). You can create a number of loaders with this function and then use this loaders in code.

### 1. Include scripts

for simple browser loading:

```html
<script type="text/javascript" src="jquery.min.js"></script>
<script type="text/javascript" src="underscore.min.js"></script>
<script type="text/javascript" src="anyloader.min.js"></script>
```

for `amd`:

```js
define(['anyloader'], function(LoaderFactory) {
    ...
});
```

### 2. Create loader

```js
var loadObject = LoaderFactory();
```

### 3. Use it

```js
loadObject('<div name="x">10</div><div name="y">20</div>')
    .done(function(obj) {
        console.log(obj); // => { x: '10', y: '20' }
    });

loadObject('<div>10</div><div>20</div>')
    .done(function(obj) {
        console.log(obj); // => [ '10', '20' ]
    });

loadObject('{ "x": 10, "y": 20 }')
    .done(function(obj) {
        console.log(obj); // => { x: 10, y: 20 }
    });
```

All loaders returns jQuery deferreds that resolves with loaded objects or arrays (In case of local parsing like in example above this would be happen immediatly).

Each argument passed to loader function, firstly parsed with set of parser functions and then composed to result object or array. You can override any parser or composer in factory options:

```js
var loadObject = LoaderFactory({
        'parse:html': function(html) { return [1, 2, 3]; }
    });
loadObject('<div class="any html">test</div>'); // => [1, 2, 3]
loadObject('some string');                      // => 'some string'

var loadObject = LoaderFactory({
        'parse:html': function(html) { return [1, 2, 3]; },
        'parse:string': function(str) { return { one: 1, two: 2 }; },
        'compose:array': function(arr) { return arr.reverse(); }
        'compose:object[some]': function(v) { return v + 10; }
    });
loadObject('<div class="any html">test</div>'); // => [3, 2, 1]
loadObject('some string');                      // => { one: 11, two: 2 }
```

Available parsers are: `parse`, `parse:string`, `parse:html`, `parse:uri`, `parse:json`, `parse:jquery`, `parse:array` and `parse:object`.

Available composers are: `compose`, `compose:object`, `compose:object[]`, `compose:object[KEY_NAME]`, `compose:array`, `compose:array[]`, `compose:string` and `compose:deferred`.

While parsing HTML, `anyloader` assumes that field names placed in any of `name`, `id` or `data-name` attributes. If where are no elements with such attributes, `anyloader` will create plain array with values, collected from each top-level element.

Detailed documentation will be available soon.
