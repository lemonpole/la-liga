import path from 'path';
import { ipcMain, Menu } from 'electron';
import is from 'electron-is';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

import * as IPCRouting from 'shared/ipc-routing';
import { Profile } from 'main/database/models';
import ScreenManager from 'main/lib/screen-manager';
import { Screen } from 'main/lib/screen-manager/types';
import DefaultMenuTemplate, { RawDefaultMenuTemplate, MenuItems } from 'main/lib/default-menu';


// module-level variables and constants
const PORT = process.env.PORT || 3000;
const WIDTH = 300;
const HEIGHT = 400;
const CONFIG = {
  url: is.production()
    ? `file://${path.join( __dirname, 'dist/renderer/screens/splash/index.html' )}`
    : `http://localhost:${PORT}/screens/splash/index.html`,
  opts: {
    backgroundColor: '#000000',
    width: WIDTH,
    height: HEIGHT,
    frame: false,
    maximizable: false,
    resizable: false,
    movable: false,
    minimizable: false
  }
};

let screen: Screen;


/**
 * First run logic
 *
 * Figure out if this the first time the user runs the app. This will
 * help determine which window to redirect the user to.
 */

let redirect_target = IPCRouting.FirstRun.OPEN;


function checkuserdata() {
  return new Promise( resolve => {
    Profile
      .count()
      .then( count => {
        redirect_target = count > 0
          ? IPCRouting.Main.OPEN
          : IPCRouting.FirstRun.OPEN
        ;
        resolve();
      })
      .catch( err => {
        log.error([ err ]);
      })
    ;
  });
}


/**
 * Auto updater logic.
 */

// configure electron-updater logger
autoUpdater.autoDownload = false;
autoUpdater.logger = log;
// @ts-ignore
autoUpdater.logger.transports.file.level = 'debug';


// auto updater event handlers
function handleError( err: Error ) {
  screen.handle.webContents.send( IPCRouting.Splash.ERROR, err );

  // attempt to launch the main application anyways
  setTimeout( () => {
    ipcMain.emit( redirect_target );
    screen.handle.close();
  }, 2000 );
}


function handleCheckingUpdate() {
  // @TODO
}


function handleNoUpdateAvail() {
  screen.handle.webContents.send( IPCRouting.Splash.NO_UPDATE_AVAIL );

  // close the splash window after 2 seconds
  // and open the main application window
  setTimeout( () => {
    ipcMain.emit( redirect_target );
    screen.handle.close();
  }, 2000 );
}


function handleUpdateAvail() {
  if( is.production() ) {
    autoUpdater.downloadUpdate();
  }

  screen.handle.webContents.send( IPCRouting.Splash.UPDATE_AVAIL );
}


function handleDownloadProgress( progressObj: object ) {
  screen.handle.webContents.send( IPCRouting.Splash.DOWNLOADING, progressObj );
}


function handleUpdateDownloaded() {
  screen.handle.webContents.send( IPCRouting.Splash.DOWNLOADED );

  // wait two seconds so that the GUI gets a chance
  // to show a `done` message
  setTimeout( () => {
    // if in production: quit and install the update
    if( is.production() ) {
      autoUpdater.quitAndInstall();
      return;
    }

    // otherwise, manually close this window
    // and open the main application window
    ipcMain.emit( redirect_target );
    screen.handle.close();
  }, 2000 );
}


// fake auto-updater for development mode
function fakeAutoUpdater() {
  const FOUND_DELAY = 2000;
  const DOWNLOAD_FREQ = 500;
  const END_DOWNLOAD_DELAY = 5000;

  const PROBABILITY_MIN = 0;
  const PROBABILITY_MAX = 10;
  const NO_UPDATE_PROBABILITY_HIGH = 5;

  // generate a random number to decide whether we'll
  // fake an update or not
  const num = Math.floor( Math.random() * PROBABILITY_MAX ) + PROBABILITY_MIN;

  let ivl: NodeJS.Timeout;
  let progress = 0;

  // immediately call `handleCheckingUpdate`
  handleCheckingUpdate();

  // if we're below five then no update was found
  // send the message and bail
  if( num < NO_UPDATE_PROBABILITY_HIGH ) {
    setTimeout( () => {
      handleNoUpdateAvail();
    }, FOUND_DELAY );

    return;
  }

  // otherwise, we're going to fake that we got an update
  // after two seconds. and then begin "downloading" it
  setTimeout( () => {
    handleUpdateAvail();

    ivl = setInterval( () => {
      progress += 20;
      handleDownloadProgress({
        bytesPerSecond: 1500,
        percent: progress,
        transferred: 1500,
        total: 3000
      });
    }, DOWNLOAD_FREQ );
  }, FOUND_DELAY );

  // after a few seconds, call `handleUpdateDownloaded`
  // and cancel the above timer
  setTimeout( () => {
    clearInterval( ivl );
    handleUpdateDownloaded();
  }, END_DOWNLOAD_DELAY );
}


/**
 * Main functions
 */

function setupscreen() {
  // create the window
  screen = ScreenManager.createScreen( IPCRouting.Splash._ID, CONFIG.url, CONFIG.opts );

  // disable the menu only in prod
  if( is.production() ) {
    screen.handle.setMenu( null );
  }

  // on osx it's enforced to show the Application Menu item
  // and in addition, the `setMenu` function doesn't work
  if( is.osx() ) {
    // in prod only add the application menu item
    if( is.production() ) {
      // @ts-ignore
      const m = Menu.buildFromTemplate( [ RawDefaultMenuTemplate[ MenuItems.APPNAME ] ] );
      Menu.setApplicationMenu( m );

    // otherwise, add the default menu since the `setMenu` function
    // does not work in osx
    } else {
      Menu.setApplicationMenu( DefaultMenuTemplate );
    }
  }
}


function setupautoupdater() {
  // if in production use the real auto-updater
  // otherwise use the fake one.
  if( is.production() ) {
    // @note: flip this on once auto-updating is enabled
    autoUpdater.on( 'error', handleError );
    autoUpdater.on( 'checking-for-update', handleCheckingUpdate );
    autoUpdater.on( 'update-available', handleUpdateAvail );
    autoUpdater.on( 'update-not-available', handleNoUpdateAvail );
    autoUpdater.on( 'download-progress', handleDownloadProgress );
    autoUpdater.on( 'update-downloaded', handleUpdateDownloaded );
    autoUpdater.checkForUpdates();

    // @note: flip this off once auto-updating is enabled
    // fakeAutoUpdater();
  } else {
    fakeAutoUpdater();
  }
}


export default () => {
  checkuserdata().then( () => {
    setupscreen();
    setupautoupdater();
  });
};
