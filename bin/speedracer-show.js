#!/usr/bin/env node

// Packages
const chalk = require('chalk')
const globby = require('globby')
const mapSeries = require('p-map-series')
const meow = require('meow')

// Ours
const { pipe } = require('../lib/.internal/util')
const { loadReport } = require('../lib/report')
const display = require('../lib/display')
const showReport = require('../lib/show-report')

const DEBUG = process.env.DEBUG

/* eslint-disable */
const argv = meow({
  description: false,
  help: `
    ${display.logo()}

    ${chalk.red(`speedracer show ${chalk.underline('reports')}`)}

    ${display.section('Options:')}

      -h, --help    Usage information  ${display.subtle(false)}

    ${display.section('Examples:')}

    ${display.subtle('–')} Show ${chalk.underline('.speedracer/high-cpu.speedracer')} report:

      ${chalk.cyan('$ speedracer show .speedracer/high-cpu.speedracer')}

    ${display.subtle('–')} Show reports recursively in ${chalk.underline('.speedracer')} directory:

      ${chalk.cyan('$ speedracer show .speedracer/**/*')}
  `
}, {
  boolean: ['help'],
  alias: {
    help: 'h'
  }
})
/* eslint-enable */

const header = () => console.log('')

const footer = () => console.log('\n')

const prepare = (baton) => {
  // set default directory to .speedracer
  if (baton.files.length === 0) {
    baton.files = ['.speedracer/**/*.speedracer']
  }

  // return matching files
  return globby(baton.files).then(paths => {
    if (paths.length === 0) {
      throw new Error('No reports found!')
    }
    baton.files = paths
  })
}

const showFiles = ({ files, options }) =>
mapSeries(files, file => {
  // only process .speedracer extension
  if (!file.endsWith('.speedracer')) return

  return loadReport(file).then(showReport)
})

const error = (err, baton) => {
  console.error(chalk.red(err.message))
  if (DEBUG) console.error(err.stack)
  footer()
  process.exit(1)
}

const run = (files, options) =>
pipe({ files, options }, [
  header,
  prepare,
  showFiles,
  footer
], error)

run(argv.input.slice(1), argv.flags)
