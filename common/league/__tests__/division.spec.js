// @flow
import adjectiveAnimal from 'adjective-animal';
import cuid from 'cuid';
import { chunk, random } from 'lodash';
import GroupStage from 'groupstage';
import { Division, Competitor } from '../';

describe( 'division', () => {
  const SIZE = 256;
  const CONF_SIZE = 8;

  let divObj;
  let conferences;

  beforeEach( () => {
    // reinstatiate division
    divObj = new Division( 'Open', SIZE, CONF_SIZE );

    // add competitors
    for( let i = 0; i < SIZE; i++ ) {
      divObj.addCompetitor( adjectiveAnimal.generateName() );
    }

    // create conferences
    conferences = chunk( divObj.competitors, CONF_SIZE ).map( conf => ({
      id: cuid(),
      competitors: conf,
      groupObj: new GroupStage( conf.length, { groupSize: CONF_SIZE })
    }) );

    divObj.setConferences( conferences );
  });

  it( 'adds a competitor', () => {
    const COMP_NAME = 'compLexity Gaming';
    const div = new Division( 'Invite', 64 );
    div.addCompetitor( COMP_NAME );

    expect( div.competitors ).toEqual( [
      { name: COMP_NAME }
    ] );
  });

  it( 'adds an array of competitors', () => {
    const COMP_NAME = 'Rival';
    const COMP_ARRAY = [
      { name: 'compLexity Gaming' },
      { name: 'Team 3D' },
      { name: 'Evil Geniuses' }
    ];
    const div = new Division( 'Invite', 64 );
    div.addCompetitor( COMP_NAME );
    div.addCompetitors( COMP_ARRAY.map( item => item.name ) );

    expect( div.competitors ).toEqual( [
      { name: COMP_NAME },
      ...COMP_ARRAY
    ] );
  });

  it( 'checks that division is not done when conferences have oustanding matches left', () => {
    expect( divObj.isDone() ).toBeFalsy();
  });

  it( 'generates random scores for all conferences and checks when division is all done', () => {
    // generate scores for all conferences
    conferences.forEach( ( conf ) => {
      const { groupObj } = conf;
      const { matches } = groupObj;

      matches.forEach( ( matchObj ) => {
        groupObj.score( matchObj.id, [ random( 16 ), random( 16 ) ] );
      });
    });

    // division should return true
    // when all conferences have completed their matches
    expect( divObj.isDone() ).toBeTruthy();
  });

  it( 'does not start post-season if there are outstanding conference matches left', () => {
    expect( divObj.startPostSeason() ).toBeFalsy();
  });

  it( "gets a competitor's group info", () => {
    // override one of the randomly generated competitors with our own
    const NAME = 'dahang';
    const CONF_NUM = random( divObj.conferences.length );
    const SEED_NUM = random( CONF_SIZE );
    divObj.conferences[ CONF_NUM ].competitors[ SEED_NUM ] = new Competitor( NAME );

    expect( divObj.getCompetitorGroupObj( NAME ) ).not.toBeNull();
  });

  it( "returns null if a competitor's group info is not found", () => {
    expect( divObj.getCompetitorGroupObj( 'rapha' ) ).toBeNull();
  });

  it( 'returns a competitor name by seed and conference number', () => {
    const CONF_NUM = random( divObj.conferences.length );
    const SEED_NUM = random( CONF_SIZE );

    // override one of the randomly generated competitors with our own
    const NAME = 'cooller';
    const competitorObj = new Competitor( NAME );
    divObj.conferences[ CONF_NUM ].competitors[ SEED_NUM ] = competitorObj;

    expect( divObj.getCompetitorName( CONF_NUM, SEED_NUM ) ).toEqual( competitorObj );
  });

  it( 'begins postseason', () => {
    // generate scores for all conferences
    conferences.forEach( ( conf ) => {
      const { groupObj } = conf;
      const { matches } = groupObj;

      matches.forEach( ( matchObj ) => {
        groupObj.score( matchObj.id, [ random( 16 ), random( 16 ) ] );
      });
    });

    // only continue if post season can be started
    // kind of a dupe for the post-season unit tests but whatever
    expect( divObj.startPostSeason() ).toBeTruthy();

    // generate scores for all promotion conference playoffs
    const { promotionConferences } = divObj;
    promotionConferences.forEach( ( conf: PromotionConference ) => {
      const { duelObj } = conf;
      const { matches } = duelObj;

      // for each match simulator a best-of-N
      const BEST_OF = 5;
      const WIN_AMT = 3;
      matches.forEach( ( matchObj ) => {
        let aFinalScore = 0;
        let bFinalScore = 0;

        // simulate a Bo5 game
        // TODO: move into its own function to reuse elsewhere?
        // TODO: possibly make class for simulator engine
        for( let i = 0; i < BEST_OF; i++ ) {
          // assign scores and check if they are tied
          let aScore = random( 16 );
          let bScore = random( 16 );

          // if they are tied, keep trying until they aren't...
          while( aScore === bScore ) {
            aScore = random( 16 );
            bScore = random( 16 );
          }

          // whomever won this round gets a point
          aFinalScore = aScore > bScore ? aFinalScore + 1 : aFinalScore;
          bFinalScore = bScore > aScore ? bFinalScore + 1 : bFinalScore;

          // whomever reaches WIN_AMT wins
          if( aFinalScore === WIN_AMT || bFinalScore === WIN_AMT ) {
            break;
          }
        }

        // submit the scores
        // but only if they are scoreable. see:
        // https://github.com/clux/tournament/blob/master/doc/base.md#ensuring-scorability--consistency
        if( duelObj.unscorable( matchObj.id, [ aFinalScore, bFinalScore ] ) === null ) {
          duelObj.score( matchObj.id, [ aFinalScore, bFinalScore ] );
        }
      });

      // all games should be done. seems the duelObj.p (lowest power) === final round num.
      // 4 lowest pow of 16 which is how many players there are
      // so the final is played in round 4
    });
  });
});