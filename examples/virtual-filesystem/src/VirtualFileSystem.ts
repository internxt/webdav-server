import * as Webdav from '../../../src';

import { VirtualResourceAllocator } from './VirtualResourceAllocator';
import { VirtualResource } from './VirtualResource';
import { Readable, Writable } from 'stream';
import { VirtualFilesystemSerializer } from './VirtualFileSystemSerializer';
import { logger } from './utils';

export class VirtualFileSystem extends Webdav.FileSystem {
  resources: {
    [path: string]: VirtualResource;
  };

  constructor(public allocator: VirtualResourceAllocator) {
    super(new VirtualFilesystemSerializer());

    this.resources = {
      '/': new VirtualResource(Webdav.ResourceType.Directory),
    };
  }

  protected _fastExistCheck(
    ctx: Webdav.RequestContext,
    path: Webdav.Path,
    callback: (exists: boolean) => void
  ): void {
    callback(!!this.resources[path.toString()]);
  }

  protected _create(
    path: Webdav.Path,
    ctx: Webdav.CreateInfo,
    callback: Webdav.SimpleCallback
  ): void {
    logger.info(
      `Creating ${
        ctx.type.isFile ? 'file' : 'folder'
      } resource at ${path.toString()}`
    );

    let resource = this.resources[path.toString()];
    if (resource) return callback(Webdav.Errors.ResourceAlreadyExists);

    resource = new VirtualResource(ctx.type);
    const id = this.allocator.allocate(path.fileName());
    resource.contentUID = id;
    this.resources[path.toString()] = resource;
    callback();
  }

  protected _delete(
    path: Webdav.Path,
    ctx: Webdav.DeleteInfo,
    callback: Webdav.SimpleCallback
  ): void {
    logger.info(`Deleting resource at ${path.toString()}`);
    const resource = this.resources[path.toString()];
    if (!resource) return callback(Webdav.Errors.ResourceNotFound);

    this.allocator.free(resource.contentUID);
    delete this.resources[path.toString()];
    callback();
  }

  protected _openWriteStream(
    path: Webdav.Path,
    ctx: Webdav.OpenWriteStreamInfo,
    callback: Webdav.ReturnCallback<Writable>
  ): void {
    const resource = this.resources[path.toString()];
    if (!resource) return callback(Webdav.Errors.ResourceNotFound);

    callback(undefined, this.allocator.writeStream(resource.contentUID));
  }

  protected _openReadStream(
    path: Webdav.Path,
    ctx: Webdav.OpenReadStreamInfo,
    callback: Webdav.ReturnCallback<Readable>
  ): void {
    logger.info(`Opening read stream for file at ${path.toString()}`);
    const resource = this.resources[path.toString()];
    if (!resource) return callback(Webdav.Errors.ResourceNotFound);
    callback(undefined, this.allocator.readStream(resource.contentUID));
  }

  protected _lockManager(
    path: Webdav.Path,
    ctx: Webdav.LockManagerInfo,
    callback: Webdav.ReturnCallback<Webdav.ILockManager>
  ): void {
    const resource = this.resources[path.toString()];
    if (!resource) return callback(Webdav.Errors.ResourceNotFound);
    callback(undefined, resource.lockManager);
  }

  protected _propertyManager(
    path: Webdav.Path,
    ctx: Webdav.PropertyManagerInfo,
    callback: Webdav.ReturnCallback<Webdav.IPropertyManager>
  ): void {
    const resource = this.resources[path.toString()];
    if (!resource) return callback(Webdav.Errors.ResourceNotFound);
    callback(undefined, resource.propertyManager);
  }

  protected _readDir(
    path: Webdav.Path,
    ctx: Webdav.ReadDirInfo,
    callback: Webdav.ReturnCallback<string[] | Webdav.Path[]>
  ): void {
    const sPath = path.toString();

    const paths: Webdav.Path[] = [];
    for (const subPath in this.resources)
      if (subPath.indexOf(sPath) === 0) {
        var pSubPath = new Webdav.Path(subPath);
        if (pSubPath.paths.length === path.paths.length + 1)
          paths.push(pSubPath);
      }

    callback(undefined, paths);
  }

  protected _creationDate(
    path: Webdav.Path,
    ctx: Webdav.CreationDateInfo,
    callback: Webdav.ReturnCallback<number>
  ): void {
    const resource = this.resources[path.toString()];
    if (!resource) return callback(Webdav.Errors.ResourceNotFound);
    callback(undefined, resource.creationDate);
  }

  protected _lastModifiedDate(
    path: Webdav.Path,
    ctx: Webdav.LastModifiedDateInfo,
    callback: Webdav.ReturnCallback<number>
  ): void {
    const resource = this.resources[path.toString()];
    if (!resource) return callback(Webdav.Errors.ResourceNotFound);

    callback(undefined, resource.lastModifiedDate);
  }

  protected _type(
    path: Webdav.Path,
    ctx: Webdav.TypeInfo,
    callback: Webdav.ReturnCallback<Webdav.ResourceType>
  ): void {
    const resource = this.resources[path.toString()];
    if (!resource) return callback(Webdav.Errors.ResourceNotFound);
    callback(undefined, resource.type);
  }

  protected _size(
    path: Webdav.Path,
    ctx: Webdav.SizeInfo,
    callback: Webdav.ReturnCallback<number>
  ): void {
    const resource = this.resources[path.toString()];
    if (!resource) return callback(Webdav.Errors.ResourceNotFound);
    const stats = this.allocator.getStats(resource.contentUID);

    return callback(undefined, stats.size);
  }
}
