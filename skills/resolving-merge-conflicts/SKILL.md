---
name: resolving-merge-conflicts
description: "Use when you need to resolve an in-progress git merge/rebase conflict."
---

1. **See the current state** of the merge/rebase. Check its target, git history, conflicting files, and existing staged and unstaged changes. Keep unrelated work intact.

2. **Find the primary sources** for each conflict. Understand deeply why each change was made, and what the original intent was. Read the commit messages, check the PRs, check original issues/tickets.

3. **Resolve each hunk.** Preserve both intents where possible. Where incompatible, use the agreed merge goal to decide and note the trade-off. If the target is wrong or the intended behavior cannot be established, report the blocker instead of inventing a resolution. Abort only when authorized and after checking its effect on existing work.

4. Discover the project's **automated checks** and run them — typically typecheck, then tests, then format. Fix anything the merge broke.

5. **Finish the authorized merge/rebase.** Stage the resolved changes explicitly and inspect the full staged diff, including automatically merged files and anything staged before this task. Preserve unrelated changes; if they cannot be kept out of the operation safely, report the blocker. Commit or continue the rebase only after the intended content and required checks are confirmed.
