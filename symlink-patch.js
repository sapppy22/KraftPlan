// symlink-patch.js
// Patches fs.symlink and fs.symlinkSync to use directory copy on Windows
// when symlinks would fail due to missing privileges.
// Load with: node --require ./symlink-patch.js <script>

const fs = require('fs');
const path = require('path');

const origSymlink = fs.symlink.bind(fs);
const origSymlinkSync = fs.symlinkSync.bind(fs);
const origPromisesSymlink = fs.promises.symlink.bind(fs.promises);

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function copyRecursive(src, dest) {
  fs.cpSync(src, dest, { recursive: true, force: true });
}

fs.symlink = function(target, path2, type, callback) {
  if (typeof type === 'function') { callback = type; type = undefined; }
  const resolvedTarget = path.isAbsolute(target)
    ? target
    : path.resolve(path.dirname(path2), target);
  
  origSymlink(target, path2, type || 'file', (err) => {
    if (err && (err.code === 'EPERM' || err.code === 'EACCES')) {
      // Fall back to copy
      try {
        if (isDir(resolvedTarget)) {
          copyRecursive(resolvedTarget, path2);
        } else {
          fs.copyFileSync(resolvedTarget, path2);
        }
        callback(null);
      } catch (copyErr) {
        callback(copyErr);
      }
    } else {
      callback(err);
    }
  });
};

fs.symlinkSync = function(target, path2, type) {
  const resolvedTarget = path.isAbsolute(target)
    ? target
    : path.resolve(path.dirname(path2), target);
  try {
    origSymlinkSync(target, path2, type);
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EACCES') {
      // Fall back to copy
      if (isDir(resolvedTarget)) {
        copyRecursive(resolvedTarget, path2);
      } else {
        fs.copyFileSync(resolvedTarget, path2);
      }
    } else {
      throw err;
    }
  }
};

fs.promises.symlink = async function(target, path2, type) {
  const resolvedTarget = path.isAbsolute(target)
    ? target
    : path.resolve(path.dirname(path2), target);
  try {
    await origPromisesSymlink(target, path2, type);
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EACCES') {
      if (isDir(resolvedTarget)) {
        fs.cpSync(resolvedTarget, path2, { recursive: true, force: true });
      } else {
        fs.copyFileSync(resolvedTarget, path2);
      }
    } else {
      throw err;
    }
  }
};

// console.log('[symlink-patch] fs.symlink patched to use copy on EPERM');
