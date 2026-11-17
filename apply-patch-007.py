"""Run from the Maker Command Center repository: python apply-patch-007.py"""
from pathlib import Path
import re, shutil
root=Path(__file__).resolve().parent
p=root/'js/music/studio.js'
if not p.exists():
    raise SystemExit('Run this installer from the repository root after installing patch 006.')
s=p.read_text(encoding='utf-8')
original=s
if "import { studioChat } from './transport.js';" not in s:
    s="import { studioChat } from './transport.js';\n"+s
old="fetch(base+'/api/chat',"
new="studioChat(base+'/api/chat',"
if old in s:
    s=s.replace(old,new)
elif new not in s:
    raise SystemExit('Studio source differs from patch 006. Nothing changed; share js/music/studio.js for a matching patch.')
s=s.replace('setTimeout(()=>controller.abort(),300000)', 'setTimeout(()=>controller.abort(),1200000)')
if 'setTimeout(()=>controller.abort(),300000)' in s:
    raise SystemExit('Could not replace old timeout; no files changed.')
# The 15-second model-list timeout is intentionally unchanged.
if original!=s:
    backup=p.with_suffix('.js.patch007-backup')
    if not backup.exists():shutil.copy2(p,backup)
    p.write_text(s,encoding='utf-8')
sw=root/'service-worker.js'
if sw.exists():
    content=sw.read_text(encoding='utf-8')
    changed=content.replace('maker-command-center-v006','maker-command-center-v007')
    if './js/music/transport.js' not in changed:
        changed=changed.replace("const ASSETS=[", "const ASSETS=['./js/music/transport.js',",1)
    if changed!=content:
        backup=sw.with_suffix('.js.patch007-backup')
        if not backup.exists():shutil.copy2(sw,backup)
        sw.write_text(changed,encoding='utf-8')
print('Patch 007 applied. Commit js/music/studio.js, js/music/transport.js and service-worker.js.')
print('Local .patch007-backup files were retained for rollback; do not commit them.')
