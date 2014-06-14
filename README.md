# AnyLoader

AnyLoader is a small JavaScript library for loading object from anythere. Supported sources for loading is:

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

All loaders returns jQuery deferreds that resolves with loaded objects (In case of local parsing like in example above this would be happen immediatly).

While parsing HTML, `anyloader` assumes that field names placed in any of `name`, `id` or `data-name` attributes. If where are no elements with such attributes, `anyloader` will create plain array with values, collected from each top-level element.

If you need other behaviour, you can pass `parse` callback while creating loader and it will be called for any HTML argument, passed to loader. You should return plain object or jQuery nodeset from this callback and it will be used in subsequent processing:

```js
var loadObject = LoaderFactory({ parse: function(str) {
    console.log(str); // => '<some><complex><html /></complex></some>'
    return { x: 10 };
}});

loadObject('<some><complex><html /></complex></some>')
    .done(function(obj) {
        console.log(obj); // => { x: 10 }
    });
```

Also you can override object creation with `create` callback:

```js
var loadObject = LoaderFactory({ create: function(obj) {
    console.log(obj); // => { x: 10, y: 10 }
    return { left: obj.x, top: obj.y };
}});

loadObject('{ "x": 10, "y": 20 }')
    .done(function(obj) {
        console.log(obj); // => { left: 10, top: 20 }
    });
```

