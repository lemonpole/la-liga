import events from 'events';
import is from 'electron-is';
import { Tail } from 'tail';
import { IterableObject } from 'shared/types';


/**
 * Based off:
 * - https://github.com/CSGO-Analysis/hltv-scorebot/blob/master/Scorebot.js
 * - https://github.com/OpenSourceLAN/better-srcds-log-parser
 */

export const TeamEnum: IterableObject<number> = {
  CT: 0,
  TERRORIST: 1,
};


export const GameEvents = {
  ROUND_OVER: 'roundover',
  GAME_OVER: 'gameover',
  SAY: 'say',
};


const RegexTypes = {
  GAME_OVER_REGEX: new RegExp( /(?:Game Over)(?:.+)de_(\S+)(?:\D+)([\d]{1,2}):([\d]{1,2})/ ),
  ROUND_OVER_REGEX: new RegExp( /Team "(TERRORIST|CT)" triggered "(.+)" (?:.)+(\d)(?:.)+(\d)/ ),
  SAY_REGEX: new RegExp( /(?:.)+(?:say|say_team)(?:.)+"(.*)"/ ),
  STEAM_REGEX: new RegExp( /<(STEAM_\d+:\d+:\d+|BOT|Console)>/ ),
  TEAM_REGEX: new RegExp( /["<]?(CT|TERRORIST|Spectator|Unassigned)[">]?/ ),
};


export class Scorebot extends events.EventEmitter {
  private tail: Tail;

  public constructor( logpath: string ) {
    super();

    // `fs.watchFile` is required on windows, otherwise
    // the logs won't be streamed in realtime
    let useWatchFile = false;

    if( is.windows() ) {
      useWatchFile = true;
    }

    // start tailing the provided file
    this.tail = new Tail( logpath, { useWatchFile });

    // bind `this` to the event handler to
    // call our own class's emit functions
    this.tail.on( 'line', this.onLine.bind( this ) );
  }

  public unwatch() {
    this.tail.unwatch();
  }

  private onLine( line: string ) {
    // figure out what type of event this is
    //
    // look for SAY events
    let regexmatch = line.match( RegexTypes.SAY_REGEX );

    if( regexmatch ) {
      this.emit( GameEvents.SAY, regexmatch[ 1 ] );
      return;
    }

    // look for GAMEOVER events
    regexmatch = line.match( RegexTypes.GAME_OVER_REGEX );

    if( regexmatch ) {
      this.emit( GameEvents.GAME_OVER, {
        map: regexmatch[ 1 ],
        score: [
          parseInt( regexmatch[ 3 ] ),         // csgo inverts the final result. e.g.: 16:1
          parseInt( regexmatch[ 2 ] )          // so 16(team2) and 1(team1)
        ]
      });
      return;
    }

    // round end events
    // @note: regex only works for CS16
    regexmatch = line.match( RegexTypes.ROUND_OVER_REGEX );

    if( regexmatch ) {
      this.emit( GameEvents.ROUND_OVER, {
        winner: TeamEnum[ regexmatch[ 1 ] ],  // can be: CT or TERRORIST
        event: regexmatch[ 2 ],               // e.g.: CTs_Win or Target_Bombed
        score: regexmatch.slice( 3 )          // e.g.: [ 0 (ct) , 1 (t) ]
      });
      return;
    }
  }
}
