---
layout: post
categories: angular
category: angular
title: "Absolute Paths with Angular and Webpack"
description: "How to use absolute paths when using imports in Angular and Webpack."
thumb: paul-samsotha-snowy-under-bridge
tags: angular2 webpack
---

When using Angular with TypeScript, we're always importing files into other files. An import statement might look something like

```typescript
import { Data } from '../data';
```

If you are very picky about style, then you might be repulsed at seeing something like the following, when you have deeply nested files

```typescript
import { Data } from '../../../data';
```

We are not strictly tied to using this way of relative importing though. In this article, I will briefly explain how we can use absolute file paths for imports, so you that with the following file structure

```
src/
    + app/
    |  |
    |  `- constants.ts
    |
    + message/
      |
      `- model/
          |
          `- message.ts
```

in your `message.ts` file, you can do this

```typescript
import { DEFAULT_MESSAGE } from 'src/app/constants';
```

which is IMO is much more preferable than doing

```typescript
import { DEFAULT_MESSAGE } from '../../app/constants';
```

To begin, please have a look at [this GitHub repo][github-repo]. It is basically just the project from the [Angular Webapack docs][angular-docs], with a few modifications.

In the project, you will see the previously mentioned file structure. You may not have this same file structure in your application (for instance you may keep all your app folders inside the app directory), but hopefully after reading this article, you will be able to figure out how to adjust configurations accordingly to fit your application structure.


{% include ads/in-article-ad.html %}


So to get this working there are two steps we need to take. First we need to make a simple modification to the TypeScript `tsconfig.json` file, and second we beed to make a small modification to the Webpack `webpack.config.js` file

## _tsconfig.json_

The only thing we need to configure for TypeScript is to set the `baseUrl` property in the `compilerOptions`

```json
"compilerOptions": {
  "baseUrl": ".",
}
```

The `baseUrl` property is stated in the [`compilerOptions`][compiler-options] to be:

>Base directory to resolve non-relative module names

So if we don't use this property, then all of our module imports will be relative. So we can only use the `./` syntax. But now we are saying that "aside from relative paths, look at the `.` (base) directory. So now if we use

```typescript
import { DEFAULT_MESSAGE } from 'src/app/constants';
```

`src` is in the base directory, so TypeScript will be able to resolve the file using this absolute path.

Or if you wanted, you could even do

```json
"compilerOptions": {
  "baseUrl": "./src",
}
```

This would allow you to get rid of the `src` from the import

```typescript
import { DEFAULT_MESSAGE } from 'app/constants';
```


## _webpack.config.js_

The configuration for Webpack is pretty easy also. What we want to do is modify the `resolve.modules`. In your project, you might just have

```javascript
module.exports = {
  resolve: {
    extensions: ['.js', '.ts']
  }
}
```

But there are other properties on the `resolve` that we can configure (see link below for more). For this case we just want to configure the `module` property to tell Webpack where else to resolve modules from besides just the `node_modules`

```javascript
modules: [
  '../',
  '../node_modules'
]
```

Or if you're going of the project, you can use the `helpers utility.

```javascript
modules: [
  helpers.root('/'),
  helpers.root('node_modules')
]
```

Here we are telling Webpack to use both the root directory and the `node_modules`. We need to specify the `node_modules` since we are overriding the default.

One thing to note about the project is that is uses a `config` directory t store all the configuration files. This is why we need to go a level up `../` to resolve, as it's being resolved from the location of the configuration file. If you are only using one `webpack.config.js` file or even multiple that are in the root directory, then we don't need to go a level up. You can just do

```javascript
modules: [
  path.resolve('.'),
  'node_modules'
]
```


## Resources

* [Webpack Module Resolution][webpack-resolution]
* [Webpack Resolve][webpack-resolve]
* [TypeScript Module Resolution][typescript-resolution]

[github-repo]: https://github.com/psamsotha/angular-docs-webpack
[angular-docs]: https://github.com/psamsotha/angular-docs-webpack

[webpack-resolution]: https://webpack.js.org/concepts/module-resolution/
[webpack-resolve]: https://webpack.js.org/configuration/resolve/#resolve-modules
[typescript-resolution]: http://www.typescriptlang.org/docs/handbook/module-resolution.html#base-url
[compiler-options]: http://www.typescriptlang.org/docs/handbook/compiler-options.html