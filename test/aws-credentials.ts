import { jest } from '@jest/globals'

// Disable logging for tests
import log from 'electron-log/main'
log.initialize({ preload: true })
log.transports.file.level = false;
log.transports.console.level = false;

import * as Path from 'node:path'
import FS from 'fs'
import ini from 'ini'
import AwsCredentials from '../src/main/api/aws-credentials'

const dataDir = Path.resolve(__dirname, 'data')
const awsFolder = Path.resolve(dataDir, '.aws')
const awsCredentials = Path.resolve(awsFolder, 'credentials')

beforeAll(() => {
  FS.rmSync(awsFolder, {
    force: true,
    recursive: true,
  })
})

afterAll(() => {
  FS.rmSync(awsFolder, {
    force: true,
    recursive: true,
  })
})

describe('AwsCredentials#save', () => {
  beforeEach(() => {
    FS.rmSync(awsFolder, {
      force: true,
      recursive: true,
    })
  })

  it('returns an error when credentials are null', () => {
    const aws = new AwsCredentials()

    const error = aws.save(null, 'profile')
    expect(error?.toString()).not.toEqual('')
  })

  it('returns an error when profile is null', () => {
    const aws = new AwsCredentials()

    const error = aws.save({}, null)
    expect(error?.toString()).not.toEqual('')
  })

  it('returns an error when $HOME path is unresolved', () => {
    const aws = new AwsCredentials()

    delete process.env.HOME
    delete process.env.USERPROFILE
    delete process.env.HOMEPATH
    delete process.env.HOMEDRIVE

    const error = aws.save({}, 'profile')
    expect(error?.toString()).not.toEqual('')
  })

  it('returns an error when $HOME path is empty', () => {
    const aws = new AwsCredentials()

    process.env.HOME = ''

    const error = aws.save({}, 'profile')
    expect(error?.toString()).not.toEqual('')
  })

  it('creates a $HOME/.aws folder when none exists', () => {
    const aws = new AwsCredentials()

    process.env.HOME = dataDir

    const error = aws.save({}, 'profile')
    expect(FS.existsSync(awsFolder)).toBe(true)
    expect(error).toBeUndefined()
  })

  it('creates a $HOME/.aws folder with 0700 permissions', () => {
    const aws = new AwsCredentials()

    process.env.HOME = dataDir

    const error = aws.save({}, 'profile')
    expect(FS.statSync(awsFolder).mode & 0x0700).toEqual(256)
    expect(error).toBeUndefined()
  })

  it('saves the access key in the credentials file', () => {
    const aws = new AwsCredentials()
    const credentials = {
      AccessKeyId: 'AccessKeyId',
    }

    process.env.HOME = dataDir

    const error = aws.save(credentials, 'profile')
    const data = FS.readFileSync(awsCredentials, 'utf-8')
    const config = ini.parse(data)

    expect(error).toBeUndefined()
    expect(config.profile.aws_access_key_id).toEqual(credentials.AccessKeyId)
  })

  it('saves the secret key in the credentials file', () => {
    const aws = new AwsCredentials()
    const credentials = {
      SecretAccessKey: 'SecretAccessKey',
    }

    process.env.HOME = dataDir

    const error = aws.save(credentials, 'profile')
    const data = FS.readFileSync(awsCredentials, 'utf-8')
    const config = ini.parse(data)

    expect(error).toBeUndefined()
    expect(config.profile.aws_secret_access_key).toEqual(credentials.SecretAccessKey)
  })

  it('saves the session token in the credentials file', () => {
    const aws = new AwsCredentials()
    const credentials = {
      SessionToken: 'SessionToken',
    }

    process.env.HOME = dataDir

    const error = aws.save(credentials, 'profile')
    const data = FS.readFileSync(awsCredentials, 'utf-8')
    const config = ini.parse(data)

    expect(error).toBeUndefined()
    expect(config.profile.aws_session_token).toEqual(credentials.SessionToken)
  })

  it('saves the session token as a security token in the credentials file', () => {
      const aws = new AwsCredentials()
      const credentials = {
        SessionToken: 'SessionToken',
      }

      process.env.HOME = dataDir

      const error = aws.save(credentials, 'profile')
      const data = FS.readFileSync(awsCredentials, 'utf-8')
      const config = ini.parse(data)

      expect(error).toBeUndefined()
      expect(config.profile.aws_security_token).toEqual(credentials.SessionToken)
    },
  )

  it('saves the expiration in the credentials file if it exists', () => {
    const aws = new AwsCredentials()
    const credentials = {
      AccessKeyId: 'AccessKeyId',
      SecretAccessKey: 'SecretAccessKey',
      SessionToken: 'SessionToken',
      Expiration: new Date().toISOString(),
    }

    process.env.HOME = dataDir

    const error = aws.save(credentials, 'profile')
    expect(error).toBeUndefined()
    const data = FS.readFileSync(awsCredentials, 'utf-8')
    const config = ini.parse(data)

    expect(config.profile).toEqual({
      aws_access_key_id: credentials.AccessKeyId,
      aws_secret_access_key: credentials.SecretAccessKey,
      aws_security_token: credentials.SessionToken,
      aws_session_token: credentials.SessionToken,
      expiration: credentials.Expiration,
    })
  })

  it('keeps existing profiles', () => {
    const aws = new AwsCredentials()
    const credentials1 = {
      AccessKeyId: 'AccessKeyId1',
      SecretAccessKey: 'SecretAccessKey1',
      SessionToken: 'SessionToken1',
    }
    const credentials2 = {
      AccessKeyId: 'AccessKeyId2',
      SecretAccessKey: 'SecretAccessKey2',
      SessionToken: 'SessionToken2',
    }
    const credentials3 = {
      AccessKeyId: 'AccessKeyId3',
      SecretAccessKey: 'SecretAccessKey3',
      SessionToken: 'SessionToken3',
      Expiration: new Date().toISOString(),
    }

    process.env.HOME = dataDir

    const err1 = aws.save(credentials1, 'profile1')
    expect(err1).toBeUndefined()

    const err2 = aws.save(credentials2, 'profile2')
    expect(err2).toBeUndefined()

    const err3 = aws.save(credentials3, 'profile3')
    expect(err3).toBeUndefined()

    const data = FS.readFileSync(awsCredentials, 'utf-8')
    const config = ini.parse(data)

    expect(config.profile1).toEqual({
      aws_access_key_id: credentials1.AccessKeyId,
      aws_secret_access_key: credentials1.SecretAccessKey,
      aws_security_token: credentials1.SessionToken,
      aws_session_token: credentials1.SessionToken,
    })
    expect(config.profile2).toEqual({
      aws_access_key_id: credentials2.AccessKeyId,
      aws_secret_access_key: credentials2.SecretAccessKey,
      aws_security_token: credentials2.SessionToken,
      aws_session_token: credentials2.SessionToken,
    })

    expect(config.profile3).toEqual({
      aws_access_key_id: credentials3.AccessKeyId,
      aws_secret_access_key: credentials3.SecretAccessKey,
      aws_security_token: credentials3.SessionToken,
      aws_session_token: credentials3.SessionToken,
      expiration: credentials3.Expiration,
    })
  })
})

describe('AwsCredentials#save - Region Handling', () => {
    beforeEach(() => {
    FS.rmSync(awsFolder, {
      force: true,
      recursive: true,
    })
  })

  it('should include region for gov regions', () => {
    const aws = new AwsCredentials()
    const credentials = {
      AccessKeyId: 'AKIA...',
      SecretAccessKey: 'secret...',
      SessionToken: 'token...',
    }

    process.env.HOME = dataDir

    const error = aws.save(credentials, 'profile', 'us-gov-west-1')
    const data = FS.readFileSync(awsCredentials, 'utf-8')
    const config = ini.parse(data)

    expect(error).toBeUndefined()
    expect(config.profile.region).toEqual('us-gov-west-1')
  })

  it('should not include region for non-gov regions', () => {
    const aws = new AwsCredentials()
    const credentials = {
      AccessKeyId: 'AKIA...',
      SecretAccessKey: 'secret...',
      SessionToken: 'token...',
    }

    process.env.HOME = dataDir

    const error = aws.save(credentials, 'profile', 'us-west-2')
    const data = FS.readFileSync(awsCredentials, 'utf-8')
    const config = ini.parse(data)

    expect(error).toBeUndefined()
    expect(config.profile.region).toBeUndefined()
  })

  it('should handle empty region string', () => {
    const aws = new AwsCredentials()
    const credentials = {
      AccessKeyId: 'AKIA...',
      SecretAccessKey: 'secret...',
      SessionToken: 'token...',
    }

    process.env.HOME = dataDir

    const error = aws.save(credentials, 'profile', '')
    const data = FS.readFileSync(awsCredentials, 'utf-8')
    const config = ini.parse(data)

    expect(error).toBeUndefined()
    expect(config.profile.region).toBeUndefined()
  })
})

describe('AwsCredentials#save - Error Handling', () => {
    beforeEach(() => {
    FS.rmSync(awsFolder, {
      force: true,
      recursive: true,
    })
  })

  it('should handle read errors gracefully', () => {
    const aws = new AwsCredentials()
    const credentials = {
      AccessKeyId: 'AKIA...',
    }

    process.env.HOME = dataDir

    // Create credentials file first
    let error: Error | void
    error = aws.save(credentials, 'profile1')
    expect(error).toBeUndefined()

    // Mock readFileSync to throw permission error
    jest.spyOn(FS, "readFileSync").mockImplementationOnce(() => {
      throw new Error('EACCES: permission denied')
    });

    error = aws.save(credentials, 'profile2')
    expect(error).not.toBeUndefined()
    expect(error?.message).toBe('EACCES: permission denied')
  })

  it('should handle write errors in fs.writeFile', () => {
    const aws = new AwsCredentials()
    const credentials = {
      AccessKeyId: 'AKIA...',
    }

    process.env.HOME = dataDir

    // Mock writeFile to fail
    jest.spyOn(FS, "writeFileSync").mockImplementationOnce((_p: FS.PathOrFileDescriptor, _d: string | NodeJS.ArrayBufferView, _o?: FS.WriteFileOptions) => {
       throw new Error('Write failed')
    });

    const error = aws.save(credentials, 'profile')
    expect(error).not.toBeUndefined()
    expect(error?.message).toBe('Write failed')
  })
})

describe('AwsCredentials#save - Multiple Profiles', () => {
    beforeEach(() => {
    FS.rmSync(awsFolder, {
      force: true,
      recursive: true,
    })
  })

  it('should update existing profile without affecting others', () => {
    const aws = new AwsCredentials()
    const credentials1 = {
      AccessKeyId: 'KEY1',
      SecretAccessKey: 'SECRET1',
      SessionToken: 'TOKEN1',
    }
    const credentials2 = {
      AccessKeyId: 'KEY2',
      SecretAccessKey: 'SECRET2',
      SessionToken: 'TOKEN2',
    }

    process.env.HOME = dataDir

    let error: Error | void
    error = aws.save(credentials1, 'profile1')
    expect(error).toBeUndefined()

    error = aws.save(credentials2, 'profile1')
    expect(error).toBeUndefined()

    const data = FS.readFileSync(awsCredentials, 'utf-8')
    const config = ini.parse(data)

    expect(config.profile1.aws_access_key_id).toBe('KEY2')
    expect(config.profile1.aws_secret_access_key).toBe('SECRET2')
  })

  it('should handle all credential fields', () => {
    const aws = new AwsCredentials()
    const credentials = {
      AccessKeyId: 'AKIA...',
      SecretAccessKey: 'secret...',
      SessionToken: 'token...',
      Expiration: '2025-03-01T18:00:00Z',
    }

    process.env.HOME = dataDir

    const error = aws.save(credentials, 'profile')
    expect(error).toBeUndefined()

    const data = FS.readFileSync(awsCredentials, 'utf-8')
    const config = ini.parse(data)

    expect(config.profile.aws_access_key_id).toBe('AKIA...')
    expect(config.profile.aws_secret_access_key).toBe('secret...')
    expect(config.profile.aws_session_token).toBe('token...')
    expect(config.profile.aws_security_token).toBe('token...')
    expect(config.profile.expiration).toBe('2025-03-01T18:00:00Z')
  })
})

describe('AwsCredentials#save - Directory Creation Errors', () => {
    beforeEach(() => {
    FS.rmSync(awsFolder, {
      force: true,
      recursive: true,
    })
  })

  it('should handle mkdir errors gracefully', () => {
    const aws = new AwsCredentials()
    const credentials = {
      AccessKeyId: 'AKIA...',
    }

    process.env.HOME = dataDir

    // Mock mkdirSync to throw permission error
    jest.spyOn(FS, "mkdirSync").mockImplementationOnce(() => {
      throw new Error('EACCES: permission denied, mkdir')
      });

    const error = aws.save(credentials, 'profile')
    expect(error).not.toBeUndefined()
    expect(error?.message).toContain('permission denied')
  })
})

describe('AwsCredentials#save - Empty Credentials Object', () => {
  beforeEach(() => {
    FS.rmSync(awsFolder, {
      force: true,
      recursive: true,
    })
  })

  it('should save even with empty credentials object', () => {
    const aws = new AwsCredentials()
    const credentials = {}

    process.env.HOME = dataDir

    const error = aws.save(credentials, 'profile')
    expect(error).toBeUndefined()
    const data = FS.readFileSync(awsCredentials, 'utf-8')
    const config = ini.parse(data)

      // Should have profile with undefined values
    expect(config.profile).toBeDefined()
  })

  it('should handle partial credentials with only some fields', () => {
    const aws = new AwsCredentials()
    const credentials = {
      AccessKeyId: 'AKIA...',
      Expiration: '2025-03-01T18:00:00Z',
    }

    process.env.HOME = dataDir

    const error = aws.save(credentials, 'profile')
    expect(error).toBeUndefined()

    const data = FS.readFileSync(awsCredentials, 'utf-8')
    const config = ini.parse(data)

    expect(config.profile.aws_access_key_id).toBe('AKIA...')
    expect(config.profile.expiration).toBe('2025-03-01T18:00:00Z')
    expect(config.profile.aws_secret_access_key).toBe('')
  })
})

describe('AwsCredentials#resolveHomePath', () => {
  beforeEach(() => {
    delete process.env.HOME
    delete process.env.USERPROFILE
    delete process.env.HOMEPATH
    delete process.env.HOMEDRIVE
  })

  it(
    'returns null if $HOME, $USERPROFILE, and $HOMEPATH are undefined',
    () => {
      expect(AwsCredentials.resolveHomePath()).toBeNull()
    },
  )

  it('uses $HOME if defined', () => {
    process.env.HOME = 'HOME'

    expect(AwsCredentials.resolveHomePath()).toEqual('HOME')
  })

  it('uses $USERPROFILE if $HOME is undefined', () => {
    process.env.USERPROFILE = 'USERPROFILE'

    expect(AwsCredentials.resolveHomePath()).toEqual('USERPROFILE')
  })

  it('uses $HOMEPATH if $HOME and $USERPROFILE are undefined', () => {
    process.env.HOMEPATH = 'HOMEPATH'

    expect(AwsCredentials.resolveHomePath()).toEqual('C:/HOMEPATH')
  })

  it('uses $HOMEDRIVE with $HOMEPATH if defined', () => {
    process.env.HOMEPATH = 'HOMEPATH'
    process.env.HOMEDRIVE = 'D:/'

    expect(AwsCredentials.resolveHomePath()).toEqual('D:/HOMEPATH')
  })
})
