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
      '/': new VirtualResource({
        type: Webdav.ResourceType.Directory,
      }),
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

    const resource = this.resources[path.toString()];
    if (resource) return callback(Webdav.Errors.ResourceAlreadyExists);

    this.resources[path.toString()] = new VirtualResource({
      type: ctx.type,
      uid: this.allocator.allocate(),
    });

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

    this.allocator.free(resource.uid);
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

    callback(undefined, this.allocator.writeStream(resource.uid));
  }

  protected _openReadStream(
    path: Webdav.Path,
    ctx: Webdav.OpenReadStreamInfo,
    callback: Webdav.ReturnCallback<Readable>
  ): void {
    //logger.info(`Opening read stream for file at ${path.toString()}`);

    const resource = this.resources[path.toString()];
    if (!resource) return callback(Webdav.Errors.ResourceNotFound);
    callback(undefined, this.allocator.readStream(resource.uid));
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

  /*   protected _move(
    pathFrom: Webdav.Path,
    pathTo: Webdav.Path,
    ctx: Webdav.MoveInfo,
    callback: Webdav.ReturnCallback<boolean>
  ): void {
    const resource = this.resources[pathFrom.toString()];

    if (!resource) return callback(Webdav.Errors.ResourceNotFound);

    this.resources[pathTo.toString()] = new VirtualResource({
      type: resource.type,
      uid: resource.uid,
      lastModifiedDate: resource.lastModifiedDate,
      creationDate: resource.creationDate,
      lockManager: resource.lockManager,
      propertyManager: resource.propertyManager,
    });

    delete this.resources[pathFrom.toString()];

    callback(undefined, true);
  } */

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

    if (resource.type === Webdav.ResourceType.Directory) {
      return callback(undefined, undefined);
    }

    const stats = this.allocator.getStats(resource.uid);
    if (!stats) return callback(undefined, undefined);
    return callback(undefined, stats.size);
  }
}
