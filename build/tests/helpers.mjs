/*!
 * helpers.mjs — what the tests of the build scripts share.
 *
 * A test writes the files a script reads into a directory of its own, runs the script there as
 * `pnpm` and the workflows run it, and reads the exit code, the output and the files it wrote.
 * Nothing of the repository is read or changed.
 *
 * Copyright 2026 Ozgur Gunes
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 */

import { execFile, execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// Git reads neither the configuration of the user nor the repository the tests run in
const GIT_ENV = {
  GIT_CONFIG_GLOBAL: os.devNull,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_DIR: undefined,
  GIT_WORK_TREE: undefined,
  GIT_INDEX_FILE: undefined
}

/**
 * Writes files into a directory, creating the directories they are in
 * @param {string} dir - The directory
 * @param {Record<string, string | null>} files - The content by path; null removes the file
 */
export function writeFiles(dir, files) {
  for (const [file, content] of Object.entries(files)) {
    const absolute = path.join(dir, file)

    if (content === null) {
      fs.rmSync(absolute, { force: true })
      continue
    }

    fs.mkdirSync(path.dirname(absolute), { recursive: true })
    fs.writeFileSync(absolute, content)
  }
}

/**
 * Creates a temporary directory that holds the given files
 * @param {Record<string, string>} [files] - The content by path
 * @returns {string} The directory
 */
export function createFixture(files = {}) {
  // The real path: macOS has its temporary directory behind a symbolic link
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'chassis-build-test-')))

  writeFiles(dir, files)
  return dir
}

export function removeFixture(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
}

export function readFile(dir, file) {
  return fs.readFileSync(path.join(dir, file), 'utf8')
}

/**
 * Runs a script of the repository with Node.js
 * @param {string} script - The script, from the root of the repository
 * @param {string[]} [args] - Its arguments
 * @param {{ cwd?: string, env?: Record<string, string | undefined> }} [options] - The
 *   directory to run it in and the environment variables to add
 * @returns {Promise<{ status: number, stdout: string, stderr: string }>} Never rejects on a
 *   failing exit code
 */
export function runScript(script, args = [], { cwd, env } = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [path.join(root, script), ...args],
      { cwd, env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: undefined, ...GIT_ENV, ...env } },
      (error, stdout, stderr) => {
        if (error && typeof error.code !== 'number') {
          reject(error)
          return
        }

        resolve({ status: error ? error.code : 0, stdout, stderr })
      }
    )
  })
}

/**
 * Puts a `pnpm` in front of the real one that writes its arguments to a log and runs the
 * given shell commands, for the scripts that start a build
 * @param {string} dir - The directory of the fixture
 * @param {string} [commands] - Shell commands, run in the directory the script runs in
 * @returns {{ env: Record<string, string>, calls: () => string[] }} The environment to run
 *   the script with, and the arguments of each call so far
 */
export function stubPnpm(dir, commands = '') {
  const bin = path.join(dir, '.bin')
  const log = path.join(bin, 'pnpm.log')

  fs.mkdirSync(bin, { recursive: true })
  fs.writeFileSync(path.join(bin, 'pnpm'), `#!/bin/sh\necho "$@" >> "${log}"\n${commands}\n`, {
    mode: 0o755
  })

  return {
    env: { PATH: `${bin}${path.delimiter}${process.env.PATH}` },
    calls: () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n') : [])
  }
}

/**
 * Runs git in a fixture, as a user the tests make up
 * @param {string} dir - The directory of the fixture
 * @param {...string} args - The arguments of git
 */
export function git(dir, ...args) {
  execFileSync(
    'git',
    [
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'init.defaultBranch=main',
      ...args
    ],
    { cwd: dir, env: { ...process.env, ...GIT_ENV }, stdio: 'pipe' }
  )
}
