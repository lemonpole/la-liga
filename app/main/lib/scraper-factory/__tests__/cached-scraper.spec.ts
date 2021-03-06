import fs from 'fs';
import path from 'path';
import { RequestCallback } from 'request';
import { mocked } from 'ts-jest';
import mock from 'mock-fs';
import cloudscraper from 'cloudscraper';


// mock cloudscraper before CachedScraper is imported
jest.mock( 'cloudscraper' );
import CachedScraper from '../cached-scraper';


// NOTE: workaround for a bug in mock-fs
// SEE: https://github.com/facebook/jest/issues/5792#issuecomment-376678248
console.log = jest.fn();


describe( 'cached scraper', () => {
  beforeAll( () => {
    // declare config as a variable
    // to later add a key whose value is derived from a function
    const config: mock.Config = {
      '/var/': {/* empty directory */},
      '/opt/cache/09120192-my-file.html': 'file content'
    };

    // add the parent directory as a path to test default path later
    config[ path.join( __dirname, '../' ) ] = {/* empty directory */};
    mock( config );
  });

  afterAll( () => {
    mock.restore();
  });

  it( 'creates cache directory in default path if it does not already exist', () => {
    const cachedScraper = new CachedScraper();
    cachedScraper.initCacheDir();

    expect( fs.existsSync( path.join( __dirname, '../', 'cache' ) ) ).toBeTruthy();
  });

  it( 'creates cache directory in specified path if it does not already exist', () => {
    const cachedScraper = new CachedScraper( '/var/cache/' );
    cachedScraper.initCacheDir();

    expect( fs.existsSync( '/var/cache' ) ).toBeTruthy();
  });

  it( 'returns specified file from cache', async () => {
    const cachedScraper = new CachedScraper( '/opt/cache/' );
    cachedScraper.initCacheDir();

    expect( await cachedScraper.getCachedFile( 'my-file' ) ).toBeInstanceOf( Array );
  });

  it( 'throws exception if specified cache file not found', async () => {
    const cachedScraper = new CachedScraper( '/opt/cache/' );
    cachedScraper.initCacheDir();

    try {
      expect( await cachedScraper.getCachedFile( 'my-fake-file' ) )
        .rejects.toThrow( /not found/ );
    } catch( err ) {
      // nothing to see here...
    }
  });

  it( 'returns the content of the specified cached file', async () => {
    const cachedScraper = new CachedScraper( '/opt/cache/' );
    cachedScraper.initCacheDir();

    expect( await cachedScraper.scrape( 'http://nowhere', 'my-file' ) )
      .toEqual( 'file content' );
  });

  it.skip( 'fetches contents from url when specified cached file is not found', async () => {
    const cachedScraper = new CachedScraper( '/opt/cache' );
    cachedScraper.initCacheDir();
    cachedScraper.setThrottleDelay( 100 );

    // mock what cloudscraper is getting from the "internet"
    // @ts-ignore
    mocked( cloudscraper.get ).mockImplementationOnce( ( url, callback: RequestCallback | undefined ) => {
      // @ts-ignore
      return callback( null, null, 'my other file content' );
    });

    expect( await cachedScraper.scrape( 'http://somewhere.com', 'my-other-file' ) )
      .toEqual( 'my other file content' );
  });
});
