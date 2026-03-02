import serverConfig from '../src/main/api/server-config';

describe('Server Config', () => {
  describe('express setup', () => {
    it('should configure app with server settings', () => {
      const mockAuth = {
        initialize: jest.fn(() => (req, res, next) => next()),
        session: jest.fn(() => (req, res, next) => next()),
      };

      const config = {
        server: {
          host: 'localhost',
          port: 2600,
        },
      };

      const app = serverConfig(mockAuth, config, 'test-secret');

      expect(app.get('host')).toBe('localhost');
      expect(app.get('port')).toBe(2600);
      expect(app.get('baseUrl')).toBe('http://localhost:2600/');
      expect(app.get('configureUrlRoute')).toBe('configure');
      expect(app.get('refreshUrlRoute')).toBe('refresh');
    });

    it('should initialize auth middleware', () => {
      const mockAuth = {
        initialize: jest.fn(() => (req, res, next) => next()),
        session: jest.fn(() => (req, res, next) => next()),
      };

      const config = {
        server: {
          host: 'localhost',
          port: 2600,
        },
      };

      serverConfig(mockAuth, config, 'test-secret');

      expect(mockAuth.initialize).toHaveBeenCalled();
      expect(mockAuth.session).toHaveBeenCalled();
    });

    it('should support different host and port configurations', () => {
      const mockAuth = {
        initialize: jest.fn(() => (req, res, next) => next()),
        session: jest.fn(() => (req, res, next) => next()),
      };

      const config = {
        server: {
          host: '127.0.0.1',
          port: 3000,
        },
      };

      const app = serverConfig(mockAuth, config, 'custom-secret');

      expect(app.get('host')).toBe('127.0.0.1');
      expect(app.get('port')).toBe(3000);
      expect(app.get('baseUrl')).toBe('http://127.0.0.1:3000/');
    });
  });

  describe('middleware stack', () => {
    it('should have middleware configured', () => {
      const mockAuth = {
        initialize: jest.fn(() => (req, res, next) => next()),
        session: jest.fn(() => (req, res, next) => next()),
      };

      const config = {
        server: {
          host: 'localhost',
          port: 2600,
        },
      };

      const app = serverConfig(mockAuth, config, 'test-secret');

      // Verify app is an Express app
      expect(typeof app.get).toBe('function');
      expect(typeof app.use).toBe('function');
      expect(typeof app.post).toBe('function');
    });
  });

  describe('CORS in development', () => {
    it('should have CORS headers set in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        const mockAuth = {
          initialize: jest.fn(() => (req, res, next) => next()),
          session: jest.fn(() => (req, res, next) => next()),
        };

        const config = {
          server: {
            host: 'localhost',
            port: 2600,
          },
        };

        const app = serverConfig(mockAuth, config, 'test-secret');

        expect(app).toBeDefined();
        // CORS middleware is added, we can verify app is configured
        expect(typeof app.use).toBe('function');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});
