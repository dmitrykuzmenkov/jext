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
./bin/jext test.html > test.js
```

Now merge jext.js lib with generated template

```bash
cat ./jext.js test.js > bundle.js
```

Finally require in browser just created the bundle.js file.
You got jext variable defined with template pool manipulation helpers and templates variable with your template.

Now just get rendered DOM and append to any element. The key of template same as file name without extension.

```javascript
var t = templates.get('test');
document.body.appendChild(t.dom());
```

Wanna update some parameters? Easy:

```javascript
t.update({welcome_text: 'JEXT works!'});
```

Now you can see rendered test template on your screen.
