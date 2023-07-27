import * as Webdav from '../../../src';
import { logger } from './utils';

export class VirtualResource {
  type: Webdav.ResourceType;
  propertyManager: Webdav.LocalPropertyManager;
  lockManager: Webdav.LocalLockManager;
  creationDate: number;
  lastModifiedDate: number;
  uid?: string;

  constructor(data: Partial<VirtualResource>) {
    this.type = data.type;
    this.propertyManager = new Webdav.LocalPropertyManager(
      data.propertyManager
    );

    this.creationDate = data.creationDate ?? Date.now();
    this.lastModifiedDate = data.lastModifiedDate ?? this.creationDate;

    this.uid = data.uid;

    this.lockManager = new Webdav.LocalLockManager();
  }
}
