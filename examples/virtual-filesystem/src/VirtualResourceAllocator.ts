import * as Webdav from '../../../src';

import { Readable, Writable } from 'stream';

import * as path from 'path';
import * as fs from 'fs';
import { logger } from './utils';

export class VirtualResourceAllocator {
  currentUID: number;

  constructor(public folderPath: string) {
    this.currentUID = 0;
  }

  initialize(callback: Webdav.SimpleCallback): void {
    logger.info('Initializing VirtualResourceAllocator');
    fs.readdir(this.folderPath, (e, files) => {
      if (e) return callback(e);

      files.forEach((file) => {
        const id = parseInt(file);
        if (!isNaN(id) && this.currentUID < id) this.currentUID = id;
      });

      logger.info('VirtualResourceAllocator initialized');
      callback();
    });
  }

  allocate(): string {
    return (++this.currentUID).toString(16);
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
