
export interface Metadata {
  name?: string
  profileUuid?: string
  url?: string
}

export interface StoredMetadata {
  name: string
  url: string
  roles?: string[]
  profileUuid?: string
}

export interface LoginPayload {
  profileUuid?: string
  profileName: string
  metadataUrl: string
}

export interface Role {
  accountId: string
  index?: number
  principalArn: string
  roleArn: string
  roleName: string
}

export interface Session {
  accountId?: string
  roleName?: string
  showRole?: boolean
  principalArn?: string
  roleArn?: string
  samlResponse?: string
  roles?: Role[]
  // JIT-specific fields
  apiUri?: string
  header?: Record<string, string>
  region?: string
  duration?: number
  roleConfigId?: string
}

export interface AWSCredentials {
  AccessKeyId?: string
  SecretAccessKey?: string
  SessionToken?: string
  Expiration?: Date | string
}

export interface ServerConfig {
  host: string
  port: number
}

export interface AuthConfig {
  path: string
  audience: string
  entryPoint?: string
  idpCert: string | string[]
  issuer: string
  callbackUrl: string
}

export interface AWSConfig {
  duration: number
}

export interface Config {
  server: ServerConfig
  auth: AuthConfig
  aws: Partial<AWSConfig>
}

