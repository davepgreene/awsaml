export {};

interface Role {
  index: number;
  accountId: string;
  roleName: string;
  principalArn: string;
  roleArn: string;
}

interface Credentials {
  accessKey: string;
  secretKey: string;
  sessionToken: string;
  expiration: string;
  accountId: string;
  platform: string;
  profileName: string;
  roleName: string;
  showRole: boolean;
  error?: string;
  redirect?: string;
  logout?: number;
}

interface MetadataUrl {
  url: string;
  name: string;
  profileUuid: string;
  roles?: string[];
}

interface LoginPayload {
  metadataUrl: string;
  profileName: string;
  profileUuid?: string;
}

interface LoginResponse {
  error?: string;
  redirect?: string;
  metadataUrlValid?: boolean;
}

declare global {
  interface Window {
    electronAPI: {
      copy: (text: string) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      getRoles: () => Promise<{ roles: Role[] }>;
      setRole: (payload: { index: number }) => Promise<{ error?: string; status?: string }>;
      refresh: () => Promise<Credentials>;
      logout: () => Promise<{ logout: boolean }>;
      getDarkMode: () => Promise<boolean>;
      darkModeUpdated: (callback: (event: unknown, value: boolean) => void) => void;
      reloadUi: (callback: (event: unknown, value: Credentials) => void) => void;
      isAuthenticated: () => Promise<boolean>;
      hasMultipleRoles: () => Promise<boolean>;
      getDefaultMetadata: () => Promise<{ url: string; name: string }>;
      login: (payload: LoginPayload) => Promise<LoginResponse>;
      getMetadataUrls: () => Promise<MetadataUrl[]>;
      setMetadataUrls: (urls: MetadataUrl[]) => Promise<void>;
      deleteProfile: (payload: { profileUuid: string }) => Promise<void>;
    };
  }
}
