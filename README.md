deploy-static
===

![NPM](https://img.shields.io/npm/v/deploy-static.svg)
![License](https://img.shields.io/npm/l/deploy-static.svg)
![Downloads](https://img.shields.io/npm/dt/deploy-static.svg)

This is a command built with Node.js to facilitate deployment of static
files.

Installation
---
``` sh
$ npm i deploy-static
```

Usage
---
Before deployment, you should upload your static files somewhere and
build a list in `static.json`.

`static.json` is like this:

``` json
[{
  "url": "http://my.storage.com/assets/app.js",
  "path": "assets/app.js"
}, {
  "url": "assets/app.css",
  "path": "assets/app.css"
}]
```

Each item has an `url` to fetch and local `path` to store. `url`s can
be both absolute or relative paths.

Then deploy your static files with the command below.

``` sh
$ deploy-static fetch static.json -d dist -t v1.0 -p http://my.storage.com/
```

The latest version will be linked to `dist/current` while the history
versions are kept in `dist` so that you can easily rollback.

Note that if the `url` is relative, the `prefix` parameter must be
assigned. `static.json` is also an `url`, either absolute or relative.

Documents
---

* deploy-static fetch

```
usage: deploy-static fetch [-h] [-t TAG] [-f] [-p PREFIX] [-S] [static]

Positional arguments:
  static                the URL or path of static.json, stdin will be read if
                        none is provided

Optional arguments:
  -h, --help            Show this help message and exit.
  -t TAG, --tag TAG     the tag of current version, will be used as the
                        subdirectory name, default as current date
  -f, --force           whether to overwrite files if tag exists
  -p PREFIX, --prefix PREFIX
                        the URL prefix for all items with relative paths
  -S, --save-static     whether to store the static.json file
```

* deploy-static link

```
usage: deploy-static link [-h] tag

Positional arguments:
  tag         the tag or folder name of the version to be linked

Optional arguments:
  -h, --help  Show this help message and exit.
```

![deploy-static](resources/deploy-static.jpg)
