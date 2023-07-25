import * as Webdav from '../../../src';

export class VirtualResource {
  type: Webdav.ResourceType;
  propertyManager: Webdav.LocalPropertyManager;
  lockManager: Webdav.LocalLockManager;
  creationDate: number;
  lastModifiedDate: number;
  contentUID?: string;

  constructor(data: VirtualResource | Webdav.ResourceType) {
    if (data.constructor === Webdav.ResourceType) {
      this.type = data as Webdav.ResourceType;
      this.propertyManager = new Webdav.LocalPropertyManager();
      this.creationDate = Date.now();
      this.lastModifiedDate = this.creationDate;
      this.contentUID = undefined;
    } else {
      const resource = data as VirtualResource;

      this.type = resource.type;
      this.propertyManager = new Webdav.LocalPropertyManager(
        resource.propertyManager
      );
      this.creationDate = resource.creationDate;
      this.lastModifiedDate = resource.lastModifiedDate;
      this.contentUID = resource.contentUID;
    }

    this.lockManager = new Webdav.LocalLockManager();
  }
}
