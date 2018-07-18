// @flow
import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import Particles from 'react-particles-js';

import Home from './home';
import NewCareer from './new-career';

import styles from './routes.scss';
import particleConfig from './particle-config.json';


const Header = ( props ) => {
  const { state } = props.location;

  return (
    <header className={styles.content}>
      <h1 className={styles.title}>
        {state.title}
      </h1>
    </header>
  );
};

const Routes = () => (
  <Route
    render={({ location }) => (
      <section className={styles.container}>
        <Particles
          params={particleConfig}
          className={styles.particlesWrapper}
        />

        <Route path="/new-career" component={Header} />

        <TransitionGroup>
          <CSSTransition key={location.key} classNames="fade" timeout={300}>
            <Switch location={location}>
              <Route exact path="/" component={Home} />
              <Route path="/new-career" component={NewCareer} />
            </Switch>
          </CSSTransition>
        </TransitionGroup>
      </section>
    )}
  />
);

export default Routes;