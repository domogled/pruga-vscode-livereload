'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import {spawn} from 'child_process';

const tinylr = require('tiny-lr');
const server = tinylr();
vscode.window.setStatusBarMessage(`Пруга livereload disabled`)

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "pruga-vscode-livereload" is now active!');

    

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('pruga.livereload', () => {
        const rootPath = vscode.workspace.rootPath;

        if(!rootPath) {
            vscode.window.showWarningMessage(`Není otevřený workspace`)
            return
        }

        const config = vscode.workspace.getConfiguration('pruga')
        const SHOW_INFO = `${config.get('showLevel')}` == "info"
        
        const livereloadPort = config.get('livereload.port')

        const buildPath2webPath = (fsPath) => {
            const abs_dev = path.join(rootPath, './build/dev')
            return path.join(path.basename(rootPath), path.relative(abs_dev, fsPath))
        }

        if(server.listening){
            vscode.window.showWarningMessage(`UŽ BĚŽÍ Пруга livereload listening on ${livereloadPort} ...`);
        }
        else {
            server.listen(livereloadPort, function() {
                console.log(`Пруга livereload listening on ${livereloadPort} ...`);
                if(SHOW_INFO) {
                    vscode.window.showInformationMessage(`Пруга livereload listening on ${livereloadPort} ...`);
                }
                vscode.window.setStatusBarMessage(`Пруга livereload listening on ${livereloadPort}`)
            })
        }

        function livereload(event) {
            const file = buildPath2webPath(event.fsPath)
            const url = `http://localhost:${livereloadPort}/changed?files=${file}`
            
            // terminal.sendText(`curl http://localhost:${livereloadPort}/changed?files=${file}`)
                
            console.log(`Executing curl ${url}`)
            if(SHOW_INFO) {
                vscode.window.showInformationMessage(`Пруга livereload change ${url} ...`)
            }
            const curl = spawn('curl', [url]);
            let stderrMessage = '';
            let stdoutMessage = '';
            
            if (!curl.pid) {
                vscode.window.showErrorMessage("Unable to execute curl. Please make sure you have curl on your PATH");
            }

            curl.on('error', (err) => {
                console.log(`Пруга livereload:curl:error: ${err}`);
                vscode.window.showErrorMessage(`Пруга livereload:curl:error: ${err}`);
            });

            curl.stdout.on('data', (buf) => {
                stdoutMessage += buf.toString()
            });
            curl.stdout.on('end', () => {
                if(stdoutMessage) {
                    console.log(`Пруга livereload:curl:stdout: ${stdoutMessage}`);
                    if(SHOW_INFO) {
                        vscode.window.showInformationMessage(`Пруга livereload:curl:stdout: ${stdoutMessage}`);
                    }
                }
            });


            // curl dává do stderr výpis průběhu stahování a ten zobrazovat nechceme
            /*curl.stderr.on('data', (buf) => {
                stderrMessage += buf.toString()
            });
            curl.stderr.on('end', () => {
                if(stderrMessage) {
                    console.log(`Пруга livereload:curl:stderr: ${stderrMessage}`);
                    vscode.window.showErrorMessage(`Пруга livereload:curl:stderr: ${stderrMessage}`);
                }
            });*/

            curl.on('close', (code) => {
                console.log(`Пруга livereload:curl:child process exited with code ${code}`);
                if(SHOW_INFO) {
                    vscode.window.showInformationMessage(`Пруга livereload:curl:child process exited with code ${code}`);
                }
            });
        
        }
        

        if (rootPath) {
            const watch_pattern = config.get('watch.buildedWeb')
            const watch_path = path.join(rootPath, watch_pattern)
            const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(`${watch_path}`);
            if(SHOW_INFO) {
                vscode.window.showInformationMessage(`Пруга livereload:watch ${watch_path}`);
            }
            context.subscriptions.push(
                fileSystemWatcher,
                fileSystemWatcher.onDidCreate(livereload),
                fileSystemWatcher.onDidChange(livereload),
                fileSystemWatcher.onDidDelete(livereload)
            );
        }
        
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
    // if(SHOW_INFO) {
    // @TODO: přece nebudu congig načítat globálně jen kvůli tomuto, nebo jo?
        vscode.window.showInformationMessage(`Пруга livereload: will be close`)
    // }
    vscode.window.setStatusBarMessage(`Пруга livereload disabled`)
    server.close()
}