import * as Webdav from '../../src';
import { VirtualFilesystemSerializer } from './src/VirtualFileSystemSerializer';
import * as path from 'path';
import * as fs from 'fs';
import { AddressInfo } from 'net';
import { logger } from './src/utils';
import { exec } from 'child_process';
import { homedir } from 'os';
import { xml2json } from 'xml-js';
import { DEBUG_WEBDAV_METHODS, ENABLE_DEBUG_WEBDAV_REQUESTS } from './config';
import { VirtualFileSystem } from './src/VirtualFileSystem';
import { VirtualResourceAllocator } from './src/VirtualResourceAllocator';
const serializer = new VirtualFilesystemSerializer();

let webdavMounted = false;
const webdavFolderPath = homedir() + '/VirtualFS';
const vsfsPath = path.resolve('./data/filesystem');

const server = new Webdav.WebDAVServer({
  hostname: 'localhost',
  requireAuthentification: false,
  rootFileSystem: new VirtualFileSystem(new VirtualResourceAllocator(vsfsPath)),
  port: 1901,
  autoSave: {
    onSaveError: (error) => {
      logger.error('Error saving server state: ', error);
    },
    treeFilePath: path.resolve('./data/state'),
  },
  autoLoad: {
    serializers: [serializer],
    treeFilePath: path.resolve('./data/state'),
  },
});

const vsfsPathExists = fs.existsSync(vsfsPath);

if (!vsfsPathExists) {
  fs.mkdir(vsfsPath, { recursive: true }, (e) => {
    if (e) throw e;

    serializer.createNewFileSystem(vsfsPath, (e, vsfs) => {
      if (e) throw e;

      if (!vsfs) throw new Error('Virtual filesystem cannot be created');
      server.setFileSystemSync('/', vsfs, false);
      logger.info('Filesystem mounted');
    });
  });
} else {
  serializer.createNewFileSystem(vsfsPath, (e, vsfs) => {
    if (e) throw e;

    if (!vsfs) throw new Error('Virtual filesystem cannot be created');
    server.setFileSystemSync('/', vsfs, false);
    logger.info('Filesystem mounted');
  });
}

if (!fs.existsSync(webdavFolderPath)) {
  fs.mkdirSync(webdavFolderPath, { recursive: true });
}

if (ENABLE_DEBUG_WEBDAV_REQUESTS) {
  server.afterRequest((ctx, next) => {
    if (
      DEBUG_WEBDAV_METHODS[0] === '*' ||
      DEBUG_WEBDAV_METHODS.map((method) => method.toLowerCase()).includes(
        ctx.request.method.toLowerCase()
      )
    ) {
      logger.info(
        `[${ctx.request.method}] ${ctx.response.statusCode} ${
          ctx.request.url
        } ${
          ctx.responseBody
            ? xml2json(ctx.responseBody, {
                spaces: 4,
                compact: true,
              })
            : 'NO_BODY'
        }`
      );
    }

    next();
  });
}

const exitHandler = () => {
  if (!webdavMounted) return;
  server.stop(() => {
    logger.info('Shutting down server');
    process.exit(0);
  });
  exec(`umount ${webdavFolderPath}`, (error) => {
    if (error) {
      logger.error(`Error unmounting webdav, you'll need to eject it manually`);
    } else {
      logger.info(`Webdav unmount correctly`);
    }
  });
};
server.start((s) => {
  const addressInfo = s.address() as AddressInfo;
  logger.info(`Virtual filesystem ready at ${addressInfo.port}`);

  logger.info('Mounting webdav');
  server.autoLoadAsync().catch((error) => {
    logger.error('Autoload failed: ', error);
  });
  exec(
    `mount_webdav -v 'Virtual FS' http://localhost:${addressInfo.port} ${webdavFolderPath}`,
    (error) => {
      if (error) {
        exitHandler();
        logger.error('Error mounting webdav: ', error);
      } else {
        webdavMounted = true;
        logger.info('Webdav ready');
      }
    }
  );
});

process.once('SIGHUP', exitHandler);
