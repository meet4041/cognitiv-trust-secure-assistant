import * as path from 'path';
import * as vscode from 'vscode';
import { exec } from 'child_process';

export interface Issue {
  line: number;
  endLine: number;
  column: number;
  endColumn: number;
  message: string;
  code?: string;  
  fix?: string;
}

export async function scanFileForIssues(filePath: string): Promise<Issue[]> {
  return new Promise<Issue[]>((resolve) => {
    const workspaceRoot = vscode.workspace.rootPath || process.cwd();
    const candidates = [
      path.join(workspaceRoot, 'semgrep-rules'),
      path.join(workspaceRoot, 'test-file', 'semgrep-rules'),
      path.join(__dirname, '..', 'semgrep-rules')
    ];

    const rulesDir = candidates[0];
    const cmd = `semgrep --config "${rulesDir}" "${filePath}" --json`;
    console.log('🔎 Running:', cmd);

    exec(cmd, (err: Error | null, stdout: string) => {
      if (err) {
        console.error('Semgrep error:', err);
        resolve([]);
        return;
      }

      try {
        const json = JSON.parse(stdout);
        const issues: Issue[] = json.results.map((res: any) => ({
          line: res.start.line ?? 1,
          endLine: res.end.line ?? res.start.line ?? 1,
          column: res.start.col ?? 1,
          endColumn: res.end.col ?? (res.start.col ?? 1) + 1,
          message: res.extra.message || 'Issue found by Semgrep',
          code: res.check_id,                             
          fix: res.extra.metadata?.fix || undefined,      
        }));

        resolve(issues);
      } catch (e) {
        console.error('Parse error:', e);
        resolve([]);
      }
    });
  });
}

export function createDiagnostics(issues: Issue[]): vscode.Diagnostic[] {
  return issues.map((issue) => {
    const range = new vscode.Range(
      issue.line - 1,
      issue.column - 1,
      issue.endLine - 1,
      issue.endColumn - 1
    );

    const diagnostic = new vscode.Diagnostic(
      range,
      issue.message,
      vscode.DiagnosticSeverity.Error
    );

    diagnostic.code = issue.code; 
    return diagnostic;
  });
}
