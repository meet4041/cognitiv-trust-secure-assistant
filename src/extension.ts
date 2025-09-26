import * as vscode from 'vscode';
import { enrichPrompt } from './promptEnricher';
import { scanFileForIssues, createDiagnostics, Issue } from './scanner';
import { applyQuickFix } from './fixes';

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
  console.log('Cognitiv Secure Code Assistant activated.');

  diagnosticCollection = vscode.languages.createDiagnosticCollection('cognitiv');
  context.subscriptions.push(diagnosticCollection);

  context.subscriptions.push(
    vscode.commands.registerCommand('cognitiv.scanCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      await scanAndReport(editor.document);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (doc) => {
      if (doc.languageId === 'python') {
        console.log(`🔍 Scanning saved file: ${doc.fileName}`);
        await scanAndReport(doc);
      }
    })
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { language: 'python' },
      new CognitivQuickFixProvider(),
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
    )
  );

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.languageId === 'markdown') {
      const enriched = enrichPrompt(event.document.getText());
      console.log('🔐 Enriched Prompt:', enriched);
    }
  });
}

async function scanAndReport(doc: vscode.TextDocument) {
  const issues: Issue[] = await scanFileForIssues(doc.fileName);
  console.log('🔎 Issues found:', issues);

  diagnosticCollection.clear();

  if (issues.length === 0) {
    vscode.window.showInformationMessage('✅ No security issues found.');
    return;
  }

  const diagnostics = createDiagnostics(issues);
  diagnosticCollection.set(doc.uri, diagnostics);
}

class CognitivQuickFixProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    context.diagnostics.forEach((diag) => {
      if (diag.code === 'hardcoded-secret') {
        const action = new vscode.CodeAction(
          '🔧 Apply Fix: Remove hardcoded secret',
          vscode.CodeActionKind.QuickFix
        );
        action.command = {
          title: 'Apply Fix',
          command: 'cognitiv.applyQuickFix',
          arguments: [document, diag]
        };
        actions.push(action);
      }
    });

    return actions;
  }
}

vscode.commands.registerCommand('cognitiv.applyQuickFix', (doc: vscode.TextDocument, diag: vscode.Diagnostic) => {
  applyQuickFix(doc, {
    line: diag.range.start.line + 1,
    endLine: diag.range.end.line + 1,
    column: diag.range.start.character + 1,
    endColumn: diag.range.end.character + 1,
    message: diag.message,
    code: typeof diag.code === 'string' ? diag.code : (diag.code != null ? String(diag.code) : undefined)
  });
});

export function deactivate() {}
