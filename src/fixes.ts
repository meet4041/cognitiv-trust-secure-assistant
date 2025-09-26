import * as vscode from 'vscode';
import { Issue } from './scanner';

export async function applyQuickFix(doc: vscode.TextDocument, issue: Issue) {
    if (!issue.fix) {
        vscode.window.showInformationMessage('No quick fix available for this issue.');
        return;
    }

    const editor = await vscode.window.showTextDocument(doc);
    const lineIndex = issue.line - 1;
    if (lineIndex < 0 || lineIndex >= doc.lineCount) {
        vscode.window.showErrorMessage('Invalid line number for quick fix.');
        return;
    }
    const lineRange = editor.document.lineAt(lineIndex).range;
    await editor.edit(editBuilder => {
        editBuilder.replace(lineRange, issue.fix!);
    });

    vscode.window.showInformationMessage('Fix applied!');
}
