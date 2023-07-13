import { WebDAVServer } from '../server';
import { startsWith } from '../helper/JSCompatibility';
import { Path } from '../manager';

/**
 * Mount a WebDAVServer instance on a ExpressJS server.
 *
 * @param root Root path of the mount
 * @param server Server to mount
 */
export function express(root: string, server: WebDAVServer) {
  const path = new Path(root).toString(true);

  return function (req, res, next) {
    let url = req.url;
    if (url[url.length - 1] !== '/') url += '/';

    if (!startsWith(url, path)) return next();

    const subPath = url.substring(path.length);

    req.url = new Path(subPath).toString(false);

    server.executeRequest(req, res, path);
  };
}
