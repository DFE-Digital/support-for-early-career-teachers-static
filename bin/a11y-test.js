#!/usr/bin/env node

'use strict';

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const pkg = require('../package.json');

const cheerio = require('cheerio');
const { program } = require('commander');
const { XMLParser } = require("fast-xml-parser");
const { createHtmlReport } = require('axe-html-reporter');

// Here we're using Commander to specify the CLI options
program
    .version(pkg.version)
    .usage('[options] <paths>')
    .option(
        '-c, --config <path>',
        'the path to a JSON or JavaScript config file'
    )
    .option(
        '-s, --sitemap <url>',
        'the path to a sitemap'
    )
    .option(
        '-f, --sitemap-find <pattern>',
        'a pattern to find in sitemaps. Use with --sitemap-replace'
    )
    .option(
        '-r, --sitemap-replace <string>',
        'a replacement to apply in sitemaps. Use with --sitemap-find'
    )
    .option(
        '-x, --sitemap-exclude <pattern>',
        'a pattern to find in sitemaps and exclude any url that matches'
    )
    .option(
        '-j, --json',
        'Output results as JSON'
    )
    .option(
        '-T, --threshold <number>',
        'permit this number of errors, warnings, or notices, otherwise fail with exit code 2',
        '0'
    )
    .option(
        '--reporter <reporter>',
        'the reporter to use. Can be a npm module or a path to a local file.'
    )
    .parse(process.argv);

const projectKey = 'Support for early career teachers';

const loadConfig = (configPath) => {
    const fullConfigPath = path.resolve('.', configPath);

    let config = {};
    try {
        const configData = fs.readFileSync(fullConfigPath, 'utf8');
        config = JSON.parse(configData);
    }
    catch(err)
    {
        throw err.message;
    }

    return config;
};

const loadSitemapIntoConfig = ({sitemap, sitemapFind, sitemapReplace, sitemapExclude}) => {
    const sitemapPath = path.resolve('.', sitemap);

    let xmlData;
    try {
        const sitemapData = fs.readFileSync(sitemapPath, 'utf8');
        const parser = new XMLParser();
        xmlData = parser.parse(sitemapData);
    }
    catch(err)
    {
        throw err.message;
    }

    if (xmlData) {
        return xmlData['urlset']['url']
            .filter(url => url['loc'].indexOf(sitemapExclude) === -1)
            .map(url => new URL(url['loc'].replace(sitemapFind, sitemapReplace)));
    }

    return [];
};

const safeFileName = (dirtyFileName) => {
    const {hostname, pathname} = new URL(dirtyFileName);
    const cleanPathname = path.parse(pathname).name
        .split('/').join('-')
        .replace(/[?=\/_:'"]+/g, '-')
        .toLowerCase();

    return hostname + '-' + cleanPathname;
};

const mergeReportIntoSummary = (summary, report) => {
    let inapplicable = []
    if (report.inapplicable) {
        inapplicable = report.inapplicable.map(n => ({...n, url: report.url}));
        summary.inapplicable = [...summary.inapplicable, ...inapplicable];
    }

    let passes = [];
    if (report.passes) {
        passes = report.passes.map(n => ({...n, url: report.url }));
        summary.passes = [...summary.passes, ...passes];
    }

    let incomplete = [];
    if (report.incomplete) {
        incomplete = report.incomplete.map(n => ({...n, url: report.url }));
        summary.incomplete = [...summary.incomplete, ...incomplete];
    }

    let violations = [];
    if (report.violations) {
        violations = report.violations.map(n => ({...n, url: report.url }));
        summary.violations = [...summary.violations, ...violations];
    }

    summary.urls = [...summary.urls, {
        url: report.url,
        reportFileName: report.reportFileName,
        inapplicable: report.inapplicable.length,
        passes: report.passes.length,
        incomplete: report.incomplete.length,
        violations: report.violations.length,
    }];

    return summary;
};

const createHtmlSummaryReport = (jsonSummaryReport) => {
    const templatePath = path.join('./a11y-ci-report', jsonSummaryReport.urls[0].reportFileName);
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const $ = cheerio.load(templateHtml);

    const summaryReport = jsonSummaryReport.urls.map(row => {
        return `\
            <tr>\
                <th scope="row"><a href="./${row.reportFileName}">${row.url}</a></th>\
                <td ${row.passes === 0 ? '' : 'class="table-success"'}>${row.passes}</td>\
                <td ${row.violations === 0 ? '' : 'class="table-danger"'}>${row.violations}</td>\
                <td ${row.incomplete === 0 ? '' : 'class="table-warning"'}>${row.incomplete}</td>\
            </tr>`;
    });

    summaryReport.unshift(`\
        <div style="padding: 2rem">\
            <h3>AXE Accessibility Results for ${projectKey} project</h3>\
            <h5>axe-core found <span class="badge badge-warning">${jsonSummaryReport.violations.length}</span> violations</h5>\
            <table class="table table-striped table-bordered">\
                <thead>\
                    <tr>
                        <th scope="col" style="width: 70%">URL</th>\
                        <th scope="col" style="width: 10%">Passes</th>\
                        <th scope="col" style="width: 10%">Violations</th>\
                        <th scope="col" style="width: 10%">incomplete</th>\
                    </tr>\
                </thead>\
                <tbody>`);
    summaryReport.push(`\
                </tbody>
            </table>\
        </div>`);

    $('body > div').replaceWith(summaryReport.join(''));
    return $.html();
};

class AxeTester {
    constructor(options) {
        this.reporters = options.reporters;
        this.ignore = options.ignore;
    }

    run(url) {
        let ignoreRules = '';
        if (this.ignore > 0) {
            ignoreRules = '--disable ' + this.ignore.map(rule => rule.toLowerCase()).join(',');
        }

        const childProcessOptions = {
            stdio: 'inherit',
            stderr: 'inherit',
        };

        const tempFile = './tmp/axe-results.json';
        try {
            execSync(`npx axe ${url} --save ${tempFile} ${ignoreRules}`, childProcessOptions);
        }
        catch(err)
        {
            console.error(err.message);
        }

        if (!fs.existsSync(tempFile))
            return;

        const resultsData = fs.readFileSync(tempFile, 'utf8');
        fs.unlinkSync(tempFile);

        const results = JSON.parse(resultsData)[0];
        results.reportFileName = `${safeFileName(results.url)}.html`;

        createHtmlReport({
            results,
            options: {
                projectKey,
                outputDir: './a11y-ci-report',
                reportFileName: results.reportFileName
            }
        });

        console.log('\n---------------------------\n');

        return results;
    }

    runAll(urls) {
        return urls.reduce((summary, url) => {
                const report = this.run(url);

                if (!report)
                    return summary;

                return mergeReportIntoSummary(summary, report);
            },
            {
                inapplicable: [],
                passes: [],
                incomplete: [],
                violations: [],
                urls: [],
            });
    }
}

const options = program.opts();

const config = loadConfig(options.config);

if (options.sitemap) {
    config.urls = loadSitemapIntoConfig(options);
}

// parse urls if no sitemap was provided
if (!options.sitemap) {
    // Parse the args into valid paths using glob and protocolify
    config.urls = program.args.map(uri => new URL(uri));
}

// Override config reporters with CLI argument
if (options.reporter) {
    config.defaults.reporters = [options.reporter];
}

// run the tests
const axeTester = new AxeTester(config.defaults);

if (fs.existsSync('./a11y-ci-report')) {
    fs.rmSync('./a11y-ci-report', {recursive: true});
}

const jsonSummaryReport = axeTester.runAll(config.urls);

const reportSummaryData = JSON.stringify(jsonSummaryReport, null, 2);
fs.writeFileSync('./a11y-ci-report/report.json', reportSummaryData);

const reportSummaryHtml = createHtmlSummaryReport(jsonSummaryReport);
fs.writeFileSync('./a11y-ci-report/index.html', reportSummaryHtml);

// Decide on an exit code based on whether
// errors are below threshold or everything passes
const totalViolations = jsonSummaryReport.violations.length;
if (totalViolations === 0 || totalViolations < parseInt(options.threshold, 10)) {
    process.exitCode = 0;
} else {
    process.exitCode = 2;

    console.log(`AXE-CORE found ${totalViolations} violations. For details see the report.`);
}
