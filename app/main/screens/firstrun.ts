import path from 'path';
import { ipcMain, Menu } from 'electron';
import is from 'electron-is';

import { IterableObject } from 'shared/types';
import * as Models from 'main/database/models';
import * as Worldgen from 'main/lib/worldgen';
import { Screen } from 'main/lib/screen-manager/types';
import ScreenManager from 'main/lib/screen-manager';
import DefaultMenuTemplate from 'main/lib/default-menu';


// module-level variables and constants
const PORT = process.env.PORT || 3000;
const WIDTH = 800;
const HEIGHT = 650;
const CONFIG = {
  url: is.production()
    ? `file://${path.join( __dirname, 'dist/renderer/screens/firstrun/index.html' )}`
    : `http://localhost:${PORT}/screens/firstrun/index.html`,
  opts: {
    backgroundColor: '#f5f5f5', // "whitesmoke"
    width: WIDTH,
    height: HEIGHT,
    minWidth: WIDTH,
    minHeight: HEIGHT,
    maximizable: false,
    resizable: false,
    movable: false,
    minimizable: false,
  }
};


let screen: Screen;


/**
 * Utility functions
 */

function openMainWindow() {
  // wait a few seconds before opening the main window
  setTimeout( () => {
    ipcMain.emit( '/worldgen/email/intro' );
    ipcMain.emit( '/screens/main/open' );
    screen.handle.close();
  }, 2000 );
}


/**
 * World gen functions
 */

async function saveplayer( data: IterableObject<any>[] ) {
  const [ userinfo, teaminfo ] = data;

  // get the countryids
  const teamcountry = await Models.Country.findOne({ where: { name: teaminfo.country }});
  const playercountry = await Models.Country.findOne({ where: { name: userinfo.country }});

  // build team object
  const team = await Models.Team.create({
    name: teaminfo.name,
    tier: 4,
  });

  // build player object
  const player = await Models.Player.create({
    alias: userinfo.alias,
    tier: 4,
  });

  // create the new user profile
  const profile = await Models.Profile.create();

  // save associations and return as a single promise
  return Promise.all([
    team.setCountry( teamcountry as Models.Country ),
    player.setTeam( team ),
    player.setCountry( playercountry as Models.Country ),
    profile.setTeam( team ),
    profile.setPlayer( player )
  ]);
}


/**
 * IPC Handlers
 */

async function saveFirstRunHandler( evt: object, data: IterableObject<any>[] ) {
  Promise.resolve( data )
    // save the player information
    .then( saveplayer )

    // assign a manager+astmanager to the new team
    .then( Worldgen.assignManagers )

    // generate the competitions
    .then( Worldgen.genAllComps )

    // finished!
    .then( openMainWindow )
  ;
}


function openWindowHandler() {
  screen = ScreenManager.createScreen(
    '/screens/firstrun',
    CONFIG.url,
    CONFIG.opts
  );
  screen.handle.setMenu( DefaultMenuTemplate );

  // the `setMenu` function above doesn't work on
  // osx so we'll have to accomodate for that
  if( is.osx() ) {
    Menu.setApplicationMenu( DefaultMenuTemplate );
  }
}


export default () => {
  // ipc listeners
  ipcMain.on( '/screens/firstrun/open', openWindowHandler );
  ipcMain.on( '/screens/firstrun/save', saveFirstRunHandler );
};