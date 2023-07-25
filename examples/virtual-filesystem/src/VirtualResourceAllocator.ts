import * as Webdav from '../../../src';

import { Readable, Writable } from 'stream';

import * as path from 'path';
import * as fs from 'fs';
import { logger } from './utils';
import * as crypto from 'crypto';
export class VirtualResourceAllocator {
  constructor(public folderPath: string) {}

  initialize(callback: Webdav.SimpleCallback): void {
    logger.info('Initializing VirtualResourceAllocator');
    callback();
  }

  allocate(name: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(name);
    return hash.digest().toString('hex').slice(0, 16);
  }

  free(name: string): void {
    if (fs.existsSync(this.fullPath(name))) {
      fs.unlinkSync(this.fullPath(name));
    }
  }

  fullPath(name: string): string {
    return path.join(this.folderPath, name);
  }

  readStream(name: string): Readable {
    return fs.createReadStream(this.fullPath(name));
  }

  writeStream(name: string): Writable {
    return fs.createWriteStream(this.fullPath(name));
  }
}
