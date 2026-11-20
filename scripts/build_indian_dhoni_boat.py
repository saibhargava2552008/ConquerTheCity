"""
Conquer The City - Asset 6: Indian Coastal Wooden Fishing Boat (Dhoni / Nava)
Production-grade 3D model for Seaview Town Fishing Harbour.
Native Blender Z-Up Coordinates -> Three.js Y-Up Export.

Coordinate Conventions:
- Blender X: Port (-X) to Starboard (+X), Width = 3.5m
- Blender Y: Bow (-Y) to Stern (+Y), Length = 10.7m
  (Exports via export_yup=True to Three.js +Z Bow, -Z Stern)
- Blender Z: Keel (-0.75m) to Deck (1.25m) to Masthead (5.60m)
  (Exports via export_yup=True to Three.js +Y Height)
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Quaternion, Matrix

def clean_scene():
    """Remove existing scene objects while preserving add-on sockets."""
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

def build_hull(materials):
    """Constructs the compound-curved wooden boat hull using 13 stations along Blender Y."""
    # Y is length: -5.5 (bow stem) to +5.2 (stern post)
    # Fields: (y, half_width, z_deck, z_sheer, z_keel, fullness, b_rise)
    stations = [
        (-5.5, 0.12, 1.55, 2.65,  0.35, 0.15, 0.08), # 0 Bow stempost tip
        (-5.2, 0.35, 1.50, 2.45,  0.05, 0.25, 0.15), # 1 Cutwater
        (-4.6, 0.80, 1.40, 2.18, -0.35, 0.45, 0.30), # 2 Bow forefoot
        (-3.8, 1.25, 1.32, 1.96, -0.58, 0.65, 0.45), # 3 Bow entrance
        (-2.8, 1.55, 1.27, 1.82, -0.70, 0.80, 0.55), # 4 Fwd shoulder
        (-1.6, 1.70, 1.24, 1.73, -0.75, 0.88, 0.60), # 5 Fwd waist
        (-0.4, 1.75, 1.22, 1.70, -0.76, 0.90, 0.62), # 6 Midships fwd
        ( 0.8, 1.76, 1.22, 1.70, -0.76, 0.90, 0.62), # 7 Midships aft
        ( 2.0, 1.72, 1.24, 1.72, -0.75, 0.88, 0.60), # 8 Aft waist
        ( 3.2, 1.60, 1.26, 1.78, -0.72, 0.80, 0.55), # 9 Aft quarter
        ( 4.2, 1.35, 1.30, 1.86, -0.60, 0.68, 0.45), # 10 Aft run
        ( 4.8, 0.95, 1.35, 1.95, -0.42, 0.50, 0.35), # 11 Transom
        ( 5.2, 0.22, 1.40, 2.05, -0.15, 0.25, 0.20), # 12 Sternpost
    ]

    bm = bmesh.new()
    num_stations = len(stations)
    v_port = []
    v_star = []

    for i, (y, hw, z_deck, z_sheer, z_keel, fullness, b_rise) in enumerate(stations):
        row_p = []
        row_s = []

        # On starboard (+X) side between Y = -3.0m and Y = -0.2m, lower bulwark to deck for Gangway 1 boarding
        is_boarding_zone = (-3.0 <= y <= -0.2)
        star_sheer = (z_deck + 0.08) if is_boarding_zone else z_sheer

        # Contours from keel (z=z_keel) up to gunwale cap (z=z_sheer)
        pts_p = [
            (0.0, z_keel),
            (hw * 0.25 * fullness, z_keel + (z_deck - z_keel) * 0.12),
            (hw * 0.65 * fullness, z_keel + (z_deck - z_keel) * b_rise),
            (hw * 0.92 * fullness, z_keel + (z_deck - z_keel) * 0.60),
            (hw * 1.00, 0.10),
            (hw * 1.02, z_deck + 0.10),
            (hw * 0.98, z_sheer),
            (hw * 0.90, z_sheer - 0.06),
        ]

        pts_s = [
            (0.0, z_keel),
            (hw * 0.25 * fullness, z_keel + (z_deck - z_keel) * 0.12),
            (hw * 0.65 * fullness, z_keel + (z_deck - z_keel) * b_rise),
            (hw * 0.92 * fullness, z_keel + (z_deck - z_keel) * 0.60),
            (hw * 1.00, 0.10),
            (hw * 1.02, z_deck + 0.06 if is_boarding_zone else z_deck + 0.10),
            (hw * 0.98, star_sheer),
            (hw * 0.90, star_sheer - 0.04),
        ]

        for x_rel, z_val in pts_p:
            vp = bm.verts.new(Vector((-x_rel, y, z_val)))
            row_p.append(vp)

        for x_rel, z_val in pts_s:
            vs = bm.verts.new(Vector((x_rel, y, z_val)))
            row_s.append(vs)

        v_port.append(row_p)
        v_star.append(row_s)

    bm.verts.ensure_lookup_table()

    # Create Quad Faces between stations
    for i in range(num_stations - 1):
        for j in range(7):
            # Port side
            try:
                bm.faces.new([
                    v_port[i][j],
                    v_port[i][j + 1],
                    v_port[i + 1][j + 1],
                    v_port[i + 1][j]
                ])
            except ValueError:
                pass

            # Starboard side
            try:
                bm.faces.new([
                    v_star[i][j],
                    v_star[i + 1][j],
                    v_star[i + 1][j + 1],
                    v_star[i + 1][j]
                ])
            except ValueError:
                pass

    # Centerline Keel Seam
    for i in range(num_stations - 1):
        try:
            bm.faces.new([
                v_port[i][0],
                v_star[i][0],
                v_star[i + 1][0],
                v_port[i + 1][0]
            ])
        except ValueError:
            pass

    # Bow Stem Plate (station 0)
    stem_pts = [v_port[0][j] for j in range(8)] + [v_star[0][j] for j in range(7, -1, -1)]
    try:
        bm.faces.new(stem_pts)
    except ValueError:
        pass

    # Transom Stern Plate (station 12)
    transom_pts = [v_port[-1][j] for j in range(8)] + [v_star[-1][j] for j in range(7, -1, -1)]
    try:
        bm.faces.new(transom_pts)
    except ValueError:
        pass

    mesh = bpy.data.meshes.new('Mesh_Boat_Hull')
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new('Boat_Hull', mesh)
    bpy.context.collection.objects.link(obj)

    # Multi-material assignments:
    # Slot 0: Mat_Hull_Topsides (Teal)
    # Slot 1: Mat_Hull_Bottom (Oxide Red)
    # Slot 2: Mat_Trim_Accent (Saffron/Gold Sheer Stripe)
    obj.data.materials.append(materials['Mat_Hull_Topsides'])
    obj.data.materials.append(materials['Mat_Hull_Bottom'])
    obj.data.materials.append(materials['Mat_Trim_Accent'])

    for poly in obj.data.polygons:
        poly.use_smooth = True
        center_z = sum(obj.data.vertices[v].co.z for v in poly.vertices) / len(poly.vertices)
        if center_z < 0.15:
            poly.material_index = 1 # Bottom antifouling
        elif 1.15 <= center_z <= 1.45:
            poly.material_index = 2 # Gold sheer stripe
        else:
            poly.material_index = 0 # Teal topsides

    mod_sol = obj.modifiers.new(name='Solidify', type='SOLIDIFY')
    mod_sol.thickness = 0.06
    mod_sol.offset = -1.0
    mod_sol.use_rim = True

    return obj

def build_deck(materials):
    """Walkable wooden deck planks."""
    bm = bmesh.new()

    y_coords = [-5.2, -4.6, -3.8, -2.8, -1.4, 0.0, 1.4, 2.8, 3.8, 4.6]
    half_widths = [0.22, 0.65, 1.15, 1.46, 1.62, 1.65, 1.62, 1.48, 1.20, 0.82]
    z_deck = 1.25

    rows = []
    num_x_divs = 10
    for y, hw in zip(y_coords, half_widths):
        row = []
        for xi in range(num_x_divs + 1):
            t = xi / num_x_divs
            x = -hw + t * (2.0 * hw)
            v = bm.verts.new(Vector((x, y, z_deck)))
            row.append(v)
        rows.append(row)

    bm.verts.ensure_lookup_table()

    for r in range(len(rows) - 1):
        for c in range(num_x_divs):
            try:
                bm.faces.new([
                    rows[r][c],
                    rows[r + 1][c],
                    rows[r + 1][c + 1],
                    rows[r][c + 1]
                ])
            except ValueError:
                pass

    mesh = bpy.data.meshes.new('Mesh_Boat_Deck')
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new('Boat_Deck', mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(materials['Mat_Timber_Deck'])
    for poly in obj.data.polygons:
        poly.use_smooth = False
    return obj

def build_internal_ribs(materials):
    """Timber frame ribs along the inside of the bulwarks."""
    bm = bmesh.new()
    rib_y_positions = [-4.2, -3.4, -2.4, -1.2, 0.0, 1.2, 2.4, 3.4, 4.2]
    hw_map = {
        -4.2: 1.00, -3.4: 1.34, -2.4: 1.58, -1.2: 1.70,
         0.0: 1.74,  1.2: 1.72,  2.4: 1.66,  3.4: 1.52,  4.2: 1.28
    }
    sheer_z_map = {
        -4.2: 2.08, -3.4: 1.92, -2.4: 1.80, -1.2: 1.72,
         0.0: 1.70,  1.2: 1.70,  2.4: 1.73,  3.4: 1.78,  4.2: 1.86
    }

    rib_w = 0.06
    rib_d = 0.08

    for y in rib_y_positions:
        hw = hw_map[y]
        z_top = sheer_z_map[y]
        h = z_top - 1.25
        z_center = 1.25 + h * 0.5

        # Port rib
        bmesh.ops.create_cube(
            bm,
            size=1.0,
            matrix=Matrix.Translation(Vector((-hw + 0.08, y, z_center))) @ Matrix.Diagonal(Vector((rib_w, rib_d, h, 1.0)))
        )
        # Starboard rib (skip Y in [-2.2, -0.8] for gangway boarding opening)
        if not (-2.2 <= y <= -0.8):
            bmesh.ops.create_cube(
                bm,
                size=1.0,
                matrix=Matrix.Translation(Vector((hw - 0.08, y, z_center))) @ Matrix.Diagonal(Vector((rib_w, rib_d, h, 1.0)))
            )

    mesh = bpy.data.meshes.new('Mesh_Internal_Ribs')
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new('Boat_Internal_Ribs', mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(materials['Mat_Timber_Deck'])
    return obj

def build_rub_rails(materials):
    """External timber rub rails along sheer line with starboard boarding gap."""
    bm = bmesh.new()

    p_pts = [
        Vector((-0.38, -5.2, 1.50)),
        Vector((-0.84, -4.6, 1.40)),
        Vector((-1.32, -3.8, 1.32)),
        Vector((-1.58, -2.8, 1.27)),
        Vector((-1.72, -1.6, 1.24)),
        Vector((-1.76, -0.2, 1.22)),
        Vector((-1.74,  1.2, 1.22)),
        Vector((-1.62,  2.8, 1.25)),
        Vector((-1.32,  4.0, 1.29)),
        Vector((-0.88,  4.8, 1.35)),
    ]

    s_pts_fwd = [
        Vector((0.38, -5.2, 1.50)),
        Vector((0.84, -4.6, 1.40)),
        Vector((1.32, -3.8, 1.32)),
        Vector((1.52, -3.2, 1.28)),
    ]

    s_pts_aft = [
        Vector((1.76,  0.0, 1.22)),
        Vector((1.74,  1.2, 1.22)),
        Vector((1.62,  2.8, 1.25)),
        Vector((1.32,  4.0, 1.29)),
        Vector((0.88,  4.8, 1.35)),
    ]

    rail_w = 0.10
    rail_h = 0.12

    def extrude_rail(pts):
        for i in range(len(pts) - 1):
            p1 = pts[i]
            p2 = pts[i + 1]
            center = (p1 + p2) * 0.5
            dir_vec = p2 - p1
            length = dir_vec.length
            bmesh.ops.create_cube(
                bm,
                size=1.0,
                matrix=Matrix.Translation(center) @ Matrix.Diagonal(Vector((rail_w, length, rail_h, 1.0)))
            )

    extrude_rail(p_pts)
    extrude_rail(s_pts_fwd)
    extrude_rail(s_pts_aft)

    mesh = bpy.data.meshes.new('Mesh_Rub_Rails')
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new('Boat_Rub_Rails', mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(materials['Mat_Trim_Accent'])
    return obj

def build_bow_stem_and_rudder(materials):
    """Raised bow stem post and stern rudder with tiller arm."""
    # 1. Carved Bow Stempost
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, -5.48, 2.10))
    stem = bpy.context.active_object
    stem.name = 'Boat_Bow_Stempost'
    stem.scale = (0.16, 0.22, 1.40)
    stem.rotation_euler = (-0.28, 0, 0) # Raked forward
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    stem.data.materials.append(materials['Mat_Trim_Accent'])

    # 2. Bow Stempost Finial Peak
    bpy.ops.mesh.primitive_cone_add(radius1=0.14, radius2=0.04, depth=0.45, location=(0.0, -5.72, 2.95), vertices=8)
    finial = bpy.context.active_object
    finial.name = 'Boat_Stempost_Finial'
    finial.rotation_euler = (-0.28, 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    finial.data.materials.append(materials['Mat_Trim_Accent'])

    # 3. Stern Transom Rudder Blade
    rudder_h = 1.40
    rudder_w = 0.65
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 5.50, 0.35))
    rudder = bpy.context.active_object
    rudder.name = 'Boat_Rudder_Blade'
    rudder.scale = (0.09, rudder_w, rudder_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    rudder.data.materials.append(materials['Mat_Timber_Deck'])

    # Rudder straps
    for pz in [0.0, 0.70]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 5.35, pz))
        strap = bpy.context.active_object
        strap.name = f'Boat_Rudder_Strap_{int(pz*10)}'
        strap.scale = (0.12, 0.35, 0.08)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        strap.data.materials.append(materials['Mat_Exhaust_Metal'])

    # 4. Tiller Arm
    bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=1.25, location=(0.0, 4.85, 1.58), vertices=8)
    tiller = bpy.context.active_object
    tiller.name = 'Boat_Tiller_Arm'
    tiller.rotation_euler = (math.pi * 0.5 - 0.12, 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    tiller.data.materials.append(materials['Mat_Timber_Deck'])

def build_wheelhouse(materials):
    """Mid-aft wooden wheelhouse with windows, door, helm wheel, and grab rails."""
    cabin_w = 1.86
    cabin_d = 2.45
    cabin_h = 1.72
    center = Vector((0.0, 0.65, 1.25 + cabin_h * 0.5))

    # 1. Main Cabin Body
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=center)
    cabin = bpy.context.active_object
    cabin.name = 'Boat_Wheelhouse_Cabin'
    cabin.scale = (cabin_w, cabin_d, cabin_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cabin.data.materials.append(materials['Mat_Cabin_Walls'])

    # 2. Cambered Curved Roof with Eaves
    roof_w = cabin_w + 0.22
    roof_d = cabin_d + 0.26
    roof_z = 1.25 + cabin_h + 0.08
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.65, roof_z))
    roof = bpy.context.active_object
    roof.name = 'Boat_Cabin_Roof'
    roof.scale = (roof_w, roof_d, 0.12)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    roof.data.materials.append(materials['Mat_Cabin_Roof'])

    # 3. Three Forward Bridge Windows (Facing -Y / Bow)
    win_w = 0.42
    win_h = 0.58
    win_y = 0.65 - cabin_d * 0.5 - 0.01
    win_z = 1.25 + cabin_h * 0.65
    for xi, x_pos in enumerate([-0.54, 0.0, 0.54]):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x_pos, win_y, win_z))
        win = bpy.context.active_object
        win.name = f'Boat_Window_Fwd_{xi}'
        win.scale = (win_w, 0.04, win_h)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        win.data.materials.append(materials['Mat_Window_Glass'])

    # 4. Port Side Windows
    for yi, y_pos in enumerate([0.30, 1.00]):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.94, y_pos, win_z))
        win_port = bpy.context.active_object
        win_port.name = f'Boat_Window_Port_{yi}'
        win_port.scale = (0.04, 0.48, win_h)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        win_port.data.materials.append(materials['Mat_Window_Glass'])

    # 5. Starboard Sliding Doorway & Window
    door_w = 0.68
    door_h = 1.42
    door_z = 1.25 + door_h * 0.5
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.94, 0.25, door_z))
    door = bpy.context.active_object
    door.name = 'Boat_Door_Starboard'
    door.scale = (0.04, door_w, door_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    door.data.materials.append(materials['Mat_Timber_Deck'])

    # Starboard Aft Window
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.94, 1.15, win_z))
    win_s = bpy.context.active_object
    win_s.name = 'Boat_Window_Starboard'
    win_s.scale = (0.04, 0.48, win_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    win_s.data.materials.append(materials['Mat_Window_Glass'])

    # 6. Roof Grab Rails (Safety Handrails)
    for side_x in [-0.88, 0.88]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=roof_d - 0.35, location=(side_x, 0.65, roof_z + 0.12), vertices=8)
        rail = bpy.context.active_object
        rail.name = f'Boat_Roof_Rail_{"L" if side_x < 0 else "R"}'
        rail.rotation_euler = (math.pi * 0.5, 0, 0)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        rail.data.materials.append(materials['Mat_Exhaust_Metal'])

    # 7. Helm Steering Wheel
    bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.025, location=(0.0, -0.35, win_z - 0.12), major_segments=16, minor_segments=8)
    helm = bpy.context.active_object
    helm.name = 'Boat_Helm_Wheel'
    helm.rotation_euler = (0.35, 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    helm.data.materials.append(materials['Mat_Timber_Deck'])

    # 8. Lifebuoy
    bpy.ops.mesh.primitive_torus_add(major_radius=0.26, minor_radius=0.06, location=(-0.96, -0.15, win_z), major_segments=16, minor_segments=8)
    lifebuoy = bpy.context.active_object
    lifebuoy.name = 'Boat_Lifebuoy'
    lifebuoy.rotation_euler = (0, math.pi * 0.5, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    lifebuoy.data.materials.append(materials['Mat_Buoys_Orange'])

    # 9. Brass Ship's Bell
    bpy.ops.mesh.primitive_cone_add(radius1=0.08, radius2=0.03, depth=0.14, location=(0.0, -0.62, 1.25 + cabin_h + 0.02), vertices=10)
    bell = bpy.context.active_object
    bell.name = 'Boat_Ships_Bell'
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bell.data.materials.append(materials['Mat_Brass_Lantern'])

def build_engine_exhaust(materials):
    """Vertical diesel exhaust stack with silencer and rain cap."""
    ex_x = 0.45
    ex_y = 1.95
    base_z = 1.25
    pipe_h = 2.15

    # 1. Main vertical steel pipe (along Z)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.065, depth=pipe_h, location=(ex_x, ex_y, base_z + pipe_h * 0.5), vertices=12)
    pipe = bpy.context.active_object
    pipe.name = 'Boat_Exhaust_Pipe'
    pipe.data.materials.append(materials['Mat_Exhaust_Metal'])

    # 2. Silencer muffler barrel
    muffler_h = 0.68
    muffler_z = base_z + 1.25
    bpy.ops.mesh.primitive_cylinder_add(radius=0.13, depth=muffler_h, location=(ex_x, ex_y, muffler_z), vertices=12)
    muffler = bpy.context.active_object
    muffler.name = 'Boat_Exhaust_Silencer'
    muffler.data.materials.append(materials['Mat_Exhaust_Metal'])

    # 3. Top curved elbow pointing aft (+Y)
    top_z = base_z + pipe_h
    bpy.ops.mesh.primitive_cylinder_add(radius=0.065, depth=0.24, location=(ex_x, ex_y + 0.09, top_z + 0.06), vertices=12)
    elbow = bpy.context.active_object
    elbow.name = 'Boat_Exhaust_Elbow'
    elbow.rotation_euler = (math.pi * 0.35, 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    elbow.data.materials.append(materials['Mat_Exhaust_Metal'])

    # 4. Flapper rain cap
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.015, location=(ex_x, ex_y + 0.18, top_z + 0.15), vertices=10)
    flapper = bpy.context.active_object
    flapper.name = 'Boat_Exhaust_Flapper'
    flapper.rotation_euler = (math.pi * 0.25, 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    flapper.data.materials.append(materials['Mat_Exhaust_Metal'])

def build_mast_and_rigging(materials):
    """Main cargo mast, derrick boom, solid cylindrical stay rods, brass lantern, and pennant."""
    mast_x = 0.0
    mast_y = -0.85
    base_z = 1.25
    mast_h = 4.35 # Tops at Z = 5.60m

    # 1. Main timber mast (along Z)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.085, depth=mast_h, location=(mast_x, mast_y, base_z + mast_h * 0.5), vertices=12)
    mast = bpy.context.active_object
    mast.name = 'Boat_Main_Mast'
    mast.data.materials.append(materials['Mat_Timber_Deck'])

    # 2. Cross-tree spreader bar near top (Z = 4.70m)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(mast_x, mast_y, 4.70))
    spreader = bpy.context.active_object
    spreader.name = 'Boat_Mast_CrossTree'
    spreader.scale = (1.55, 0.10, 0.08)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    spreader.data.materials.append(materials['Mat_Timber_Deck'])

    # 3. Horizontal derrick boom extending forward (Z = 3.20m, Y from -0.85 to -3.55)
    boom_len = 2.70
    boom_center_y = mast_y - boom_len * 0.5
    bpy.ops.mesh.primitive_cylinder_add(radius=0.055, depth=boom_len, location=(mast_x, boom_center_y, 3.20), vertices=10)
    boom = bpy.context.active_object
    boom.name = 'Boat_Derrick_Boom'
    boom.rotation_euler = (math.pi * 0.5, 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    boom.data.materials.append(materials['Mat_Timber_Deck'])

    # 4. Rigging Stays as solid thin cylindrical rods
    top_pos = Vector((mast_x, mast_y, 4.70))
    stay_anchors = [
        (Vector((-1.65, -0.1, 1.65)), 'Stay_Port_Fwd'),
        (Vector((-1.65, -1.6, 1.65)), 'Stay_Port_Aft'),
        (Vector(( 1.65, -0.1, 1.65)), 'Stay_Star_Fwd'),
        (Vector(( 1.65, -1.6, 1.65)), 'Stay_Star_Aft'),
        (Vector(( 0.0,  -5.3, 2.45)), 'Stay_Forestay'),
    ]
    for anchor, name_suf in stay_anchors:
        create_rod(top_pos, anchor, radius=0.012, mat=materials['Mat_Exhaust_Metal'], name=f'Boat_{name_suf}', verts=6)

    # 5. Boom Topping Lift Rod
    boom_tip = Vector((mast_x, -3.55, 3.20))
    mast_peak = Vector((mast_x, mast_y, 5.40))
    create_rod(mast_peak, boom_tip, radius=0.012, mat=materials['Mat_Exhaust_Metal'], name='Boat_Boom_Lift', verts=6)

    # 6. Hanging Brass Lantern from boom
    lantern_y = -2.85
    lantern_z = 2.85
    bpy.ops.mesh.primitive_cylinder_add(radius=0.085, depth=0.25, location=(mast_x, lantern_y, lantern_z), vertices=10)
    lantern = bpy.context.active_object
    lantern.name = 'Boat_Brass_Lantern'
    lantern.data.materials.append(materials['Mat_Brass_Lantern'])

    # Lantern suspension line
    create_rod(Vector((mast_x, lantern_y, 3.20)), Vector((mast_x, lantern_y, lantern_z + 0.12)), radius=0.008, mat=materials['Mat_Exhaust_Metal'], name='Boat_Lantern_Wire')

    # 7. Indian Marine Tricolor Pennant at masthead
    bpy.ops.mesh.primitive_cone_add(radius1=0.12, radius2=0.01, depth=0.72, location=(mast_x, mast_y + 0.35, 5.55), vertices=8)
    pennant = bpy.context.active_object
    pennant.name = 'Boat_Tricolor_Pennant'
    pennant.rotation_euler = (math.pi * 0.5, 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    pennant.data.materials.append(materials['Mat_Trim_Accent'])

def build_deck_equipment_and_props(materials):
    """Detailed fishing equipment: cargo hatch, capstan winch, nets, crates, buoys, ropes, samson posts."""
    base_z = 1.25

    # 1. Forward Cargo Hatch with Slatted Coaming (Y in [-3.30, -2.10])
    hatch_w = 1.35
    hatch_d = 1.20
    hatch_h = 0.22
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, -2.70, base_z + hatch_h * 0.5))
    hatch = bpy.context.active_object
    hatch.name = 'Boat_Cargo_Hatch'
    hatch.scale = (hatch_w, hatch_d, hatch_h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    hatch.data.materials.append(materials['Mat_Timber_Deck'])

    # Raised Hatch Cover with Trim
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, -2.70, base_z + hatch_h + 0.025))
    hatch_top = bpy.context.active_object
    hatch_top.name = 'Boat_Hatch_Cover'
    hatch_top.scale = (hatch_w + 0.08, hatch_d + 0.08, 0.05)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    hatch_top.data.materials.append(materials['Mat_Trim_Accent'])

    # 2. Net Hauling Winch / Mechanical Capstan (Forward deck Y = -3.90)
    winch_x = 0.0
    winch_y = -3.90
    bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=0.48, location=(winch_x, winch_y, base_z + 0.36), vertices=12)
    winch_drum = bpy.context.active_object
    winch_drum.name = 'Boat_Net_Winch_Drum'
    winch_drum.rotation_euler = (0, math.pi * 0.5, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    winch_drum.data.materials.append(materials['Mat_Exhaust_Metal'])

    # Winch mounting frame pedestal
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(winch_x, winch_y, base_z + 0.16))
    winch_base = bpy.context.active_object
    winch_base.name = 'Boat_Net_Winch_Base'
    winch_base.scale = (0.54, 0.38, 0.32)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    winch_base.data.materials.append(materials['Mat_Exhaust_Metal'])

    # 3. Stacked Green Monofilament Fishing Nets (Port foredeck Y = -1.80)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.46, subdivisions=2, location=(-0.88, -1.80, base_z + 0.30))
    net1 = bpy.context.active_object
    net1.name = 'Boat_Fishing_Nets_01'
    net1.scale = (0.95, 1.35, 0.65)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    net1.data.materials.append(materials['Mat_Fishing_Net'])

    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.36, subdivisions=2, location=(-0.82, -1.95, base_z + 0.58))
    net2 = bpy.context.active_object
    net2.name = 'Boat_Fishing_Nets_02'
    net2.scale = (0.85, 1.05, 0.52)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    net2.data.materials.append(materials['Mat_Fishing_Net'])

    # 4. Marine Float Buoys
    buoy_data = [
        ((-0.68, -2.45, base_z + 0.22), materials['Mat_Buoys_Orange']),
        ((-0.74, -2.78, base_z + 0.22), materials['Mat_Buoys_Yellow']),
        ((-0.58, -2.98, base_z + 0.22), materials['Mat_Buoys_Orange']),
    ]
    for bi, (pos, mat) in enumerate(buoy_data):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16, location=pos, segments=12, ring_count=8)
        buoy = bpy.context.active_object
        buoy.name = f'Boat_Float_Buoy_{bi}'
        buoy.data.materials.append(mat)

    # 5. Fish Crates (Slatted crates stacked neatly)
    crate_dims = (0.56, 0.42, 0.28)
    crate_positions = [
        ( 0.98, -2.85, base_z + 0.14,  0.05),
        ( 0.98, -2.85, base_z + 0.42, -0.08),
        (-0.78,  3.20, base_z + 0.14,  0.12),
        (-0.78,  3.20, base_z + 0.42,  0.00),
    ]
    for ci, (cx, cy, cz, rot) in enumerate(crate_positions):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz))
        crate = bpy.context.active_object
        crate.name = f'Boat_Fish_Crate_{ci}'
        crate.scale = crate_dims
        crate.rotation_euler = (0, 0, rot)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        crate.data.materials.append(materials['Mat_Wood_Crates'])

    # 6. Coiled Jute Ropes
    rope_data = [
        (0.0, -4.68, base_z + 0.045, 0.36), # Bow coil
        (0.0,  4.20, base_z + 0.045, 0.30), # Stern coil
    ]
    for ri, (rx, ry, rz, radius) in enumerate(rope_data):
        bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=0.048, location=(rx, ry, rz), major_segments=16, minor_segments=8)
        rope = bpy.context.active_object
        rope.name = f'Boat_Coiled_Rope_{ri}'
        rope.data.materials.append(materials['Mat_Rope'])

    # 7. Navigation Light Boxes
    # Port Light (Red) on port cabin side
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.98, 0.20, 2.25))
    nav_port = bpy.context.active_object
    nav_port.name = 'Boat_Nav_Light_Port'
    nav_port.scale = (0.12, 0.14, 0.18)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    nav_port.data.materials.append(materials['Mat_Nav_Red'])

    # Starboard Light (Green) on star cabin side
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.98, 0.20, 2.25))
    nav_star = bpy.context.active_object
    nav_star.name = 'Boat_Nav_Light_Starboard'
    nav_star.scale = (0.12, 0.14, 0.18)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    nav_star.data.materials.append(materials['Mat_Nav_Green'])

    # 8. Auspicious Bow Eyes (Kannu medallions on port and starboard prow)
    for side_x, name_suf in [(-0.48, 'Port'), (0.48, 'Starboard')]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=0.03, location=(side_x, -4.75, 1.88), vertices=14)
        eye = bpy.context.active_object
        eye.name = f'Boat_Bow_Eye_{name_suf}'
        pitch = 0.35 if side_x > 0 else -0.35
        eye.rotation_euler = (0, math.pi * 0.5, pitch)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        eye.data.materials.append(materials['Mat_Trim_Accent'])

    # 9. Heavy Timber Samson Mooring Posts
    for bx in [-0.18, 0.18]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.065, depth=0.65, location=(bx, -4.88, base_z + 0.30), vertices=10)
        bitt = bpy.context.active_object
        bitt.name = f'Boat_Bow_Bitt_{"L" if bx < 0 else "R"}'
        bitt.data.materials.append(materials['Mat_Timber_Deck'])

    # Cross pin through bitts
    bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=0.55, location=(0.0, -4.88, base_z + 0.45), vertices=8)
    bitt_pin = bpy.context.active_object
    bitt_pin.name = 'Boat_Bow_Bitt_Pin'
    bitt_pin.rotation_euler = (0, math.pi * 0.5, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bitt_pin.data.materials.append(materials['Mat_Exhaust_Metal'])

def build_colliders():
    """Generates simplified invisible collision geometry with Collider_ prefix.
    Sets hide_render=True and display_type='WIRE' so they don't block visual renders."""
    cols = []

    # 1. Main Walkable Deck Collider
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 1.15))
    col_deck = bpy.context.active_object
    col_deck.name = 'Collider_Boat_Deck'
    col_deck.scale = (3.0, 9.8, 0.20)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_deck)

    # 2. Wheelhouse Cabin Collider
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.65, 2.10))
    col_cabin = bpy.context.active_object
    col_cabin.name = 'Collider_Boat_Cabin'
    col_cabin.scale = (1.90, 2.50, 1.72)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_cabin)

    # 3. Port Gunwale Bulwark Collider
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.58, 0.0, 1.55))
    col_gun_l = bpy.context.active_object
    col_gun_l.name = 'Collider_Boat_Gunwale_L'
    col_gun_l.scale = (0.28, 9.6, 0.65)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_gun_l)

    # 4. Starboard Aft Gunwale Collider
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.58, 2.2, 1.55))
    col_gun_r_aft = bpy.context.active_object
    col_gun_r_aft.name = 'Collider_Boat_Gunwale_R_Aft'
    col_gun_r_aft.scale = (0.28, 4.4, 0.65)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_gun_r_aft)

    # 5. Starboard Forward Gunwale Collider (Leaves clear boarding gap Y in [-3.2, 0.0] for Gangway 1!)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.58, -4.10, 1.55))
    col_gun_r_fwd = bpy.context.active_object
    col_gun_r_fwd.name = 'Collider_Boat_Gunwale_R_Fwd'
    col_gun_r_fwd.scale = (0.28, 1.80, 0.65)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_gun_r_fwd)

    for c in cols:
        c.hide_render = True
        c.display_type = 'WIRE'

def setup_camera_and_lighting():
    """Sets up a beauty camera and sun lighting for preview rendering."""
    # Camera placed at front-starboard 3/4 elevated angle
    cam_data = bpy.data.cameras.new('Boat_Preview_Camera')
    cam_data.lens = 38.0
    cam_obj = bpy.data.objects.new('Boat_Preview_Camera', cam_data)
    cam_obj.location = (8.5, -7.5, 5.0)
    bpy.context.collection.objects.link(cam_obj)

    # Look at center of boat
    target = Vector((0.0, -0.5, 1.8))
    cam_dir = target - cam_obj.location
    rot_quat = cam_dir.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()
    bpy.context.scene.camera = cam_obj

    # Main Key Sun Light
    light_data = bpy.data.lights.new('Boat_Sun_Light', type='SUN')
    light_data.energy = 4.0
    light_data.color = (1.0, 0.95, 0.88)
    light_obj = bpy.data.objects.new('Boat_Sun_Light', light_data)
    light_obj.location = (12, -12, 16)
    light_obj.rotation_euler = (math.radians(50), math.radians(-25), math.radians(45))
    bpy.context.collection.objects.link(light_obj)

    # Fill Sun Light from port side
    fill_data = bpy.data.lights.new('Boat_Fill_Light', type='SUN')
    fill_data.energy = 1.8
    fill_data.color = (0.78, 0.88, 1.0)
    fill_obj = bpy.data.objects.new('Boat_Fill_Light', fill_data)
    fill_obj.rotation_euler = (math.radians(35), math.radians(35), math.radians(-120))
    bpy.context.collection.objects.link(fill_obj)

def main():
    print("=== Building Native Z-Up Indian Dhoni Fishing Boat (Asset 6) ===")
    clean_scene()

    # Define PBR Materials
    materials = {
        'Mat_Hull_Topsides': create_pbr_material(
            'Mat_Hull_Topsides',
            base_color=(0.04, 0.40, 0.45), # Vibrant Indian coastal marine teal/turquoise
            roughness=0.55,
            metallic=0.04
        ),
        'Mat_Hull_Bottom': create_pbr_material(
            'Mat_Hull_Bottom',
            base_color=(0.58, 0.15, 0.12), # Weathered antifouling oxide red / copper
            roughness=0.82,
            metallic=0.0
        ),
        'Mat_Timber_Deck': create_pbr_material(
            'Mat_Timber_Deck',
            base_color=(0.42, 0.32, 0.22), # Weathered teak/sal wood planks
            roughness=0.75,
            metallic=0.0
        ),
        'Mat_Cabin_Walls': create_pbr_material(
            'Mat_Cabin_Walls',
            base_color=(0.82, 0.78, 0.72), # Weathered coastal cream/pale timber
            roughness=0.65,
            metallic=0.0
        ),
        'Mat_Cabin_Roof': create_pbr_material(
            'Mat_Cabin_Roof',
            base_color=(0.28, 0.35, 0.38), # Weathered dark marine gray-blue painted timber
            roughness=0.68,
            metallic=0.02
        ),
        'Mat_Window_Glass': create_pbr_material(
            'Mat_Window_Glass',
            base_color=(0.12, 0.32, 0.42), # Reflective marine tinted glass
            roughness=0.10,
            metallic=0.15,
            transmission=0.55,
            alpha=0.85
        ),
        'Mat_Exhaust_Metal': create_pbr_material(
            'Mat_Exhaust_Metal',
            base_color=(0.18, 0.18, 0.20), # Cast iron / heat-patinated steel
            roughness=0.65,
            metallic=0.85
        ),
        'Mat_Fishing_Net': create_pbr_material(
            'Mat_Fishing_Net',
            base_color=(0.06, 0.40, 0.24), # Emerald marine nylon mesh
            roughness=0.92,
            metallic=0.0
        ),
        'Mat_Buoys_Orange': create_pbr_material(
            'Mat_Buoys_Orange',
            base_color=(0.95, 0.38, 0.05), # Safety marine orange
            roughness=0.35,
            metallic=0.02
        ),
        'Mat_Buoys_Yellow': create_pbr_material(
            'Mat_Buoys_Yellow',
            base_color=(0.95, 0.82, 0.08), # High-visibility marine yellow
            roughness=0.35,
            metallic=0.02
        ),
        'Mat_Rope': create_pbr_material(
            'Mat_Rope',
            base_color=(0.62, 0.50, 0.32), # Natural jute/manila hemp fiber
            roughness=0.95,
            metallic=0.0
        ),
        'Mat_Brass_Lantern': create_pbr_material(
            'Mat_Brass_Lantern',
            base_color=(0.78, 0.60, 0.22), # Aged marine brass
            roughness=0.35,
            metallic=0.85
        ),
        'Mat_Wood_Crates': create_pbr_material(
            'Mat_Wood_Crates',
            base_color=(0.50, 0.40, 0.30), # Slatted pine/sal wood crates
            roughness=0.80,
            metallic=0.0
        ),
        'Mat_Trim_Accent': create_pbr_material(
            'Mat_Trim_Accent',
            base_color=(0.88, 0.65, 0.12), # Saffron gold / Indian yellow trim
            roughness=0.50,
            metallic=0.05
        ),
        'Mat_Nav_Red': create_pbr_material(
            'Mat_Nav_Red',
            base_color=(0.85, 0.08, 0.08), # Port ruby navigation light
            roughness=0.20,
            metallic=0.10
        ),
        'Mat_Nav_Green': create_pbr_material(
            'Mat_Nav_Green',
            base_color=(0.08, 0.75, 0.25), # Starboard emerald navigation light
            roughness=0.20,
            metallic=0.10
        ),
    }

    # 1. Build Hull
    build_hull(materials)

    # 2. Build Deck
    build_deck(materials)

    # 3. Internal Frames/Ribs
    build_internal_ribs(materials)

    # 4. Rub Rails
    build_rub_rails(materials)

    # 5. Bow Stem, Finial, Stern Rudder & Tiller
    build_bow_stem_and_rudder(materials)

    # 6. Wheelhouse Cabin, Helm, Windows, Lifebuoy
    build_wheelhouse(materials)

    # 7. Engine Exhaust Stack
    build_engine_exhaust(materials)

    # 8. Mast, Derricking Boom, Stays, Pennant, Lantern
    build_mast_and_rigging(materials)

    # 9. Deck Equipment, Winch, Nets, Crates, Buoys, Samson Posts
    build_deck_equipment_and_props(materials)

    # 10. Simplified Colliders
    build_colliders()

    # 11. Setup Camera & Lighting for inspection
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
    export_dir = os.path.abspath('public/models')
    os.makedirs(export_dir, exist_ok=True)
    export_path = os.path.join(export_dir, 'prop_indian_dhoni_boat_01.glb')

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
