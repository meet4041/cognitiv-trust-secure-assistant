import * as vscode from 'vscode';

export class HardcodedSecretQuickFixProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
  ];

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      if (diagnostic.code === 'hardcoded-secret') {
        actions.push(this.createEnvVarFix(document, diagnostic.range));
      }
    }

    return actions;
  }

  private createEnvVarFix(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction {
    const fix = new vscode.CodeAction(
      'Replace with environment variable',
      vscode.CodeActionKind.QuickFix
    );
    fix.isPreferred = true;

    const lineText = document.getText(range);
    const match = lineText.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    const varName = match ? match[1] : 'SECRET';
    const replacement = `${varName} = os.getenv("${varName}")`;

    fix.edit = new vscode.WorkspaceEdit();
    fix.edit.replace(document.uri, range, replacement);

    return fix;
  }
}
