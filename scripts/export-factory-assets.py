"""Run with Blender --background <source.blend> --python scripts/export-factory-assets.py.
Exports selected source assets without saving or modifying the original blend file.
"""
import bpy
from mathutils import Matrix, Vector
from pathlib import Path

OUTPUT = Path(bpy.data.filepath).parent.parent / 'public' / 'models'

def export_asset(name, objects, origin):
    bpy.ops.object.select_all(action='DESELECT')
    copies = []
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for source in objects:
        if source.type != 'MESH':
            continue
        mesh = bpy.data.meshes.new_from_object(source.evaluated_get(depsgraph), depsgraph=depsgraph)
        clone = bpy.data.objects.new(source.name + '_export', mesh)
        bpy.context.scene.collection.objects.link(clone)
        clone.matrix_world = Matrix.Translation(-Vector(origin)) @ source.matrix_world
        clone.select_set(True)
        copies.append(clone)
    if not copies:
        raise RuntimeError('No meshes found for ' + name)
    bpy.context.view_layer.objects.active = copies[0]
    bpy.ops.object.join()
    asset = bpy.context.view_layer.objects.active
    asset.name = name
    asset['source_file'] = 'Factory_Process_V9_Open_CNC_Charging.blend'
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / (name + '.glb')), export_format='GLB', use_selection=True, export_yup=True, export_extras=True, export_animations=False)
    print('EXPORTED', name, 'source meshes', len(copies), 'vertices', len(asset.data.vertices))
    bpy.data.objects.remove(asset, do_unlink=True)

rack = bpy.data.objects['V7 RM01 RAW MATERIAL']
export_asset('factory-rack', list(rack.children_recursive), rack.matrix_world.translation)
server_names = ['ENV Server rack cabinet.004', 'ENV Server rack door.008', 'ENV Server rack door.009', 'ENV Server rack handle.008', 'ENV Server rack handle.009', 'ENV Server rack plinth.004']
export_asset('factory-server', [bpy.data.objects[name] for name in server_names], (58.6, 78.6, 0))
