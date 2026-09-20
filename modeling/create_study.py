import bpy
from pathlib import Path
p=Path('modeling/output');p.mkdir(parents=True,exist_ok=True)
(p/'blender-version.txt').write_text(bpy.app.version_string)
