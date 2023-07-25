import * as Webdav from '../../../src';

import { Readable, Writable } from 'stream';

import * as path from 'path';
import * as fs from 'fs';
import { logger } from './utils';
import * as crypto from 'crypto';
export class VirtualResourceAllocator {
  private currentUID: number = 0;
  constructor(public folderPath: string) {}

  initialize(callback: Webdav.SimpleCallback): void {
    logger.info('Initializing VirtualResourceAllocator');
    fs.readdir(this.folderPath, (e, files) => {
      if (e) return callback(e);

      files.forEach((file) => {
        const id = parseInt(file);
        if (!isNaN(id) && this.currentUID < id) {
          logger.info('FILE', file);
          this.currentUID = id;
        }
      });

      callback();
    });
    callback();
  }

  allocate(): string {
    return (++this.currentUID).toString(16);
  }

  free(uid: string): void {
    if (fs.existsSync(this.fullPath(uid))) {
      fs.unlinkSync(this.fullPath(uid));
    }
  }

  fullPath(uid: string): string {
    return path.join(this.folderPath, uid);
  }

  readStream(uid: string): Readable {
    return fs.createReadStream(this.fullPath(uid));
  }

  writeStream(uid: string): Writable {
    return fs.createWriteStream(this.fullPath(uid));
  }

  getStats(name: string) {
    try {
      return fs.statSync(this.fullPath(name));
    } catch {
      return null;
    }
  }
}
