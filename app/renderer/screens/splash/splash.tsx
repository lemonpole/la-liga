import React, { Component } from 'react';
import { ipcRenderer } from 'electron';
import { SyncOutlined, CheckOutlined } from '@ant-design/icons';


interface State {
  status: string;
  downloading: boolean;
}


class Splash extends Component<{}, State> {
  statuses = {
    CHECKING: 'Checking for updates...',
    ERROR: 'Error checking for update. See logs for more information.',
    UPTODATE: 'Up to date.',
    DOWNLOADING: 'Downloading update...',
    DONE: 'Done.'
  }

  state = {
    status: this.statuses.CHECKING,
    downloading: false
  }

  componentDidMount() {
    ipcRenderer.on( '/screens/splash/error', this.handleError );
    ipcRenderer.on( '/screens/splash/checking-update', this.handleCheckingUpdate );
    ipcRenderer.on( '/screens/splash/no-update-avail', this.handleNoUpdateAvail );
    ipcRenderer.on( '/screens/splash/update-avail', this.handleUpdateAvail );
    ipcRenderer.on( '/screens/splash/download-progress', this.handleDownloadProgress );
    ipcRenderer.on( '/screens/splash/update-downloaded', this.handleUpdateDownloaded );
  }

  handleError = () => {
    this.setState({
      status: this.statuses.ERROR
    });
  }

  handleCheckingUpdate = () => {
    // @TODO
  }

  handleNoUpdateAvail = () => {
    this.setState({
      status: this.statuses.UPTODATE
    });
  }

  handleUpdateAvail = () => {
    this.setState({
      status: this.statuses.DOWNLOADING,
      downloading: true
    });
  }

  /**
   * NOTE: There is an active issue with auto-updater that does not
   * emit the download progress while doing differential updates.
   *
   * See: https://github.com/electron-userland/electron-builder/issues/3106
   * See: https://github.com/electron-userland/electron-builder/issues/2521
   */
  handleDownloadProgress = () => {
    // @TODO
  }

  handleUpdateDownloaded = () => {
    this.setState({
      status: this.statuses.DONE,
      downloading: false
    });
  }

  render() {
    return (
      <section id="splash">
        <p>{this.state.status}</p>
        <div className="progress-container">
          {this.state.downloading && (
            <SyncOutlined spin />
          )}
          {this.state.status === this.statuses.DONE && (
            <CheckOutlined />
          )}
        </div>
      </section>
    );
  }
}


export default Splash;
