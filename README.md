# Red Hat Extensions

Experimental extension elements based off of Red Hat Design System principles and tooling.

## Contributing to RHx

## Prerequisites

To develop components or Red Hat Extension documentation, you must first install
some required software, namely node.js. We use [nvm](https://github.com/nvm-sh/nvm)
to ensure a uniform development environment.

### Install Node
Fedora/RHEL users should install `nvm` for bash directly from GitHub

```bash
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
```

Mac users should [Install homebrew](https://brew.sh/), then use that to install `nvm`:

```bash
brew install nvm
```

### Clone the Repository

Then change directory to it:

```bash
git clone git@github.com:redhat-ux/red-hat-design-system
cd red-hat-design-system
```

### Install Dependencies
Install the right node version using `nvm`, then install the `node_modules` dependencies:

```bash
nvm use
npm ci
```

## Generate an Element

RHx uses tools and libraries from  [`@patternfly/patternfly-elements`](https://github.com/patternfly/patternfly-elements).
Use the PatternFly Elements generator to scaffold an element:

```bash
npm run new
```

## Run the Dev Server
Run the dev server to develop components. Your changes will automatically refresh the browser
window:

```bash
npm start
```

This starts a local dev server at http://localhost:8000 and the 11ty dev server for the docs site at http://localhost:8080

To run *only* the components dev server, first run the build, then run the dev 
server:
```bash
npm run dev
```

To run *only* the docs dev server, first run the build, then 11ty
```bash
npm run serve
```
