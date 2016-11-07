import * as vscode from 'vscode';

export class LiveServerContentProvider implements vscode.TextDocumentContentProvider{
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    

	private _config = {port: Number}

    public constructor(config) {
        this._config = {port: config.port}
    }

    public provideTextDocumentContent(uri:vscode.Uri):string{

		console.log(`пруга preview ${uri}`);

        return `<!DOCTYPE html><html><head><style>
		html, body, canvas, div {
			margin:0;
			padding: 0;			
			width:100%;
			height:100%;
			background-color: silver;
		}
		#khanvas {
			display:block;
			border:none;
			outline:none;
		}
	</style></head><body>medvěd<iframe src="${uri}" width="100%" height="100%" frameBorder="0"></iframe><div class="svgbg"></div></body></html>`;
    }
}