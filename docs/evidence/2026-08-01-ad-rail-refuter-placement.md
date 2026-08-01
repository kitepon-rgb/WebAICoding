# 記事レール広告リリース — refuter配置裁定

- 裁定日時: 2026-08-01T01:31:45Z
- task: `release-readonly-audit`
- candidate / worker run: `release-audit-run`
- executor: Codex native `/root/release_audit`
- dry-run結果: `review-required`
- 理由: `capacity-review-required`

同時に起動する監査workerはこの1件だけであり、routing smokeが完了した同一taskを再利用する。
任務はread-only、書込scopeは空、commit・push・deployは禁止しているため、capacityがunknownであることを
明示的に受け入れて配置する。
