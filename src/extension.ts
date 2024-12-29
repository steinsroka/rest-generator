import * as vscode from "vscode";
import { RestInterfaceGenerator } from "./RestInterfaceGenerator";
import { MAVEN_PRODUCT_TYPES } from "./types";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "generateRestInterface",
    async (uri) => {
      const apiEndPoint = await vscode.window.showQuickPick(
        MAVEN_PRODUCT_TYPES.map(
          (type) => `MAVEN_${type.toUpperCase()}_BE_URL`
        ).concat("CUSTOM"),
        {
          title: "Select API endpoint",
          async onDidSelectItem(item) {
            if (item === "CUSTOM") {
              await vscode.window.showInputBox({
                placeHolder: "Enter custom API endpoint",
              });
            }
          },
        }
      );
      const inputPath = uri.fsPath;
      const outputBasePath =
        vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
      const generator = new RestInterfaceGenerator(inputPath);
      generator.generate({
        outputPath: outputBasePath,
        options: { apiEndPoint },
      });
      vscode.window.showInformationMessage(
        `REST interface generated in ${outputBasePath} successfully!`
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
