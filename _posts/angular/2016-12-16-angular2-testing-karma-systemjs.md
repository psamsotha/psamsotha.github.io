---
layout: post
categories: angular
category: angular
title: "Angular 2 Testing with Karma and SystemJS"
description: "The Angular 2 Quickstart testing (Karma and SystemJS) configuration will be demystified."
thumb: sideways-building
tags: angular2 karma systemjs
---

Unit testing is a critical part of any piece of software. Writing tests give us confidence that our individual software components act reliably in accordance to specification. An Angular 2 application is no different. We should write unit tests for our components, services, pipes, directives, etc.

The [Angular 2 documentation][testing docs] may be the best source out there for examples (and explanation) of how to write tests for Angular 2 code. There are many examples for many use cases. The one thing that the documentation lacks is an explanation of the configuration of the tests. It only links to a [quickstart][quickstart-github] project, and briefly explains what some of the files are used for. This is great to get started, but if you're like me, you are curious and want to know how things work.

In this article I will walk through the basics of working with the different technologies used to run the Angular tests (from the linked quickstart), and then go through how they all fit together. There are many different ways we can configure testing with different technologies. The aim of this article is to simply try to demystify the configuration in the Angular 2 Quickstart, by explaining the project's configuration, step by step.

This is a hands on guide, and to get the most out of it, you should follow along and write the code and understand it, as I explain it. After reading this article, you should be able to create an Angular project from scratch, using SystemJS as the module loader, and Karma as the test runner for your Angular 2 tests.

I will begin by walking through the basics of Karma, then go through the basics of SystemJS. Afterwards, we will add Angular to the project and then configure the test infrastructure to be able to use Angular in the tests. To follow along, you will need to have [Node][node] installed and have a text editor ready.

>**NOTE:** The complete source code for this article can be found at [**GitHub**](https://github.com/psamsotha/angular2-testing). This project is not meant to be a starter project of any kind. So please do not try to use it as such. Use the [quickstart][quickstart-github] instead. For the best learning experience, this project should only be used as a reference for if you get stuck at any point. It is recommended to write everything yourself.

[testing docs]: https://angular.io/docs/ts/latest/guide/testing.html
[quickstart-github]: https://github.com/angular/quickstart
[node]: https://nodejs.org/en/

### Table of Contents

* [Getting Started with Karma](#karma)
	* [Jasmine Introduction](#jasmine)
	* [Setting up Karma and Running Jasmine Tests](#karma-jasmine)
		* [Karma dependencies](#karma-deps)
		* [Karma Configuration](#karma-config)
		* [Test Results](#test-results)
* [Getting Started with SystemJS](#systemjs)
	* [Intro to Modules](#modules)
	* [SystemJS Quickstart](#systemjs-quickstart)
	* [Importing Modules](#import-modules)
	* [Testing with SystemJS](#systemjs-testing)
		* [karma-test-shim.js](#karma-test-shim)
* [Adding Angular](#angular)
	* [Application Setup](#angular-app)
	* [Testing Setup](#angular-test)
* [Summary](#summary)


{% include ads/in-article-ad.html %}


<a name="karma"></a>

## Getting Started with Karma

[Karma][karma] is test runner. What does this mean? Well if you have ever tested  any Javascript projects before, you may have used a _framework_ like [Mocha][mocha] or [Jasmine][jasmine]. The difference between these two and Karma, is that the frameworks provide the APIs we use in our code to execute tests, while Karma is the one that runs the tests. We could skip Karma and just execute Jasmine or Mocha code in the browser (as it's just plain Javascript), but Karma allows us to run the test from the command line, allowing us to configure different types of test environments.

Let's first walk through an example using Jasmine by itself, then we will use Karma to run the Jasmine tests.

<a name="jasmine"></a>

### Jasmine Introduction

To get started, just create an empty folder, initialize the project with npm and then add the Jasmine dependency.

1. `mkdir angular2-testing`

2. `cd angular2-testing`

3. `npm init` (accept all defaults)

4. `npm install --save-dev jasmine-core lite-server concurrently`

`lite-server` is a just an HTTP server allowing us to run our project on a server (as opposed to just _opening_ the HTML file in the browser). `concurrently` is just a tool allowing us to run multiple npm commands, as you will see in the scripts we write later.

Let's also set up TypeScript right now, as our Angular code will be written in TypeScript. So we'll just get that out of the way right now. All of the code written from here on out, will be written in TypeScript and transpiled to Javascript.

First we need to install TypeScript, and then set up the TypeScript configuration in the `tsconfig.json` file.

    npm install --save-dev typescript core-js @types/node @types/jasmine

We're also installing the TypeScript typings for jasmine and node as we'll need them to compile our TypeScript tests.

Then create a `tsconfig.json` file at the root of the project, and add the following contents

```json
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "moduleResolution": "node",
    "sourceMap": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "lib": [ "es2015", "dom" ],
    "noImplicitAny": true,
    "suppressImplicitAnyIndexErrors": true
  }
}
```

I won't go into anything about this file. You should read the [TypeScript documentation][typescript docs] for a quickstart guide on getting started with TypeScript, if you are unfamiliar with this.

Let's now add some scripts to the `package.json` file, which will allow us to run some basic tasks for our project. Replace the `"scripts"` property in the `package.json` with the following:

```json
"scripts": {
  "start": "tsc && concurrently \"tsc -w\" \"lite-server\" ",
  "test": "npm start",
  "tsc": "tsc"
}
```

The `tsc` command will simply do a one-time compilation of our TypeScript code. The `start` command will compile the TypeScript, watch for any changes, and also run the lite-server to serve up our project artifacts. Since we are just using Jasmine by itself for these initial tests, the `test` command will simply do the same thing as the `start` command, and will run our tests when we open the `index.html` page (that we will create in a moment).

Ok, now the set up is complete, we can get to start writing some code.

Create an `app` folder and inside the `app` folder, create a `counter` folder. Now create a `counter.spec.ts` in the `counter` folder. In the `counter.sepc.ts` file, add the following contents:

```typescript
class Counter {
  _count = 0;

  increment() {
    this._count++;
  }

  decrement() {
    this._count--;
  }

  get value() {
    return this._count;
  }
}
```

You can see this is just a simple class that increments and decrements the state of the counter. Now directly below that class, add the following

```typescript
describe('Counter', () => {
  let counter: Counter;

  beforeEach(() => {
    counter = new Counter();
  });

  it('should increase value of counter when incremented', () => {
    expect(counter.value).toEqual(0);
    counter.increment();
    expect(counter.value).toEqual(1);
  });

  it('should decrease value of counter when decremented', () => {
    expect(counter.value).toEqual(0);
    counter.decrement();
    expect(counter.value).toEqual(-1);
  });
});
```

These are just a couple simple tests to make sure the `decrement` and `increment` function work correctly. I won't get into what the code does. If you have never used Jasmine, please read [the documentation][jasmine].

Also notice that both the `Counter` class and the tests are in the same file. Normally you would have the `Counter` class in a separate `counter.ts` file, and then `import` it into the test file. But that requires module loading, and we are not there yet in our adventure. This will be explored more in the [Getting Started with SystemJS](#systemjs) section.

Now let's compile just to make sure there are no compilation errors. Run

    npm run tsc

There should be no errors. You can now see the transpiled `.js` files right next to the TypeScript `.ts` file, along with the source map.

Now let's set up the Jasmine tests. Add an `index.html` page to the root of the project and add the following contents.

```html
<!doctype html>
<head>
  <meta charset="utf-8">
  <title>Angular 2 Testing</title>

  <link rel="shortcut icon" type="image/png" href="node_modules/jasmine-core/images/jasmine_favicon.png">
  <link rel="stylesheet" href="node_modules/jasmine-core/lib/jasmine-core/jasmine.css">

  <script src="node_modules/jasmine-core/lib/jasmine-core/jasmine.js"></script>
  <script src="node_modules/jasmine-core/lib/jasmine-core/jasmine-html.js"></script>
  <script src="node_modules/jasmine-core/lib/jasmine-core/boot.js"></script>

  <script src="app/counter/counter.spec.js"></script>
</head>
<body>
</body>
</html>
```

Here, we are adding all the required Jasmine files from the node package we installed earlier. We also add the single spec file we created. I won't get too much into explaining these files, because using Jasmine this way, is not the point of this article. This is more for those that are coming from a straight Jasmine background. I thought that seeing this would make for an easier transition to Karma.

Now let's run the test. Simply run `npm run test`, and the files should compile again. Then the server should start, serving up the `index.html` page. If all goes well, you should see the Jasmine test results telling you that everything went well. Two tests passed!

![jasmine-success][jasmine-success]

Awesome! Now that we've seen how to run Jasmine in the browser, let's set up Karma, and use Karma to run the Jasmine tests.

[karma]: https://karma-runner.github.io/1.0/index.html
[mocha]: https://mochajs.org/
[jasmine]: https://jasmine.github.io/
[typescript docs]: http://www.typescriptlang.org/docs/tutorial.html
[jasmine-success]: https://www.dropbox.com/s/v635h5k4woashno/jasmine-success.png?dl=1

<a name="karma-jasmine"></a>

### Setting up Karma and Running Jasmine Tests

<a name="karma-deps"></a>

#### Karma Dependencies

First lets install all the required modules to run Karma

* `karma`
* `karma-cli`
* `karma-jasmine`
* `karma-chrome-launcher`
* `karma-jasmine-html-reporter`

Add all of the above to the install command to install them

    npm install --save-dev <all-of-the-above>

You should also install the Karma CLI globally.

    npm install -g karma-cli

`karma` and `karma-cli` are the core Karma module to run Karma. `karma-jasmine` is the Karma plugin that allows us to run Jasmine tests. Remember that Karma is not dependent on any one testing framework. But most of the time (for Angular projects), you will see the testing framework used is Jasmine.

The `xxx-launcher`s are plugins that correspond to the different browsers you can launch the tests in. For now, we will just use the Chrome launcher, which will start up a Chrome browser to run the tests. But keep in mind that there are also launchers for headless browsers like Chrome.

And finally, the `karma-jasmine-html-reporter` is the Karma plugin that will allow us to produce jasmine HTML reports, like the one in the previous image.

Now we have the dependencies installed, we need to configure Karma. This is done in a `karma.conf.js` file.

<a name="karma-config"></a>

#### Karma Configuration

At the root of the project, create a `karma.conf.js` file and add the following contents into the file.

```js
module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],

    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter')
    ],

    files: [
      'app/counter/counter.spec.js'
    ],

      reporters: ['progress', 'kjhtml'],

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false
  });
};
```

The `karma.conf.js` is a Node module, and when Karma loads it, it will pass a configuration object. We can use this object to configure Karma by calling the `config.set`, passing in a configuration object. All of the available configuration properties are listed in [the karma documentation][karma-conf-docs]. I will quickly go through the ones used above.

* `basePath` - This is the path that Karma will use to resolve files/patterns listed in the `files` (seen above) array and `excludes` (not used here) array. In this case we just use `''`, as we want everything resolved from the root of the project, as seen in the one file listed `app/counter/counter.spec.js`.

* `frameworks` - As mentioned previously, Karma is not tied to any framework, so here, we are listing Jasmine as the testing framework.

* `plugins` - Here we list the plugins that we installed earlier.

* `files` - Explained in following text.

* `reporters` - the `'kjhtml'` reporter uses the `karma-jasmine-html-reporter` we installed earlier. It allows us to see the Karma HTML result when we run the browser.

* The rest should be self explanatory, by the property name. If it is not obvious, please see [the documentation][karma-conf-docs].

I wanted to save the `files` property explanation because it requires a bit of explanation and exploration.

When Karma executes, it starts a web server. All the files include in the `files` array are the files included in the server. If the file is not listed, then it isn't added to the server.  Let's give this a test run, for now ignoring any results (which we will get to later). Let's first add a couple new scripts to the `package.json` file. In the `"scripts"` replace the `"test"` property with the following two

    "test": "tsc && concurrently \"tsc -w\" \"karma start karma.conf.js\"",
    "test-once": "tsc && karma start karma.conf.js --single-run",

The first one will start the Karma server, and stay running while watching files. The second one will just do a single run. We will use the first one for now. Run the following

    npm run test

You should see a Chrome browser launch with something like the following

![karma-connected][karma-connected]

Now as I mentioned, Karma starts a server and adds the files we listed in the `files` array. Let's check it out. Open up a different browser window, and just type into the URL bar

    http://localhost:9876/base/app/counter/counter.spec.js

You should see the source code the `counter.spec.js` file. You may also notice that we used `base` in the URL. The is important to remember for later, as by default, Karma adds `base` as the base path. Now try to type in the URL bar

    http://localhost:9876/base/app/counter/counter.spec.js.map

The file isn't found. You should see NOT FOUND in the browser.. Now try to stop the server, add the `.map` file to the `files` array, and restart the server. Now try to go to the URL. You should see now see the contents of the `.map` file. When you're done, just remove the `.map` file from the `files` array.

Let's now look at another way to add files to `files` array. Beside from just listing the file as a string, we can also use an object. See [the files documentation][karma-files] for all the properties. I will just list three

* `pattern` - This can be a file, or a pattern (using [glob pattern matching][glob-pattern]).

* `included` - Explained below.

* `watched` - Whether Karma should watch this file for changes (and restart if any change is detected).

Lets change the configuration of the `files` array to:

```js
files: [
  { pattern: 'app/counter/counter.spec.js', included: true, watched: true }
]
```

This will have the exact same effect as if we were to just use the single string file name. The default for `includeed` is true, and the default for `watched` is true. Let's check out what the `included` really means. Start Karma again (stop first if needed - configuration changes requires a restart).

    npm run test

In the Chrome window, after you see that Karma is connection, open the Chrome developer tools with <kbd>f12</kbd>. Now open the "Network" tab and refresh the browser. On the left, in the list of all the files retrieved on the refresh, you should see a `context.html` page. Click on it to open the contents.

![karma-include][karma-include]

If you look at the right hand side, you will also notice that the `counter.spec.js` file is added as a `<script>`. This is what the `included` means. To run the tests, Karma uses an HTML page to load the scripts into the browser so that the scripts can run.

So why _wouldn't_ we want the file added as a `<script>`? Well, when using SystemJS (as we'll see later) in an application, we don't add the files as `<script>`s in the `index.html` page. SystemJS loads the files dynamically at runtime when the files are needed. So when using SystemJS and Karma, we do the same.

<a name="test-results"></a>

#### Test Results

So most of the discussion so far has been about configuration. As for the results, there's really not much to discuss. If you start Karma again, and you look in the terminal, you should see the results at the bottom.

    Chrome 54.0.2840 (Windows 10 0.0.0): Executed 2 of 2 SUCCESS (0.295 secs / 0.016 secs)

If you want to view the Jasmine HTML report, click on the <kbd>Debug</kbd> button in the Chrome Browser. You should see a similar result as the one earlier.

So that was your introduction to Karma. Next we will explore SystemJS, and then see how we would use it with Karma.


[karma-conf-docs]: https://karma-runner.github.io/1.0/config/configuration-file.html
[karma-files]: https://karma-runner.github.io/1.0/config/files.html
[karma-connected]: https://www.dropbox.com/s/b5cpcf04e4kiwhf/karma-connected.png?dl=1
[karma-include]: https://www.dropbox.com/s/qp9m5libzvkt67l/karma-include.png?dl=1
[glob-pattern]: https://github.com/isaacs/node-glob


{% include ads/post-in-article-banner-1.html %}


<a name="systemjs"></a>

## Getting Started with SystemJS

SystemJS is a module loader. So what is a module? From the [SystemJS docs][module-docs]:

>A module is simply a JavaScript file written with module syntax. Modules _export_ values, which can then be _imported_ by other modules.

Let briefly see what this means in code.

<a name="modules"></a>

### Intro to Modules

Remember our good friend the `Counter` class, that we just had in the same file as the spec file? Let's put it into it's own file, and and the import it into the spec file. Create a `counter.ts` file in the `counter` folder, and copy and paste the `Counter` class (from the spec) into it, also adding the `export` keyword

```typescript
export class Counter {
  ...
}
```

Then in the `counter.spec.ts` file, remove the `Counter` class, and instead import it, using the following syntax

```typescript
import { Counter } from './counter';
```

Everything else in the spec file should be the same. Now let's compile both files.

    npm run tsc

If you look at the contents of the compiled `counter.js` file, you should see

```js
var Counter = (function () {
    ...
}());
exports.Counter = Counter;
```

Here, `Counter` is being exported with the module. Now look at the `counter.spec.js` file

```js
var counter_1 = require("./counter");
describe('Counter', function () {
    var counter;
    beforeEach(function () {
        counter = new counter_1.Counter();
    });
});
```

Using `require` is how to load the module in Javascript. You can see that the `Counter` class is actually a _member_ of imported module. That's why we do `new counter_1.Counter()` instead of `new counter_1()`.

So how does this fit it with SystemJS. Let's find out.

<a name="systemjs-quickstart"></a>

### SystemJS Quickstart

First, let's install SystemJS

    npm install --save systemjs

Once that's finished installing, let's add it to our `index.html`. If you haven't already, you can remove all the Jasmine related stuff from the file. (Just a note, in case there is any confusion, none of that Jasmine stuff in the index.html file was actually used in the Karma testing). Replace the contents of the `index.html` page with the following (removing the `(#)`s)

```html
<!doctype html>
<head>
  <meta charset="utf-8">
  <title>Angular 2 Testing</title>
  <script src="node_modules/systemjs/dist/system.src.js"></script>  (1)
</head>
<body>
  <h2>Count: <span id="count">0</span></h2>

  <script>
    System.import('app/counter/counter.js').then(function(module) {  (2)
      var counter = new module.Counter();  (3)
      var count = document.getElementById('count');
      setInterval(function () {
        counter.increment();
        count.innerHTML = counter.value;  (4)
      }, 1000);
    });
  </script>
</body>
</html>
```

There are a few things going on here:

1. We add the SystemJS script to the application.

2. We import the `counter.js` module, using the `System.import` method. In the promise callback, we get passed an instance of the _module_.

3. With the module, we can create an instance of the `Counter` class.

4. We change the value of the `h2` count every second, with the incremented value of the counter.

Let's run the code.

    npm start

If all went well, you should see the count increment every second. Now let's take this example to next level.

<a name="import-modules"></a>

### Importing Modules

Let's import something from another module into the `counter` module. I will use RxJS just so we can also see how to use the `SystemJS.config`. First install `RxJS`

    npm install --save rxjs

Now change the contents of the `counter.ts` file to 

```typescript
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

export class Counter {
  
  private _count = 0;
  private _value = new BehaviorSubject<number>(this._count);

  increment() {
    this._value.next(++this._count);
  }

  decrement() {
    this._value.next(--this._count);
  }

  get value(): Observable<number> {
    return this._value.asObservable();
  }
}
```

Here, we are using RxJS to publish the new value to subscribers. In the `index.thml` page, change the contents of the `<script>` accordingly, to adjust to this new change

```html
<script>
  System.import('app/counter/counter.js').then(function(module) {
    var count = document.getElementById('count');
    var counter = new module.Counter();
    counter.value.subscribe(function(value) {
      count.innerHTML = value;
    });
    setInterval(function () {
      counter.increment();
    }, 1000);
  });
</script>
```

Now lets try to run the app.

    npm start

If you look at both the terminal and Browser console, you will see 404 errors. In  the browser console, you will see

	Uncaught (in promise) Error: (SystemJS) XHR error (404 Not Found) loading
	http://localhost:3000/rxjs/BehaviorSubject(…)

What this means is that when the `counter` module is loaded, it is trying to import the `BehaviorSubject`. And the error is telling you the path it is trying to load it from. It is using this path, because that is the path we use in our import statement

    import { BehaviorSubject } from 'rxjs/BehaviorSubject';

So how can we fix this? This is were the `SystemJS.config` comes to the rescue. We can configure how different paths are resolved.

Add a `systemjs.config.js` file to the root of the project, and add the following contents to that file

```js
(function(global) {
  SystemJS.config({
    paths: {
      'npm:': 'node_modules/'
    },
    map: {
      'app': 'app',
      'rxjs': 'npm:rxjs'
    },
    packages: {
      app: {
        defaultExtension: 'js'
      },
      rxjs: {
        defaultExtension: 'js'
      }
    }
  })
})(this);
```

This is how we can configure SystemJS. The following is a description of the properties used above:

* `paths` - Here we are making an alias so that we can use `npm:` as an alias for the path `node_modules/`. This will save us some typing in the `map` section.

* `map` - Here we are creating mappings, which is also a type of alias. Above, we are saying that when you see `rxjs`, replace it with the path `node_modules/rxjs` when resolving the module path.

* `packages` - Here we are saying that for the package `rxjs` (listed in the `map`. The default file extension is `js`. This allows us to exclude the `.js` from the import.

With this configuration and the following import statement

```typescript
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
```

when SystemJS tries to load `rxjs/BehaviorSubject`, it will now prefix it with `node_modules/` and add the default extension `.js`. Now the path is absolute, and the module can be resolved.

We also add a mapping for `app`, as this is part of the path for the project files. For this package, we also add the `defaultExtension: js`. For the code we are using right now in the `index.html`, this is not really required at this point, as we are importing using the `.js` extension already. But in the real application, we will not be using extensions with our import statements. And the above mapping will allow for that. So let's just adjust the `index.html` page to accommodate for this adjustments. Just change

```js
System.import('app/counter/counter.js')
```

to 

```js
System.import('app/counter/counter')
```

See how we removed the `.js` extension.

Now we just need to add the configuration file the `index.html` page. Now this is what the `<head>` should look like

```html
<head>
  <meta charset="utf-8">
  <title>Angular 2 Testing</title>
  <script src="node_modules/systemjs/dist/system.src.js"></script>
  <script src="systemjs.config.js"></script>
</head>
```

Now we can run the app.

    npm start

Voila! Everything now works. You should be feeling like a champ right now! But we still need to test it :-)

<a name="systemjs-testing"></a>

### Testing with SystemJS

To test our `Counter`, the first thing we need to do is modify the test cases to accommodate for our new use of RxJS. Replace the contents of the `counter.spec.ts` file with the following:

```typescript
import { Counter } from './counter';

describe('Counter', () => {
  let counter: Counter;

  beforeEach(() => {
    counter = new Counter();
  });

  it('should increase value of counter when incremented', (done) => {
    counter.increment();
    counter.value.subscribe(value => {
      expect(value).toEqual(1);
      done();
    });
  });

  it('should decrease value of counter when decremented', (done) => {
    counter.decrement();
    counter.value.subscribe(value => {
      expect(value).toEqual(-1);
      done();
    });
  });
});
```

Let's also add the `counter.js` file to the Karma config so that Karma can add it to the server.

```js
files: [
  { pattern: 'app/counter/counter.js', included: false, watched: true },
  { pattern: 'app/counter/counter.spec.js', included: true, watched: true }
],
```

Now let's just run the test as-is, just to see what happens.

    npm run test

You should see the following errors (preventing the tests from running):

	[1] Chrome 54.0.2840 (Windows 10 0.0.0) ERROR
	[1]   Uncaught ReferenceError: require is not defined
	[1]   at app/counter/counter.spec.js:2
	[1]
	[1] Chrome 54.0.2840 (Windows 10 0.0.0) ERROR
	[1]   Uncaught ReferenceError: require is not defined
	[1]   at app/counter/counter.spec.js:2

So what does this mean? Well let's look at the compiled `counter.js` file. At line two we should see
   
    var BehaviorSubject_1 = require("rxjs/BehaviorSubject");

And `require` is not defined in the Browser engine. So why did it work when we ran the app? It's because we were using SystemJS to load the module (i.e. we didn't add the `counter.js` as a `<script>`). Also remember when we talked about the Karma configuration `files` array. Here is what is currently looks like.

```js
files: [
  { pattern: 'app/counter/counter.js', included: false, watched: true },
  { pattern: 'app/counter/counter.spec.js', included: true, watched: true }
],
```

Remember we said that `included` means that the file should added as a `<script>`. Well this is what's causing the error. For tests, we don't want our application files added as a `<script>`. We want SystemJS to load them, just like in the application.

So let's update the `files` array:

```js
files: [
  'node_modules/systemjs/dist/system.src.js',

  { pattern: 'node_modules/rxjs/**/*.js', included: false, watched: false },
  { pattern: 'node_modules/rxjs/**/*.js.map', included: false, watched: false },

  { pattern: 'systemjs.config.js', included: false, watched: false },
  { pattern: 'app/counter/counter.js', included: false, watched: true },
  { pattern: 'app/counter/counter.spec.js', included: false, watched: true }
],
```

So we are now adding SystemJS. Also just using a string for the module (instead of the object like the other three files used), we accept the defaults, which is `included: true, watched: false`. We _do_ want SystemJS added as a `<script>` and we don't need to watch it, as it's a third-party library, and the code will not be changing. We also add our `systemjs.config.js` file. We are not including it as a `<script>` as we will have SystemJS load it. And finally, we added the RxJS library.

At this point, if we tried to run the test, nothing would happen, i.e. no tests would be run. This is because 1) The spec file is not added as a `<script>` and 2) we haven't told SystemJS to load them yet.

This is where we want to make use of a `karma-test-shim.js` file, that we can use just for tests. In this file, we will have SystemJS load all of our modules.

<a name="karma-test-shim"></a>

#### _karma-test-shim.js_

Create a `karma-test-shim.js` file at the root of the project. As I mentioned before, this article is to help demystify the workings of the Angular 2 Quickstart project (in regards to testing). So I will grab some of the content from [its karma-test-shim.js][quickstart-test-shim]. I won't grab all of it right now, as a lot it involves Angular, and I haven't gotten there yet. I will just grab what is important for now and briefly walk through what all the code does. So in your file, add the following contents:

```js
Error.stackTraceLimit = 0;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;

// (1)
var builtPaths = (__karma__.config.builtPaths || ['app/'])
                  .map(function(p) { return '/base/'+p;});

// (2)
__karma__.loaded = function () { };

// (3)
function isJsFile(path) {
  return path.slice(-3) == '.js';
}

// (4)
function isSpecFile(path) {
  return /\.spec\.(.*\.)?js$/.test(path);
}

// (5)
function isBuiltFile(path) {
  return isJsFile(path) &&
          builtPaths.reduce(function(keep, bp) {
            return keep || (path.substr(0, bp.length) === bp);
          }, false);
}

// (6)
var allSpecFiles = Object.keys(window.__karma__.files)
  .filter(isSpecFile)
  .filter(isBuiltFile);

// (7)
SystemJS.config({
  baseURL: 'base'
});

// (8)
System.import('systemjs.config.js')
  .then(initTesting);

// (9)
function initTesting () {
  return Promise.all(
    allSpecFiles.map(function (moduleName) {
      return System.import(moduleName);
    })
  )
  .then(__karma__.start, __karma__.error);
}
```

It looks like there is alot going on here, but really, most of the code is just helper functions. I'll quickly go through them

* First couple lines - Not really important right now. Just some environment settings.

* (2) - Here we are using this hook to tell Karma _not_ to start the tests. We will manually trigger the tests after SystemJS has loaded all the modules.

* (6) - This is our main goal: to get all the `.spec` files. We only want `.spec` files that are a part of our application. The helper functions `(3)`, `(4)`, and `(5)` help us filter all the files to make sure we get what we want.

    The `Object.keys(window.__karma__.files)` grabs all the files in our Karma config `files` array, and then we use the helper functions to filter them out.

    We only want the `.spec` files because that all we want SystemJS to load. The spec files already import the application files, so we don't need to import them manually. They will be imported transitively when SystemJS sees the `require`s.

* (7) - Here we are setting the `baseURL` in the SystemJS configuration. Remember that Karma adds the base path `base` to the webserver URL. So SystemJS will use the same base URL when trying to load modules. 

* (8) - We now load the `systemjs.config.js` file, and when that module is resolved, we call `(9)`

* (9) - Here, we use the helper function (that grabbed all the spec files), we iterate through them, importing all of them with `System.import`. After they are all resolved, we manually start Karma by passing the karma start function to the Promise `then`.

Now the last thing is to add this `karma-test-shim.js` file to the `karma.conf.js` file, so that Karma can load it and add it as a `<script>` to run  when the server starts. Below is the current `files` array configuration.

```js
files: [
  'node_modules/systemjs/dist/system.src.js',

  { pattern: 'node_modules/rxjs/**/*.js', included: false, watched: false },
  { pattern: 'node_modules/rxjs/**/*.js.map', included: false, watched: false },

  { pattern: 'systemjs.config.js', included: false, watched: false },
  'karma-test-shim.js',

  { pattern: 'app/counter/counter.js', included: false, watched: true },
  { pattern: 'app/counter/counter.spec.js', included: false, watched: true }
],
```

Now if you run the test (`npm run test`), you should get a success with 2 tests run and 2 tests succeeding!

Bet you feel pretty good about yourself right about now. Do you feel like a Guru yet? Not so fast, Grasshopper. We still need to add Angular!

[module-docs]: https://github.com/systemjs/systemjs/blob/master/docs/es6-modules-overview.md
[quickstart-test-shim]: https://github.com/angular/quickstart/blob/master/karma-test-shim.js


{% include ads/post-in-article-banner-2.html %}

<a name="angular"></a>

## Adding Angular

Finally, we've reached the point where we can now add Angular to our project.

<a name="angular-app"></a>

### Application Setup 

Let's start by first just adding the dependencies, getting a hello world up and running, then we'll get the testing. So install the following

    npm install --save \
      @angular/core @angular/common @angular/compiler \
      @angular/platform-browser @angular/platform-browser-dynamic \
      core-js reflect-metadata zone.js

These are just the basic dependencies. We're not going to do any forms or http calls or routing, so we'll just leave those out.

Now let's code up the application. In the `app` folder, add the following files:

_**app.component.ts**_

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app',
  template: '<h1>{{ message }}</h1>'
})
export class AppComponent {
  message = 'Hello World!';
}
```

_**main.ts**_

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppComponent } from './app.component';

@NgModule({
  imports: [ BrowserModule ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {

platformBrowserDynamic().bootstrapModule(AppModule);
```

And  replace the contents of the `index.html` file with the following:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Angular2 Testing</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="node_modules/core-js/client/shim.min.js"></script>
    <script src="node_modules/zone.js/dist/zone.js"></script>
    <script src="node_modules/reflect-metadata/Reflect.js"></script>
    <script src="node_modules/systemjs/dist/system.src.js"></script>
    <script src="systemjs.config.js"></script>
    <script>
      System.import('app').catch(function(err){ console.error(err); });
    </script>
  </head>

  <body>
    <app>Loading ...</app>
  </body>
</html>
```

You can see here, that we use `System.import` to import the `app` package. But we need to make one change to the `systemjs.config.js` file. Add a `main` property that points our compiled `main.js`.

```js
app: {
  main: './main.js',
  defaultExtension: 'js'
}
```

The `main` tells SystemJS what file is the main file to load for this (`app`) package. In this case, the `main.js` file is the default one to load. And when that file is loaded, it will bootstrap our Angular application.

We also need to make SystemJS aware of how to load the Angular modules. In our application files, when we import Angular, we do something like

```typescript
import { Component } from '@angular/core';
```

SystemJS doesn't know what the `@angular/core` module is unless we map it correctly in the `systemjs.config.js` file, just like we did with RxJS. So modify the `map` property in the `systemjs.config.js` file to the following:

```js
map: {
  'app': 'app',

  '@angular/core': 'npm:@angular/core/bundles/core.umd.js',
  '@angular/common': 'npm:@angular/common/bundles/common.umd.js',
  '@angular/compiler': 'npm:@angular/compiler/bundles/compiler.umd.js',
  '@angular/platform-browser': 'npm:@angular/platform-browser/bundles/platform-browser.umd.js',
  '@angular/platform-browser-dynamic': 'npm:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',

  'rxjs': 'npm:rxjs'
}
```

See how we are mapping the `@angular/core` to the actual module file. This is how we are able to to use `from '@angular/core'`.

At this point, running the app should work. Give it a shot.

    npm start

You should see the "Hello World!" message. And now we have Angular set up for the application. But we still need to configure the testing.

<a name="angular-test"></a>

### Testing Setup

Let's start with the `karma.conf.js` file. In the `files` array, add the following right under the `systemjs.src.js` file

```js
// Polyfills
'node_modules/core-js/client/shim.js',
'node_modules/reflect-metadata/Reflect.js',

// zone.js
'node_modules/zone.js/dist/zone.js',
'node_modules/zone.js/dist/long-stack-trace-zone.js',
'node_modules/zone.js/dist/proxy.js',
'node_modules/zone.js/dist/sync-test.js',
'node_modules/zone.js/dist/jasmine-patch.js',
'node_modules/zone.js/dist/async-test.js',
'node_modules/zone.js/dist/fake-async-test.js',
```

I won't really get into what all these files are. Just accept that they are needed when testing Angular applications. And just notice that because we are just using strings, all these files are added as `<script>`s.

Next we will add the Angular files. So right under the above files, add the following

```js
{ pattern: 'node_modules/@angular/**/*.js', included: false, watched: false },
{ pattern: 'node_modules/@angular/**/*.js.map', included: false, watched: false },
```

Here we are using a `pattern` matcher instead of individual files. This will match all the files in the `@angular/xxx` modules. We also add the source maps so that they can be used for debugging (we won't do any debugging here). Also notice that we use `included: false`, which means that they will not get added as `<script>`s. They will get loaded by SystemJS.

Now we need to add our application files. Previously, with the `counter` files, we added them individually. Let's change that to use a pattern to add all of our files, just like we did with the Angular files. So replace the following

```js
{ pattern: 'app/counter/counter.js', included: false, watched: true },
{ pattern: 'app/counter/counter.spec.js', included: false, watched: true }
```

with

```js
{ pattern: 'app/**/*.js', included: false, watched: true },
{ pattern: 'app/**/*.ts', included: false, watched: true },
{ pattern: 'app/**/*.js.map', included: false, watched: true }
```

we are also adding the source maps and the source `.ts` files here for debugging. But again, we will not be doing any debugging here. And again, notice the `included: false`. We will also let SystemJS load these modules.

And that is it for the Karma configuration (for now). Now we need to tell SystemJS to load the files. So let's go to our `karma-test-shim.js` file.

Remember that in this file, we are loading the `systemjs.config.js` file with a `System.import`. Remember the `systemjs.config.js` file has all the mapping for the Angular files so we can do `from @angular/core`. In our tests, we are also now using the Angular testing files, which are _not_ mapped in the `systemjs.config.js`. We don't map them there because they are specific to testing, and we don't want to clutter our application stuff with unnecessary testing stuff.

In our tests will will being using things like

    import { TestBed } from '@angular/core/testing'

All of these `@angular/xxx/testing` modules, we still need to map. So change the `SystemJS.config` (`(7)` previously mentioned) in the `karma-test-shim.js` to the following

```js
System.config({
  baseURL: 'base',

  map: {
    '@angular/core/testing': 'npm:@angular/core/bundles/core-testing.umd.js',
    '@angular/common/testing': 'npm:@angular/common/bundles/common-testing.umd.js',
    '@angular/compiler/testing': 'npm:@angular/compiler/bundles/compiler-testing.umd.js',
    '@angular/platform-browser/testing': 'npm:@angular/platform-browser/bundles/platform-browser-testing.umd.js',
    '@angular/platform-browser-dynamic/testing': 'npm:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic-testing.umd.js',
  },
});
```

This is just like the mapping in the `systemjs.config.js` file, except now, we are adding the testing modules.

We're still not done with the configuration yet, but let's try testing out what we have so far. We will get an error, but I want to be able to show what the problem is, and how we can fix it. So let's add a test. Add a file name `app.component.spec.ts` in the `app` folder, and add the following contents:

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('component: AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ AppComponent ]
    });
    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('should display Hello World message', () => {
    const debugEl = fixture.debugElement;
    const h1 = debugEl.nativeElement.querySelector('h1');
    expect(h1.textContent).toEqual('Hello World!');
  });
});
```

I'm not going to get into what this code does. That is not the purpose of this article. Angular documentation has great info on this subject.

Let's now run the test.

    npm run test

When running the test, we should see one failure, which is from the `app.component.spec` file we just added. The error reads:

    [1]     TypeError: Cannot read property 'injector' of null

The reason for this, is that when using the `TestBed`, it needs to be initialized in a special way. Let's quickly see how to do that. In the same spec file, add the following imports:

```typescript
import {
  BrowserDynamicTestingModule, platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
```

Then in a `beforeAll`, right before the `beforeEach`, add the following:

```typescript
beforeAll(() => {
  TestBed.initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting()
  );
});
```

If you run the tests again (or just watch it reload from the previous start), it should produce successes for all cases.

The thing about the `TestBed.initTestEnvironment` is that it only needs to be called once for the entire test environment. So what we do instead of trying to add it to a test file like we did here, we instead call it in the `karma-test-shim.js` file. So remove the contents of the last step we just did (the `import` and the `beforeAll`). Then in the `karma-test-shim.js` file, replace

```js
System.import('systemjs.config.js')
  .then(initTesting);
```

with

```js
System.import('systemjs.config.js')
  .then(initTestBed)
  .then(initTesting);

function initTestBed(){
  return Promise.all([
    System.import('@angular/core/testing'),
    System.import('@angular/platform-browser-dynamic/testing')
  ])

  .then(function (providers) {
    var coreTesting    = providers[0];
    var browserTesting = providers[1];

    coreTesting.TestBed.initTestEnvironment(
      browserTesting.BrowserDynamicTestingModule,
      browserTesting.platformBrowserDynamicTesting());
  })
}
```

What we are doing in the `initTestBed` function is loading the two Angular testing modules, the ones that contain the `TestBed`, and the other two imports we used just recently. When those two modules are resolved, we call the `TestBed.initTestEnvironment` with the same two arguments as we did previously.

Now if you run the tests again (or just wait for reload) the tests should again pass!

And there you have it. You have now graduated from Grasshopper to Guru.

One last thing I should probably add though, that I didn't mention previously. That is how to deal with Angular retrieved assets, like our external templates and styles. For these you will need to add the files to the Karma config `files` array.

```js
{ pattern: appBase + '**/*.html', included: false, watched: true },
{ pattern: appBase + '**/*.css', included: false, watched: true },
```

Then, right below the `files` array property, add the following

```js
proxies: {
  "/app/": "/base/app/"
},
```

There are some comments in the quickstart, that explain what these are for. I won't really go through it.


<a name="summary"></a>

## Summary

We've gone through a lot in this article. First we examined testing with Jasmine in the browser. Then we switched over to Karma, and saw how it can be used to run Jasmine tests from the command line. After that, we got familiarized with SystemJS, using our `Counter` class along with RxJS. We then tested the `Counter` code, configuring SystemJS into the Karma configuration. Angular 2 was then added to the mix, and we saw what we need to do to configure Karma to be able to use the Angular modules.

[final project]: https://github.com/psamsotha/angular2-testing



