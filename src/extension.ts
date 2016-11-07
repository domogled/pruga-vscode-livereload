'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import {spawn} from 'child_process';

var tinylr = require('tiny-lr');
var server = tinylr();

let config = vscode.workspace.getConfiguration('pruga')

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
        var livereloadPort = config["liveServerPort"] || 35729

        server.listen(livereloadPort, function() {
            console.log('... Listening on %s ...', livereloadPort);
            vscode.window.showInformationMessage(`Пруга:livereload: ... Listening on ${livereloadPort} ...`);
        })


        function livereload(event) {
            const file = path.relative(path.join(rootPath, config["webPath"]), event.fsPath)
            const url = `http://localhost:${livereloadPort}/changed?files=${file}`
            
            // terminal.sendText(`curl http://localhost:${livereloadPort}/changed?files=${file}`)
                
            console.log(`Executing curl ${url}`)
            
            const curl = spawn('curl', [url]);
            let stderrMessage = '';
            let stdoutMessage = '';
            
            if (!curl.pid) {
                vscode.window.showErrorMessage("Unable to execute curl. Please make sure you have curl on your PATH");
            }

            curl.on('error', (err) => {
                console.log(`Пруга:curl:error: ${err}`);
                vscode.window.showErrorMessage(`Пруга:curl:error: ${err}`);
            });

            curl.stdout.on('data', (buf) => {
                stdoutMessage += buf.toString()
            });
            curl.stdout.on('end', () => {
                if(stdoutMessage) {
                    console.log(`Пруга:curl:stdout: ${stdoutMessage}`);
                    vscode.window.showInformationMessage(`Пруга:curl:stdout: ${stdoutMessage}`);
                }
            });


            // curl dává do stderr výpis průběhu stahování a ten zobrazovat nechceme
            /*curl.stderr.on('data', (buf) => {
                stderrMessage += buf.toString()
            });
            curl.stderr.on('end', () => {
                if(stderrMessage) {
                    console.log(`Пруга:curl:stderr: ${stderrMessage}`);
                    vscode.window.showErrorMessage(`Пруга:curl:stderr: ${stderrMessage}`);
                }
            });*/

            curl.on('close', (code) => {
                console.log(`Пруга:curl:child process exited with code ${code}`);
                vscode.window.showInformationMessage(`Пруга:curl:child process exited with code ${code}`);
            });
        
        }
        
        const rootPath = vscode.workspace.rootPath;
        if (rootPath) {
            var webpath = path.join(rootPath, config["webPath"])
            var fileSystemWatcher = vscode.workspace.createFileSystemWatcher(`${webpath}`);
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
    vscode.window.showInformationMessage(`Пруга:livereload: will be close`);
    server.close();
}