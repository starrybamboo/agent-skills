from pathlib import Path
import os
import re
import sys

home = Path.home()
codex_home = Path(os.environ.get("CODEX_HOME", home / ".codex")).expanduser()
override = os.environ.get("PSTACK_ROOT")

if override:
    path = Path(override).expanduser().resolve()
    if (path / "skills/poteto-mode/SKILL.md").is_file():
        print(path)
        raise SystemExit(0)
    print(
        f"PSTACK_ROOT does not contain skills/poteto-mode/SKILL.md: {path}",
        file=sys.stderr,
    )
    raise SystemExit(1)

installed = codex_home / "pstack-codex/upstream"
if (installed / "skills/poteto-mode/SKILL.md").is_file():
    print(installed.resolve())
    raise SystemExit(0)

candidates = []
for base in (
    home / ".claude/plugins/cache/starrybamboo-skills/pstack",
    home / ".claude/plugins/cache/cursor-plugins/pstack",
    home / ".claude/plugins/cache/pstack-claude/pstack",
):
    if base.is_dir():
        candidates.extend(p for p in base.iterdir() if p.is_dir())

def version_key(path: Path):
    parts = re.split(r"[.-]", path.name)
    return tuple(int(p) if p.isdigit() else 0 for p in parts)

valid = [p.resolve() for p in candidates if (p / "skills/poteto-mode/SKILL.md").is_file()]
if not valid:
    print(
        "pstack not found. Run the repository Codex install command or set "
        "PSTACK_ROOT to a pstack plugin directory.",
        file=sys.stderr,
    )
    raise SystemExit(1)

print(max(valid, key=version_key))
