import * as vscode from 'vscode';
import { enrichPrompt } from './promptEnricher';
import { scanFileForIssues, Issue } from './scanner';
import { applyQuickFix } from './fixes';

// Issue type now imported from scanner

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
    console.log('✅ Cognitiv Secure Code Assistant activated.');

    diagnosticCollection = vscode.languages.createDiagnosticCollection('cognitiv');
    context.subscriptions.push(diagnosticCollection);

    // Command: Manual scan
    context.subscriptions.push(
        vscode.commands.registerCommand('cognitiv.scanCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) { return; }
            await scanAndReport(editor.document);
        })
    );

    // Hook: Scan on save – only for Python files
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async (doc) => {
            if (doc.languageId === 'python') {
                console.log(`🔍 Scanning saved file: ${doc.fileName}`);
                await scanAndReport(doc);
            }
        })
    );

    // Example prompt enrichment usage (optional)
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

    const diagnostics: vscode.Diagnostic[] = [];

    issues.forEach((issue: Issue) => {
        diagnostics.push(
            new vscode.Diagnostic(
                new vscode.Range(
                    new vscode.Position(issue.line - 1, 0),
                    new vscode.Position(issue.line - 1, 100)
                ),
                issue.message,
                vscode.DiagnosticSeverity.Warning
            )
        );

        // Show a popup with Apply Fix option
        vscode.window.showWarningMessage(issue.message, 'Apply Fix').then(selection => {
            if (selection === 'Apply Fix') {
                applyQuickFix(doc, issue);
            }
        });
    });

    diagnosticCollection.set(doc.uri, diagnostics);
}

export function deactivate() {}
