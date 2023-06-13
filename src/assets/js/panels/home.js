'use strict';

import { logger, database, changePanel, status } from '../utils.js';

const { launch } = require('minecraft-java-core');
const pkg = nw.global.manifest.__nwjs_manifest;
const win = nw.Window.get();
var opn = require('opn');

const fs = require('fs')
const https = require('https')
const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME)

class Home {
    static id = "home";
    async init(config, news) {
        this.config = config
        this.news = await news
        this.database = await new database().init();
        this.initLaunch();
        this.initStatusServer();
        this.initBtn();
        this.loadPseudo();
        this.name;
    }

    loadPseudo() {
        fs.readFile('./username.txt', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return
            }
            if (data.toString() == "") return;
            this.name = data.toString();
            document.getElementById('name-input').value = this.name;
        });
    }
    savePseudo(pseudo) {

        fs.writeFile('./username.txt', pseudo, err => {
            if (err) {
                console.error(err);
            }
        });
    }

    optionsTXT() {

        var dirPoke = process.env.APPDATA + "/." + this.config.dataDirectory;

        fs.readFile(dirPoke + '/options.txt', 'utf8', (err, data) => {
            if (err) {
                this.writeOptions();
            }
        });
    }

    writeOptions() {
        var dirPoke = process.env.APPDATA + "/." + this.config.dataDirectory;

        fs.writeFile(dirPoke + '/options.txt', this.config.optionsArgs, err => {
            if (err) {
                console.error(err);
            }
            console.error("Resources pack loads !");
        });

    }

    async initLaunch() {
        document.querySelector('.play-btn').addEventListener('click', async () => {




            if (this.name != "") {
                this.savePseudo(this.name);
                this.optionsTXT();

                let urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;

                let ram = (await this.database.get('1234', 'ram')).value;
                let javaPath = (await this.database.get('1234', 'java-path')).value;
                let javaArgs = (await this.database.get('1234', 'java-args')).value;
                let Resolution = (await this.database.get('1234', 'screen')).value;

                let screen;

                let playBtn = document.querySelector('.play-btn');
                let info = document.querySelector(".text-download")
                let progressBar = document.querySelector(".progress-bar")
                let logcontent = document.querySelector(".log-content")

                if (Resolution.screen.width == '<auto>') {
                    screen = false
                } else {
                    screen = {
                        width: Resolution.screen.width,
                        height: Resolution.screen.height
                    }
                }

                let opts = {
                    url: `${urlpkg}/files`,
                    authenticator: {
                        access_token: "123456",
                        client_token: "123456",
                        uuid: "1234567",
                        name: this.name,
                        user_properties: "",
                        meta: {
                            type: "offline",
                            offline: true
                        }
                    },
                    path: `${dataDirectory}/${process.platform == 'darwin' ? this.config.dataDirectory : `.${this.config.dataDirectory}`}`,
                    version: this.config.game_version,
                    //detached: launcherSettings.launcher.close === 'close-all' ? false : true,
                    java: this.config.java,
                    javapath: javaPath.path,
                    args: [...javaArgs.args, ...this.config.game_args],
                    screen,
                    custom: this.config.custom,
                    verify: this.config.verify,
                    ignored: this.config.ignored,
                    memory: {
                        min: `${2 * 1024}M`,
                        max: `${ram.ramMax * 1024}M`
                    }
                }



                playBtn.style.display = "none"
                info.style.display = "block"
                launch.launch(opts);
                console.log(this.name)
                launch.on('progress', (DL, totDL) => {
                    
                    progressBar.style.display = "block"
                    document.querySelector(".text-download").innerHTML = `Téléchargement ${((DL / totDL) * 100).toFixed(0)}%`
                    win.setProgressBar(DL / totDL);
                    progressBar.value = DL;
                    progressBar.max = totDL;
                })

                launch.on('speed', (speed) => {
                    console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)

                })

                launch.on('check', (e) => {

                    progressBar.style.display = "block"
                    document.querySelector(".text-download").innerHTML = `Vérification ${((DL / totDL) * 100).toFixed(0)}%`
                    progressBar.value = DL;
                    progressBar.max = totDL;

                })

                launch.on('data', (e) => {
                    new logger('Minecraft', '#36b030', logcontent);
                    //       if (launcherSettings.launcher.close === 'close-launcher') win.hide();
                    progressBar.style.display = "none"
                    win.setProgressBar(0);
                    info.innerHTML = `Demarrage en cours...`
                    console.log(e);
                })

                launch.on('close', () => {
                    //        if (launcherSettings.launcher.close === 'close-launcher') {
                    //            win.show();
                    //            win.focus();
                    //            win.setShowInTaskbar(true);
                    //        }
                    progressBar.style.display = "none"
                    info.style.display = "none"
                    playBtn.style.display = "block"
                    info.innerHTML = `Vérification`
                    new logger('Launcher', '#7289da', logcontent);
                    console.log('Close');
                })
            }
        })
    }

    async initStatusServer() {
        let nameServer = document.querySelector('.server-text .name');
        let serverMs = document.querySelector('.server-text .desc');
        let playersConnected = document.querySelector('.etat-text .text');
        let online = document.querySelector(".etat-text .online");
        let srvbox = document.getElementById('server-box');
        let serverPing = await new status(this.config.status.ip, this.config.status.port).getStatus();

        if (!serverPing.error) {
            srvbox.style.width = '250px';
            nameServer.textContent = this.config.serverName;
            serverMs.innerHTML = `<span class="green">En ligne</span> - ${serverPing.ms}ms`;
            online.classList.toggle("off");
            playersConnected.textContent = serverPing.players;
        } else {
            srvbox.style.width = '320px';
            nameServer.textContent = 'Serveur indisponible';
            serverMs.innerHTML = `<span class="red">Hors ligne</span>`;
        }
    }

    initBtn() {
        document.querySelector('.settings-btn').addEventListener('click', () => {
            changePanel('settings');
        });
        //opens the url in the default browser 
        document.getElementById('discord-btn').addEventListener('click', () => {
            opn('https://discord.gg/gneTFkA');
        });

        document.getElementById('site-btn').addEventListener('click', () => {
            opn('https://pokefree.fr');
        });
        document.getElementById('name-input').addEventListener('input', () => {
            this.name =document.getElementById('name-input').value;
            console.log(this.name);
        });


    }

    getdate(e) {
        let date = new Date(e)
        let year = date.getFullYear()
        let month = date.getMonth() + 1
        let day = date.getDate()
        let allMonth = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
        return { year: year, month: allMonth[month - 1], day: day }
    }
}
export default Home;