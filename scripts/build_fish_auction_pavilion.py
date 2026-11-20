"""
Conquer The City - Asset 8: Fish Auction Pavilion & Catch Processing Centre
Creates 'building_fish_auction_pavilion_01.glb' for Seaview Town Fishing Harbour.
Modelled after authentic Andhra Pradesh coastal fishery auction markets (Visakhapatnam / Kakinada harbor auction sheds).

Features:
- Large open-sided reinforced-concrete and steel pavilion (16m x 16m).
- Washable non-slip concrete/terrazzo market floor at Y = 0.40m matching wharf height.
- Recessed drainage gutters with cast iron grates and sloped washdown channels.
- Heavy structural steel roof trusses and weathered corrugated gable roof with ridge monitor ventilator.
- Raised central auction platform (height 0.65m, smooth 0.25m step-up).
- 4 marine stainless-steel fish sorting and grading tables with drainage spouts.
- Gantry-suspended circular dial weighing scales and digital crate tare scale.
- Stacked injection-molded plastic fish crates (blue, orange, yellow, green) and insulated bulk ice containers (ISOTERM).
- Brass water washdown bib taps and coiled reinforced wash hoses.
- Industrial 3-blade coastal ceiling fans and vapor-tight fluorescent LED fixtures.
- Bilingual cooperative signboard: "సముద్ర చేపల వేలం కేంద్రం / SEAVIEW FISH AUCTION CENTRE".
- Simplified collision geometry with Collider_ prefix.
- Exported to public/models/building_fish_auction_pavilion_01.glb.
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

def create_pbr_material(name, base_color, roughness=0.6, metallic=0.0, specular=0.5, transmission=0.0, emission=None, alpha=1.0):
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

    if emission:
        if 'Emission Color' in node_bsdf.inputs:
            node_bsdf.inputs['Emission Color'].default_value = (emission[0], emission[1], emission[2], 1.0)
            node_bsdf.inputs['Emission Strength'].default_value = emission[3] if len(emission) > 3 else 1.0
        elif 'Emission' in node_bsdf.inputs:
            node_bsdf.inputs['Emission'].default_value = (emission[0], emission[1], emission[2], 1.0)

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

def build_plinth_and_drainage(materials):
    """Constructs the elevated 0.40m washable floor plinth, drainage channels, and curb ramps."""
    # 1. Main Concrete Foundation Plinth (16.0m x 16.0m, height 0.40m, Z from 0.0 to 0.40m)
    # Native Blender coordinates: X in [-8.0, 8.0], Y in [-8.0, 8.0], Z in [0.0, 0.40]
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.20))
    plinth = bpy.context.active_object
    plinth.name = 'Pavilion_Foundation_Plinth'
    plinth.scale = (16.0, 16.0, 0.40)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    plinth.data.materials.append(materials['Mat_Concrete_Plinth'])

    # 2. Non-Slip Washable Wet Ceramic/Terrazzo Market Floor Tile Overlay (Z = 0.405)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.405))
    floor_tile = bpy.context.active_object
    floor_tile.name = 'Pavilion_Washable_Tile_Floor'
    floor_tile.scale = (15.6, 15.6, 0.01)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    floor_tile.data.materials.append(materials['Mat_Market_Tile'])

    # 3. Recessed Floor Drainage Channels with Cast-Iron Grates
    # Two longitudinal gutters running North-South at X = -2.2 and X = +2.2 (flanking central auction aisle)
    for gx in [-2.2, 2.2]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(gx, 0.0, 0.408))
        grate = bpy.context.active_object
        grate.name = f'Pavilion_Drain_Grate_{gx}'
        grate.scale = (0.35, 15.2, 0.015)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        grate.data.materials.append(materials['Mat_Drain_Grate'])

    # 4. East Delivery Ramp (Smooth ramp for fish crate hand carts rising from 0.0 to 0.40m at X = 8.0 to 9.2)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(8.6, 0.0, 0.20))
    ramp = bpy.context.active_object
    ramp.name = 'Pavilion_East_Delivery_Ramp'
    ramp.scale = (1.2, 8.0, 0.38)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ramp.data.materials.append(materials['Mat_Concrete_Plinth'])

def build_superstructure_and_roof(materials):
    """Constructs reinforced concrete pillar pedestals, structural steel trusses, corrugated gable roof, and signage."""
    # 1. 10 Perimeter Structural Columns (Concrete lower base 0.50m x 0.50m x 1.20m + Steel I-beam up to 4.20m)
    # Column positions:
    # North row (Y = -7.4): X = -7.4, 0.0, 7.4
    # South row (Y = +7.4): X = -7.4, 0.0, 7.4
    # West mid (X = -7.4, Y = -3.7, +3.7)
    # East mid (X = +7.4, Y = -3.7, +3.7)
    col_coords = [
        (-7.4, -7.4), (0.0, -7.4), (7.4, -7.4),
        (-7.4, 7.4),  (0.0, 7.4),  (7.4, 7.4),
        (-7.4, -2.5), (-7.4, 2.5),
        (7.4, -2.5),  (7.4, 2.5)
    ]

    for ci, (cx, cy) in enumerate(col_coords):
        # Concrete lower pedestal (impact protection against hand carts and salt wash)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, 0.40 + 0.45))
        ped = bpy.context.active_object
        ped.name = f'Pavilion_Column_Pedestal_{ci}'
        ped.scale = (0.50, 0.50, 0.90)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        ped.data.materials.append(materials['Mat_Concrete_Plinth'])

        # Steel structural column above pedestal up to eaves (Z = 1.30 to 4.20, height 2.90m)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, 1.30 + 1.45))
        steel_col = bpy.context.active_object
        steel_col.name = f'Pavilion_Steel_Column_{ci}'
        steel_col.scale = (0.28, 0.28, 2.90)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        steel_col.data.materials.append(materials['Mat_Steel_Truss'])

    # 2. Perimeter Structural Eaves Tie-Beams (at Z = 4.10m)
    # North & South eaves beams (length 16.0m)
    for ey in [-7.4, 7.4]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, ey, 4.15))
        beam = bpy.context.active_object
        beam.name = f'Pavilion_Eaves_Beam_Y_{ey}'
        beam.scale = (16.2, 0.25, 0.30)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        beam.data.materials.append(materials['Mat_Steel_Truss'])

    # East & West eaves beams (length 16.0m)
    for ex in [-7.4, 7.4]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(ex, 0.0, 4.15))
        beam = bpy.context.active_object
        beam.name = f'Pavilion_Eaves_Beam_X_{ex}'
        beam.scale = (0.25, 16.2, 0.30)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        beam.data.materials.append(materials['Mat_Steel_Truss'])

    # 3. Transverse Roof Trusses (3 steel Pratt trusses across Y = -7.4, 0.0, +7.4)
    for ti, ty in enumerate([-7.4, 0.0, 7.4]):
        # Bottom chord (horizontal beam at Z = 4.15m)
        create_rod(Vector((-8.0, ty, 4.15)), Vector((8.0, ty, 4.15)), radius=0.06, mat=materials['Mat_Steel_Truss'], name=f'Truss_{ti}_BottomChord')
        # Left rafter (sloped from X = -8.0, Z = 4.15 up to X = 0.0, Z = 5.60)
        create_rod(Vector((-8.0, ty, 4.15)), Vector((0.0, ty, 5.60)), radius=0.06, mat=materials['Mat_Steel_Truss'], name=f'Truss_{ti}_RafterLeft')
        # Right rafter (sloped from X = 8.0, Z = 4.15 up to X = 0.0, Z = 5.60)
        create_rod(Vector((8.0, ty, 4.15)), Vector((0.0, ty, 5.60)), radius=0.06, mat=materials['Mat_Steel_Truss'], name=f'Truss_{ti}_RafterRight')
        # King post (vertical at center X = 0.0 from Z = 4.15 to 5.60)
        create_rod(Vector((0.0, ty, 4.15)), Vector((0.0, ty, 5.60)), radius=0.05, mat=materials['Mat_Steel_Truss'], name=f'Truss_{ti}_KingPost')
        # Diagonal struts
        create_rod(Vector((-4.0, ty, 4.15)), Vector((-2.0, ty, 5.24)), radius=0.04, mat=materials['Mat_Steel_Truss'], name=f'Truss_{ti}_StrutL')
        create_rod(Vector((4.0, ty, 4.15)), Vector((2.0, ty, 5.24)), radius=0.04, mat=materials['Mat_Steel_Truss'], name=f'Truss_{ti}_StrutR')

    # 4. Weathered Industrial Corrugated Gable Roof
    # Pitched roof mesh: apex at X = 0.0, Z = 5.60; eaves at X = -8.5 and +8.5, Z = 4.05; length Y in [-8.5, 8.5]
    mesh = bpy.data.meshes.new('Mesh_Auction_Pavilion_Roof')
    obj = bpy.data.objects.new('Pavilion_Corrugated_Roof', mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    # Left slope vertices
    v0 = bm.verts.new((-8.5, -8.5, 4.05))
    v1 = bm.verts.new((0.0, -8.5, 5.60))
    v2 = bm.verts.new((0.0, 8.5, 5.60))
    v3 = bm.verts.new((-8.5, 8.5, 4.05))
    bm.faces.new([v0, v1, v2, v3])

    # Right slope vertices
    v4 = bm.verts.new((0.0, -8.5, 5.60))
    v5 = bm.verts.new((8.5, -8.5, 4.05))
    v6 = bm.verts.new((8.5, 8.5, 4.05))
    v7 = bm.verts.new((0.0, 8.5, 5.60))
    bm.faces.new([v4, v5, v6, v7])

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    obj.data.materials.append(materials['Mat_Corrugated_Roof'])

    # 5. Continuous Ridge Monitor Ventilator along Roof Apex (X = 0, Z = 5.60 to 6.05, Y in [-8.5, 8.5])
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 5.82))
    ridge_vent = bpy.context.active_object
    ridge_vent.name = 'Pavilion_Ridge_Monitor_Ventilator'
    ridge_vent.scale = (1.60, 17.2, 0.45)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ridge_vent.data.materials.append(materials['Mat_Steel_Truss'])

    # 6. Bilingual Cooperative Signboard on Front (West: X in [-4.5, 4.5], Y = -8.2, Z in [4.2, 5.2])
    # Main navy background board
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, -8.25, 4.70))
    sign = bpy.context.active_object
    sign.name = 'Pavilion_Bilingual_Signboard'
    sign.scale = (8.80, 0.12, 1.05)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    sign.data.materials.append(materials['Mat_Signboard'])

    # Warm gold lettering plaque: Telugu line (top) & English line (bottom)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, -8.32, 4.88))
    sign_telugu = bpy.context.active_object
    sign_telugu.name = 'Sign_Text_Telugu_Plaque'
    sign_telugu.scale = (7.80, 0.04, 0.32)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    sign_telugu.data.materials.append(materials['Mat_Sign_Gold'])

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, -8.32, 4.52))
    sign_english = bpy.context.active_object
    sign_english.name = 'Sign_Text_English_Plaque'
    sign_english.scale = (8.20, 0.04, 0.28)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    sign_english.data.materials.append(materials['Mat_Sign_Gold'])

    # Gold border trim around signboard
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, -8.27, 4.70))
    sign_border = bpy.context.active_object
    sign_border.name = 'Pavilion_Signboard_Gold_Border'
    sign_border.scale = (8.92, 0.06, 1.15)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    sign_border.data.materials.append(materials['Mat_Sign_Gold'])

def build_auction_platform_and_desks(materials):
    """Constructs the central raised auction bidding stage, auctioneer desk, and tally slate."""
    # 1. Central Raised Auction Stage (4.2m x 3.2m, height 0.25m, top at Z = 0.65m; smooth step-up)
    # Location: Center of pavilion (X = 0.0, Y = 0.0)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.40 + 0.125))
    stage = bpy.context.active_object
    stage.name = 'Pavilion_Auction_Stage'
    stage.scale = (4.20, 3.20, 0.25)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    stage.data.materials.append(materials['Mat_Concrete_Plinth'])

    # High-visibility yellow safety edge strip around auction platform
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.652))
    edge = bpy.context.active_object
    edge.name = 'Pavilion_Auction_Stage_Safety_Strip'
    edge.scale = (4.25, 3.25, 0.01)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    edge.data.materials.append(materials['Mat_Sign_Gold'])

    # 2. Auctioneer Wooden Raised Desk (X = 0.0, Y = 0.8, top Z = 1.65m)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.85, 0.65 + 0.50))
    desk = bpy.context.active_object
    desk.name = 'Auctioneer_Desk'
    desk.scale = (1.80, 0.75, 1.00)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    desk.data.materials.append(materials['Mat_Wood_Timber'])

    # 3. Auctioneer Timber Bench Seat
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 1.30, 0.65 + 0.25))
    bench = bpy.context.active_object
    bench.name = 'Auctioneer_Bench'
    bench.scale = (1.60, 0.35, 0.50)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bench.data.materials.append(materials['Mat_Wood_Timber'])

    # 4. Daily Catch Rate Blackboard / Tally Slate (Easel mounted on platform corner)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.50, 0.85, 0.65 + 0.70))
    tally = bpy.context.active_object
    tally.name = 'Auction_Tally_Slate'
    tally.scale = (0.75, 0.08, 1.10)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    tally.data.materials.append(materials['Mat_Drain_Grate'])

def build_sorting_tables_and_scales(materials):
    """Constructs 4 stainless steel fish grading tables, hanging dial scales, and digital tare platform."""
    # 4 Heavy-Duty Marine Stainless-Steel Grading Tables
    # Tables are placed in the flanking work zones:
    # North Wing: Table 1 at (-4.2, -4.0), Table 2 at (4.2, -4.0)
    # South Wing: Table 3 at (-4.2, +4.0), Table 4 at (4.2, +4.0)
    table_locs = [
        (-4.2, -4.0, 'Table_North_West'),
        (4.2, -4.0,  'Table_North_East'),
        (-4.2, 4.0,  'Table_South_West'),
        (4.2, 4.0,   'Table_South_East')
    ]

    for tx, ty, tname in table_locs:
        # Stainless steel tabletop with raised perimeter lip (3.2m x 1.4m x 0.08m at Z = 1.25m)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(tx, ty, 0.40 + 0.85))
        top = bpy.context.active_object
        top.name = f'Pavilion_{tname}_Top'
        top.scale = (3.20, 1.40, 0.10)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        top.data.materials.append(materials['Mat_Sorting_Table'])

        # Drainage slope / collection funnel spout on table end
        bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.25, location=(tx - 1.50, ty, 0.40 + 0.72), vertices=8)
        spout = bpy.context.active_object
        spout.name = f'Pavilion_{tname}_DrainSpout'
        spout.data.materials.append(materials['Mat_Sorting_Table'])

        # 4 Sturdy Galvanized Steel Legs
        for lx in [-1.45, 1.45]:
            for ly in [-0.55, 0.55]:
                create_rod(
                    Vector((tx + lx, ty + ly, 0.40)),
                    Vector((tx + lx, ty + ly, 0.40 + 0.80)),
                    radius=0.045,
                    mat=materials['Mat_Steel_Truss'],
                    name=f'{tname}_Leg_{lx}_{ly}'
                )

        # Crushed ice mound with fresh fish catch on each table
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(tx, ty, 0.40 + 0.95))
        ice_bed = bpy.context.active_object
        ice_bed.name = f'{tname}_Iced_Catch_Bed'
        ice_bed.scale = (2.20, 0.80, 0.12)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        ice_bed.data.materials.append(materials['Mat_Crushed_Ice'])

        # Heavy circular teak fish butchering / gutting round block on table end
        bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=0.12, location=(tx + 1.10, ty, 0.40 + 0.96), vertices=12)
        block = bpy.context.active_object
        block.name = f'{tname}_Cutting_Block'
        block.data.materials.append(materials['Mat_Wood_Timber'])

    # 2 Overhead Dial Weighing Scales Suspended from Structural Gantries
    # Suspended over central passage at X = -2.2, Y = 0.0 and X = 2.2, Y = 0.0
    for si, sx in enumerate([-2.2, 2.2]):
        # Overhead hanger rod from truss (Z = 4.15 down to 2.60)
        create_rod(Vector((sx, 0.0, 4.15)), Vector((sx, 0.0, 2.60)), radius=0.025, mat=materials['Mat_Steel_Truss'], name=f'Scale_Rod_{si}')
        # Circular dial scale body (diameter 0.55m, depth 0.12m)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.12, location=(sx, 0.0, 2.45), vertices=16)
        scale_body = bpy.context.active_object
        scale_body.name = f'Pavilion_Dial_Scale_{si}'
        scale_body.rotation_euler = (0, math.radians(90), 0)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        scale_body.data.materials.append(materials['Mat_Scale_Dial'])

        # Heavy steel suspension hook below dial
        create_rod(Vector((sx, 0.0, 2.30)), Vector((sx, 0.0, 1.85)), radius=0.02, mat=materials['Mat_Brass_Fitting'], name=f'Scale_Hook_{si}')

    # Digital Floor Tare Platform Scale (Low profile at X = -0.5, Y = -2.0, Z = 0.40 to 0.52)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.60, -2.0, 0.40 + 0.06))
    digi_scale = bpy.context.active_object
    digi_scale.name = 'Pavilion_Digital_Platform_Scale'
    digi_scale.scale = (0.90, 0.90, 0.12)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    digi_scale.data.materials.append(materials['Mat_Sorting_Table'])

    # Digital LED display pole
    create_rod(Vector((-0.60, -2.40, 0.40)), Vector((-0.60, -2.40, 1.35)), radius=0.025, mat=materials['Mat_Steel_Truss'], name='Digital_Scale_Pillar')
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.60, -2.40, 1.40))
    display_head = bpy.context.active_object
    display_head.name = 'Digital_Scale_Head'
    display_head.scale = (0.28, 0.15, 0.18)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    display_head.data.materials.append(materials['Mat_Drain_Grate'])

def build_fish_crates_and_ice_totes(materials):
    """Adds authentic Indian coastal fish crates in multi-color plastic stacks and bulk ice containers."""
    crate_colors = [
        materials['Mat_Fish_Crate_Blue'],
        materials['Mat_Fish_Crate_Orange'],
        materials['Mat_Fish_Crate_Yellow'],
        materials['Mat_Fish_Crate_Green']
    ]

    # Stacks of crates arranged along the perimeter columns and sorting tables
    crate_stacks = [
        # West unloading side (near wharf)
        (-6.2, -2.5, 3),
        (-6.2, 2.5, 4),
        (-6.2, -6.0, 3),
        # East loading side
        (6.2, -2.5, 4),
        (6.2, 2.5, 3),
        (6.2, 6.0, 2),
        # Beside sorting tables
        (-4.2, -6.0, 2),
        (4.2, -6.0, 3),
        (-4.2, 6.0, 3),
        (4.2, 6.0, 2)
    ]

    crate_w, crate_d, crate_h = 0.65, 0.45, 0.28

    for si, (sx, sy, count) in enumerate(crate_stacks):
        for ci in range(count):
            cz = 0.40 + ci * crate_h + crate_h * 0.5
            mat = crate_colors[(si + ci) % len(crate_colors)]
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, sy, cz))
            crate = bpy.context.active_object
            crate.name = f'Fish_Crate_Stack_{si}_{ci}'
            crate.scale = (crate_w, crate_d, crate_h)
            bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
            crate.data.materials.append(mat)

    # 4 Heavy-Duty Insulated Bulk Ice Totes (ISOTERM containers) with drainage valves
    # Dimensions: 1.10m x 0.90m x 0.85m
    ice_tote_locs = [
        (-6.4, -4.5, 'ISOTERM_Tote_NorthWest'),
        (-6.4, 4.5,  'ISOTERM_Tote_SouthWest'),
        (6.4, -4.5,  'ISOTERM_Tote_NorthEast'),
        (6.4, 4.5,   'ISOTERM_Tote_SouthEast')
    ]

    for tx, ty, tname in ice_tote_locs:
        # Main insulated white tub
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(tx, ty, 0.40 + 0.42))
        tote = bpy.context.active_object
        tote.name = f'Pavilion_{tname}'
        tote.scale = (1.10, 0.90, 0.84)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        tote.data.materials.append(materials['Mat_Ice_Tote'])

        # Cyan / blue insulated lid
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(tx, ty, 0.40 + 0.86))
        lid = bpy.context.active_object
        lid.name = f'Pavilion_{tname}_Lid'
        lid.scale = (1.14, 0.94, 0.08)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        lid.data.materials.append(materials['Mat_Fish_Crate_Blue'])

        # Brass drain valve on bottom corner
        bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.10, location=(tx + 0.56, ty, 0.40 + 0.12), vertices=8)
        valve = bpy.context.active_object
        valve.name = f'Pavilion_{tname}_Valve'
        valve.rotation_euler = (0, math.radians(90), 0)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        valve.data.materials.append(materials['Mat_Brass_Fitting'])

def build_washdown_and_utilities(materials):
    """Adds water washdown bib taps, coiled wash hoses, ceiling fans, and fluorescent vapor-tight lights."""
    # 1. Water Washdown Stations on 4 Perimeter Columns
    # Columns at (-7.4, -2.5), (-7.4, 2.5), (7.4, -2.5), (7.4, 2.5)
    for wx, wy in [(-7.15, -2.5), (-7.15, 2.5), (7.15, -2.5), (7.15, 2.5)]:
        # Vertical galvanized water riser pipe
        create_rod(Vector((wx, wy, 0.40)), Vector((wx, wy, 1.60)), radius=0.022, mat=materials['Mat_Steel_Truss'], name=f'Water_Pipe_{wx}_{wy}')
        # Brass bib tap
        bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.12, location=(wx, wy, 1.20), vertices=8)
        tap = bpy.context.active_object
        tap.name = f'Water_Bib_Tap_{wx}_{wy}'
        tap.data.materials.append(materials['Mat_Brass_Fitting'])

        # Coiled green reinforced rubber hose on wall bracket
        bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.05, location=(wx, wy, 0.85), major_segments=16, minor_segments=8)
        hose = bpy.context.active_object
        hose.name = f'Washdown_Hose_{wx}_{wy}'
        hose.rotation_euler = (0, math.radians(90), 0)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        hose.data.materials.append(materials['Mat_Hose_Rubber'])

    # 2. 4 Industrial Coastal 3-Blade Ceiling Fans (Suspended at Z = 3.80m)
    fan_locs = [
        (-3.8, -3.8), (3.8, -3.8),
        (-3.8, 3.8),  (3.8, 3.8)
    ]

    for fi, (fx, fy) in enumerate(fan_locs):
        # Downrod from roof purlin
        create_rod(Vector((fx, fy, 4.20)), Vector((fx, fy, 3.80)), radius=0.02, mat=materials['Mat_Steel_Truss'], name=f'Fan_Rod_{fi}')
        # Motor hub
        bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.12, location=(fx, fy, 3.75), vertices=12)
        motor = bpy.context.active_object
        motor.name = f'Fan_Motor_{fi}'
        motor.data.materials.append(materials['Mat_Steel_Truss'])

        # 3 Aerodynamic steel blades
        for bi in range(3):
            angle = bi * (2 * math.pi / 3)
            blade_x = fx + math.sin(angle) * 0.45
            blade_y = fy + math.cos(angle) * 0.45
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(blade_x, blade_y, 3.75))
            blade = bpy.context.active_object
            blade.name = f'Fan_{fi}_Blade_{bi}'
            blade.scale = (0.16, 0.70, 0.015)
            blade.rotation_euler = (0, 0, -angle)
            bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
            blade.data.materials.append(materials['Mat_Steel_Truss'])

    # 3. 6 Vapor-Tight Fluorescent LED Batten Fixtures (Suspended over sorting tables and auction aisle at Z = 3.65m)
    light_locs = [
        (-4.2, -4.0), (4.2, -4.0),
        (-4.2, 4.0),  (4.2, 4.0),
        (0.0, -2.5),  (0.0, 2.5)
    ]

    for li, (lx, ly) in enumerate(light_locs):
        # Fixture casing
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lx, ly, 3.65))
        lamp = bpy.context.active_object
        lamp.name = f'Pavilion_LED_Batten_{li}'
        lamp.scale = (1.50, 0.18, 0.10)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        lamp.data.materials.append(materials['Mat_Lamp_Emission'])

def build_colliders():
    """Generates simplified box colliders for game physics."""
    cols = []

    # 1. Main Walkable Foundation Floor Plinth
    # Local center: (0, 0, 0.20), size: (16.0, 16.0, 0.40)
    # Walkable top at Y = 0.40m matching wharf deck!
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.20))
    col_floor = bpy.context.active_object
    col_floor.name = 'Collider_Auction_Floor'
    col_floor.scale = (16.0, 16.0, 0.40)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_floor)

    # 2. Raised Central Auction Platform
    # Local center: (0, 0, 0.40 + 0.125), size: (4.20, 3.20, 0.25)
    # Walkable top at Y = 0.65m (0.25m step rise)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 0.525))
    col_stage = bpy.context.active_object
    col_stage.name = 'Collider_Auction_Stage'
    col_stage.scale = (4.20, 3.20, 0.25)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_stage)

    # 3. Auctioneer Desk & Bench Solid Obstacle
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 1.0, 0.65 + 0.50))
    col_desk = bpy.context.active_object
    col_desk.name = 'Collider_Auction_Desk'
    col_desk.scale = (1.80, 1.10, 1.00)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    cols.append(col_desk)

    # 4. 4 Solid Colliders for Sorting Tables (table + ice catch)
    table_locs = [
        (-4.2, -4.0, 'Table_NW'),
        (4.2, -4.0,  'Table_NE'),
        (-4.2, 4.0,  'Table_SW'),
        (4.2, 4.0,   'Table_SE')
    ]
    for tx, ty, tname in table_locs:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(tx, ty, 0.40 + 0.45))
        col_t = bpy.context.active_object
        col_t.name = f'Collider_Auction_{tname}'
        col_t.scale = (3.20, 1.40, 0.90)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        cols.append(col_t)

    # 5. Perimeter Structural Columns (10 solid columns)
    col_coords = [
        (-7.4, -7.4), (0.0, -7.4), (7.4, -7.4),
        (-7.4, 7.4),  (0.0, 7.4),  (7.4, 7.4),
        (-7.4, -2.5), (-7.4, 2.5),
        (7.4, -2.5),  (7.4, 2.5)
    ]
    for ci, (cx, cy) in enumerate(col_coords):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, 0.40 + 1.90))
        col_p = bpy.context.active_object
        col_p.name = f'Collider_Auction_Pillar_{ci}'
        col_p.scale = (0.55, 0.55, 3.80)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        cols.append(col_p)

    for c in cols:
        c.hide_render = True
        c.display_type = 'WIRE'

def setup_camera_and_lighting():
    """Sets up a beauty camera and sun lighting for preview rendering."""
    # Camera looking into the open pavilion from high 3/4 angle (West entrance)
    cam_data = bpy.data.cameras.new('Pavilion_Preview_Camera')
    cam_data.lens = 28.0
    cam_obj = bpy.data.objects.new('Pavilion_Preview_Camera', cam_data)
    cam_obj.location = (-15.0, -12.0, 8.5)
    bpy.context.collection.objects.link(cam_obj)

    # Aim camera at central auction stage
    target = Vector((0.0, 0.0, 1.5))
    cam_dir = target - cam_obj.location
    rot_quat = cam_dir.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()
    bpy.context.scene.camera = cam_obj

    # Key Sun Light
    light_data = bpy.data.lights.new('Pavilion_Sun_Light', type='SUN')
    light_data.energy = 4.5
    light_data.color = (1.0, 0.96, 0.88)
    light_obj = bpy.data.objects.new('Pavilion_Sun_Light', light_data)
    light_obj.location = (-18, -18, 22)
    light_obj.rotation_euler = (math.radians(48), math.radians(-32), math.radians(45))
    bpy.context.collection.objects.link(light_obj)

    # Soft Coastal Ambient Sky Light
    fill_data = bpy.data.lights.new('Pavilion_Fill_Light', type='SUN')
    fill_data.energy = 2.0
    fill_data.color = (0.75, 0.88, 1.0)
    fill_obj = bpy.data.objects.new('Pavilion_Fill_Light', fill_data)
    fill_obj.rotation_euler = (math.radians(35), math.radians(40), math.radians(-130))
    bpy.context.collection.objects.link(fill_obj)

def main():
    print("=== Building Fish Auction Pavilion (Asset 8) ===")
    clean_scene()

    # Define 19 High-Quality PBR Materials
    materials = {
        'Mat_Concrete_Plinth': create_pbr_material(
            'Mat_Concrete_Plinth',
            base_color=(0.42, 0.44, 0.46), # Moisture-resistant foundation concrete
            roughness=0.85,
            metallic=0.0
        ),
        'Mat_Market_Tile': create_pbr_material(
            'Mat_Market_Tile',
            base_color=(0.52, 0.58, 0.60), # Wet washable terrazzo fish market floor
            roughness=0.35,
            metallic=0.05,
            specular=0.70
        ),
        'Mat_Drain_Grate': create_pbr_material(
            'Mat_Drain_Grate',
            base_color=(0.28, 0.30, 0.32), # Cast-iron drainage trench grates
            roughness=0.55,
            metallic=0.85
        ),
        'Mat_Steel_Truss': create_pbr_material(
            'Mat_Steel_Truss',
            base_color=(0.16, 0.32, 0.42), # Marine teal/blue painted structural steel
            roughness=0.50,
            metallic=0.65
        ),
        'Mat_Corrugated_Roof': create_pbr_material(
            'Mat_Corrugated_Roof',
            base_color=(0.40, 0.45, 0.47), # Weathered industrial corrugated roofing
            roughness=0.65,
            metallic=0.50
        ),
        'Mat_Sorting_Table': create_pbr_material(
            'Mat_Sorting_Table',
            base_color=(0.75, 0.78, 0.80), # Marine grade 304 stainless steel tabletops
            roughness=0.25,
            metallic=0.90
        ),
        'Mat_Fish_Crate_Blue': create_pbr_material(
            'Mat_Fish_Crate_Blue',
            base_color=(0.08, 0.38, 0.82), # Royal blue plastic crate
            roughness=0.40,
            metallic=0.0
        ),
        'Mat_Fish_Crate_Orange': create_pbr_material(
            'Mat_Fish_Crate_Orange',
            base_color=(0.88, 0.40, 0.12), # Terracotta orange plastic crate
            roughness=0.40,
            metallic=0.0
        ),
        'Mat_Fish_Crate_Yellow': create_pbr_material(
            'Mat_Fish_Crate_Yellow',
            base_color=(0.92, 0.78, 0.10), # Canary yellow plastic crate
            roughness=0.40,
            metallic=0.0
        ),
        'Mat_Fish_Crate_Green': create_pbr_material(
            'Mat_Fish_Crate_Green',
            base_color=(0.12, 0.62, 0.32), # Emerald green plastic crate
            roughness=0.40,
            metallic=0.0
        ),
        'Mat_Ice_Tote': create_pbr_material(
            'Mat_Ice_Tote',
            base_color=(0.92, 0.94, 0.96), # Polyethylene bulk ice tub
            roughness=0.35,
            metallic=0.0
        ),
        'Mat_Crushed_Ice': create_pbr_material(
            'Mat_Crushed_Ice',
            base_color=(0.85, 0.95, 1.0), # Translucent crushed ice bed
            roughness=0.20,
            metallic=0.0,
            transmission=0.55
        ),
        'Mat_Signboard': create_pbr_material(
            'Mat_Signboard',
            base_color=(0.06, 0.16, 0.34), # Deep marine navy cooperative signboard
            roughness=0.45,
            metallic=0.10
        ),
        'Mat_Sign_Gold': create_pbr_material(
            'Mat_Sign_Gold',
            base_color=(0.95, 0.82, 0.18), # Warm gold Telugu/English lettering
            roughness=0.35,
            metallic=0.75
        ),
        'Mat_Brass_Fitting': create_pbr_material(
            'Mat_Brass_Fitting',
            base_color=(0.82, 0.65, 0.25), # Brass washdown taps and scale hooks
            roughness=0.30,
            metallic=0.90
        ),
        'Mat_Hose_Rubber': create_pbr_material(
            'Mat_Hose_Rubber',
            base_color=(0.18, 0.55, 0.22), # Industrial green rubber washdown hose
            roughness=0.75,
            metallic=0.0
        ),
        'Mat_Scale_Dial': create_pbr_material(
            'Mat_Scale_Dial',
            base_color=(0.95, 0.95, 0.95), # White dial face of weighing scale
            roughness=0.30,
            metallic=0.10
        ),
        'Mat_Wood_Timber': create_pbr_material(
            'Mat_Wood_Timber',
            base_color=(0.50, 0.38, 0.26), # Rough-sawn timber cutting blocks & desk
            roughness=0.85,
            metallic=0.0
        ),
        'Mat_Lamp_Emission': create_pbr_material(
            'Mat_Lamp_Emission',
            base_color=(1.0, 0.98, 0.90), # Vapor-tight LED fluorescent fixture
            roughness=0.20,
            metallic=0.0,
            emission=(1.0, 0.98, 0.90, 2.5)
        )
    }

    # 1. Foundation Plinth & Drainage
    build_plinth_and_drainage(materials)

    # 2. Columns, Superstructure, Trusses & Corrugated Gable Roof
    build_superstructure_and_roof(materials)

    # 3. Central Raised Auction Stage, Desk & Tally Board
    build_auction_platform_and_desks(materials)

    # 4. Sorting Tables, Scale Gantries & Tare Scale
    build_sorting_tables_and_scales(materials)

    # 5. Multi-color Fish Crates & Bulk Ice Totes
    build_fish_crates_and_ice_totes(materials)

    # 6. Water Washdown Stations, Taps, Ceiling Fans & Lighting
    build_washdown_and_utilities(materials)

    # 7. Simplified Colliders
    build_colliders()

    # 8. Beauty Camera & Lighting
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
    export_path = os.path.join(export_dir, 'building_fish_auction_pavilion_01.glb')

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
