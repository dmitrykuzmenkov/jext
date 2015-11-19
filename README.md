JEXT - Javascript ex DOM templater
======

JEXT is tool for using html templates as JS files with DOM rendered elements and special helper to manipulate real time data updates.

## Installing
To install JEXT you have to just run npm in your project dir:

```bash
npm install jext ---save-dev
```

## Usage
### Sample usage with bin tool
You have test.html example template. To build it just use jext bin tool:

```bash
./bin/jext examples/simple.jext > templates.js
```

Now merge jext.js lib with generated template

```bash
cat ./jext.js templates.js > bundle.js
```

Well you can do same as above with one command:

```bash
./bin/jext examples/simple.jext -b > bundle.js
```

Finally require in browser just created the bundle.js file.
You got jext variable defined with template pool manipulation helpers and templates variable with your template.

Now just get rendered DOM and append to any element. The key of template same as file name without extension.

```javascript
var t = templates.get('examples/simple');
document.body.appendChild(t.dom());
```

Wanna update some parameters? Easy:

```javascript
t.update({welcome_text: 'JEXT works!'});
```

Now you can see rendered test template on your screen.

## Template markup
You can use only simple constructs in your html template.

### Variables
Just use {{ var_name }} in attribute or inside element to make it works.
```html
<div title="{{ title }}">{{ body }}</div>
```

### Iteration
When making iteration inside template JEXT switching context inside iterated object. So only possible to access object variables of current iterated item.

```json
  {
    "rows": [
      {"value": 1},
      {"value": 2}
    ]
  }
```

```html
<div for="rows">
  The value is: {{ value }}
</div>
```

You know what will be as result? :)

### Condition
Condition switches context as iteration. Its same easy to use.

```json
  {
    "first": false,
    "second": {
      "value": 2
    }
  }
```

```html
  <div if="first">
    First block wont appear here
  </div>
  <div if="second">
    In context of second condition: {{ value }}
  </div>
```
