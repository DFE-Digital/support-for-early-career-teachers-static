# Support for early career teachers

This service contains training materials for early career teachers.

It is deployed to [https://support-for-early-career-teachers.education.gov.uk](https://support-for-early-career-teachers.education.gov.uk).

## Running the service

The service is a static site generated using the [Nanoc](https://nanoc.app) framework.

You will need Ruby and Node.js installed. Then install the Ruby and Node dependencies by running:

```bash
make build
```

To run a local server to preview the static site, run:

```bash
make start
```

## Deployments

The service is deployed to GitHub Pages automatically from the `main` branch.
