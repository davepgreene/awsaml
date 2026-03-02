import ini from 'ini'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { AWSCredentials } from '../types'
import log from 'electron-log/main'

class AwsCredentials {
  save(credentials: AWSCredentials, profile: string, region?: string) : Error | void {
    return this._saveAsIniFile(credentials, profile, region)
  }

  _saveAsIniFile(
    credentials: AWSCredentials,
    profile: string,
    region = '',
  ): Error | void {
    const home = AwsCredentials.resolveHomePath()

    if (!home) {
      return new Error('Cannot save AWS credentials, HOME path not set')
    }

    const configFile = path.join(home, '.aws', 'credentials')

    if (!credentials) {
      return new Error('Invalid AWS credentials')
    }

    if (!profile) {
      return new Error('Cannot save AWS credentials, profile not set')
    }

    try {
      fs.mkdirSync(path.join(home, '.aws'), {
        recursive: true,
        mode: '0700',
      })
    } catch (e) {
      return e as Error
    }
    log.info(`Saving AWS credentials for profile "${profile}" to ${configFile}`)

    let data: string | undefined
    try {
      data = fs.readFileSync(configFile, {
        encoding: 'utf8',
      })
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
        return e as Error
      }
    }

    let config: Record<string, Record<string, string>> = Object.create(null)

    if (data && data !== '') {
      config = ini.parse(data)
    }

    config[profile] = {
      aws_access_key_id: credentials.AccessKeyId || '',
      aws_secret_access_key: credentials.SecretAccessKey || '',
      aws_session_token: credentials.SessionToken || '',
      // Some libraries e.g. boto v2.38.0, expect an "aws_security_token" entry.
      aws_security_token: credentials.SessionToken || '',
    }

    // Include expiration if it is available
    if (credentials.Expiration) {
      config[profile].expiration = credentials.Expiration instanceof Date
        ? credentials.Expiration.toISOString()
        : credentials.Expiration
    }

    if (region.includes('gov')) {
      config[profile].region = region
    }

    const encodedConfig = ini.encode(config, {
      whitespace: true,
    })

    try {
      fs.writeFileSync(configFile, encodedConfig, 'utf8')
    } catch(e) {
      return e as Error
    }
  }

  static resolveHomePath(): string | null {
    const {
      env,
    } = process

    return env.HOME
      || env.USERPROFILE
      || (env.HOMEPATH ? ((env.HOMEDRIVE || 'C:/') + env.HOMEPATH) : null)
  }
}

export default AwsCredentials
