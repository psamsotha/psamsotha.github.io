Paul Samsotha's Developer Blog
==============================

The is the project source code for my blog https://psamsotha.github.io/. The project is
open source under MIT. Go ahead and fork it.

Feel free to post any [issues](https://github.com/psamsotha/psamsotha.github.io/issues)
or make a PR.

### Stack

* [Jekyll](http://jekyllrb.com/) as the static site generator
* [Gulp](http://gulpjs.com/) as the build system
* [Foundation](http://foundation.zurb.com/) for the grid and other frontend goodies.

### Build

To build the project, you should have Jekyll (see the [quickstart](http://jekyllrb.com/docs/quickstart/))
and Gulp installed

* `gulp` - development build, launch a server, and watch.
* `gulp build` - one time development jekyll build.
* `gulp build:watch` - development build and watch
* `gulp build:prod` - one time production build.
* `gulp build:prod:watch` - production build and watch.
* `gulp deploy` - deploy `_site` files to GitHub master branch (for site hosting).

### Environments

* Production Build - Disqus added to posts

### Deployment

The development of the this project is done on the `development` branch and therefore
the `development` branch is the default branch. The `master` only holds the generated
Jekyll `_site` files. These files are the main deployment artifacts for the site.
To deploy the site, just run `gulp deploy`, where after a successful build,
you will be asked for you GitHub credentials to push to the repo.
