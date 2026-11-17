import bpy
import bmesh
import math
import os
from mathutils import Vector, Matrix, Euler

# ==============================================================================
# CONQUER THE CITY — REALISTIC 3D WORLD ASSET GENERATOR (BLENDER 5.3)
# Produces high-quality, semi-realistic, GTA V-inspired Indian coastal assets:
# 1. building_coastal_arcade.glb  (2-Storey Commercial Arcade with Shops & Balconies)
# 2. building_heritage_villa.glb   (Goan/Konkan Colonial Heritage Residence)
# 3. landmark_seaview_lighthouse.glb (Stone Masonry Landmark Lighthouse)
# 4. tree_coconut_palm.glb         (Detailed Organic Curved Coconut Palm Tree)
# 5. prop_auto_rickshaw.glb        (Iconic Indian Bajaj Auto-Rickshaw / Tuk-Tuk)
# 6. prop_coastal_streetlamp.glb   (Cast-Iron Victorian Marine Streetlight)
# 7. prop_promenade_bench.glb      (Teak Wood & Cast-Iron Promenade Bench)
# 8. prop_utility_pole.glb         (Concrete Utility Pole with Transformer & Cables)
# ==============================================================================

OUT_DIR = os.path.join(os.getcwd(), "public", "models")
os.makedirs(OUT_DIR, exist_ok=True)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    # Ensure a collection exists
    if not bpy.data.collections:
        col = bpy.data.collections.new("Collection")
        bpy.context.scene.collection.children.link(col)

def create_pbr_material(name, base_color, roughness=0.7, metallic=0.0, emission_color=None, emission_strength=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        # Blender 4.x / 5.x Principled BSDF input handling
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = (*base_color, 1.0) if len(base_color) == 3 else base_color
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
        if emission_color and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*emission_color, 1.0) if len(emission_color) == 3 else emission_color
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat

def create_cube(name, size, location, material=None):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    # Scale to desired dimensions
    bm.transform(Matrix.Diagonal((*size, 1.0)))
    bm.to_mesh(mesh)
    bm.free()
    
    obj.location = location
    if material:
        obj.data.materials.append(material)
    return obj

def create_cylinder(name, radius, depth, location, rotation=(0,0,0), segments=16, material=None):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=segments,
        radius1=radius,
        radius2=radius,
        depth=depth
    )
    # Align cylinder axis along Y (Three.js vertical axis)
    bm.transform(Euler((math.pi/2, 0, 0)).to_matrix().to_4x4())
    bm.to_mesh(mesh)
    bm.free()
    
    obj.location = location
    obj.rotation_euler = rotation
    if material:
        obj.data.materials.append(material)
    return obj

def export_glb(filepath):
    # Select all objects
    bpy.ops.object.select_all(action='SELECT')
    # Rotate by +90 degrees around X to map Three.js coordinates (Y-up) to Blender coordinates (Z-up)
    bpy.ops.transform.rotate(value=math.radians(90), orient_axis='X')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials='EXPORT',
    )
    print(f"  [SUCCESS] Exported GLB: {filepath} ({os.path.getsize(filepath):,} bytes)")

# ==============================================================================
# 1. COMMERCIAL COASTAL ARCADE BUILDING
# ==============================================================================
def generate_coastal_arcade():
    print("\n--- Generating building_coastal_arcade.glb ---")
    reset_scene()
    
    # Materials
    mat_stucco = create_pbr_material("Stucco_Ochre", (0.92, 0.82, 0.62), roughness=0.85)
    mat_stone_base = create_pbr_material("Granite_Plinth", (0.35, 0.35, 0.38), roughness=0.75)
    mat_terracotta = create_pbr_material("Terracotta_Tiles", (0.76, 0.28, 0.15), roughness=0.65)
    mat_wood_dark = create_pbr_material("Dark_Teak_Wood", (0.24, 0.14, 0.08), roughness=0.55)
    mat_shutter_metal = create_pbr_material("Galvanized_Shutter", (0.65, 0.68, 0.72), roughness=0.45, metallic=0.75)
    mat_awning_stripe1 = create_pbr_material("Awning_Red", (0.82, 0.18, 0.15), roughness=0.8)
    mat_awning_stripe2 = create_pbr_material("Awning_Green", (0.12, 0.48, 0.32), roughness=0.8)
    mat_signboard1 = create_pbr_material("Signboard_Malabar", (0.15, 0.25, 0.45), roughness=0.5)
    mat_signboard2 = create_pbr_material("Signboard_Chai", (0.68, 0.42, 0.15), roughness=0.5)
    mat_wrought_iron = create_pbr_material("Wrought_Iron", (0.12, 0.12, 0.14), roughness=0.4, metallic=0.85)
    mat_glass = create_pbr_material("Window_Glass", (0.18, 0.28, 0.38), roughness=0.1, metallic=0.9)
    mat_ac_unit = create_pbr_material("AC_Unit_Plastic", (0.88, 0.88, 0.86), roughness=0.4)
    
    W = 12.0 # Width
    D = 10.0 # Depth
    H_G = 4.2 # Ground floor height
    H_1 = 3.8 # First floor height
    
    # 1. Raised Granite Plinth
    create_cube("Plinth", (W + 0.8, 0.45, D + 0.8), (0, 0.225, 0), mat_stone_base)
    # Front entrance steps
    create_cube("Front_Step_1", (8.0, 0.2, 1.2), (0, 0.1, D/2 + 0.6), mat_stone_base)
    create_cube("Front_Step_2", (7.0, 0.2, 0.6), (0, 0.3, D/2 + 0.3), mat_stone_base)
    
    # 2. Ground Floor Main Structure
    create_cube("GF_Body", (W, H_G, D), (0, 0.45 + H_G/2, 0), mat_stucco)
    
    # 3. Ground Floor Shop Bays & Recesses
    # Left Shop: Malabar Trading Co.
    create_cube("Left_Shop_Frame", (4.8, 3.2, 0.4), (-3.2, 0.45 + 1.6, D/2 + 0.05), mat_wood_dark)
    create_cube("Left_Roll_Shutter", (4.4, 2.8, 0.1), (-3.2, 0.45 + 1.4, D/2 + 0.15), mat_shutter_metal)
    # Right Shop: Seaview Chai & Bakery
    create_cube("Right_Shop_Frame", (4.8, 3.2, 0.4), (3.2, 0.45 + 1.6, D/2 + 0.05), mat_wood_dark)
    create_cube("Right_Roll_Shutter", (4.4, 2.8, 0.1), (3.2, 0.45 + 1.4, D/2 + 0.15), mat_shutter_metal)
    
    # 4. Signboards above shops
    create_cube("Signboard_Left", (4.6, 0.65, 0.15), (-3.2, 0.45 + 3.4, D/2 + 0.2), mat_signboard1)
    create_cube("Signboard_Right", (4.6, 0.65, 0.15), (3.2, 0.45 + 3.4, D/2 + 0.2), mat_signboard2)
    
    # 5. Fabric Overhanging Awnings
    for x_off, mat_awn in [(-3.2, mat_awning_stripe1), (3.2, mat_awning_stripe2)]:
        awn = create_cube("Awning", (4.8, 0.15, 1.6), (x_off, 0.45 + 3.1, D/2 + 0.8), mat_awn)
        awn.rotation_euler = (0.22, 0, 0)
        # Drop scalloped valance
        create_cube("Awning_Valance", (4.8, 0.35, 0.06), (x_off, 0.45 + 2.75, D/2 + 1.55), mat_awn)
    
    # 6. Molded Horizontal String Cornice (separating floors)
    create_cube("Floor_Cornice", (W + 0.6, 0.35, D + 0.6), (0, 0.45 + H_G + 0.175, 0), mat_stone_base)
    
    # 7. First Floor Main Structure
    create_cube("FF_Body", (W, H_1, D), (0, 0.45 + H_G + 0.35 + H_1/2, 0), mat_stucco)
    
    # 8. First Floor Cantilevered Balcony
    balcony_y = 0.45 + H_G + 0.35
    create_cube("Balcony_Slab", (W - 1.2, 0.25, 1.8), (0, balcony_y + 0.125, D/2 + 0.9), mat_stone_base)
    # Balcony support corbel brackets
    for bx in [-4.5, -2.25, 0, 2.25, 4.5]:
        create_cube("Balcony_Corbel", (0.35, 0.55, 1.4), (bx, balcony_y - 0.275, D/2 + 0.7), mat_stone_base)
    
    # Balcony Wrought Iron Railing
    rail_h = 0.95
    # Front rail bar
    create_cube("Balcony_Rail_Front", (W - 1.2, 0.06, 0.06), (0, balcony_y + rail_h, D/2 + 1.75), mat_wrought_iron)
    create_cube("Balcony_Rail_Bottom", (W - 1.2, 0.06, 0.06), (0, balcony_y + 0.3, D/2 + 1.75), mat_wrought_iron)
    # Side rails
    create_cube("Balcony_Rail_Left", (0.06, 0.06, 1.7), (-(W - 1.2)/2, balcony_y + rail_h, D/2 + 0.9), mat_wrought_iron)
    create_cube("Balcony_Rail_Right", (0.06, 0.06, 1.7), ((W - 1.2)/2, balcony_y + rail_h, D/2 + 0.9), mat_wrought_iron)
    # Vertical balusters
    for bx in range(int(-(W - 1.6)*2), int((W - 1.6)*2) + 1, 3):
        create_cylinder("Baluster", 0.025, rail_h - 0.25, (bx * 0.25, balcony_y + (rail_h + 0.25)/2, D/2 + 1.75), material=mat_wrought_iron)
    
    # 9. First Floor French Windows & Louvered Shutters
    for wx in [-4.2, -1.4, 1.4, 4.2]:
        wy = balcony_y + 1.6
        # Window recess frame
        create_cube("Win_Frame", (1.6, 2.4, 0.15), (wx, wy, D/2 + 0.02), mat_wood_dark)
        create_cube("Win_Glass", (1.4, 2.2, 0.05), (wx, wy, D/2 + 0.05), mat_glass)
        # Molded decorative window pediment
        create_cube("Win_Pediment", (1.8, 0.25, 0.2), (wx, wy + 1.3, D/2 + 0.1), mat_stone_base)
        # Wooden shutters
        create_cube("Win_Shutter_L", (0.5, 2.2, 0.06), (wx - 0.9, wy, D/2 + 0.1), mat_wood_dark)
        create_cube("Win_Shutter_R", (0.5, 2.2, 0.06), (wx + 0.9, wy, D/2 + 0.1), mat_wood_dark)
        
    # 10. Wall-Mounted Air Conditioner Units (Authentic Coastal Urban Detail)
    for ac_x, ac_y in [(-4.8, balcony_y + 2.8), (4.8, balcony_y + 2.8)]:
        create_cube("AC_Unit", (0.85, 0.55, 0.4), (ac_x, ac_y, D/2 + 0.22), mat_ac_unit)
        create_cylinder("AC_Fan_Grille", 0.22, 0.04, (ac_x, ac_y, D/2 + 0.43), rotation=(math.pi/2, 0, 0), material=mat_shutter_metal)
    
    # 11. Pitched Mangalore Terracotta Hip Roof with Eaves
    roof_base_y = 0.45 + H_G + 0.35 + H_1
    roof_h = 2.6
    # Roof eave fascia
    create_cube("Roof_Cornice", (W + 1.0, 0.35, D + 1.0), (0, roof_base_y + 0.175, 0), mat_stone_base)
    # Terracotta Hip Roof Cone/Pyramid
    mesh_roof = bpy.data.meshes.new("Roof_Mesh")
    obj_roof = bpy.data.objects.new("Roof", mesh_roof)
    bpy.context.scene.collection.objects.link(obj_roof)
    bm_r = bmesh.new()
    bmesh.ops.create_cone(
        bm_r,
        cap_ends=True,
        cap_tris=True,
        segments=4,
        radius1=math.hypot(W + 1.6, D + 1.6) / 2,
        radius2=0.0,
        depth=roof_h
    )
    bm_r.transform(Euler((0, 0, math.pi/4)).to_matrix().to_4x4())
    bm_r.to_mesh(mesh_roof)
    bm_r.free()
    obj_roof.location = (0, roof_base_y + 0.35 + roof_h / 2, 0)
    obj_roof.data.materials.append(mat_terracotta)
    
    # Ridge Capping & Finial
    create_cube("Roof_Ridge_Cap", (0.6, 0.2, D * 0.3), (0, roof_base_y + 0.35 + roof_h - 0.1, 0), mat_terracotta)
    create_cylinder("Roof_Finial", 0.15, 0.6, (0, roof_base_y + 0.35 + roof_h + 0.3, 0), material=mat_stone_base)
    
    export_glb(os.path.join(OUT_DIR, "building_coastal_arcade.glb"))

# ==============================================================================
# 2. GOAN/KONKAN COLONIAL HERITAGE VILLA
# ==============================================================================
def generate_heritage_villa():
    print("\n--- Generating building_heritage_villa.glb ---")
    reset_scene()
    
    mat_stucco = create_pbr_material("Stucco_White", (0.94, 0.93, 0.91), roughness=0.85)
    mat_stone_plinth = create_pbr_material("Laterite_Stone", (0.55, 0.32, 0.24), roughness=0.8)
    mat_terracotta = create_pbr_material("Terracotta_Mangalore", (0.78, 0.31, 0.16), roughness=0.65)
    mat_wood_teak = create_pbr_material("Carved_Teak", (0.32, 0.18, 0.11), roughness=0.5)
    mat_wood_teal = create_pbr_material("Colonial_Teal_Wood", (0.14, 0.42, 0.46), roughness=0.6)
    mat_glass = create_pbr_material("Window_Glass", (0.2, 0.3, 0.4), roughness=0.1, metallic=0.9)
    mat_brass = create_pbr_material("Polished_Brass", (0.85, 0.72, 0.28), roughness=0.3, metallic=0.85)
    
    W = 14.0
    D = 12.0
    H = 6.8
    veranda_d = 3.2
    
    # 1. Laterite Stone Plinth with Front Steps
    create_cube("Plinth_Villa", (W + 0.8, 0.5, D + veranda_d + 0.8), (0, 0.25, veranda_d/2), mat_stone_plinth)
    create_cube("Villa_Steps", (6.0, 0.25, 1.2), (0, 0.125, D/2 + veranda_d + 0.6), mat_stone_plinth)
    
    # 2. Main Two-Storey House Body
    create_cube("Villa_Body", (W, H, D), (0, 0.5 + H/2, 0), mat_stucco)
    
    # 3. Grand Front Veranda (Covered Porch)
    # Veranda Roof
    veranda_roof_y = 0.5 + 3.8
    create_cube("Veranda_Roof", (W + 0.6, 0.3, veranda_d + 0.6), (0, veranda_roof_y, D/2 + veranda_d/2), mat_terracotta)
    
    # 4 Classical Tuscan Columns supporting Veranda
    num_cols = 4
    col_spacing = (W - 2.0) / (num_cols - 1)
    for c in range(num_cols):
        cx = -(W - 2.0)/2 + c * col_spacing
        cz = D/2 + veranda_d - 0.3
        # Plinth base
        create_cube("Col_Base", (0.5, 0.35, 0.5), (cx, 0.5 + 0.175, cz), mat_stone_plinth)
        # Fluted column shaft
        create_cylinder("Col_Shaft", 0.18, 3.1, (cx, 0.5 + 0.35 + 1.55, cz), material=mat_stucco)
        # Column capital
        create_cube("Col_Cap", (0.5, 0.25, 0.5), (cx, 0.5 + 0.35 + 3.1 + 0.125, cz), mat_stone_plinth)
        
    # Veranda Decorative Balustrade between columns
    for c in range(num_cols - 1):
        mid_x = (-(W - 2.0)/2 + c * col_spacing + -(W - 2.0)/2 + (c + 1) * col_spacing) / 2
        # Except central entrance gap
        if c == 1:
            continue
        create_cube("Veranda_Railing_Top", (col_spacing - 0.5, 0.1, 0.15), (mid_x, 0.5 + 0.9, D/2 + veranda_d - 0.3), mat_wood_teal)
        create_cube("Veranda_Railing_Bottom", (col_spacing - 0.5, 0.08, 0.12), (mid_x, 0.5 + 0.25, D/2 + veranda_d - 0.3), mat_wood_teal)
        for bi in range(5):
            bx = mid_x - (col_spacing - 0.9)/2 + bi * ((col_spacing - 0.9)/4)
            create_cylinder("Baluster_Wood", 0.04, 0.55, (bx, 0.5 + 0.55, D/2 + veranda_d - 0.3), material=mat_wood_teal)
            
    # 4. Ornate Carved Teak Double Front Door
    create_cube("Door_Frame", (2.2, 3.2, 0.15), (0, 0.5 + 1.6, D/2 + 0.05), mat_wood_teak)
    create_cube("Door_Leaf_L", (0.95, 2.8, 0.08), (-0.5, 0.5 + 1.4, D/2 + 0.08), mat_wood_teak)
    create_cube("Door_Leaf_R", (0.95, 2.8, 0.08), (0.5, 0.5 + 1.4, D/2 + 0.08), mat_wood_teak)
    # Brass door handles & studs
    create_cylinder("Brass_Knocker_L", 0.06, 0.04, (-0.2, 0.5 + 1.4, D/2 + 0.14), rotation=(math.pi/2, 0, 0), material=mat_brass)
    create_cylinder("Brass_Knocker_R", 0.06, 0.04, (0.2, 0.5 + 1.4, D/2 + 0.14), rotation=(math.pi/2, 0, 0), material=mat_brass)
    # Fanlight decorative transom window above door
    create_cube("Fanlight", (2.0, 0.6, 0.06), (0, 0.5 + 2.9, D/2 + 0.08), mat_glass)
    
    # 5. First Floor Windows with Stone Sills & Teal Louvers
    for wx in [-4.6, -1.8, 1.8, 4.6]:
        wy = 0.5 + 4.8
        create_cube("Villa_Win_Frame", (1.6, 2.2, 0.15), (wx, wy, D/2 + 0.02), mat_stone_plinth)
        create_cube("Villa_Win_Glass", (1.3, 1.9, 0.05), (wx, wy, D/2 + 0.05), mat_glass)
        create_cube("Villa_Win_Sill", (1.8, 0.15, 0.25), (wx, wy - 1.15, D/2 + 0.1), mat_stone_plinth)
        create_cube("Villa_Shutter_L", (0.55, 1.9, 0.06), (wx - 0.85, wy, D/2 + 0.08), mat_wood_teal)
        create_cube("Villa_Shutter_R", (0.55, 1.9, 0.06), (wx + 0.85, wy, D/2 + 0.08), mat_wood_teal)
        
    # 6. Central Upper Balcony
    create_cube("Villa_Upper_Balcony", (4.2, 0.25, 1.6), (0, 0.5 + 3.8 + 0.125, D/2 + 0.8), mat_stone_plinth)
    create_cube("Villa_Balcony_Rail", (4.2, 0.9, 0.08), (0, 0.5 + 3.8 + 0.6, D/2 + 1.6), mat_wood_teal)
    
    # 7. Pitched Mangalore Terracotta Roof with Decorative Gable Bargeboard
    roof_y = 0.5 + H
    roof_h = 2.8
    create_cube("Villa_Eaves_Molding", (W + 1.2, 0.3, D + 1.2), (0, roof_y + 0.15, 0), mat_stone_plinth)
    
    # Hip Roof
    mesh_vr = bpy.data.meshes.new("Villa_Roof_Mesh")
    obj_vr = bpy.data.objects.new("Villa_Roof", mesh_vr)
    bpy.context.scene.collection.objects.link(obj_vr)
    bm_vr = bmesh.new()
    bmesh.ops.create_cone(
        bm_vr,
        cap_ends=True,
        cap_tris=True,
        segments=4,
        radius1=math.hypot(W + 1.8, D + 1.8) / 2,
        radius2=0.0,
        depth=roof_h
    )
    bm_vr.transform(Euler((0, 0, math.pi/4)).to_matrix().to_4x4())
    bm_vr.to_mesh(mesh_vr)
    bm_vr.free()
    obj_vr.location = (0, roof_y + 0.3 + roof_h / 2, 0)
    obj_vr.data.materials.append(mat_terracotta)
    
    # Dormer Window on Roof
    create_cube("Dormer_Body", (1.8, 1.4, 1.6), (0, roof_y + 1.3, D/2 - 0.5), mat_stucco)
    create_cube("Dormer_Window", (1.2, 1.0, 0.05), (0, roof_y + 1.3, D/2 + 0.3), mat_glass)
    
    export_glb(os.path.join(OUT_DIR, "building_heritage_villa.glb"))

# ==============================================================================
# 3. SEAVIEW LIGHTHOUSE LANDMARK
# ==============================================================================
def generate_lighthouse():
    print("\n--- Generating landmark_seaview_lighthouse.glb ---")
    reset_scene()
    
    mat_stone_base = create_pbr_material("Ashlar_Granite", (0.42, 0.44, 0.46), roughness=0.8)
    mat_tower_white = create_pbr_material("Lighthouse_Tower", (0.92, 0.92, 0.90), roughness=0.7)
    mat_tower_red = create_pbr_material("Lighthouse_Stripe_Red", (0.82, 0.18, 0.15), roughness=0.65)
    mat_metal_iron = create_pbr_material("Wrought_Iron", (0.15, 0.15, 0.18), roughness=0.4, metallic=0.85)
    mat_copper_dome = create_pbr_material("Aged_Copper", (0.22, 0.52, 0.45), roughness=0.45, metallic=0.65)
    mat_glass = create_pbr_material("Lantern_Glass", (0.9, 0.95, 1.0), roughness=0.05, metallic=0.1)
    mat_beacon_glow = create_pbr_material("Beacon_Emitter", (1.0, 0.9, 0.2), roughness=0.1, emission_color=(1.0, 0.9, 0.3), emission_strength=4.0)
    mat_wood_teak = create_pbr_material("Heavy_Teak_Door", (0.28, 0.16, 0.10), roughness=0.5)
    
    # 1. Octagonal Rusticated Stone Foundation Base
    base_h = 4.2
    create_cylinder("Stone_Base", 4.4, base_h, (0, base_h/2, 0), segments=8, material=mat_stone_base)
    # Base cornice plinth
    create_cylinder("Base_Cornice", 4.7, 0.4, (0, base_h + 0.2, 0), segments=8, material=mat_stone_base)
    
    # Deep Arched Entrance Portal on South face
    create_cube("Portal_Frame", (2.8, 3.4, 0.8), (0, 1.7, 4.3), mat_stone_base)
    create_cube("Portal_Door", (2.0, 2.6, 0.2), (0, 1.3, 4.1), mat_wood_teak)
    create_cylinder("Portal_Lantern", 0.15, 0.4, (0, 3.2, 4.8), material=mat_beacon_glow)
    
    # 2. Tapered Main Tower with Red and White Alternating Bands
    tower_h = 18.0
    tower_r_bottom = 3.2
    tower_r_top = 2.2
    num_bands = 5
    band_h = tower_h / num_bands
    
    for b in range(num_bands):
        b_y = base_h + 0.4 + b * band_h + band_h / 2
        r1 = tower_r_bottom - (b / num_bands) * (tower_r_bottom - tower_r_top)
        r2 = tower_r_bottom - ((b + 1) / num_bands) * (tower_r_bottom - tower_r_top)
        
        mesh_b = bpy.data.meshes.new(f"Tower_Band_{b}")
        obj_b = bpy.data.objects.new(f"Tower_Band_{b}", mesh_b)
        bpy.context.scene.collection.objects.link(obj_b)
        bm_b = bmesh.new()
        bmesh.ops.create_cone(
            bm_b,
            cap_ends=True,
            cap_tris=False,
            segments=16,
            radius1=r1,
            radius2=r2,
            depth=band_h
        )
        bm_b.to_mesh(mesh_b)
        bm_b.free()
        obj_b.location = (0, b_y, 0)
        obj_b.data.materials.append(mat_tower_red if b % 2 == 1 else mat_tower_white)
        
    # Spiral staircase observation slit windows
    for sw_i in range(4):
        sw_y = base_h + 3.0 + sw_i * 3.8
        ang = sw_i * (math.pi / 2)
        wx = math.sin(ang) * (tower_r_bottom - sw_i * 0.2)
        wz = math.cos(ang) * (tower_r_bottom - sw_i * 0.2)
        create_cube(f"Slit_Win_{sw_i}", (0.45, 0.9, 0.4), (wx, sw_y, wz), mat_metal_iron)
        
    # 3. Observation Gallery Walkway
    gallery_y = base_h + 0.4 + tower_h
    create_cylinder("Gallery_Floor", 3.4, 0.5, (0, gallery_y + 0.25, 0), segments=16, material=mat_stone_base)
    # Corbel brackets supporting gallery
    for i in range(8):
        ang = i * (math.pi / 4)
        create_cube(f"Gallery_Bracket_{i}", (0.35, 0.8, 1.0), (math.sin(ang) * 2.3, gallery_y - 0.4, math.cos(ang) * 2.3), mat_stone_base)
        
    # Gallery Metal Safety Railing
    create_cylinder("Gallery_Railing", 3.4, 1.05, (0, gallery_y + 0.5 + 0.525, 0), segments=16, material=mat_metal_iron)
    
    # 4. Glass Lantern Room with Fresnel Lens
    lantern_y = gallery_y + 0.5
    create_cylinder("Lantern_Base", 2.2, 0.6, (0, lantern_y + 0.3, 0), segments=16, material=mat_metal_iron)
    create_cylinder("Lantern_Glass_Room", 2.0, 2.6, (0, lantern_y + 0.6 + 1.3, 0), segments=16, material=mat_glass)
    # Central Revolving Beacon Core
    create_cylinder("Beacon_Core", 0.5, 1.2, (0, lantern_y + 0.6 + 1.3, 0), material=mat_beacon_glow)
    
    # 5. Conical Copper Dome Roof & Spire Finial
    dome_y = lantern_y + 0.6 + 2.6
    mesh_dome = bpy.data.meshes.new("Dome_Mesh")
    obj_dome = bpy.data.objects.new("Lighthouse_Dome", mesh_dome)
    bpy.context.scene.collection.objects.link(obj_dome)
    bm_d = bmesh.new()
    bmesh.ops.create_cone(
        bm_d,
        cap_ends=True,
        cap_tris=False,
        segments=16,
        radius1=2.3,
        radius2=0.1,
        depth=1.8
    )
    bm_d.to_mesh(mesh_dome)
    bm_d.free()
    obj_dome.location = (0, dome_y + 0.9, 0)
    obj_dome.data.materials.append(mat_copper_dome)
    
    # Spire / Weathervane
    create_cylinder("Dome_Spire", 0.06, 1.4, (0, dome_y + 1.8 + 0.7, 0), material=mat_copper_dome)
    
    export_glb(os.path.join(OUT_DIR, "landmark_seaview_lighthouse.glb"))

# ==============================================================================
# 4. DETAILED TROPICAL COCONUT PALM TREE
# ==============================================================================
def generate_coconut_palm():
    print("\n--- Generating tree_coconut_palm.glb ---")
    reset_scene()
    
    mat_bark = create_pbr_material("Palm_Trunk_Bark", (0.36, 0.28, 0.20), roughness=0.85)
    mat_frond_green = create_pbr_material("Palm_Frond_Green", (0.16, 0.44, 0.12), roughness=0.6)
    mat_coconut = create_pbr_material("Coconut_Husk", (0.38, 0.32, 0.16), roughness=0.75)
    
    # Natural organic curved trunk (7 segmented tilted cylinders)
    total_h = 8.5
    num_segments = 7
    seg_h = total_h / num_segments
    curr_loc = Vector((0, 0, 0))
    lean_angle = 0.14 # Natural ocean breeze curvature
    
    for s in range(num_segments):
        # Taper from radius 0.4m at base to 0.2m at crown
        r = 0.38 - (s / num_segments) * 0.18
        # Curved displacement
        dx = math.sin(s * 0.3) * 0.18
        dy = seg_h
        dz = 0.0
        
        cyl = create_cylinder(f"Trunk_Seg_{s}", r, seg_h, (curr_loc.x + dx/2, curr_loc.y + dy/2, curr_loc.z), rotation=(0, 0, -s * lean_angle * 0.15), segments=10, material=mat_bark)
        curr_loc += Vector((dx, dy, dz))
        
    crown_loc = curr_loc
    
    # Crown fronds: 14 natural radiating drooping fronds in 2 tiers
    num_fronds = 14
    for f in range(num_fronds):
        angle = (f / num_fronds) * (math.pi * 2)
        tier = f % 2
        frond_len = 3.6 - tier * 0.4
        droop = 0.45 + tier * 0.25
        
        # Central curved rachis
        fx = math.sin(angle) * (frond_len * 0.5)
        fz = math.cos(angle) * (frond_len * 0.5)
        fy = -droop
        
        rachis = create_cube(f"Frond_Rachis_{f}", (0.08, 0.06, frond_len), (crown_loc.x + fx, crown_loc.y + fy, crown_loc.z + fz), mat_bark)
        rachis.rotation_euler = (droop, angle, 0)
        
        # Leaf blade fans along rachis
        leaf = create_cube(f"Leaf_Blade_{f}", (0.85, 0.03, frond_len * 0.85), (crown_loc.x + fx * 1.1, crown_loc.y + fy * 1.1, crown_loc.z + fz * 1.1), mat_frond_green)
        leaf.rotation_euler = (droop * 1.1, angle, 0.1)
        
    # Cluster of coconuts at crown base
    for c in range(6):
        c_ang = c * (math.pi / 3) + 0.3
        cx = crown_loc.x + math.sin(c_ang) * 0.35
        cz = crown_loc.z + math.cos(c_ang) * 0.35
        cy = crown_loc.y - 0.25
        create_cylinder(f"Coconut_{c}", 0.18, 0.25, (cx, cy, cz), segments=8, material=mat_coconut)
        
    export_glb(os.path.join(OUT_DIR, "tree_coconut_palm.glb"))

# ==============================================================================
# 5. ICONIC INDIAN AUTO-RICKSHAW (TUK-TUK)
# ==============================================================================
def generate_auto_rickshaw():
    print("\n--- Generating prop_auto_rickshaw.glb ---")
    reset_scene()
    
    mat_yellow_cab = create_pbr_material("Auto_Yellow_Cab", (0.95, 0.72, 0.06), roughness=0.35, metallic=0.1)
    mat_green_chassis = create_pbr_material("Auto_Green_Chassis", (0.08, 0.38, 0.18), roughness=0.4, metallic=0.15)
    mat_black_rubber = create_pbr_material("Auto_Rubber_Tire", (0.12, 0.12, 0.12), roughness=0.85)
    mat_chrome = create_pbr_material("Auto_Chrome", (0.88, 0.88, 0.90), roughness=0.15, metallic=0.95)
    mat_glass = create_pbr_material("Auto_Glass", (0.85, 0.92, 0.96), roughness=0.08, metallic=0.1)
    mat_seat_vinyl = create_pbr_material("Auto_Seat_Vinyl", (0.18, 0.18, 0.20), roughness=0.6)
    mat_headlight = create_pbr_material("Auto_Headlight", (1.0, 0.95, 0.8), roughness=0.1, emission_color=(1.0, 0.95, 0.7), emission_strength=2.5)
    
    L = 2.65 # Length
    W = 1.30 # Width
    H = 1.70 # Height
    
    # 1. Lower Chassis & Floorboard
    create_cube("Chassis_Floor", (W, 0.15, L), (0, 0.35, 0), mat_green_chassis)
    
    # 2. Wheels: 1 front steering wheel, 2 rear drive wheels
    wheel_r = 0.28
    wheel_w = 0.16
    # Front wheel
    create_cylinder("Wheel_Front", wheel_r, wheel_w, (0, wheel_r, L/2 - 0.3), rotation=(0, 0, math.pi/2), segments=14, material=mat_black_rubber)
    create_cylinder("Wheel_Front_Hub", wheel_r * 0.5, wheel_w + 0.02, (0, wheel_r, L/2 - 0.3), rotation=(0, 0, math.pi/2), segments=10, material=mat_chrome)
    # Rear Left & Right wheels
    for r_side in [-1, 1]:
        rx = r_side * (W/2 - 0.08)
        rz = -L/2 + 0.45
        create_cylinder(f"Wheel_Rear_{r_side}", wheel_r, wheel_w, (rx, wheel_r, rz), rotation=(0, 0, math.pi/2), segments=14, material=mat_black_rubber)
        create_cylinder(f"Wheel_Rear_Hub_{r_side}", wheel_r * 0.5, wheel_w + 0.02, (rx, wheel_r, rz), rotation=(0, 0, math.pi/2), segments=10, material=mat_chrome)
        
    # 3. Classic Dark Green Lower Body Mudguards & Cabin Walls
    create_cube("Body_Rear_Tub", (W + 0.05, 0.55, L * 0.55), (0, 0.65, -0.2), mat_green_chassis)
    create_cube("Body_Front_Nose", (W * 0.75, 0.6, 0.8), (0, 0.65, L/2 - 0.3), mat_green_chassis)
    
    # Front Mudguard
    create_cube("Front_Mudguard", (0.35, 0.25, 0.65), (0, 0.55, L/2 - 0.3), mat_green_chassis)
    
    # 4. Yellow Metal Roof Canopy
    create_cube("Yellow_Roof", (W + 0.08, 0.12, L * 0.85), (0, H - 0.06, -0.05), mat_yellow_cab)
    # Rounded roof overhang
    create_cube("Roof_Front_Peak", (W * 0.8, 0.12, 0.35), (0, H - 0.12, L/2 - 0.45), mat_yellow_cab)
    
    # 5. Canopy Support Pillars
    pillar_r = 0.025
    for px in [-(W/2 - 0.05), W/2 - 0.05]:
        # Front A-pillar
        create_cylinder("A_Pillar", pillar_r, H - 0.8, (px, 0.9 + (H - 0.8)/2, L/2 - 0.5), material=mat_chrome)
        # B-pillar
        create_cylinder("B_Pillar", pillar_r, H - 0.8, (px, 0.9 + (H - 0.8)/2, 0.1), material=mat_chrome)
        # Rear C-pillar
        create_cylinder("C_Pillar", pillar_r, H - 0.8, (px, 0.9 + (H - 0.8)/2, -L/2 + 0.1), material=mat_chrome)
        
    # 6. Windshield with Black Rubber Bezel
    create_cube("Windshield_Glass", (W * 0.78, 0.55, 0.04), (0, 1.25, L/2 - 0.5), mat_glass)
    create_cube("Windshield_Wiper", (0.02, 0.35, 0.02), (0.1, 1.25, L/2 - 0.47), mat_black_rubber)
    
    # 7. Front Round Headlight & Amber Turn Indicators
    create_cylinder("Headlight_Chrome", 0.12, 0.1, (0, 0.85, L/2 + 0.12), rotation=(math.pi/2, 0, 0), material=mat_chrome)
    create_cylinder("Headlight_Lens", 0.09, 0.04, (0, 0.85, L/2 + 0.18), rotation=(math.pi/2, 0, 0), material=mat_headlight)
    for ind_x in [-0.25, 0.25]:
        create_cylinder("Indicator", 0.04, 0.04, (ind_x, 0.85, L/2 + 0.12), rotation=(math.pi/2, 0, 0), material=mat_yellow_cab)
        
    # 8. Passenger & Driver Interior (Black vinyl seats, handlebar)
    # Rear passenger bench
    create_cube("Passenger_Seat_Base", (W - 0.15, 0.35, 0.5), (0, 0.55, -L/2 + 0.45), mat_seat_vinyl)
    create_cube("Passenger_Seat_Back", (W - 0.15, 0.55, 0.12), (0, 0.95, -L/2 + 0.18), mat_seat_vinyl)
    # Driver seat
    create_cube("Driver_Seat", (0.5, 0.3, 0.45), (0, 0.55, 0.25), mat_seat_vinyl)
    # Handlebar
    create_cylinder("Handlebar", 0.02, 0.65, (0, 0.95, 0.65), rotation=(0, 0, math.pi/2), material=mat_chrome)
    
    # 9. Rear Bumper & License Plate
    create_cube("Rear_Bumper", (W + 0.1, 0.12, 0.12), (0, 0.35, -L/2 - 0.05), mat_black_rubber)
    create_cube("License_Plate", (0.35, 0.15, 0.02), (0, 0.55, -L/2 - 0.02), mat_yellow_cab)
    
    export_glb(os.path.join(OUT_DIR, "prop_auto_rickshaw.glb"))

# ==============================================================================
# 6. COLONIAL CAST-IRON MARINE STREETLAMP
# ==============================================================================
def generate_coastal_streetlamp():
    print("\n--- Generating prop_coastal_streetlamp.glb ---")
    reset_scene()
    
    mat_iron = create_pbr_material("Cast_Iron_Black", (0.12, 0.13, 0.15), roughness=0.4, metallic=0.85)
    mat_brass = create_pbr_material("Brass_Trim", (0.75, 0.62, 0.22), roughness=0.3, metallic=0.9)
    mat_glass = create_pbr_material("Lantern_Glass", (0.9, 0.95, 1.0), roughness=0.08, metallic=0.1)
    mat_filament = create_pbr_material("Light_Bulb_Glow", (1.0, 0.9, 0.6), roughness=0.1, emission_color=(1.0, 0.88, 0.55), emission_strength=4.5)
    
    H = 5.4
    
    # 1. Fluted Octagonal Pedestal Base
    create_cylinder("Pedestal_Foot", 0.45, 0.25, (0, 0.125, 0), segments=8, material=mat_iron)
    create_cylinder("Pedestal_Plinth", 0.32, 0.65, (0, 0.25 + 0.325, 0), segments=8, material=mat_iron)
    create_cylinder("Pedestal_Cap", 0.36, 0.15, (0, 0.9 + 0.075, 0), segments=8, material=mat_iron)
    
    # 2. Tapered Cast-Iron Pole with Molded Collar Rings
    pole_h = 3.6
    create_cylinder("Lamp_Pole", 0.12, pole_h, (0, 1.05 + pole_h/2, 0), segments=12, material=mat_iron)
    # Ornamental collar rings
    for ring_y in [1.8, 2.8, 3.8, 4.6]:
        create_cylinder("Collar_Ring", 0.16, 0.08, (0, ring_y, 0), segments=12, material=mat_brass)
        
    # 3. Double-Scroll Curved Arm
    create_cube("Arm_Horizontal", (0.95, 0.08, 0.08), (0.45, H - 0.2, 0), mat_iron)
    create_cylinder("Arm_Support_Scroll", 0.04, 0.7, (0.28, H - 0.45, 0), rotation=(0, 0, 0.65), material=mat_iron)
    
    # 4. Hexagonal Glass Lantern
    lantern_loc = Vector((0.85, H - 0.55, 0))
    create_cylinder("Lantern_Cap", 0.32, 0.15, (lantern_loc.x, lantern_loc.y + 0.35, lantern_loc.z), segments=6, material=mat_brass)
    create_cylinder("Lantern_Glass_Cage", 0.26, 0.65, (lantern_loc.x, lantern_loc.y, lantern_loc.z), segments=6, material=mat_glass)
    create_cylinder("Lantern_Base", 0.22, 0.12, (lantern_loc.x, lantern_loc.y - 0.35, lantern_loc.z), segments=6, material=mat_iron)
    # Internal glowing filament
    create_cylinder("Bulb_Glow", 0.08, 0.2, (lantern_loc.x, lantern_loc.y, lantern_loc.z), material=mat_filament)
    
    export_glb(os.path.join(OUT_DIR, "prop_coastal_streetlamp.glb"))

# ==============================================================================
# 7. TEAK WOOD & CAST-IRON PROMENADE BENCH
# ==============================================================================
def generate_promenade_bench():
    print("\n--- Generating prop_promenade_bench.glb ---")
    reset_scene()
    
    mat_wood = create_pbr_material("Weathered_Teak", (0.42, 0.28, 0.18), roughness=0.6)
    mat_iron = create_pbr_material("Bench_Cast_Iron", (0.14, 0.15, 0.16), roughness=0.45, metallic=0.85)
    
    L = 2.2 # Length
    
    # 2 Cast-Iron Scrolled Side Frames
    for side_x in [-(L/2 - 0.15), L/2 - 0.15]:
        # Front and rear legs
        create_cube("Bench_Leg_Front", (0.08, 0.45, 0.08), (side_x, 0.225, 0.3), mat_iron)
        create_cube("Bench_Leg_Rear", (0.08, 0.75, 0.08), (side_x, 0.375, -0.3), mat_iron)
        create_cube("Bench_Base_Strut", (0.08, 0.06, 0.6), (side_x, 0.15, 0), mat_iron)
        # Curved Armrest
        create_cube("Bench_Armrest", (0.08, 0.06, 0.65), (side_x, 0.55, 0.05), mat_iron)
        
    # Contoured Teak Slats for Seat (4 slats)
    for si in range(4):
        sz = 0.22 - si * 0.14
        sy = 0.42 - si * 0.02
        create_cube(f"Seat_Slat_{si}", (L, 0.035, 0.11), (0, sy, sz), mat_wood)
        
    # Teak Slats for Backrest (3 slats)
    for bi in range(3):
        bz = -0.25 - bi * 0.04
        by = 0.52 + bi * 0.13
        create_cube(f"Back_Slat_{bi}", (L, 0.11, 0.035), (0, by, bz), mat_wood)
        
    export_glb(os.path.join(OUT_DIR, "prop_promenade_bench.glb"))

# ==============================================================================
# 8. CONCRETE UTILITY POLE WITH TRANSFORMER & CROSSARMS
# ==============================================================================
def generate_utility_pole():
    print("\n--- Generating prop_utility_pole.glb ---")
    reset_scene()
    
    mat_concrete = create_pbr_material("Utility_Concrete", (0.65, 0.66, 0.68), roughness=0.85)
    mat_wood_beam = create_pbr_material("Treated_Crossarm", (0.34, 0.24, 0.16), roughness=0.7)
    mat_ceramic = create_pbr_material("Ceramic_Insulator", (0.85, 0.55, 0.15), roughness=0.25)
    mat_metal_gray = create_pbr_material("Transformer_Metal", (0.42, 0.44, 0.48), roughness=0.45, metallic=0.75)
    
    H = 7.8
    
    # 1. Octagonal Concrete Pole
    create_cylinder("Pole_Shaft", 0.22, H, (0, H/2, 0), segments=8, material=mat_concrete)
    
    # 2. Dual Timber Crossarms at Top
    create_cube("Crossarm_Top", (2.8, 0.14, 0.14), (0, H - 0.4, 0.18), mat_wood_beam)
    create_cube("Crossarm_Mid", (2.4, 0.14, 0.14), (0, H - 1.2, 0.18), mat_wood_beam)
    
    # 3. Ribbed Ceramic Bell Insulators
    for ix in [-1.2, -0.4, 0.4, 1.2]:
        create_cylinder("Insulator_Top", 0.08, 0.25, (ix, H - 0.22, 0.18), segments=8, material=mat_ceramic)
    for ix in [-0.9, 0.9]:
        create_cylinder("Insulator_Mid", 0.08, 0.25, (ix, H - 1.02, 0.18), segments=8, material=mat_ceramic)
        
    # 4. Cylindrical Distribution Transformer Drum
    create_cylinder("Transformer_Drum", 0.38, 1.1, (0, H - 2.4, -0.42), segments=12, material=mat_metal_gray)
    # Mounting bracket
    create_cube("Transformer_Bracket", (0.45, 0.12, 0.55), (0, H - 2.8, -0.22), mat_metal_gray)
    
    export_glb(os.path.join(OUT_DIR, "prop_utility_pole.glb"))

# ==============================================================================
# 9. TRADITIONAL INDIAN COASTAL FISHING BOAT (DHONI)
# ==============================================================================
def generate_coastal_boat():
    print("\n--- Generating prop_coastal_boat.glb ---")
    reset_scene()
    
    mat_hull_red = create_pbr_material("Boat_Hull_Red", (0.78, 0.14, 0.12), roughness=0.55)
    mat_hull_stripe = create_pbr_material("Boat_Stripe_Gold", (0.92, 0.72, 0.12), roughness=0.45)
    mat_deck_wood = create_pbr_material("Deck_Weathered_Teak", (0.44, 0.32, 0.22), roughness=0.65)
    mat_cabin_wood = create_pbr_material("Cabin_Teak", (0.35, 0.22, 0.14), roughness=0.55)
    mat_glass = create_pbr_material("Boat_Window_Glass", (0.75, 0.88, 0.95), roughness=0.1, metallic=0.2)
    mat_mast = create_pbr_material("Boat_Mast_Wood", (0.30, 0.18, 0.10), roughness=0.6)
    mat_net = create_pbr_material("Fishing_Net_Green", (0.12, 0.38, 0.25), roughness=0.85)
    
    L = 9.2
    W = 2.6
    H = 1.4
    
    # 1. Main Curved Wooden Hull
    create_cube("Boat_Hull_Main", (W, H, L * 0.75), (0, H/2, 0), mat_hull_red)
    create_cube("Boat_Waterline_Stripe", (W + 0.05, 0.2, L * 0.76), (0, H * 0.65, 0), mat_hull_stripe)
    
    # Pointed Tapered Bow
    mesh_bow = bpy.data.meshes.new("Bow_Mesh")
    obj_bow = bpy.data.objects.new("Boat_Bow", mesh_bow)
    bpy.context.scene.collection.objects.link(obj_bow)
    bm_bow = bmesh.new()
    bmesh.ops.create_cone(
        bm_bow,
        cap_ends=True,
        cap_tris=False,
        segments=12,
        radius1=W * 0.45,
        radius2=0.1,
        depth=L * 0.25
    )
    bm_bow.transform(Euler((math.pi/2, 0, 0)).to_matrix().to_4x4())
    bm_bow.to_mesh(mesh_bow)
    bm_bow.free()
    obj_bow.location = (0, H/2, L * 0.375 + L * 0.125)
    obj_bow.data.materials.append(mat_hull_red)
    
    # Pointed Tapered Stern
    mesh_stern = bpy.data.meshes.new("Stern_Mesh")
    obj_stern = bpy.data.objects.new("Boat_Stern", mesh_stern)
    bpy.context.scene.collection.objects.link(obj_stern)
    bm_stern = bmesh.new()
    bmesh.ops.create_cone(
        bm_stern,
        cap_ends=True,
        cap_tris=False,
        segments=12,
        radius1=W * 0.42,
        radius2=0.15,
        depth=L * 0.2
    )
    bm_stern.transform(Euler((-math.pi/2, 0, 0)).to_matrix().to_4x4())
    bm_stern.to_mesh(mesh_stern)
    bm_stern.free()
    obj_stern.location = (0, H/2, -L * 0.375 - L * 0.1)
    obj_stern.data.materials.append(mat_hull_red)
    
    # 2. Walkable Wooden Deck Floor
    create_cube("Boat_Deck", (W - 0.25, 0.15, L * 0.85), (0, H - 0.075, 0), mat_deck_wood)
    
    # 3. Wheelhouse / Cabin
    create_cube("Wheelhouse_Body", (1.6, 1.4, 2.2), (0, H + 0.7, -1.2), mat_cabin_wood)
    # Cabin windows
    create_cube("Cabin_Win_Front", (1.2, 0.55, 0.05), (0, H + 0.85, -0.08), mat_glass)
    create_cube("Cabin_Win_L", (0.05, 0.55, 0.8), (-0.82, H + 0.85, -1.2), mat_glass)
    create_cube("Cabin_Win_R", (0.05, 0.55, 0.8), (0.82, H + 0.85, -1.2), mat_glass)
    
    # 4. Mast with Rigging
    create_cylinder("Boat_Mast", 0.07, 4.5, (0, H + 2.25, 1.2), segments=8, material=mat_mast)
    create_cylinder("Boat_Crossbar", 0.04, 1.8, (0, H + 3.8, 1.2), rotation=(0, 0, math.pi/2), segments=8, material=mat_mast)
    
    # 5. Folded Fishing Nets & Crates on Deck
    create_cube("Net_Pile", (0.8, 0.35, 1.2), (0.35, H + 0.175, 2.2), mat_net)
    
    export_glb(os.path.join(OUT_DIR, "prop_coastal_boat.glb"))

# ==============================================================================
# MAIN RUNNER
# ==============================================================================
if __name__ == "__main__":
    print("================================================================")
    print("=== BLENDER 5.3: GENERATING QUALITY SEAVIEW TOWN GLB ASSETS ===")
    print("================================================================")
    generate_coastal_arcade()
    generate_heritage_villa()
    generate_lighthouse()
    generate_coconut_palm()
    generate_auto_rickshaw()
    generate_coastal_streetlamp()
    generate_promenade_bench()
    generate_utility_pole()
    generate_coastal_boat()
    print("\n[COMPLETE] All 9 high-quality reference district GLB assets exported successfully!")
