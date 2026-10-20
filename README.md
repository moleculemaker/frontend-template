# Frontend Template

This Repo is intended to be used as a template frontend repo for all moleculemaker frontends.
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 20.3.0. 

## Bootstrap

1. Clone repo to local machine
2. If you do not have nvm installed, install it from https://github.com/nvm-sh/nvm
3. Run `nvm use` to set the correct node version for this project
4. Run `npm install` to install the dependencies

## App identity (`app.yaml`)

`app.yaml` is the single source for everything that names the app: its id, display
name, family (`alphasynthesis` or `alphasynbio`), Matomo site, backend job type, Figma
frames and landing-page cards. The comments in the file describe each field.

After editing it, run:

```sh
npm run app:sync
```

This regenerates the files derived from it: `src/app/app-identity.ts`, the chart
(`chart/Chart.yaml`, `chart/values*.yaml`), the page title, and any line marked
`# app:sync <key>` (today only in the workflows) in any file git doesn't ignore.
`npm run app:sync -- --list` shows the derived values (hostnames, namespace, image,
feedback address) and every file it manages.

Never edit a generated file by hand. CI runs `npm run app:sync -- --check` and fails if
any is out of date with `app.yaml`.

The family selects the header branding (`src/app/family-branding.ts`) and the
deployment conventions (prod domain, namespace). Everything else is shared.

## Components

All builtin components are inside the `src/app/components` folder.

Component Preview (WIP): use storybook

## Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
