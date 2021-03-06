import { flatten } from 'lodash';


/**
 * Declare enums, types, and interfaces.
 */

export enum MiddlewareType {
  END = 'end',
  INIT = 'init',
}


interface MiddlewareCallback {
  ( data?: any ): Promise<any>;
}


interface Middleware {
  type?: string;
  callback: MiddlewareCallback;
}


/**
 * The Item Loop class.
 */

export class ItemLoop {
  private middleware: Middleware[];
  private bail: boolean;

  constructor() {
    this.middleware = [];
    this.bail = false;
  }

  private async runMiddleware( item: any ) {
    const matchedm = this.middleware.filter( m => m.type === item.type );
    return Promise.all( matchedm.map( m => m.callback( item )) );
  }

  public async start( max: number ) {
    // we're starting so set bail back to default
    this.bail = false;

    // bail if no `init` middleware was defined
    const initm = this.middleware.find( m => m.type === MiddlewareType.INIT );

    if( !initm ) {
      throw new Error( `'${MiddlewareType.INIT}' middleware type not found!` );
    }

    // grab the end middleware
    const endm = this.middleware.find( m => m.type === MiddlewareType.END );

    // grab the generic middleware
    const genericm = this.middleware.filter( m => !m.type );

    // run the middleware loop
    for( let i = 0; i < max; i++ ) {
      const items = await initm.callback();
      const results = [];

      // run the items sequentially to
      // avoid race conditions
      for( let j = 0; j < items.length; j++ ) {
        const item = items[ j ];
        results.push( await this.runMiddleware( item ) );
      }

      // run the generic middleware (also sequentially)
      for( let j = 0; j < genericm.length; j++ ) {
        const item = genericm[ j ];
        results.push( await item.callback( items ) );
      }

      // do we need to bail out early?
      const bail = flatten( results ).findIndex( r => r === false );

      if( bail > -1 || this.bail ) {
        break;
      }

      // run end-loop middleware
      if( endm ) {
        await endm.callback();
      }
    }

    return Promise.resolve();
  }

  public register( type: string, callback: MiddlewareCallback ) {
    this.middleware.push({ type, callback });
  }

  public stop() {
    this.bail = true;
  }
}
