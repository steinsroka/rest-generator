import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "generateRestInterface",
    async () => {
      vscode.window.showInformationMessage("Hello World from rest-generator!");
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
