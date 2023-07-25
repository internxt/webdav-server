import * as Webdav from '../../../src';

import { VirtualFileSystem } from './VirtualFileSystem';
import { VirtualResourceAllocator } from './VirtualResourceAllocator';
import { VirtualResource } from './VirtualResource';
import { logger } from './utils';

export interface VirtualFileSystemSerializedData {
  path: string;
  resources: {
    [path: string]: VirtualResource;
  };
}

export class VirtualFilesystemSerializer
  implements Webdav.FileSystemSerializer
{
  uid(): string {
    return 'VirtualStoredSerializer-1.0.0';
  }

  serialize(
    fs: VirtualFileSystem,
    callback: Webdav.ReturnCallback<VirtualFileSystemSerializedData>
  ): void {
    callback(undefined, {
      path: fs.allocator.folderPath,
      resources: fs.resources,
    });
  }

  unserialize(
    serializedData: VirtualFileSystemSerializedData,
    callback: Webdav.ReturnCallback<VirtualFileSystem>
  ): void {
    logger.info('Unserializing filesystem');
    this.createNewFileSystem(serializedData.path, (e, fs) => {
      if (e) return callback(e);

      if (!fs) return callback(new Error('No FileSystem to unserialize found'));
      for (const path in serializedData.resources) {
        fs.resources[path] = new VirtualResource(
          serializedData.resources[path]
        );
      }

      callback(undefined, fs);
    });
  }

  createNewFileSystem(
    path: string,
    callback: Webdav.ReturnCallback<VirtualFileSystem>
  ): void {
    const allocator = new VirtualResourceAllocator(path);
    allocator.initialize((e) => {
      if (e) return callback(e);

      const fs = new VirtualFileSystem(allocator);
      fs.setSerializer(this);
      callback(undefined, fs);
    });
  }
}
