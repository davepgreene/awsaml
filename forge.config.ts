import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { PublisherGithub } from '@electron-forge/publisher-github';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as util from 'node:util';

const exec = util.promisify(require('node:child_process').exec);

const buildDirName = path.join(process.cwd(), 'build');
const buildDirStat = fs.statSync(buildDirName, {
  throwIfNoEntry: false,
});

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    prune: true,
    ignore: (filePath: string) => {
      if (filePath === '') return false;
      // Allowlist: only include these paths
      return !/^\/(build|dist|images|node_modules|package\.json|LICENSE\.md)(\/|$)/.test(filePath);
    },
    name: 'Awsaml',
    executableName: 'Awsaml',
    appBundleId: 'com.rapid7.awsaml',
    helperBundleId: 'com.rapid7.awsaml.helper',
    darwinDarkModeSupport: true,
    icon: 'images/icon',
  },
  rebuildConfig: {},
  hooks: {
    generateAssets: async () => {
      console.log('INFO: Clearing previous React build...');
      if (buildDirStat && buildDirStat.isDirectory()) {
        fs.rmSync(buildDirName, { force: true, recursive: true });
      }
      console.log('INFO: Building React assets...');
      await exec('yarn build:react');
      console.log('INFO: React build complete.');
      console.log('INFO: Building main process...');
      await exec('yarn build:main');
      console.log('INFO: Main process build complete.');
    },
  },
  makers: [
    new MakerSquirrel(
      {
        authors: require('./package.json').contributors.join(', '),
        setupIcon: path.join(process.cwd(), 'images', 'icon.ico'),
      },
      ['win32']
    ),
    new MakerZIP({}, ['darwin']),
    new MakerDeb(
      {
        options: {
          homepage: require('./package.json').repository.url.replace('.git', ''),
          maintainer: require('./package.json').contributors.join(', '),
          icon: 'images/icon.png',
        },
      },
      ['linux']
    ),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'rapid7',
        name: 'awsaml',
      },
      draft: true,
      prerelease: false,
    }),
  ],
};

if (process.env.BUILD_NUMBER && process.env.BUILD_NUMBER !== '') {
  config.packagerConfig.osxSign = {};
  config.packagerConfig.osxNotarize = {
    tool: 'notarytool',
    appleId: process.env.NOTARIZE_CREDS_USR || '',
    appleIdPassword: process.env.NOTARIZE_CREDS_PSW || '',
    teamId: process.env.MAC_TEAM_ID || '',
  };
}

export default config;
