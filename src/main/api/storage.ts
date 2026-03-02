import * as fs from 'node:fs';

export class Storage {
  data: Record<string, unknown> | null = null;

  file: string;

  constructor(file: string) {
    this.file = file;
  }

  load(): void {
    if (this.data !== null) {
      return;
    }
    if (!fs.existsSync(this.file)) {
      this.data = {};
      return;
    }
    const json = fs.readFileSync(this.file, 'utf8');

    if (json === '') {
      this.data = {};
      return;
    }
    this.data = JSON.parse(json);
  }

  save(): void {
    if (this.data !== null) {
      fs.writeFileSync(this.file, JSON.stringify(this.data), 'utf8');
    }
  }

  set(key: string, value: unknown): void {
    this.load();
    this.data![key] = value;
    this.save();
  }

  get<T>(key: string): T | undefined {
    this.load();
    if (key in this.data!) {
      return this.data![key] as T;
    }
    return undefined;
  }

  delete(key: string): void {
    this.load();
    if (key in this.data!) {
      delete this.data![key];
    }
    this.save();
  }
}

export default (path: string): Storage => new Storage(path);
