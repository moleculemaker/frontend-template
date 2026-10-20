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
frames, landing-page cards, and whether it has launched. The comments in the file describe each field.

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

Until `launched: true`, `src/index.html` carries `<meta name="robots" content="noindex">`,
so the unlisted prod site stays out of search results. Every non-prod deployment
(staging, local) also shows an internal-testing banner linking to the released tool,
driven by `environment` and `prodUrl` in the chart's runtime config.

The family selects the header branding (`src/app/family-branding.ts`) and the
deployment conventions (prod domain, namespace). Everything else is shared.

## The job flow (`/v1`)

The app submits to mmli-backend's versioned API: the form (`/test`) posts the tool's
input document and any files as multipart, Loading shows the job queued and then
processing, and the results page is `/result/:id`, the route the backend's
notification email links to.

- **API client:** `src/app/api/v1`, generated from the snapshot in
  `openapi/mmli-backend-v1.openapi.json`. `npm run openapi:v1:sync` refreshes the
  snapshot from staging and regenerates; `npm run openapi:v1` only regenerates. It uses
  openapi-generator 7.24.0 (`openapitools.v1.json`), because 6.6.0, which the legacy
  client in `src/app/api/mmli-backend` uses, reads FastAPI's OpenAPI 3.1 parameters as
  `any`.
- **Job input and result types:** `src/app/api/tool-schemas.ts` (`ToolInput`,
  `ToolResults`), generated from `schemas/input.schema.json` and
  `schemas/output.schema.json`. `npm run schemas:sync` fetches both for `app.yaml`'s
  `job_type` from the staging backend and regenerates; `npm run schemas` only
  regenerates. CI runs `npm run schemas -- --check`. The template's schemas are the
  sample tool's, from [job-template](https://github.com/moleculemaker/job-template).

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

Start the app (`npm start`), then run `npx nightwatch ./nightwatch --env chrome`. The
job-flow test runs against a mock of the `/v1` API that it starts itself, and points the
app at it by answering the `envvars.json` request over the Chrome DevTools Protocol, so
it needs Chrome and a chromedriver that matches it (`CHROMEWEBDRIVER` is the directory
containing one).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
