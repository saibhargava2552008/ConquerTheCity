import bpy
import bmesh
import math
import os

print("=== STARTING ASSET 9: FISHERMEN'S COOPERATIVE BUILDING MODELING ===")

# 1. SCENE MANAGEMENT: Select or create Scene_Cooperative
if "Scene_Cooperative" in bpy.data.scenes:
    scene = bpy.data.scenes["Scene_Cooperative"]
else:
    scene = bpy.data.scenes.new("Scene_Cooperative")

bpy.context.window.scene = scene

# Clear only objects in Scene_Cooperative (preserving Asset 8 in default scene)
for obj in list(scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# Set render settings for preview
scene.render.engine = 'CYCLES' if hasattr(bpy.types, 'CyclesRenderSettings') else 'BLENDER_EEVEE'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

TEXTURE_DIR = os.path.abspath('public/models/textures')

# ---------------------------------------------------------------------------
# 2. HELPER FUNCTIONS: Material Creation
# ---------------------------------------------------------------------------
def make_mat(name, col, rough=0.6, metal=0.0, tex_name=None, emissive_col=None, emissive_strength=0.0):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = col
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal

    if emissive_col and emissive_strength > 0:
        bsdf.inputs['Emission Color'].default_value = emissive_col
        bsdf.inputs['Emission Strength'].default_value = emissive_strength

    if tex_name:
        tex_path = os.path.join(TEXTURE_DIR, tex_name)
        if os.path.exists(tex_path):
            img = bpy.data.images.get(tex_name)
            if not img:
                img = bpy.data.images.load(tex_path)
            tex_node = nodes.new('ShaderNodeTexImage')
            tex_node.image = img
            links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])

    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    return mat

# Materials Definition (19 PBR materials)
mat_plinth = make_mat('Mat_Coop_Plinth', (0.58, 0.59, 0.57, 1.0), rough=0.85)
mat_terrazzo = make_mat('Mat_Coop_Terrazzo', (0.72, 0.78, 0.75, 1.0), rough=0.35, tex_name='coop_terrazzo_floor.png')
mat_plaster = make_mat('Mat_Coop_Plaster', (0.92, 0.91, 0.88, 1.0), rough=0.82)
mat_seagreen = make_mat('Mat_Coop_SeaGreen', (0.18, 0.42, 0.40, 1.0), rough=0.55)
mat_marineblue = make_mat('Mat_Coop_MarineBlue', (0.12, 0.28, 0.48, 1.0), rough=0.45)
mat_tiles = make_mat('Mat_Coop_MangaloreTile', (0.68, 0.30, 0.18, 1.0), rough=0.75, tex_name='coop_mangalore_tiles.png')
mat_timber = make_mat('Mat_Coop_Timber', (0.38, 0.22, 0.12, 1.0), rough=0.65)
mat_signboard = make_mat('Mat_Coop_Signboard', (0.07, 0.18, 0.34, 1.0), rough=0.4, tex_name='coop_signboard.png', emissive_col=(0.07, 0.18, 0.34, 1.0), emissive_strength=0.35)
mat_noticeboard = make_mat('Mat_Coop_NoticeBoard', (0.16, 0.30, 0.22, 1.0), rough=0.7, tex_name='coop_notice_board.png')
mat_glass = make_mat('Mat_Coop_Glass', (0.85, 0.92, 0.95, 1.0), rough=0.15, metal=0.2)
mat_metal_alum = make_mat('Mat_Coop_MetalAlum', (0.65, 0.67, 0.70, 1.0), rough=0.35, metal=0.85)
mat_counter_wood = make_mat('Mat_Coop_CounterWood', (0.45, 0.26, 0.15, 1.0), rough=0.40)
mat_ledger = make_mat('Mat_Coop_Ledger', (0.62, 0.12, 0.10, 1.0), rough=0.55, tex_name='coop_ledger.png')
mat_plastic_blue = make_mat('Mat_Coop_PlasticBlue', (0.10, 0.35, 0.75, 1.0), rough=0.35)
mat_office_steel = make_mat('Mat_Coop_OfficeSteel', (0.35, 0.38, 0.35, 1.0), rough=0.45, metal=0.70)
mat_net = make_mat('Mat_Coop_FishingNet', (0.28, 0.52, 0.42, 1.0), rough=0.85)
mat_rope = make_mat('Mat_Coop_MarineRope', (0.65, 0.52, 0.32, 1.0), rough=0.90)
mat_lifejacket = make_mat('Mat_Coop_LifeJacket', (0.92, 0.32, 0.10, 1.0), rough=0.60)
mat_buoy = make_mat('Mat_Coop_Buoy', (0.95, 0.45, 0.15, 1.0), rough=0.40)

def add_box(name, loc, size, mat, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    return obj

def add_cylinder(name, loc, radius, depth, mat, rot=(0,0,0), vertices=16, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    return obj

# ---------------------------------------------------------------------------
# 3. ROOT GROUP & FOUNDATION PLINTH
# ---------------------------------------------------------------------------
root = bpy.data.objects.new("building_fishermen_cooperative_01", None)
scene.collection.objects.link(root)

# Foundation Plinth: 14m (X) x 13m (Z) x 0.40m (Y), top at Y = 0.40m
plinth = add_box("Coop_Foundation_Plinth", (0.0, 0.0, 0.20), (14.0, 13.0, 0.40), mat_plinth, root)

# Veranda Floor (X: -7.0 to -4.0, Z: -5.5 to 5.5, Y = 0.405)
veranda_floor = add_box("Coop_Veranda_Floor", (-5.5, 0.0, 0.405), (3.0, 11.0, 0.01), mat_terrazzo, root)

# Interior Hall Floor (X: -4.0 to 6.5, Z: -5.5 to 3.5, Y = 0.405)
interior_floor = add_box("Coop_Interior_Floor", (1.25, -1.0, 0.405), (10.5, 9.0, 0.01), mat_terrazzo, root)

# Net Storage Bay Concrete Pad (X: -2.0 to 6.5, Z: 3.5 to 6.0, Y = 0.405)
net_floor = add_box("Coop_Net_Bay_Floor", (2.25, 4.75, 0.405), (8.5, 2.5, 0.01), mat_plinth, root)

# Veranda Access Steps (West side, X = -7.0)
step_1 = add_box("Coop_Entrance_Step_1", (-7.35, 0.0, 0.10), (0.7, 6.0, 0.20), mat_plinth, root)
step_2 = add_box("Coop_Entrance_Step_2", (-7.05, 0.0, 0.25), (0.7, 6.4, 0.30), mat_plinth, root)

# ---------------------------------------------------------------------------
# 4. EXTERIOR WALLS & ARCHITECTURAL ENVELOPE
# ---------------------------------------------------------------------------
wall_h = 3.4
wall_y = 0.40 + wall_h / 2 # 2.10m
wall_thick = 0.30

# Rear East Wall (X = 6.5, Z: -5.5 to 3.5, H = 3.4m)
add_box("Coop_Wall_East", (6.5, -1.0, wall_y), (wall_thick, 9.0, wall_h), mat_plaster, root)
# Sea-green dado trim along base of East wall
add_box("Coop_Dado_East", (6.45, -1.0, 0.80), (wall_thick + 0.04, 9.02, 0.80), mat_seagreen, root)

# South Wall (Z = -5.5, X: -4.0 to 6.5, H = 3.4m)
add_box("Coop_Wall_South", (1.25, -5.5, wall_y), (10.5, wall_thick, wall_h), mat_plaster, root)
add_box("Coop_Dado_South", (1.25, -5.45, 0.80), (10.52, wall_thick + 0.04, 0.80), mat_seagreen, root)

# Interior Partition Wall between Office and Net Storage Bay (Z = 3.5, X: -2.0 to 6.5, H = 3.4m)
add_box("Coop_Wall_North_Interior", (2.25, 3.5, wall_y), (8.5, wall_thick, wall_h), mat_plaster, root)

# North Exterior Wall of Storage Bay (Z = 6.0, X: 2.0 to 6.5, H = 2.8m, semi-open)
add_box("Coop_Wall_Net_Bay_Back", (4.25, 6.0, 0.40 + 1.4), (4.5, wall_thick, 2.8), mat_plaster, root)

# Front West Wall (X = -4.0) with central 2.4m double entrance portal:
# South wing: Z: -5.5 to -1.2 (depth 4.3m)
add_box("Coop_Wall_West_South", (-4.0, -3.35, wall_y), (wall_thick, 4.3, wall_h), mat_plaster, root)
add_box("Coop_Dado_West_South", (-3.95, -3.35, 0.80), (wall_thick + 0.04, 4.32, 0.80), mat_seagreen, root)

# North wing: Z: 1.2 to 3.5 (depth 2.3m)
add_box("Coop_Wall_West_North", (-4.0, 2.35, wall_y), (wall_thick, 2.3, wall_h), mat_plaster, root)
add_box("Coop_Dado_West_North", (-3.95, 2.35, 0.80), (wall_thick + 0.04, 2.32, 0.80), mat_seagreen, root)

# Door Header Beam above entrance (Z: -1.2 to 1.2, Y: 2.9 to 3.8)
add_box("Coop_Door_Header", (-4.0, 0.0, 3.35), (wall_thick + 0.05, 2.5, 0.90), mat_seagreen, root)

# Front Double Doors (Open, angled back against interior walls)
door_left = add_box("Coop_Entrance_Door_Left", (-3.75, -1.5, 1.65), (0.06, 1.0, 2.4), mat_timber, root)
door_left.rotation_euler.z = -0.55
door_right = add_box("Coop_Entrance_Door_Right", (-3.75, 1.5, 1.65), (0.06, 1.0, 2.4), mat_timber, root)
door_right.rotation_euler.z = 0.55

# ---------------------------------------------------------------------------
# 5. FRONT VERANDA COLUMNS, ARCHITRAVE & SIGNBOARD
# ---------------------------------------------------------------------------
# 4 Square Concrete Veranda Pillars at X = -6.8:
# Z coordinates: -5.0, -1.8, 1.8, 5.0
col_z = [-5.0, -1.8, 1.8, 5.0]
for i, cz in enumerate(col_z):
    # Pedestal base
    add_box(f"Coop_Pillar_Base_{i}", (-6.8, cz, 0.65), (0.46, 0.46, 0.50), mat_seagreen, root)
    # Column shaft
    add_box(f"Coop_Pillar_Shaft_{i}", (-6.8, cz, 2.05), (0.36, 0.36, 2.30), mat_plaster, root)
    # Capital
    add_box(f"Coop_Pillar_Capital_{i}", (-6.8, cz, 3.25), (0.48, 0.48, 0.20), mat_seagreen, root)

# Veranda Eaves Beam / Architrave (X = -6.8, Z: -5.5 to 5.5, Y = 3.45)
add_box("Coop_Veranda_Architrave", (-6.8, 0.0, 3.45), (0.38, 11.4, 0.30), mat_seagreen, root)

# Prominent Front Bilingual Signboard (mounted on West veranda architrave)
# 8.2m wide x 1.0m high x 0.10m thick, center at X = -7.05, Y = 3.90
signboard = add_box("Coop_Bilingual_Signboard", (-7.05, 0.0, 3.90), (0.10, 8.2, 1.0), mat_signboard, root)
# Teak / Brass perimeter frame
add_box("Coop_Signboard_Frame_Top", (-7.05, 0.0, 4.43), (0.14, 8.35, 0.08), mat_timber, root)
add_box("Coop_Signboard_Frame_Bottom", (-7.05, 0.0, 3.37), (0.14, 8.35, 0.08), mat_timber, root)
add_box("Coop_Signboard_Frame_Left", (-7.05, -4.13, 3.90), (0.14, 0.08, 1.06), mat_timber, root)
add_box("Coop_Signboard_Frame_Right", (-7.05, 4.13, 3.90), (0.14, 0.08, 1.06), mat_timber, root)

# ---------------------------------------------------------------------------
# 6. MANGALORE-TILE PITCHED ROOF
# ---------------------------------------------------------------------------
# Main Hip & Gable Roof covering main building (X: -4.3 to 7.0, Z: -6.0 to 4.0)
# Ridge line at X = 1.35, Y = 5.25m
roof_w = 11.5 # X span
roof_d = 10.5 # Z span

# West roof pitch (sloping from ridge down to X = -4.3 at Y = 3.8)
mesh_w = bpy.data.meshes.new("Coop_Roof_West_Mesh")
obj_w = bpy.data.objects.new("Coop_Roof_West", mesh_w)
scene.collection.objects.link(obj_w)
obj_w.parent = root
bm_w = bmesh.new()
# 4 vertices
v1 = bm_w.verts.new((-4.4, -5.8, 3.75))
v2 = bm_w.verts.new((1.35, -5.8, 5.25))
v3 = bm_w.verts.new((1.35, 3.8, 5.25))
v4 = bm_w.verts.new((-4.4, 3.8, 3.75))
bm_w.faces.new([v1, v2, v3, v4])
bm_w.to_mesh(mesh_w)
bm_w.free()
obj_w.data.materials.append(mat_tiles)

# East roof pitch (sloping from ridge down to X = 6.8 at Y = 3.75)
mesh_e = bpy.data.meshes.new("Coop_Roof_East_Mesh")
obj_e = bpy.data.objects.new("Coop_Roof_East", mesh_e)
scene.collection.objects.link(obj_e)
obj_e.parent = root
bm_e = bmesh.new()
v1 = bm_e.verts.new((1.35, -5.8, 5.25))
v2 = bm_e.verts.new((6.9, -5.8, 3.75))
v3 = bm_e.verts.new((6.9, 3.8, 3.75))
v4 = bm_e.verts.new((1.35, 3.8, 5.25))
bm_e.faces.new([v1, v2, v3, v4])
bm_e.to_mesh(mesh_e)
bm_e.free()
obj_e.data.materials.append(mat_tiles)

# Gable Triangle Walls (South at Z = -5.5, North at Z = 3.5)
mesh_gs = bpy.data.meshes.new("Coop_Gable_South_Mesh")
obj_gs = bpy.data.objects.new("Coop_Gable_South", mesh_gs)
scene.collection.objects.link(obj_gs)
obj_gs.parent = root
bm_gs = bmesh.new()
vg1 = bm_gs.verts.new((-4.0, -5.5, 3.8))
vg2 = bm_gs.verts.new((6.5, -5.5, 3.8))
vg3 = bm_gs.verts.new((1.35, -5.5, 5.20))
bm_gs.faces.new([vg1, vg2, vg3])
bm_gs.to_mesh(mesh_gs)
bm_gs.free()
obj_gs.data.materials.append(mat_plaster)

# Ridge Cap Tiles along apex (X = 1.35, Z: -5.9 to 3.9, Y = 5.30)
add_box("Coop_Roof_Ridge_Cap", (1.35, -1.0, 5.32), (0.35, 10.0, 0.12), mat_tiles, root)

# Veranda Lean-To Pitch (sloping from West wall X = -4.0, Y = 3.8 down to architrave X = -7.2, Y = 3.45)
mesh_v = bpy.data.meshes.new("Coop_Veranda_Roof_Mesh")
obj_v = bpy.data.objects.new("Coop_Veranda_Roof", mesh_v)
scene.collection.objects.link(obj_v)
obj_v.parent = root
bm_v = bmesh.new()
v1 = bm_v.verts.new((-7.3, -5.8, 3.45))
v2 = bm_v.verts.new((-4.0, -5.8, 3.85))
v3 = bm_v.verts.new((-4.0, 5.8, 3.85))
v4 = bm_v.verts.new((-7.3, 5.8, 3.45))
bm_v.faces.new([v1, v2, v3, v4])
bm_v.to_mesh(mesh_v)
bm_v.free()
obj_v.data.materials.append(mat_tiles)

# Net Storage Bay Lean-To Roof (sloping from Z = 3.5, Y = 3.8 down to Z = 6.4, Y = 3.0)
mesh_nb = bpy.data.meshes.new("Coop_Net_Bay_Roof_Mesh")
obj_nb = bpy.data.objects.new("Coop_Net_Bay_Roof", mesh_nb)
scene.collection.objects.link(obj_nb)
obj_nb.parent = root
bm_nb = bmesh.new()
v1 = bm_nb.verts.new((-2.4, 3.5, 3.85))
v2 = bm_nb.verts.new((6.8, 3.5, 3.85))
v3 = bm_nb.verts.new((6.8, 6.4, 3.05))
v4 = bm_nb.verts.new((-2.4, 6.4, 3.05))
bm_nb.faces.new([v1, v2, v3, v4])
bm_nb.to_mesh(mesh_nb)
bm_nb.free()
obj_nb.data.materials.append(mat_tiles)

# ---------------------------------------------------------------------------
# 7. ALUMINIUM WINDOWS, VENTILATORS & WALL DETAILS
# ---------------------------------------------------------------------------
# South Facade Windows (2 large 3-panel casement windows at X = -1.5 and X = 3.5, Z = -5.5)
for wx in [-1.5, 3.5]:
    # Window Frame (Marine Blue)
    add_box(f"Coop_Window_Frame_{wx}", (wx, -5.5, 2.10), (2.0, 0.35, 1.4), mat_marineblue, root)
    # Glass Panes
    add_box(f"Coop_Window_Glass_{wx}", (wx, -5.5, 2.10), (1.8, 0.05, 1.2), mat_glass, root)
    # Security Bars (Aluminium)
    for bx in [-0.6, -0.2, 0.2, 0.6]:
        add_cylinder(f"Coop_Window_Bar_{wx}_{bx}", (wx + bx, -5.5, 2.10), 0.015, 1.2, mat_metal_alum, parent=root)
    # Concrete Sunshade / Chajja
    add_box(f"Coop_Window_Chajja_{wx}", (wx, -5.85, 2.90), (2.3, 0.60, 0.10), mat_plaster, root)

# West Facade Front Windows (flanking main entrance)
for wz in [-3.2, 2.2]:
    add_box(f"Coop_Front_Win_Frame_{wz}", (-4.0, wz, 2.10), (0.35, 1.6, 1.4), mat_marineblue, root)
    add_box(f"Coop_Front_Win_Glass_{wz}", (-4.0, wz, 2.10), (0.05, 1.4, 1.2), mat_glass, root)

# ---------------------------------------------------------------------------
# 8. INTERIOR FUNCTIONAL STAGING & CIVIC PROPS
# ---------------------------------------------------------------------------
# A. L-Shaped Reception & Member Registration Counter
# Main counter section: X = -1.5 to 1.5, Z = -1.8, H = 1.05m
add_box("Coop_Counter_Main", (0.0, -1.8, 0.40 + 0.525), (3.0, 0.70, 1.05), mat_counter_wood, root)
# Counter top lip (teak)
add_box("Coop_Counter_Top", (0.0, -1.8, 0.40 + 1.06), (3.15, 0.80, 0.06), mat_timber, root)
# Glass teller screen with transaction cutout
add_box("Coop_Teller_Glass", (0.0, -1.8, 0.40 + 1.45), (2.8, 0.04, 0.70), mat_glass, root)
# Return counter wing: X = 1.2, Z = -1.8 to 0.5
add_box("Coop_Counter_Return", (1.2, -0.65, 0.40 + 0.525), (0.65, 1.8, 1.05), mat_counter_wood, root)
add_box("Coop_Counter_Return_Top", (1.2, -0.65, 0.40 + 1.06), (0.75, 1.85, 0.06), mat_timber, root)

# Traditional Khata / Ledger Books on Counter
ledger1 = add_box("Coop_Ledger_1", (-0.6, -1.8, 0.40 + 1.11), (0.35, 0.45, 0.05), mat_ledger, root)
ledger1.rotation_euler.z = 0.15
ledger2 = add_box("Coop_Ledger_2", (-0.1, -1.8, 0.40 + 1.11), (0.30, 0.40, 0.04), mat_ledger, root)
ledger2.rotation_euler.z = -0.10

# Receipt Tray & Desk Bell
add_box("Coop_Receipt_Tray", (0.5, -1.8, 0.40 + 1.11), (0.25, 0.35, 0.04), mat_timber, root)
add_cylinder("Coop_Desk_Bell", (0.85, -1.8, 0.40 + 1.12), 0.05, 0.06, mat_metal_alum, parent=root)

# B. Member Registration Desk & Chairs (Inside office)
add_box("Coop_Office_Desk", (3.8, -1.5, 0.40 + 0.38), (1.6, 0.90, 0.76), mat_counter_wood, root)
add_box("Coop_Office_Chair_Clerk", (4.8, -1.5, 0.40 + 0.45), (0.55, 0.55, 0.90), mat_office_steel, root)

# Visiting Fishermen Blue Polypropylene Chairs (4 chairs along South wall)
for i, cx in enumerate([-3.0, -2.0, -1.0, 0.0]):
    # Seat
    add_box(f"Coop_Chair_Seat_{i}", (cx, -4.8, 0.40 + 0.45), (0.48, 0.48, 0.06), mat_plastic_blue, root)
    # Backrest
    add_box(f"Coop_Chair_Back_{i}", (cx, -5.02, 0.40 + 0.72), (0.46, 0.06, 0.50), mat_plastic_blue, root)
    # Legs (steel)
    for lx in [-0.20, 0.20]:
        for lz in [-0.20, 0.20]:
            add_cylinder(f"Coop_Chair_Leg_{i}_{lx}_{lz}", (cx + lx, -4.8 + lz, 0.40 + 0.22), 0.015, 0.44, mat_metal_alum, parent=root)

# C. Wall-Mounted Cooperative Notice Board
notice_board = add_box("Coop_Notice_Board", (1.5, -5.32, 2.20), (2.4, 0.06, 1.4), mat_noticeboard, root)
# Notice board frame
add_box("Coop_Notice_Frame_Top", (1.5, -5.32, 2.92), (2.45, 0.08, 0.05), mat_timber, root)
add_box("Coop_Notice_Frame_Bottom", (1.5, -5.32, 1.48), (2.45, 0.08, 0.05), mat_timber, root)

# D. Wall Clock & Oscillating Wall Fans
add_cylinder("Coop_Wall_Clock", (-1.5, -5.32, 2.90), 0.22, 0.06, mat_metal_alum, rot=(math.pi/2, 0, 0), parent=root)
for fx in [-2.5, 3.8]:
    add_cylinder(f"Coop_Wall_Fan_{fx}", (fx, -5.30, 2.70), 0.28, 0.08, mat_plastic_blue, rot=(math.pi/2, 0, 0), parent=root)

# E. Storage & Document Cabinets (East wall)
# 4-Drawer Steel Filing Cabinet
add_box("Coop_Filing_Cabinet", (6.15, -4.2, 0.40 + 0.70), (0.60, 0.90, 1.40), mat_office_steel, root)
# Wooden Document Shelving Unit with registry files
add_box("Coop_Doc_Shelf", (6.15, -2.0, 0.40 + 1.0), (0.45, 2.2, 2.0), mat_timber, root)
# Shelves content (box file binders)
for row, sy in enumerate([0.7, 1.2, 1.7]):
    add_box(f"Coop_File_Row_{row}", (6.10, -2.0, 0.40 + sy), (0.35, 2.0, 0.28), mat_office_steel, root)

# F. Fish Weight Inspection Scale & Table (West hall, offset from doorway)
add_box("Coop_Scale_Table", (-3.2, 1.8, 0.40 + 0.38), (1.0, 1.2, 0.76), mat_timber, root)
add_box("Coop_Digital_Scale_Base", (-3.2, 1.8, 0.40 + 0.80), (0.45, 0.55, 0.08), mat_office_steel, root)
add_box("Coop_Digital_Scale_Pan", (-3.2, 1.8, 0.40 + 0.85), (0.50, 0.60, 0.02), mat_metal_alum, root)
add_cylinder("Coop_Digital_Scale_Column", (-3.0, 2.02, 0.40 + 1.10), 0.02, 0.45, mat_metal_alum, parent=root)
add_box("Coop_Digital_Scale_Display", (-3.0, 2.02, 0.40 + 1.35), (0.12, 0.18, 0.10), mat_plastic_blue, root)

# ---------------------------------------------------------------------------
# 9. NORTH COVERED NET REPAIR & MARINE GEAR STORAGE BAY
# ---------------------------------------------------------------------------
# Storage Bay Timber Corner Posts
for px in [-2.0, 6.0]:
    add_box(f"Coop_Storage_Post_{px}", (px, 6.0, 0.40 + 1.35), (0.22, 0.22, 2.70), mat_timber, root)

# A. Stacked Fishing Nets on Wooden Pallets
add_box("Coop_Net_Pallet_1", (0.5, 4.8, 0.40 + 0.08), (1.4, 1.8, 0.16), mat_timber, root)
# Stacked green & tan folded nylon fishing nets
add_box("Coop_Nylon_Net_Stack_1", (0.5, 4.8, 0.40 + 0.45), (1.25, 1.65, 0.60), mat_net, root)

add_box("Coop_Net_Pallet_2", (3.2, 4.8, 0.40 + 0.08), (1.4, 1.8, 0.16), mat_timber, root)
add_box("Coop_Nylon_Net_Stack_2", (3.2, 4.8, 0.40 + 0.40), (1.25, 1.65, 0.50), mat_net, root)

# B. Coiled Heavy Marine Ropes (3 rope coils)
add_cylinder("Coop_Rope_Coil_1", (-1.0, 4.2, 0.40 + 0.18), 0.45, 0.36, mat_rope, parent=root)
add_cylinder("Coop_Rope_Coil_2", (-1.0, 5.2, 0.40 + 0.22), 0.50, 0.44, mat_rope, parent=root)
add_cylinder("Coop_Rope_Coil_3", (5.2, 4.5, 0.40 + 0.20), 0.42, 0.40, mat_rope, parent=root)

# C. Life Jackets Hanging on Wall Hooks (North interior wall at Z = 3.6)
for i, lx in enumerate([0.2, 1.0, 1.8, 2.6]):
    # Life jacket body
    add_box(f"Coop_Life_Jacket_{i}", (lx, 3.68, 2.10), (0.42, 0.12, 0.65), mat_lifejacket, root)
    # Reflective white stripes
    add_box(f"Coop_LJ_Stripe_Top_{i}", (lx, 3.75, 2.25), (0.44, 0.02, 0.06), mat_glass, root)
    add_box(f"Coop_LJ_Stripe_Bot_{i}", (lx, 3.75, 1.95), (0.44, 0.02, 0.06), mat_glass, root)

# D. Marine Mooring Buoys & Marker Floats
# Cylindrical buoy
add_cylinder("Coop_Marker_Buoy_1", (4.8, 5.3, 0.40 + 0.35), 0.20, 0.70, mat_buoy, rot=(0, 0, 0.3), parent=root)
# Spherical buoy
bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.25, location=(4.2, 5.4, 0.40 + 0.25))
buoy_sphere = bpy.context.active_object
buoy_sphere.name = "Coop_Marker_Buoy_2"
buoy_sphere.data.materials.append(mat_buoy)
buoy_sphere.parent = root

# E. Exterior Washdown Bib Tap & Drainage Basin
add_box("Coop_Wash_Basin", (-2.2, 3.8, 0.40 + 0.25), (0.60, 0.60, 0.50), mat_plinth, root)
add_cylinder("Coop_Wash_Tap_Pipe", (-2.2, 3.60, 0.40 + 0.75), 0.02, 0.50, mat_metal_alum, parent=root)
add_cylinder("Coop_Wash_Tap_Spout", (-2.2, 3.70, 0.40 + 0.95), 0.015, 0.15, mat_metal_alum, rot=(math.pi/2, 0, 0), parent=root)

# ---------------------------------------------------------------------------
# 10. SIMPLIFIED COLLISION GEOMETRY (Collider_*)
# ---------------------------------------------------------------------------
colliders = []

def make_collider(name, loc, size):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    col = bpy.context.active_object
    col.name = name
    col.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    # Hide from renders
    col.hide_render = True
    col.display_type = 'WIRE'
    col.parent = root
    colliders.append(col)
    return col

# 1. Walkable Foundation Plinth (Height 0.40m, top at Y = 0.40m)
make_collider("Collider_Coop_Plinth", (0.0, 0.0, 0.20), (14.0, 13.0, 0.40))

# 2. Main Building Perimeter Solid Walls
make_collider("Collider_Coop_Wall_East", (6.5, -1.0, wall_y), (0.35, 9.0, wall_h))
make_collider("Collider_Coop_Wall_South", (1.25, -5.5, wall_y), (10.5, 0.35, wall_h))
make_collider("Collider_Coop_Wall_North_Div", (2.25, 3.5, wall_y), (8.5, 0.35, wall_h))
make_collider("Collider_Coop_Wall_West_South", (-4.0, -3.35, wall_y), (0.35, 4.3, wall_h))
make_collider("Collider_Coop_Wall_West_North", (-4.0, 2.35, wall_y), (0.35, 2.3, wall_h))

# 3. Veranda Pillars
for i, cz in enumerate(col_z):
    make_collider(f"Collider_Coop_Pillar_{i}", (-6.8, cz, 1.8), (0.50, 0.50, 2.80))

# 4. Interior Counters and Furniture
make_collider("Collider_Coop_Reception_Counter", (0.0, -1.8, 0.40 + 0.60), (3.2, 0.85, 1.20))
make_collider("Collider_Coop_Counter_Return", (1.2, -0.65, 0.40 + 0.60), (0.75, 1.8, 1.20))
make_collider("Collider_Coop_Doc_Shelves", (6.15, -2.0, 0.40 + 1.0), (0.50, 2.2, 2.0))
make_collider("Collider_Coop_Filing_Cabinet", (6.15, -4.2, 0.40 + 0.70), (0.65, 0.95, 1.40))
make_collider("Collider_Coop_Inspection_Table", (-3.2, 1.8, 0.40 + 0.50), (1.05, 1.25, 1.00))

# 5. Net Bay Storage Pallets
make_collider("Collider_Coop_Net_Pallet_1", (0.5, 4.8, 0.40 + 0.40), (1.5, 1.9, 0.80))
make_collider("Collider_Coop_Net_Pallet_2", (3.2, 4.8, 0.40 + 0.40), (1.5, 1.9, 0.80))

print(f"Total Colliders Generated: {len(colliders)}")

# ---------------------------------------------------------------------------
# 11. SCENE STATS & OPTIMIZATION
# ---------------------------------------------------------------------------
bpy.context.view_layer.update()

total_tris = 0
visual_objs = [o for o in scene.objects if o.type == 'MESH' and not o.name.startswith("Collider_")]
for o in visual_objs:
    total_tris += sum(len(p.vertices) - 2 for p in o.data.polygons)

print(f"Total Visual Meshes: {len(visual_objs)}")
print(f"Total Visual Triangles: {total_tris}")
print(f"Total Materials: {len(bpy.data.materials)}")

# ---------------------------------------------------------------------------
# 12. GLB EXPORT
# ---------------------------------------------------------------------------
export_path = os.path.abspath('public/models/building_fishermen_cooperative_01.glb')
print(f"Exporting GLB to: {export_path} ...")

# Select root and all its children for export
bpy.ops.object.select_all(action='DESELECT')
def select_hierarchy(obj):
    obj.select_set(True)
    for c in obj.children:
        select_hierarchy(c)

select_hierarchy(root)
bpy.context.view_layer.objects.active = root

bpy.ops.export_scene.gltf(
    filepath=export_path,
    use_selection=True,
    use_active_scene=True,
    export_format='GLB',
    export_apply=True,
    export_yup=True
)

file_size_kb = os.path.getsize(export_path) / 1024
print(f"GLB Export Succeeded! File size: {file_size_kb:.2f} KB")

# ---------------------------------------------------------------------------
# 13. PREVIEW CAMERA & LIGHTING FOR RENDER
# ---------------------------------------------------------------------------
cam_data = bpy.data.cameras.new("Coop_Preview_Camera")
cam_obj = bpy.data.objects.new("Coop_Preview_Camera", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Position camera for high 3/4 architectural view showing West veranda and North bay
cam_obj.location = (-15.5, -9.5, 8.8)
cam_obj.rotation_euler = (math.radians(65), 0, math.radians(-58))

# Sun Light
light_data = bpy.data.lights.new(name="Coop_Sun", type='SUN')
light_data.energy = 3.5
light_obj = bpy.data.objects.new(name="Coop_Sun", object_data=light_data)
scene.collection.objects.link(light_obj)
light_obj.rotation_euler = (math.radians(48), math.radians(24), math.radians(-40))

# Ambient Fill Light
fill_data = bpy.data.lights.new(name="Coop_Fill", type='SUN')
fill_data.energy = 1.2
fill_obj = bpy.data.objects.new(name="Coop_Fill", object_data=fill_data)
scene.collection.objects.link(fill_obj)
fill_obj.rotation_euler = (math.radians(-30), math.radians(15), math.radians(140))

# Render studio preview
preview_path = os.path.abspath('public/models/blender_fishermen_cooperative_preview.png')
scene.render.filepath = preview_path
print(f"Rendering preview image to: {preview_path} ...")
bpy.ops.render.render(write_still=True)
print(f"Preview Render Saved: {preview_path}")

print("=== ASSET 9: FISHERMEN'S COOPERATIVE BUILDING COMPLETE! ===")
