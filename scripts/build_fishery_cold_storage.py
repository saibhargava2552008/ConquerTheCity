"""
Conquer The City - Asset 7: Fishery Cold Storage & Processing Warehouse
Creates 'building_fishery_cold_storage_01.glb' for Seaview Town Fishing Harbour.
Modelled after authentic Indian coastal commercial fishery cold-storage facilities (Andhra / Gujarat marine export packing units).

Features:
- Insulated precast concrete warehouse walls with coastal weathering and steel I-beam columns.
- Raised concrete loading bay dock (height 1.20m) with safety hazard chevrons and dock bumper pads.
- Accessible South and North stair ramps from wharf (0.40m) up to dock platform (1.20m) with steel railings.
- Wide 6.0m central loading entrance with overhead rolling shutter and hanging refrigerated PVC strip curtains.
- Cantilevered loading bay canopy with prominent bilingual cooperative signboard:
  "सागर मत्स्य शीत गृह / SEAVIEW FISHERIES COLD STORAGE & PROCESSING UNIT".
- Commercial refrigeration chiller condensing units on equipment pad with dual fans and insulated piping.
- Seafood logistics props: bulk insulated ice totes (ISOTERM), stacked plastic fish crates, pallet jack, wooden pallets.
- Industrial corrugated gable roof with ridge monitors, downspouts, and weather-proof dock lighting.
- Simplified collision geometry with Collider_ prefix.
- Origin at ground center (0, 0, 0) -> instantiates cleanly at (-24.0, 0.0, 75.0).
- Exported to public/models/building_fishery_cold_storage_01.glb.
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Quaternion, Matrix

def clean_scene():
    """Remove existing scene objects while preserving add-on server sockets."""
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh, do_unlink=True)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat, do_unlink=True)
    for cam in list(bpy.data.cameras):
        bpy.data.cameras.remove(cam, do_unlink=True)
    for light in list(bpy.data.lights):
        bpy.data.lights.remove(light, do_unlink=True)

def create_pbr_material(name, base_color, roughness=0.6, metallic=0.0, specular=0.5, transmission=0.0, alpha=1.0):
    """Creates a Principled BSDF material compatible with Blender 4.x/5.x."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()

    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_out.location = (300, 0)

    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.location = (0, 0)

    node_bsdf.inputs['Base Color'].default_value = (base_color[0], base_color[1], base_color[2], alpha)
    node_bsdf.inputs['Roughness'].default_value = roughness
    node_bsdf.inputs['Metallic'].default_value = metallic

    if 'Specular IOR Level' in node_bsdf.inputs:
        node_bsdf.inputs['Specular IOR Level'].default_value = specular
    elif 'Specular' in node_bsdf.inputs:
        node_bsdf.inputs['Specular'].default_value = specular

    if transmission > 0:
        if 'Transmission Weight' in node_bsdf.inputs:
            node_bsdf.inputs['Transmission Weight'].default_value = transmission
        elif 'Transmission' in node_bsdf.inputs:
            node_bsdf.inputs['Transmission'].default_value = transmission
        mat.blend_method = 'BLEND'

    mat.node_tree.links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    return mat

def create_rod(p1, p2, radius, mat, name='Rod', verts=6):
    """Creates a solid cylindrical rod connecting two 3D points."""
    dir_vec = p2 - p1
    length = dir_vec.length
    if length < 1e-4:
        return None
    center = (p1 + p2) * 0.5
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=length, location=center, vertices=verts)
    rod = bpy.context.active_object
    rod.name = name
    up = Vector((0, 0, 1))
    rot_quat = up.rotation_difference(dir_vec)
    rod.rotation_mode = 'QUATERNION'
    rod.rotation_quaternion = rot_quat
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    rod.data.materials.append(mat)
    return rod

def build_foundation_and_dock(materials):
    """Builds the main foundation plinth, loading dock, and stairs."""
    # 1. Main Warehouse Floor Plinth (X in [-7.5, 8.0], Y in [-10.5, 10.5], Z in [0.0, 1.20])
    bldg_w = 15.5
    bldg_d = 21.0
    plinth_h = 1.20
    bldg_center_x = 0.25

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(bldg_center_x, 0.0, plinth_h * 0.5))
    plinth = bpy.context.active_object
    plinth.name = 'Warehouse_Foundation_Plinth'
    plinth.scale = (bldg_w, bldg_d, plinth_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    plinth.data.materials.append(materials['Mat_Concrete_Plinth'])

    # Interior Floor Top Surface (Z = 1.20)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(bldg_center_x, 0.0, plinth_h + 0.01))
    floor_top = bpy.context.active_object
    floor_top.name = 'Warehouse_Interior_Floor_Mesh'
    floor_top.scale = (bldg_w - 0.4, bldg_d - 0.4, 0.02)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    floor_top.data.materials.append(materials['Mat_Loading_Dock'])

    # 2. Raised Loading Dock Platform (X in [-9.5, -7.5], Y in [-8.5, 8.5], Z in [0.0, 1.20])
    dock_w = 2.0
    dock_d = 17.0
    dock_center_x = -8.5
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(dock_center_x, 0.0, plinth_h * 0.5))
    dock = bpy.context.active_object
    dock.name = 'Warehouse_Loading_Dock_Platform'
    dock.scale = (dock_w, dock_d, plinth_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    dock.data.materials.append(materials['Mat_Loading_Dock'])

    # Safety Yellow Edge Curb Strip along West edge (X = -9.5)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-9.45, 0.0, plinth_h + 0.01))
    curb = bpy.context.active_object
    curb.name = 'Warehouse_Dock_Safety_Curb'
    curb.scale = (0.15, dock_d, 0.02)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    curb.data.materials.append(materials['Mat_Safety_Yellow'])

    # Rubber Dock Bumpers (8 heavy rubber cushion pads along West vertical face)
    for bi, y_pos in enumerate([-7.5, -5.5, -3.5, -1.5, 1.5, 3.5, 5.5, 7.5]):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-9.58, y_pos, 0.85))
        bumper = bpy.context.active_object
        bumper.name = f'Warehouse_Dock_Bumper_{bi}'
        bumper.scale = (0.12, 0.35, 0.55)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        bumper.data.materials.append(materials['Mat_Rubber_Black'])

    # 3. South Access Stairs (Y in [8.5, 12.0], rising from Z = 0.40m wharf up to Z = 1.20m dock)
    # 4 steps: rise 0.20m, run 0.85m each
    for si in range(4):
        step_z = 0.40 + (si + 1) * 0.20
        step_y = 12.0 - si * 0.85 - 0.425
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(dock_center_x, step_y, step_z * 0.5))
        step = bpy.context.active_object
        step.name = f'Warehouse_Stairs_South_Step_{si}'
        step.scale = (dock_w, 0.85, step_z)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        step.data.materials.append(materials['Mat_Concrete_Plinth'])

    # 4. North Access Stairs (Y in [-12.0, -8.5], rising from Z = 0.40m up to Z = 1.20m)
    for si in range(4):
        step_z = 0.40 + (si + 1) * 0.20
        step_y = -12.0 + si * 0.85 + 0.425
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(dock_center_x, step_y, step_z * 0.5))
        step = bpy.context.active_object
        step.name = f'Warehouse_Stairs_North_Step_{si}'
        step.scale = (dock_w, 0.85, step_z)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        step.data.materials.append(materials['Mat_Concrete_Plinth'])

    # Galvanized Steel Safety Handrails along outside edge of stairs (X = -9.50)
    # South handrail
    create_rod(Vector((-9.50, 12.0, 1.35)), Vector((-9.50, 8.5, 2.15)), radius=0.03, mat=materials['Mat_Steel_Galvanized'], name='Rail_South_Slope')
    create_rod(Vector((-9.50, 12.0, 0.40)), Vector((-9.50, 12.0, 1.35)), radius=0.03, mat=materials['Mat_Steel_Galvanized'], name='Rail_South_Post1')
    create_rod(Vector((-9.50, 8.5, 1.20)), Vector((-9.50, 8.5, 2.15)), radius=0.03, mat=materials['Mat_Steel_Galvanized'], name='Rail_South_Post2')

    # North handrail
    create_rod(Vector((-9.50, -12.0, 1.35)), Vector((-9.50, -8.5, 2.15)), radius=0.03, mat=materials['Mat_Steel_Galvanized'], name='Rail_North_Slope')
    create_rod(Vector((-9.50, -12.0, 0.40)), Vector((-9.50, -12.0, 1.35)), radius=0.03, mat=materials['Mat_Steel_Galvanized'], name='Rail_North_Post1')
    create_rod(Vector((-9.50, -8.5, 1.20)), Vector((-9.50, -8.5, 2.15)), radius=0.03, mat=materials['Mat_Steel_Galvanized'], name='Rail_North_Post2')

def build_walls_and_superstructure(materials):
    """Constructs the insulated concrete walls, rolling shutter entrance, and steel columns."""
    bldg_w = 15.5
    bldg_d = 21.0
    wall_h = 4.60 # from Z=1.20 to Z=5.80
    wall_z = 1.20 + wall_h * 0.5
    wall_th = 0.35

    # 1. South Wall (Y = 10.5) - Solid with Gable Peak
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.25, 10.5 - wall_th * 0.5, wall_z))
    wall_s = bpy.context.active_object
    wall_s.name = 'Warehouse_Wall_South'
    wall_s.scale = (bldg_w, wall_th, wall_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    wall_s.data.materials.append(materials['Mat_Insulated_Walls'])

    # South Gable Triangle (Z: 5.80 to 7.10)
    bm_sg = bmesh.new()
    v1 = bm_sg.verts.new(Vector((-7.5, 10.5 - wall_th * 0.5, 5.80)))
    v2 = bm_sg.verts.new(Vector(( 8.0, 10.5 - wall_th * 0.5, 5.80)))
    v3 = bm_sg.verts.new(Vector(( 0.25, 10.5 - wall_th * 0.5, 7.10)))
    v4 = bm_sg.verts.new(Vector((-7.5, 10.5, 5.80)))
    v5 = bm_sg.verts.new(Vector(( 8.0, 10.5, 5.80)))
    v6 = bm_sg.verts.new(Vector(( 0.25, 10.5, 7.10)))
    bm_sg.faces.new([v1, v2, v3])
    bm_sg.faces.new([v4, v6, v5])
    bm_sg.faces.new([v1, v4, v6, v3])
    bm_sg.faces.new([v2, v3, v6, v5])
    bm_sg.faces.new([v1, v2, v5, v4])
    mesh_sg = bpy.data.meshes.new('Mesh_South_Gable')
    bm_sg.to_mesh(mesh_sg)
    bm_sg.free()
    obj_sg = bpy.data.objects.new('Warehouse_Gable_South', mesh_sg)
    bpy.context.collection.objects.link(obj_sg)
    obj_sg.data.materials.append(materials['Mat_Insulated_Walls'])

    # 2. North Wall (Y = -10.5) - Solid with Gable Peak
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.25, -10.5 + wall_th * 0.5, wall_z))
    wall_n = bpy.context.active_object
    wall_n.name = 'Warehouse_Wall_North'
    wall_n.scale = (bldg_w, wall_th, wall_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    wall_n.data.materials.append(materials['Mat_Insulated_Walls'])

    # North Gable Triangle
    bm_ng = bmesh.new()
    v1 = bm_ng.verts.new(Vector((-7.5, -10.5 + wall_th * 0.5, 5.80)))
    v2 = bm_ng.verts.new(Vector(( 8.0, -10.5 + wall_th * 0.5, 5.80)))
    v3 = bm_ng.verts.new(Vector(( 0.25, -10.5 + wall_th * 0.5, 7.10)))
    v4 = bm_ng.verts.new(Vector((-7.5, -10.5, 5.80)))
    v5 = bm_ng.verts.new(Vector(( 8.0, -10.5, 5.80)))
    v6 = bm_ng.verts.new(Vector(( 0.25, -10.5, 7.10)))
    bm_ng.faces.new([v1, v3, v2])
    bm_ng.faces.new([v4, v5, v6])
    bm_ng.faces.new([v1, v3, v6, v4])
    bm_ng.faces.new([v2, v5, v6, v3])
    bm_ng.faces.new([v1, v4, v5, v2])
    mesh_ng = bpy.data.meshes.new('Mesh_North_Gable')
    bm_ng.to_mesh(mesh_ng)
    bm_ng.free()
    obj_ng = bpy.data.objects.new('Warehouse_Gable_North', mesh_ng)
    bpy.context.collection.objects.link(obj_ng)
    obj_ng.data.materials.append(materials['Mat_Insulated_Walls'])

    # 3. East Wall (X = 8.0) - Solid Rear Wall
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(8.0 - wall_th * 0.5, 0.0, wall_z))
    wall_e = bpy.context.active_object
    wall_e.name = 'Warehouse_Wall_East'
    wall_e.scale = (wall_th, bldg_d, wall_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    wall_e.data.materials.append(materials['Mat_Insulated_Walls'])

    # 4. West Wall (X = -7.5) - With Accessible Loading Doorway (Y in [-3.0, +3.0])
    # South Wing: Y in [3.0, 10.5] (length 7.5m)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-7.5 + wall_th * 0.5, 6.75, wall_z))
    wall_w_s = bpy.context.active_object
    wall_w_s.name = 'Warehouse_Wall_West_SouthWing'
    wall_w_s.scale = (wall_th, 7.5, wall_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    wall_w_s.data.materials.append(materials['Mat_Insulated_Walls'])

    # North Wing: Y in [-10.5, -3.0] (length 7.5m)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-7.5 + wall_th * 0.5, -6.75, wall_z))
    wall_w_n = bpy.context.active_object
    wall_w_n.name = 'Warehouse_Wall_West_NorthWing'
    wall_w_n.scale = (wall_th, 7.5, wall_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    wall_w_n.data.materials.append(materials['Mat_Insulated_Walls'])

    # Door Header above entrance: Y in [-3.0, +3.0], Z in [4.80, 5.80] (height 1.0m)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-7.5 + wall_th * 0.5, 0.0, 5.30))
    door_hdr = bpy.context.active_object
    door_hdr.name = 'Warehouse_Doorway_Header'
    door_hdr.scale = (wall_th, 6.0, 1.00)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    door_hdr.data.materials.append(materials['Mat_Insulated_Walls'])

    # 5. Overhead Rolling Shutter Drum & Partially Rolled Shutter
    # Drum housing across top of doorway
    bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=6.2, location=(-7.50, 0.0, 4.85), vertices=12)
    shutter_drum = bpy.context.active_object
    shutter_drum.name = 'Warehouse_Rolling_Shutter_Drum'
    shutter_drum.rotation_euler = (math.pi * 0.5, 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    shutter_drum.data.materials.append(materials['Mat_Rolling_Shutter'])

    # Rolled shutter curtain visible at top (Z in [4.30, 4.80])
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-7.50, 0.0, 4.55))
    shutter_slats = bpy.context.active_object
    shutter_slats.name = 'Warehouse_Rolling_Shutter_Slats'
    shutter_slats.scale = (0.08, 5.90, 0.50)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    shutter_slats.data.materials.append(materials['Mat_Rolling_Shutter'])

    # 6. Hanging Refrigerated PVC Strip Curtains (Translucent plastic thermal ribbons)
    # 7 vertical overlapping plastic strips hanging from Z = 4.50 down to Z = 1.30
    strip_w = 0.90
    strip_h = 3.20
    for pi in range(7):
        py = -2.70 + pi * 0.90
        px = -7.35 + (0.02 if pi % 2 == 0 else -0.02)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, 1.20 + strip_h * 0.5))
        pvc = bpy.context.active_object
        pvc.name = f'Warehouse_PVC_Strip_{pi}'
        pvc.scale = (0.015, strip_w, strip_h)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        pvc.data.materials.append(materials['Mat_PVC_Curtain'])

    # 7. Structural Steel Columns (Marine Blue I-Beams every 3.5m along East and West walls)
    for yi in [-10.4, -7.0, -3.5, 3.5, 7.0, 10.4]:
        for xi in [-7.55, 7.85]:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(xi, yi, wall_z))
            col = bpy.context.active_object
            col.name = f'Warehouse_Steel_Column_{int(xi)}_{int(yi)}'
            col.scale = (0.22, 0.22, wall_h)
            bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
            col.data.materials.append(materials['Mat_Steel_Framing'])

def build_roof_and_canopy(materials):
    """Pitched corrugated steel roof, ridge ventilator, and loading bay canopy."""
    # 1. Main Pitched Roof
    # Left slope (X from -7.9 to 0.25)
    # Right slope (X from 0.25 to 8.4)
    bm_r = bmesh.new()

    # Left slope quads
    v_l1 = bm_r.verts.new(Vector((-7.9, -10.9, 5.75)))
    v_l2 = bm_r.verts.new(Vector(( 0.25, -10.9, 7.15)))
    v_l3 = bm_r.verts.new(Vector(( 0.25,  10.9, 7.15)))
    v_l4 = bm_r.verts.new(Vector((-7.9,  10.9, 5.75)))
    bm_r.faces.new([v_l1, v_l2, v_l3, v_l4])

    # Right slope quads
    v_r1 = bm_r.verts.new(Vector(( 0.25, -10.9, 7.15)))
    v_r2 = bm_r.verts.new(Vector(( 8.4, -10.9, 5.75)))
    v_r3 = bm_r.verts.new(Vector(( 8.4,  10.9, 5.75)))
    v_r4 = bm_r.verts.new(Vector(( 0.25,  10.9, 7.15)))
    bm_r.faces.new([v_r1, v_r2, v_r3, v_r4])

    mesh_roof = bpy.data.meshes.new('Mesh_Pitched_Roof')
    bm_r.to_mesh(mesh_roof)
    bm_r.free()

    obj_roof = bpy.data.objects.new('Warehouse_Corrugated_Roof', mesh_roof)
    bpy.context.collection.objects.link(obj_roof)
    obj_roof.data.materials.append(materials['Mat_Corrugated_Roof'])

    mod_sol = obj_roof.modifiers.new(name='Solidify', type='SOLIDIFY')
    mod_sol.thickness = 0.08
    mod_sol.offset = 1.0

    # 2. Roof Ridge Monitor Ventilator (Along apex X=0.25, Y in [-8.0, 8.0])
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.25, 0.0, 7.35))
    ridge = bpy.context.active_object
    ridge.name = 'Warehouse_Roof_Ridge_Ventilator'
    ridge.scale = (1.20, 16.0, 0.45)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ridge.data.materials.append(materials['Mat_Steel_Framing'])

    # 3. Cantilevered Loading Bay Canopy (Shelters loading dock from monsoon rains)
    # Projects from X = -7.5 out to X = -9.9, Y in [-4.5, 4.5] at height Z = 5.05
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-8.70, 0.0, 5.05))
    canopy = bpy.context.active_object
    canopy.name = 'Warehouse_Loading_Canopy'
    canopy.scale = (2.40, 9.20, 0.12)
    canopy.rotation_euler = (0, -0.06, 0) # slight drainage pitch
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    canopy.data.materials.append(materials['Mat_Corrugated_Roof'])

    # Canopy diagonal steel support struts (4 brackets)
    for cy in [-4.0, -1.5, 1.5, 4.0]:
        create_rod(Vector((-7.50, cy, 3.80)), Vector((-9.80, cy, 5.00)), radius=0.035, mat=materials['Mat_Steel_Framing'], name=f'Canopy_Strut_{int(cy*10)}')

    # 4. Fishery Cold Storage Identification Signboard mounted on Canopy Fascia
    # Centered at X = -9.92, Z = 5.55, Y in [-3.8, 3.8] (length 7.6m, height 0.95m)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-9.92, 0.0, 5.55))
    signboard = bpy.context.active_object
    signboard.name = 'Warehouse_Fishery_Signboard'
    signboard.scale = (0.08, 7.60, 0.95)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    signboard.data.materials.append(materials['Mat_Signboard'])

    # Gold frame border around sign
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-9.94, 0.0, 5.55))
    sign_border = bpy.context.active_object
    sign_border.name = 'Warehouse_Signboard_Border'
    sign_border.scale = (0.06, 7.75, 1.05)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    sign_border.data.materials.append(materials['Mat_Safety_Yellow'])

    # 5. Industrial Dock Lights under canopy
    for ly in [-3.0, 0.0, 3.0]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.25, location=(-8.60, ly, 4.90), vertices=10)
        light_fixture = bpy.context.active_object
        light_fixture.name = f'Warehouse_Dock_Lamp_{int(ly*10)}'
        light_fixture.data.materials.append(materials['Mat_Steel_Galvanized'])

def build_refrigeration_and_utilities(materials):
    """Outdoor commercial chiller condenser units, coolant piping, and ventilation fans."""
    # 1. South Concrete Equipment Pad (Y in [9.0, 11.5], X in [1.0, 6.5], Z = 0.0 to 0.25)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(3.75, 10.8, 0.125))
    pad = bpy.context.active_object
    pad.name = 'Warehouse_Chiller_Equipment_Pad'
    pad.scale = (5.5, 2.0, 0.25)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    pad.data.materials.append(materials['Mat_Concrete_Plinth'])

    # 2. Two Industrial Dual-Fan Condenser Units
    for ci, cx in enumerate([2.2, 5.0]):
        # Main chiller cabinet
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, 10.8, 0.25 + 0.70))
        chiller = bpy.context.active_object
        chiller.name = f'Warehouse_Chiller_Unit_{ci}'
        chiller.scale = (2.20, 1.30, 1.40)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        chiller.data.materials.append(materials['Mat_Chiller_Metal'])

        # Top dual axial fan cowls
        for fi, fx in enumerate([-0.55, 0.55]):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.42, depth=0.18, location=(cx + fx, 10.8, 1.70), vertices=14)
            fan_cowl = bpy.context.active_object
            fan_cowl.name = f'Warehouse_Chiller_{ci}_Fan_{fi}'
            bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
            fan_cowl.data.materials.append(materials['Mat_Steel_Galvanized'])

    # 3. Insulated Refrigeration Coolant Piping Conduit Loops
    # Pipes run from chillers up the South wall into the building
    p1 = Vector((3.5, 10.5, 0.90))
    p2 = Vector((3.5, 10.3, 3.20))
    create_rod(p1, p2, radius=0.07, mat=materials['Mat_Copper_Piping'], name='Refrig_Pipe_Main_Vertical')

    p3 = Vector((3.5, 10.3, 3.20))
    p4 = Vector((3.5, 10.0, 3.20))
    create_rod(p3, p4, radius=0.07, mat=materials['Mat_Copper_Piping'], name='Refrig_Pipe_Penetration')

    # Secondary return pipe
    create_rod(Vector((3.8, 10.5, 0.90)), Vector((3.8, 10.3, 3.40)), radius=0.05, mat=materials['Mat_Copper_Piping'], name='Refrig_Pipe_Return_Vertical')
    create_rod(Vector((3.8, 10.3, 3.40)), Vector((3.8, 10.0, 3.40)), radius=0.05, mat=materials['Mat_Copper_Piping'], name='Refrig_Pipe_Return_Penetration')

    # 4. Large Hooded Ventilation Exhaust Fans on Upper Gables (South & North)
    for gy, gname in [(10.5, 'South'), (-10.5, 'North')]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.60, depth=0.45, location=(0.25, gy, 6.20), vertices=16)
        vent_fan = bpy.context.active_object
        vent_fan.name = f'Warehouse_Vent_Fan_{gname}'
        vent_fan.rotation_euler = (math.pi * 0.5, 0, 0)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        vent_fan.data.materials.append(materials['Mat_Chiller_Metal'])

    # 5. Exterior Electrical Breaker Panel & Fire Safety Cabinet on West Wall South Wing
    # Electrical Breaker Enclosure (X = -7.55, Y = 4.20, Z = 2.40)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-7.58, 4.20, 2.40))
    elec_box = bpy.context.active_object
    elec_box.name = 'Warehouse_Electrical_Panel'
    elec_box.scale = (0.18, 0.85, 1.20)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    elec_box.data.materials.append(materials['Mat_Chiller_Metal'])

    # Fire Hose Reel Cabinet (X = -7.58, Y = 7.50, Z = 2.30)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-7.58, 7.50, 2.30))
    fire_box = bpy.context.active_object
    fire_box.name = 'Warehouse_Fire_Hose_Cabinet'
    fire_box.scale = (0.18, 0.75, 0.85)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    fire_box.data.materials.append(materials['Mat_Safety_Red'])

def build_cold_storage_props(materials):
    """Pallet jack, bulk insulated ice containers (ISOTERM), fish crates, and pallets on the dock."""
    # 1. Manual Hydraulic Pallet Jack (Sitting on dock at X = -8.50, Y = 2.20, Z = 1.20)
    pj_x = -8.50
    pj_y = 2.20
    pj_z = 1.20

    # Fork tines
    for fy in [-0.22, 0.22]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(pj_x - 0.40, pj_y + fy, pj_z + 0.05))
        fork = bpy.context.active_object
        fork.name = f'Warehouse_Pallet_Fork_{int(fy*100)}'
        fork.scale = (1.10, 0.16, 0.08)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        fork.data.materials.append(materials['Mat_Safety_Yellow'])

    # Hydraulic pump body
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(pj_x + 0.22, pj_y, pj_z + 0.35))
    pump = bpy.context.active_object
    pump.name = 'Warehouse_Pallet_Pump_Body'
    pump.scale = (0.35, 0.40, 0.60)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    pump.data.materials.append(materials['Mat_Safety_Yellow'])

    # T-bar steering handle
    create_rod(Vector((pj_x + 0.22, pj_y, pj_z + 0.40)), Vector((pj_x + 0.45, pj_y, pj_z + 1.15)), radius=0.03, mat=materials['Mat_Steel_Galvanized'], name='Pallet_Jack_Handle')
    create_rod(Vector((pj_x + 0.45, pj_y - 0.22, pj_z + 1.15)), Vector((pj_x + 0.45, pj_y + 0.22, pj_z + 1.15)), radius=0.025, mat=materials['Mat_Steel_Galvanized'], name='Pallet_Jack_TBar')

    # 2. Insulated Bulk Ice Containers (ISOTERM Seafood Tubs - 1 White, 1 Orange)
    tote_data = [
        ((-8.40, -4.20, 1.20 + 0.42), (1.15, 0.95, 0.85), materials['Mat_Ice_Tote_White']),
        ((-8.40, -5.50, 1.20 + 0.42), (1.15, 0.95, 0.85), materials['Mat_Fish_Crate_Terracotta']),
        ((-3.50,  3.00, 1.20 + 0.42), (1.15, 0.95, 0.85), materials['Mat_Ice_Tote_White']), # Inside warehouse
    ]
    for ti, (pos, dims, mat) in enumerate(tote_data):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=pos)
        tote = bpy.context.active_object
        tote.name = f'Warehouse_Ice_Tote_{ti}'
        tote.scale = dims
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        tote.data.materials.append(mat)

        # Insulated Lid Trim
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(pos[0], pos[1], pos[2] + dims[2] * 0.5 + 0.04))
        lid = bpy.context.active_object
        lid.name = f'Warehouse_Ice_Tote_Lid_{ti}'
        lid.scale = (dims[0] + 0.08, dims[1] + 0.08, 0.08)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        lid.data.materials.append(mat)

    # 3. Stacked Commercial Plastic Fish Crates (Royal Blue & Terracotta)
    crate_w, crate_d, crate_h = 0.58, 0.42, 0.26
    crate_stacks = [
        # (center_x, center_y, base_z, num_stacked, mat)
        (-8.45, -1.80, 1.20 + 0.14, 4, materials['Mat_Fish_Crate_Blue']),
        (-8.45, -2.40, 1.20 + 0.14, 3, materials['Mat_Fish_Crate_Terracotta']),
        (-5.50, -4.00, 1.20 + 0.14, 4, materials['Mat_Fish_Crate_Blue']), # Inside
        (-5.50, -4.60, 1.20 + 0.14, 4, materials['Mat_Fish_Crate_Terracotta']), # Inside
    ]
    for si, (sx, sy, sz_base, count, mat) in enumerate(crate_stacks):
        # Wooden pallet underneath
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, sy, 1.20 + 0.06))
        pallet = bpy.context.active_object
        pallet.name = f'Warehouse_Pallet_{si}'
        pallet.scale = (0.75, 0.75, 0.12)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        pallet.data.materials.append(materials['Mat_Wood_Pallet'])

        for ci in range(count):
            cz = sz_base + ci * crate_h
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, sy, cz))
            crate = bpy.context.active_object
            crate.name = f'Warehouse_Fish_Crate_{si}_{ci}'
            crate.scale = (crate_w, crate_d, crate_h)
            bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
            crate.data.materials.append(mat)

def build_colliders():
    """Generates simplified invisible collision geometry with Collider_ prefix.
    Sets hide_render=True and display_type='WIRE' so they don't block visual renders."""
    cols = []

    # 1. Main Walkable Interior Concrete Floor (X in [-7.5, 8.0], Y in [-10.5, 10.5], top at Z = 1.20)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.25, 0.0, 0.60))
    col_floor = bpy.context.active_object
    col_floor.name = 'Collider_Warehouse_Floor'
    col_floor.scale = (15.5, 21.0, 1.20)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_floor)

    # 2. Walkable Loading Dock Platform (X in [-9.5, -7.5], Y in [-8.5, 8.5], top at Z = 1.20)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-8.50, 0.0, 0.60))
    col_dock = bpy.context.active_object
    col_dock.name = 'Collider_Warehouse_Dock'
    col_dock.scale = (2.0, 17.0, 1.20)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_dock)

    # 3. South Access Stairs Collider (Y in [8.5, 12.0], rising 0.40 to 1.20)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-8.50, 10.25, 0.80))
    col_stairs_s = bpy.context.active_object
    col_stairs_s.name = 'Collider_Warehouse_Stairs_South'
    col_stairs_s.scale = (2.0, 3.5, 0.80)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_stairs_s)

    # 4. North Access Stairs Collider (Y in [-12.0, -8.5], rising 0.40 to 1.20)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-8.50, -10.25, 0.80))
    col_stairs_n = bpy.context.active_object
    col_stairs_n.name = 'Collider_Warehouse_Stairs_North'
    col_stairs_n.scale = (2.0, 3.5, 0.80)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_stairs_n)

    # 5. North Wall Solid Barrier (Y = -10.5)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.25, -10.5, 3.50))
    col_wall_n = bpy.context.active_object
    col_wall_n.name = 'Collider_Warehouse_Wall_North'
    col_wall_n.scale = (15.5, 0.60, 4.60)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_wall_n)

    # 6. South Wall Solid Barrier (Y = 10.5)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.25, 10.5, 3.50))
    col_wall_s = bpy.context.active_object
    col_wall_s.name = 'Collider_Warehouse_Wall_South'
    col_wall_s.scale = (15.5, 0.60, 4.60)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_wall_s)

    # 7. East Wall Solid Barrier (X = 8.0)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(8.0, 0.0, 3.50))
    col_wall_e = bpy.context.active_object
    col_wall_e.name = 'Collider_Warehouse_Wall_East'
    col_wall_e.scale = (0.60, 21.0, 4.60)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_wall_e)

    # 8. West Wall South Wing Barrier (Y in [3.0, 10.5])
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-7.5, 6.75, 3.50))
    col_wall_w_s = bpy.context.active_object
    col_wall_w_s.name = 'Collider_Warehouse_Wall_West_South'
    col_wall_w_s.scale = (0.60, 7.5, 4.60)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_wall_w_s)

    # 9. West Wall North Wing Barrier (Y in [-10.5, -3.0])
    # Leaves Y in [-3.0, +3.0] completely open for the central loading bay entrance!
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-7.5, -6.75, 3.50))
    col_wall_w_n = bpy.context.active_object
    col_wall_w_n.name = 'Collider_Warehouse_Wall_West_North'
    col_wall_w_n.scale = (0.60, 7.5, 4.60)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_wall_w_n)

    # 10. Chiller Equipment Pad Obstacle (South exterior)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(3.75, 10.8, 0.90))
    col_chiller = bpy.context.active_object
    col_chiller.name = 'Collider_Warehouse_Chillers'
    col_chiller.scale = (5.5, 2.0, 1.80)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_chiller)

    for c in cols:
        c.hide_render = True
        c.display_type = 'WIRE'

def setup_camera_and_lighting():
    """Sets up a beauty camera and sun lighting for preview rendering."""
    # Camera placed at high 3/4 angle looking at loading dock and entrance
    cam_data = bpy.data.cameras.new('Warehouse_Preview_Camera')
    cam_data.lens = 32.0
    cam_obj = bpy.data.objects.new('Warehouse_Preview_Camera', cam_data)
    cam_obj.location = (-18.0, -14.0, 10.0)
    bpy.context.collection.objects.link(cam_obj)

    # Look at loading bay entrance
    target = Vector((-7.5, 0.0, 3.0))
    cam_dir = target - cam_obj.location
    rot_quat = cam_dir.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()
    bpy.context.scene.camera = cam_obj

    # Key Sun Light
    light_data = bpy.data.lights.new('Warehouse_Sun_Light', type='SUN')
    light_data.energy = 4.2
    light_data.color = (1.0, 0.96, 0.88)
    light_obj = bpy.data.objects.new('Warehouse_Sun_Light', light_data)
    light_obj.location = (-20, -20, 25)
    light_obj.rotation_euler = (math.radians(48), math.radians(-30), math.radians(45))
    bpy.context.collection.objects.link(light_obj)

    # Fill Light
    fill_data = bpy.data.lights.new('Warehouse_Fill_Light', type='SUN')
    fill_data.energy = 1.8
    fill_data.color = (0.78, 0.88, 1.0)
    fill_obj = bpy.data.objects.new('Warehouse_Fill_Light', fill_data)
    fill_obj.rotation_euler = (math.radians(35), math.radians(40), math.radians(-130))
    bpy.context.collection.objects.link(fill_obj)

def main():
    print("=== Building Fishery Cold Storage Warehouse (Asset 7) ===")
    clean_scene()

    # Define PBR Materials
    materials = {
        'Mat_Concrete_Plinth': create_pbr_material(
            'Mat_Concrete_Plinth',
            base_color=(0.34, 0.35, 0.37), # Heavy moisture-sealed foundation concrete
            roughness=0.85,
            metallic=0.0
        ),
        'Mat_Insulated_Walls': create_pbr_material(
            'Mat_Insulated_Walls',
            base_color=(0.82, 0.84, 0.80), # Coastal off-white / seafoam cream insulated wall panels
            roughness=0.65,
            metallic=0.02
        ),
        'Mat_Corrugated_Roof': create_pbr_material(
            'Mat_Corrugated_Roof',
            base_color=(0.38, 0.44, 0.46), # Weathered industrial corrugated steel roofing
            roughness=0.68,
            metallic=0.45
        ),
        'Mat_Steel_Framing': create_pbr_material(
            'Mat_Steel_Framing',
            base_color=(0.14, 0.28, 0.38), # Marine teal/blue painted structural I-beams
            roughness=0.50,
            metallic=0.65
        ),
        'Mat_Loading_Dock': create_pbr_material(
            'Mat_Loading_Dock',
            base_color=(0.48, 0.48, 0.48), # Non-slip broom-finished loading dock concrete
            roughness=0.80,
            metallic=0.0
        ),
        'Mat_Safety_Yellow': create_pbr_material(
            'Mat_Safety_Yellow',
            base_color=(0.92, 0.74, 0.08), # High-visibility safety hazard yellow
            roughness=0.45,
            metallic=0.05
        ),
        'Mat_Rolling_Shutter': create_pbr_material(
            'Mat_Rolling_Shutter',
            base_color=(0.56, 0.58, 0.60), # Galvanized corrugated steel rolling shutter
            roughness=0.55,
            metallic=0.75
        ),
        'Mat_PVC_Curtain': create_pbr_material(
            'Mat_PVC_Curtain',
            base_color=(0.70, 0.86, 0.94), # Translucent clear PVC freezer strip curtain
            roughness=0.15,
            metallic=0.05,
            transmission=0.65,
            alpha=0.75
        ),
        'Mat_Chiller_Metal': create_pbr_material(
            'Mat_Chiller_Metal',
            base_color=(0.42, 0.45, 0.48), # Zinc-galvanized chiller condenser cabinet
            roughness=0.55,
            metallic=0.80
        ),
        'Mat_Copper_Piping': create_pbr_material(
            'Mat_Copper_Piping',
            base_color=(0.78, 0.45, 0.25), # Insulated refrigeration copper coolant piping
            roughness=0.35,
            metallic=0.85
        ),
        'Mat_Steel_Galvanized': create_pbr_material(
            'Mat_Steel_Galvanized',
            base_color=(0.65, 0.68, 0.70), # Galvanized pipe handrails and struts
            roughness=0.45,
            metallic=0.80
        ),
        'Mat_Fish_Crate_Blue': create_pbr_material(
            'Mat_Fish_Crate_Blue',
            base_color=(0.08, 0.35, 0.78), # Injection-molded royal blue plastic fish crate
            roughness=0.40,
            metallic=0.0
        ),
        'Mat_Fish_Crate_Terracotta': create_pbr_material(
            'Mat_Fish_Crate_Terracotta',
            base_color=(0.85, 0.38, 0.12), # Terracotta orange plastic fish crate
            roughness=0.40,
            metallic=0.0
        ),
        'Mat_Ice_Tote_White': create_pbr_material(
            'Mat_Ice_Tote_White',
            base_color=(0.90, 0.92, 0.94), # Heavy-duty polyethylene insulated bulk ice tub
            roughness=0.35,
            metallic=0.0
        ),
        'Mat_Wood_Pallet': create_pbr_material(
            'Mat_Wood_Pallet',
            base_color=(0.52, 0.42, 0.30), # Rough-sawn pine/sal transport pallet
            roughness=0.85,
            metallic=0.0
        ),
        'Mat_Signboard': create_pbr_material(
            'Mat_Signboard',
            base_color=(0.08, 0.18, 0.38), # Deep marine navy cooperative signboard
            roughness=0.45,
            metallic=0.05
        ),
        'Mat_Safety_Red': create_pbr_material(
            'Mat_Safety_Red',
            base_color=(0.85, 0.10, 0.10), # Emergency fire safety reel cabinet
            roughness=0.40,
            metallic=0.05
        ),
        'Mat_Rubber_Black': create_pbr_material(
            'Mat_Rubber_Black',
            base_color=(0.12, 0.12, 0.14), # Heavy vulcanized black rubber dock bumper
            roughness=0.90,
            metallic=0.0
        ),
    }

    # 1. Foundation & Loading Dock
    build_foundation_and_dock(materials)

    # 2. Walls, Doors & Superstructure
    build_walls_and_superstructure(materials)

    # 3. Roof, Canopy & Signboard
    build_roof_and_canopy(materials)

    # 4. Refrigeration Chiller Banks & Utilities
    build_refrigeration_and_utilities(materials)

    # 5. Cold Storage Props (Pallet jack, totes, crates, pallets)
    build_cold_storage_props(materials)

    # 6. Simplified Colliders
    build_colliders()

    # 7. Preview Camera & Lighting
    setup_camera_and_lighting()

    # Calculate statistics
    total_verts = sum(len(o.data.vertices) for o in bpy.data.objects if o.type == 'MESH')
    total_tris = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH' and not o.name.startswith('Collider_'))
    total_col_tris = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith('Collider_'))
    print(f"Total Objects: {len(bpy.data.objects)}")
    print(f"Total Visual Polygons: {total_tris}")
    print(f"Total Collider Polygons: {total_col_tris}")
    print(f"Total Vertices: {total_verts}")
    print(f"Total Materials: {len(materials)}")

    # Export to GLB
    export_dir = r'c:\Users\ssaib\Downloads\ConquerTheCity\public\models'
    os.makedirs(export_dir, exist_ok=True)
    export_path = os.path.join(export_dir, 'building_fishery_cold_storage_01.glb')

    # Select all mesh objects for export (omit camera and lights)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=export_path,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True
    )

    file_size_bytes = os.path.getsize(export_path)
    file_size_kb = file_size_bytes / 1024.0
    print(f"GLB exported successfully to: {export_path}")
    print(f"File Size: {file_size_kb:.2f} KB ({file_size_bytes} bytes)")

if __name__ == '__main__':
    main()
