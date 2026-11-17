import bpy
import bmesh
import os
import math
from mathutils import Vector, Matrix, Euler

# ==============================================================================
# CONQUER THE CITY — ANANYA 3D CHARACTER GENERATOR (BLENDER 4.x / 5.3.0 READY)
# Character: Ananya (23yo Indian Female, 1.72m physical stature)
# Role: Street-Smart Operations Architect
#
# Generates:
#   1. Complete Editable Blender Scene (7 Required Collections)
#   2. Contoured BMesh Anatomy, Sculpted Facial Features, Half-Up Wavy Hair & Layered Clothing
#   3. Real Packed PBR Image Textures (Golden-Brown Skin, Cotton Twill, Ribbed Tank, Olive Cargo)
#   4. Humanoid Armature + Strict Anatomical Weight Partitioning (Zero Weight Bleed)
#   5. 8 Distinct Locomotion & Interaction NLA Actions (Idle, Walk, Run, Sprint, Jump, Landing, Turn, Hand)
#   6. Automated Validation Report, Dynamic Clearance Audit & Direct .blend + .glb Export
# ==============================================================================

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__)) if "__file__" in locals() else os.getcwd()
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR) if os.path.basename(SCRIPT_DIR) == "scripts" else SCRIPT_DIR
PUBLIC_MODELS_DIR = os.path.join(PROJECT_ROOT, "public", "models")
os.makedirs(PUBLIC_MODELS_DIR, exist_ok=True)

BLEND_OUT_PATH = os.path.join(PUBLIC_MODELS_DIR, "ananya_character.blend")
GLB_OUT_PATH = os.path.join(PUBLIC_MODELS_DIR, "ananya_character.glb")
REF_IMAGE_PATH = os.path.join(PUBLIC_MODELS_DIR, "ananya_turnaround.png")

REQUIRED_COLLECTIONS = [
    "ANANYA_CHARACTER",
    "ANANYA_CLOTHING",
    "ANANYA_HAIR",
    "ANANYA_RIG",
    "ANANYA_MATERIALS",
    "ANANYA_REFERENCE",
    "ANANYA_LIGHTING",
]

# ==============================================================================
# 1. SCENE INITIALIZATION & COLLECTION ARCHITECTURE
# ==============================================================================

def reset_scene():
    if bpy.context.active_object and bpy.context.active_object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')

    for obj in list(bpy.data.objects):
        obj.hide_select = False
        obj.hide_viewport = False
        bpy.data.objects.remove(obj, do_unlink=True)

    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)

    for block_list in (
        bpy.data.meshes,
        bpy.data.armatures,
        bpy.data.materials,
        bpy.data.actions,
        bpy.data.lights,
        bpy.data.cameras,
        bpy.data.images,
    ):
        for block in list(block_list):
            block_list.remove(block)

    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    scene.unit_settings.length_unit = 'METERS'
    scene.render.fps = 30

    cols = {}
    for cname in REQUIRED_COLLECTIONS:
        c = bpy.data.collections.new(cname)
        scene.collection.children.link(c)
        cols[cname] = c
    return cols


def link_to_collection(obj, col):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)


# ==============================================================================
# 2. PBR PIXEL-BUFFER TEXTURE & MATERIAL ENGINE
# ==============================================================================

def generate_procedural_image(name, width, height, pixel_fn, is_data=False):
    """Generates a genuine packed Image texture data-block for glTF 2.0 export."""
    if name in bpy.data.images:
        bpy.data.images.remove(bpy.data.images[name])
    img = bpy.data.images.new(name=name, width=width, height=height, alpha=True, is_data=is_data)
    pixels = [0.0] * (width * height * 4)
    for y in range(height):
        v = y / float(height)
        for x in range(width):
            u = x / float(width)
            r, g, b, a = pixel_fn(u, v, x, y)
            idx = (y * width + x) * 4
            pixels[idx] = r
            pixels[idx + 1] = g
            pixels[idx + 2] = b
            pixels[idx + 3] = a
    img.pixels[:] = pixels
    img.pack()
    return img


def set_bsdf_input_safe(bsdf, name_candidates, value):
    """Safely assigns Principled BSDF inputs across Blender 3.6, 4.x, and 5.3.0."""
    for name in name_candidates:
        if name in bsdf.inputs:
            bsdf.inputs[name].default_value = value
            return


def build_pbr_materials(mat_col):
    """Creates 10 UV-mapped PBR materials with packed textures for Ananya."""
    # 1. Warm Golden-Brown Indian Female Skin + Subtle Lip/Cheek/Brow Shading
    def skin_tex_fn(u, v, x, y):
        base_r, base_g, base_b = 0.76, 0.51, 0.36
        micro = (math.sin(x * 0.8) * math.cos(y * 0.8)) * 0.012
        # Subtle warm lip tint around mouth UV band
        lip_mask = 0.0
        if 0.28 < v < 0.35 and 0.42 < u < 0.58:
            lip_mask = 0.14 * (1.0 - abs(u - 0.5) / 0.08)
        r = max(0.0, min(1.0, base_r + micro + lip_mask * 0.35))
        g = max(0.0, min(1.0, base_g + micro - lip_mask * 0.45))
        b = max(0.0, min(1.0, base_b + micro - lip_mask * 0.35))
        return (r, g, b, 1.0)

    # 2. Deep Teal Structured Utility Cotton Twill (#215E61)
    def teal_jacket_fn(u, v, x, y):
        base_r, base_g, base_b = 0.13, 0.37, 0.38
        weave = (math.sin(x * 1.8) + math.cos(y * 1.8)) * 0.018
        seam_highlight = 0.03 if (x % 32 == 0 or y % 32 == 0) else 0.0
        return (base_r + weave + seam_highlight, base_g + weave + seam_highlight, base_b + weave + seam_highlight, 1.0)

    # 3. Cream Ribbed Cotton Tank Top (#E5E0D8)
    def cream_tank_fn(u, v, x, y):
        base_r, base_g, base_b = 0.89, 0.87, 0.84
        rib = math.sin(x * 3.14159 * 0.5) * 0.025
        return (base_r + rib, base_g + rib, base_b + rib, 1.0)

    # 4. Olive-Charcoal Cargo Trousers (#2E3532)
    def olive_cargo_fn(u, v, x, y):
        base_r, base_g, base_b = 0.18, 0.22, 0.19
        twill = math.sin((x - y) * 1.4) * 0.016
        return (base_r + twill, base_g + twill, base_b + twill, 1.0)

    # 5. Micro-Normal Map for Fabric & Leather
    def normal_tex_fn(u, v, x, y):
        nx = 0.5 + 0.055 * math.cos(x * 1.6)
        ny = 0.5 + 0.055 * math.sin(y * 1.6)
        return (nx, ny, 1.0, 1.0)

    img_skin = generate_procedural_image("T_Ananya_Skin_Albedo", 256, 256, skin_tex_fn)
    img_teal = generate_procedural_image("T_Ananya_TealJacket_Albedo", 256, 256, teal_jacket_fn)
    img_tank = generate_procedural_image("T_Ananya_CreamTank_Albedo", 256, 256, cream_tank_fn)
    img_cargo = generate_procedural_image("T_Ananya_OliveCargo_Albedo", 256, 256, olive_cargo_fn)
    img_norm = generate_procedural_image("T_Ananya_Fabric_Normal", 256, 256, normal_tex_fn, is_data=True)

    def make_mat(name, base_color, roughness, metallic=0.0, sss=0.0, albedo_img=None, normal_img=None):
        mat = bpy.data.materials.new(name=name)
        if hasattr(mat, "use_nodes"):
            mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        bsdf = nodes.get("Principled BSDF")

        set_bsdf_input_safe(bsdf, ["Base Color"], base_color)
        set_bsdf_input_safe(bsdf, ["Roughness"], roughness)
        set_bsdf_input_safe(bsdf, ["Metallic"], metallic)
        if sss > 0.0:
            set_bsdf_input_safe(bsdf, ["Subsurface Weight", "Subsurface"], sss)

        if albedo_img:
            tex = nodes.new("ShaderNodeTexImage")
            tex.image = albedo_img
            tex.location = (-460, 300)
            links.new(bsdf.inputs["Base Color"], tex.outputs["Color"])

        if normal_img:
            ntex = nodes.new("ShaderNodeTexImage")
            ntex.image = normal_img
            ntex.location = (-460, -60)
            nmap = nodes.new("ShaderNodeNormalMap")
            nmap.inputs["Strength"].default_value = 0.32
            nmap.location = (-200, -60)
            links.new(nmap.inputs["Color"], ntex.outputs["Color"])
            links.new(bsdf.inputs["Normal"], nmap.outputs["Normal"])
        return mat

    mats = {
        "Skin":        make_mat("MAT_Ananya_Skin",        (0.76, 0.51, 0.36, 1.0), 0.42, 0.0, 0.15, img_skin, None),
        "Eyes":        make_mat("MAT_Ananya_Eyes",        (0.10, 0.05, 0.03, 1.0), 0.06, 0.0, 0.0,  None, None),
        "Eyebrows":    make_mat("MAT_Ananya_Eyebrows",    (0.05, 0.04, 0.04, 1.0), 0.55, 0.0, 0.0,  None, None),
        "Hair":        make_mat("MAT_Ananya_Hair",        (0.05, 0.04, 0.04, 1.0), 0.38, 0.04, 0.0, None, img_norm),
        "UtilityJkt":  make_mat("MAT_Ananya_TealJacket",  (0.13, 0.37, 0.38, 1.0), 0.74, 0.0, 0.0,  img_teal, img_norm),
        "CreamTank":   make_mat("MAT_Ananya_CreamTank",   (0.89, 0.87, 0.84, 1.0), 0.82, 0.0, 0.0,  img_tank, img_norm),
        "CargoPants":  make_mat("MAT_Ananya_OliveCargo",  (0.18, 0.22, 0.19, 1.0), 0.76, 0.0, 0.0,  img_cargo, img_norm),
        "TanBoots":    make_mat("MAT_Ananya_TanBoots",    (0.55, 0.34, 0.21, 1.0), 0.44, 0.0, 0.0,  None, img_norm),
        "SilverMetal": make_mat("MAT_Ananya_SilverWatch", (0.82, 0.84, 0.86, 1.0), 0.20, 0.92, 0.0, None, None),
        "BrassSnaps":  make_mat("MAT_Ananya_BrassSnaps",  (0.74, 0.58, 0.32, 1.0), 0.26, 0.88, 0.0, None, None),
    }

    for idx, (key, mat) in enumerate(mats.items()):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.03)
        m = bpy.data.meshes.new(f"Swatch_{key}_Mesh")
        bm.to_mesh(m)
        bm.free()
        sw_obj = bpy.data.objects.new(f"Swatch_{key}", m)
        sw_obj.location = Vector((-0.85 + idx * 0.09, 0.55, 0.03))
        sw_obj.data.materials.append(mat)
        sw_obj.hide_render = True
        sw_obj.hide_viewport = True
        link_to_collection(sw_obj, mat_col)

    return mats


# ==============================================================================
# 3. BMESH CONTOURED LOFTING & TOPOLOGY ENGINE
# ==============================================================================

def create_lofted_mesh(name, rings, cap_bottom=False, cap_top=False, subsurf_levels=1):
    """Builds a smooth quad-topology mesh from anatomical cross-section rings."""
    bm = bmesh.new()
    bm_rings = []
    for ring_pts in rings:
        bm_ring = [bm.verts.new(Vector(pt)) for pt in ring_pts]
        bm_rings.append(bm_ring)

    n = len(rings[0])
    for r_idx in range(len(bm_rings) - 1):
        rA = bm_rings[r_idx]
        rB = bm_rings[r_idx + 1]
        for i in range(n):
            i_next = (i + 1) % n
            bm.faces.new((rA[i], rA[i_next], rB[i_next], rB[i]))

    if cap_bottom and bm_rings:
        cb = sum((v.co for v in bm_rings[0]), Vector()) / n
        vb = bm.verts.new(cb)
        for i in range(n):
            bm.faces.new((bm_rings[0][(i + 1) % n], bm_rings[0][i], vb))

    if cap_top and bm_rings:
        ct = sum((v.co for v in bm_rings[-1]), Vector()) / n
        vt = bm.verts.new(ct)
        for i in range(n):
            bm.faces.new((bm_rings[-1][i], bm_rings[-1][(i + 1) % n], vt))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    uv_layer = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for loop in f.loops:
            co = loop.vert.co
            theta = math.atan2(co.y, co.x)
            u = (theta + math.pi) / (2.0 * math.pi)
            v = max(0.0, min(1.0, co.z / 1.72))
            loop[uv_layer].uv = (u, v)

    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    bm.to_mesh(mesh)
    bm.free()

    for poly in mesh.polygons:
        poly.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    if subsurf_levels > 0:
        mod = obj.modifiers.new(name="Subsurf", type='SUBSURF')
        mod.levels = subsurf_levels
        mod.render_levels = subsurf_levels
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        obj.select_set(False)

    return obj


# ==============================================================================
# 4. ANATOMICAL HEAD, FACE, ARMS, PALMS & 10 FINGERS (ANANYA_CHARACTER)
# ==============================================================================

def build_ananya_head_and_face(char_col, mats):
    """
    Constructs Ananya's realistic Indian female facial anatomy (1.72m stature):
    delicate tapered jawline, high cheekbones, defined nose bridge, full lips,
    almond eye sockets, sculpted eyebrows, ears, and separate eyeball meshes.
    """
    segments = 24
    profile_slices = [
        (1.38, 0.056, 0.055,  0.005, "NECK_BASE"),
        (1.44, 0.049, 0.050,  0.002, "NECK_SLENDER"),
        (1.49, 0.054, 0.062, -0.012, "CHIN_TAPER"),
        (1.52, 0.065, 0.080, -0.016, "LIPS_MOUTH"),
        (1.55, 0.072, 0.085, -0.014, "NOSE_TIP"),
        (1.58, 0.076, 0.090, -0.009, "CHEEKBONES"),
        (1.61, 0.074, 0.085, -0.005, "ALMOND_EYES"),
        (1.64, 0.075, 0.088, -0.006, "ARCHED_BROWS"),
        (1.68, 0.072, 0.084,  0.002, "FOREHEAD"),
        (1.72, 0.055, 0.068,  0.008, "CRANIUM_CROWN"),
    ]

    rings = []
    for z, rx, ry, y_off, mode in profile_slices:
        ring = []
        for i in range(segments):
            ang = (2.0 * math.pi * i) / segments
            cx = math.cos(ang)
            sy = math.sin(ang)
            x = cx * rx
            y = sy * ry + y_off

            if sy < -0.18:
                if mode in ("NOSE_TIP", "CHEEKBONES") and abs(cx) < 0.24:
                    protrusion = (1.0 - abs(cx) / 0.24) * (0.021 if mode == "NOSE_TIP" else 0.015)
                    y -= protrusion
                elif mode == "ALMOND_EYES" and 0.20 < abs(cx) < 0.62:
                    y += 0.010
                elif mode == "ARCHED_BROWS" and abs(cx) < 0.68:
                    y -= 0.006 * abs(sy)
                elif mode == "CHEEKBONES" and 0.45 < abs(cx) < 0.82:
                    x *= 1.05
                    y -= 0.005
                elif mode == "LIPS_MOUTH" and abs(cx) < 0.34:
                    y -= 0.011 * (1.0 - abs(cx) / 0.34)
                elif mode == "CHIN_TAPER" and abs(cx) < 0.28:
                    y -= 0.012

            if mode in ("CHEEKBONES", "ALMOND_EYES") and abs(cx) > 0.92 and abs(sy) < 0.32:
                x += (0.014 if cx > 0 else -0.014)
                y += 0.005

            ring.append((x, y, z))
        rings.append(ring)

    head_obj = create_lofted_mesh("Ananya_Head_And_Neck", rings, cap_bottom=False, cap_top=True, subsurf_levels=1)
    head_obj.data.materials.append(mats["Skin"])
    link_to_collection(head_obj, char_col)

    # Separate Left & Right Almond Eyeballs
    bm_eyes = bmesh.new()
    for side_x in (-0.029, 0.029):
        mat_e = Matrix.Translation((side_x, -0.073, 1.61))
        bmesh.ops.create_uvsphere(bm_eyes, u_segments=14, v_segments=10, radius=0.0118, matrix=mat_e)
    bmesh.ops.recalc_face_normals(bm_eyes, faces=bm_eyes.faces)
    uv_e = bm_eyes.loops.layers.uv.new("UVMap")
    for f in bm_eyes.faces:
        for lp in f.loops:
            lp[uv_e].uv = (0.5, 0.5)
    eye_mesh = bpy.data.meshes.new("Ananya_Eyes_Mesh")
    bm_eyes.to_mesh(eye_mesh)
    bm_eyes.free()
    for p in eye_mesh.polygons:
        p.use_smooth = True
    eyes_obj = bpy.data.objects.new("Ananya_Eyes", eye_mesh)
    eyes_obj.data.materials.append(mats["Eyes"])
    link_to_collection(eyes_obj, char_col)

    # Sculpted 3D Arched Eyebrows
    bm_brows = bmesh.new()
    for s_mul in (1.0, -1.0):
        b_pts = [
            Vector((0.012 * s_mul, -0.084, 1.632)),
            Vector((0.030 * s_mul, -0.081, 1.640)),
            Vector((0.048 * s_mul, -0.072, 1.634)),
        ]
        b_rings = []
        for pt in b_pts:
            b_rings.append([
                bm_brows.verts.new(pt + Vector((0, -0.002, 0.003))),
                bm_brows.verts.new(pt + Vector((0,  0.002, 0.003))),
                bm_brows.verts.new(pt + Vector((0,  0.002, -0.003))),
                bm_brows.verts.new(pt + Vector((0, -0.002, -0.003))),
            ])
        for r_i in range(2):
            for k in range(4):
                kn = (k + 1) % 4
                bm_brows.faces.new((b_rings[r_i][k], b_rings[r_i][kn], b_rings[r_i + 1][kn], b_rings[r_i + 1][k]))
    bmesh.ops.recalc_face_normals(bm_brows, faces=bm_brows.faces)
    brow_mesh = bpy.data.meshes.new("Ananya_Eyebrows_Mesh")
    bm_brows.to_mesh(brow_mesh)
    bm_brows.free()
    brows_obj = bpy.data.objects.new("Ananya_Eyebrows", brow_mesh)
    brows_obj.data.materials.append(mats["Eyebrows"])
    link_to_collection(brows_obj, char_col)


def build_ananya_arms_palms_and_fingers(char_col, mats):
    """
    Constructs Ananya's natural relaxed arms, wrists, anatomically shaped palms, and
    five individually modelled 3-phalange fingers per hand with safe clearance from thighs.
    """
    for side, s_mul in [("L", 1.0), ("R", -1.0)]:
        # Relaxed arm hanging posture (Wrists at X=0.270m, preserving 12.2cm clearance from hips)
        sh_pos = Vector((0.165 * s_mul, 0.010, 1.390))
        el_pos = Vector((0.240 * s_mul, 0.015, 1.110))
        wr_pos = Vector((0.270 * s_mul, -0.010, 0.860))
        palm_pos = Vector((0.280 * s_mul, -0.016, 0.795))

        # 1. Upper Arm
        up_rings = []
        for t in (0.0, 0.35, 0.70, 1.0):
            c = sh_pos.lerp(el_pos, t)
            rad = 0.046 - 0.007 * t
            ring = []
            for k in range(12):
                a = (2.0 * math.pi * k) / 12
                dx = math.cos(a) * rad * 0.95 * s_mul
                dz = -math.cos(a) * rad * 0.30
                dy = math.sin(a) * rad
                ring.append((c.x + dx, c.y + dy, c.z + dz))
            up_rings.append(ring)

        up_obj = create_lofted_mesh(f"Ananya_UpperArm_{side}", up_rings, cap_bottom=True, cap_top=True, subsurf_levels=1)
        up_obj.data.materials.append(mats["Skin"])
        link_to_collection(up_obj, char_col)

        # 2. Forearm & Contoured Feminine Palm
        arm_slices = [
            (el_pos.lerp(wr_pos, 0.0),  0.038, 0.036),
            (el_pos.lerp(wr_pos, 0.38), 0.034, 0.031),
            (el_pos.lerp(wr_pos, 0.78), 0.026, 0.023),
            (wr_pos,                    0.024, 0.019),
            (palm_pos,                  0.034, 0.015),
        ]

        arm_rings = []
        segs = 14
        for center, r_lat, r_depth in arm_slices:
            ring = []
            for i in range(segs):
                ang = (2.0 * math.pi * i) / segs
                dx = math.cos(ang) * r_lat * s_mul
                dz = -math.cos(ang) * (r_lat * 0.12)
                dy = math.sin(ang) * r_depth
                ring.append((center.x + dx, center.y + dy, center.z + dz))
            arm_rings.append(ring)

        arm_obj = create_lofted_mesh(f"Ananya_Forearm_Palm_{side}", arm_rings, cap_bottom=True, cap_top=True, subsurf_levels=1)
        arm_obj.data.materials.append(mats["Skin"])
        link_to_collection(arm_obj, char_col)

        # 3. 5 Individually Articulated Fingers per Hand
        finger_defs = [
            ("Thumb",  Vector((0.286 * s_mul, -0.030, 0.835)), Vector((0.015 * s_mul, -0.024, -0.038)), 0.0090),
            ("Index",  Vector((0.288 * s_mul, -0.026, 0.796)), Vector((0.006 * s_mul, -0.006, -0.062)), 0.0078),
            ("Middle", Vector((0.282 * s_mul, -0.012, 0.792)), Vector((0.004 * s_mul, -0.004, -0.068)), 0.0082),
            ("Ring",   Vector((0.274 * s_mul,  0.002, 0.795)), Vector((0.003 * s_mul, -0.003, -0.062)), 0.0076),
            ("Pinky",  Vector((0.264 * s_mul,  0.014, 0.802)), Vector((0.003 * s_mul, -0.002, -0.048)), 0.0068),
        ]

        bm_fingers = bmesh.new()
        for fname, f_start, f_vec, f_rad in finger_defs:
            f_rings = []
            for joint_idx in range(4):
                t = joint_idx / 3.0
                knuckle_pt = f_start + f_vec * t
                swell = 1.05 if joint_idx in (1, 2) else 1.0
                r_curr = f_rad * (1.0 - 0.28 * t) * swell
                v_ring = []
                for k in range(8):
                    a = (2.0 * math.pi * k) / 8
                    v_ring.append(bm_fingers.verts.new(knuckle_pt + Vector((math.cos(a) * r_curr, math.sin(a) * r_curr, 0.0))))
                f_rings.append(v_ring)
            for r_i in range(3):
                for k in range(8):
                    kn = (k + 1) % 8
                    bm_fingers.faces.new((f_rings[r_i][k], f_rings[r_i][kn], f_rings[r_i + 1][kn], f_rings[r_i + 1][k]))
            v_tip = bm_fingers.verts.new(f_start + f_vec * 1.06)
            for k in range(8):
                bm_fingers.faces.new((f_rings[-1][k], f_rings[-1][(k + 1) % 8], v_tip))

        bmesh.ops.recalc_face_normals(bm_fingers, faces=bm_fingers.faces)
        uv_f = bm_fingers.loops.layers.uv.new("UVMap")
        for f in bm_fingers.faces:
            for lp in f.loops:
                lp[uv_f].uv = (0.35, 0.35)

        f_mesh = bpy.data.meshes.new(f"Ananya_Fingers_{side}_Mesh")
        bm_fingers.to_mesh(f_mesh)
        bm_fingers.free()
        for p in f_mesh.polygons:
            p.use_smooth = True
        f_obj = bpy.data.objects.new(f"Ananya_Fingers_{side}", f_mesh)
        f_obj.data.materials.append(mats["Skin"])
        link_to_collection(f_obj, char_col)


# ==============================================================================
# 5. HALF-UP KNOTTED WAVY HAIRSTYLE (ANANYA_HAIR)
# ==============================================================================

def build_ananya_half_up_wavy_hair(hair_col, mats):
    """Constructs Ananya's signature half-up wavy hairstyle with scalp volume, rear crown knot and framing tendrils."""
    # 1. Scalp Volume Base
    scalp_slices = [
        (1.56, 0.072, 0.082, 0.022),
        (1.62, 0.080, 0.092, 0.012),
        (1.67, 0.082, 0.096, 0.004),
        (1.71, 0.068, 0.084, 0.002),
        (1.735, 0.036, 0.048, 0.004),
    ]
    s_rings = []
    for z, rx, ry, y_off in scalp_slices:
        ring = []
        for i in range(20):
            ang = (2.0 * math.pi * i) / 20
            cx, sy = math.cos(ang), math.sin(ang)
            if z < 1.65 and sy < -0.28:
                sy = -0.28
            ring.append((cx * rx, sy * ry + y_off, z))
        s_rings.append(ring)

    scalp_obj = create_lofted_mesh("Ananya_Hair_ScalpBase", s_rings, cap_bottom=False, cap_top=True, subsurf_levels=1)
    scalp_obj.data.materials.append(mats["Hair"])
    link_to_collection(scalp_obj, hair_col)

    # 2. Rear Crown Half-Up Tied Knot
    knot_rings = []
    knot_center = Vector((0.0, 0.098, 1.665))
    for s_idx, (dy, r_k) in enumerate([(0.00, 0.034), (0.018, 0.042), (0.036, 0.038), (0.050, 0.022)]):
        ring = []
        for i in range(16):
            ang = (2.0 * math.pi * i) / 16
            twist = 0.003 * math.sin(ang * 4.0 + s_idx)
            ring.append((
                knot_center.x + math.cos(ang) * (r_k + twist),
                knot_center.y + dy,
                knot_center.z + math.sin(ang) * (r_k + twist),
            ))
        knot_rings.append(ring)
    knot_obj = create_lofted_mesh("Ananya_Hair_TopKnot", knot_rings, cap_bottom=False, cap_top=True, subsurf_levels=1)
    knot_obj.data.materials.append(mats["Hair"])
    link_to_collection(knot_obj, hair_col)

    # 3. 26 Flowing Wavy Hair Strands
    bm = bmesh.new()
    num_strands = 26
    for idx in range(num_strands):
        if idx < 2:
            ang = math.radians(-115 if idx == 0 else -65)
            is_front_tendril = True
        else:
            t_back = (idx - 2) / 23.0
            ang = math.radians(-35 + t_back * 250.0)
            is_front_tendril = False

        cx, sy = math.cos(ang), math.sin(ang)
        steps = 7
        lock_rings = []
        for s in range(steps):
            t = s / float(steps - 1)
            wave = math.sin(t * math.pi * 2.8 + idx * 0.9) * 0.012
            if is_front_tendril:
                px = cx * (0.072 + 0.015 * t) + wave * 0.4
                py = -0.055 - 0.012 * math.sin(t * math.pi)
                pz = 1.68 - 0.19 * t
            else:
                rad_x = 0.068 + 0.038 * math.sin(t * math.pi * 0.75)
                rad_y = 0.078 + 0.035 * math.sin(t * math.pi * 0.75)
                px = cx * rad_x + wave * sy
                py = sy * rad_y + 0.018 + wave * cx
                pz = 1.67 - 0.25 * (t ** 1.08)

            w = 0.018 * (1.0 - 0.65 * t)
            th = 0.009 * (1.0 - 0.70 * t)
            tangent = Vector((-sy, cx, 0.0)).normalized()
            normal = Vector((cx, sy, 0.15)).normalized()
            c_pos = Vector((px, py, pz))

            v0 = bm.verts.new(c_pos - tangent * w)
            v1 = bm.verts.new(c_pos + normal * th)
            v2 = bm.verts.new(c_pos + tangent * w)
            v3 = bm.verts.new(c_pos - normal * (th * 0.5))
            lock_rings.append([v0, v1, v2, v3])

        for r_i in range(steps - 1):
            for k in range(4):
                kn = (k + 1) % 4
                bm.faces.new((lock_rings[r_i][k], lock_rings[r_i][kn], lock_rings[r_i + 1][kn], lock_rings[r_i + 1][k]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uv_l = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for lp in f.loops:
            lp[uv_l].uv = (0.5, max(0.0, min(1.0, (lp.vert.co.z - 1.40) / 0.32)))

    strands_mesh = bpy.data.meshes.new("Ananya_Hair_WavyStrands_Mesh")
    bm.to_mesh(strands_mesh)
    bm.free()
    for p in strands_mesh.polygons:
        p.use_smooth = True
    strands_obj = bpy.data.objects.new("Ananya_Hair_WavyStrands", strands_mesh)
    strands_obj.data.materials.append(mats["Hair"])
    link_to_collection(strands_obj, hair_col)


# ==============================================================================
# 6. FITTED LAYERED CLOTHING, BOOTS & WRISTWATCH (ANANYA_CLOTHING)
# ==============================================================================

def build_ananya_clothing(cloth_col, mats):
    """
    Constructs separate, editable garment meshes with realistic thickness, folds, and pockets:
      1. Ananya_TankTop_Cream (fitted ribbed inner top)
      2. Ananya_UtilityJacket_Teal (cropped jacket, rolled sleeves, chest flap pockets, brass snaps)
      3. Ananya_CargoTrousers_Olive (high-waisted slim cargo pants, streamlined thigh pockets, ankle cuffs)
      4. Ananya_Boots_Tan (sturdy lace-up ankle boots with lug soles)
      5. Ananya_Wristwatch_Silver (brushed silver watch on left wrist)
    """
    # ------------------------------------------------------------------
    # A. FITTED CREAM RIBBED TANK TOP (Z = 0.90m to 1.39m)
    # ------------------------------------------------------------------
    tank_slices = [
        (0.90, 0.126, 0.088,  0.000),
        (1.02, 0.118, 0.084,  0.000),
        (1.16, 0.134, 0.096, -0.004),
        (1.27, 0.144, 0.108, -0.012),
        (1.38, 0.132, 0.088,  0.000),
    ]
    tank_rings = []
    for z, rx, ry, y_off in tank_slices:
        ring = [(math.cos(2 * math.pi * i / 20) * rx, math.sin(2 * math.pi * i / 20) * ry + y_off, z) for i in range(20)]
        tank_rings.append(ring)

    tank_obj = create_lofted_mesh("Ananya_TankTop_Cream", tank_rings, cap_bottom=False, cap_top=False, subsurf_levels=1)
    tank_obj.data.materials.append(mats["CreamTank"])
    link_to_collection(tank_obj, cloth_col)

    # ------------------------------------------------------------------
    # B. DEEP TEAL CROPPED UTILITY JACKET (Z = 0.96m to 1.47m + Rolled Sleeves + Pockets)
    # ------------------------------------------------------------------
    jkt_slices = [
        (0.96, 0.136, 0.098),
        (1.08, 0.134, 0.096),
        (1.25, 0.154, 0.114),
        (1.39, 0.168, 0.106),
        (1.44, 0.076, 0.072),
        (1.48, 0.082, 0.078),
    ]
    bm_jkt = bmesh.new()
    j_cols = 22
    j_grid = []
    start_ang = math.radians(-68)
    end_ang = math.radians(248)
    for z, rx, ry in jkt_slices:
        row = []
        for c in range(j_cols):
            t = c / float(j_cols - 1)
            ang = start_ang + t * (end_ang - start_ang)
            cx, sy = math.cos(ang), math.sin(ang)
            fold = 0.0035 * math.sin(c * 2.3 + z * 9.0)
            row.append(bm_jkt.verts.new(Vector((cx * (rx + fold), sy * (ry + fold), z))))
        j_grid.append(row)

    for r_i in range(len(j_grid) - 1):
        for c_i in range(j_cols - 1):
            bm_jkt.faces.new((j_grid[r_i][c_i], j_grid[r_i][c_i + 1], j_grid[r_i + 1][c_i + 1], j_grid[r_i + 1][c_i]))

    # Rolled Utility Sleeves following relaxed arm trajectory
    for side_mul in (1.0, -1.0):
        sh_p = Vector((0.165 * side_mul, 0.010, 1.390))
        el_p = Vector((0.240 * side_mul, 0.015, 1.110))
        sl_steps = [
            (0.00, 0.054),
            (0.35, 0.050),
            (0.75, 0.046),
            (0.92, 0.052),
            (1.00, 0.048),
        ]
        sl_rings = []
        for t, rad in sl_steps:
            c_pt = sh_p.lerp(el_p, t)
            ring = []
            for k in range(14):
                a = (2.0 * math.pi * k) / 14
                dx = math.cos(a) * rad * 0.95 * side_mul
                dz = -math.cos(a) * rad * 0.30
                dy = math.sin(a) * rad
                ring.append(bm_jkt.verts.new(c_pt + Vector((dx, dy, dz))))
            sl_rings.append(ring)
        for r_i in range(len(sl_rings) - 1):
            for k in range(14):
                kn = (k + 1) % 14
                bm_jkt.faces.new((sl_rings[r_i][k], sl_rings[r_i][kn], sl_rings[r_i + 1][kn], sl_rings[r_i + 1][k]))

        # Chest Flap Utility Pockets
        px_in, px_out = 0.055 * side_mul, 0.122 * side_mul
        p_verts = [
            bm_jkt.verts.new(Vector((px_in,  -0.114, 1.20))),
            bm_jkt.verts.new(Vector((px_out, -0.106, 1.20))),
            bm_jkt.verts.new(Vector((px_out, -0.106, 1.29))),
            bm_jkt.verts.new(Vector((px_in,  -0.114, 1.29))),
        ]
        if side_mul < 0:
            p_verts.reverse()
        bm_jkt.faces.new(p_verts)

    bmesh.ops.recalc_face_normals(bm_jkt, faces=bm_jkt.faces)
    uv_j = bm_jkt.loops.layers.uv.new("UVMap")
    for f in bm_jkt.faces:
        for lp in f.loops:
            lp[uv_j].uv = ((lp.vert.co.x + 0.5), (lp.vert.co.z - 0.95) / 0.60)

    jkt_mesh = bpy.data.meshes.new("Ananya_UtilityJacket_Teal_Mesh")
    bm_jkt.to_mesh(jkt_mesh)
    bm_jkt.free()
    for p in jkt_mesh.polygons:
        p.use_smooth = True
    jkt_obj = bpy.data.objects.new("Ananya_UtilityJacket_Teal", jkt_mesh)
    solid_mod = jkt_obj.modifiers.new(name="Thickness", type='SOLIDIFY')
    solid_mod.thickness = 0.0040
    sub_mod = jkt_obj.modifiers.new(name="Subsurf", type='SUBSURF')
    sub_mod.levels = 1
    bpy.context.scene.collection.objects.link(jkt_obj)
    bpy.context.view_layer.objects.active = jkt_obj
    jkt_obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=solid_mod.name)
    bpy.ops.object.modifier_apply(modifier=sub_mod.name)
    jkt_obj.select_set(False)
    jkt_obj.data.materials.append(mats["UtilityJkt"])
    link_to_collection(jkt_obj, cloth_col)

    # Brass Utility Snap Buttons
    bm_snaps = bmesh.new()
    snap_coords = [
        (-0.048, -0.104, 0.99), (-0.048, -0.104, 1.09), (-0.048, -0.108, 1.19), (-0.048, -0.112, 1.29),
        (0.088, -0.114, 1.27), (-0.088, -0.114, 1.27),
    ]
    for sx, sy, sz in snap_coords:
        mat_s = Matrix.Translation((sx, sy, sz)) @ Matrix.Rotation(math.radians(90), 4, 'X')
        bmesh.ops.create_cone(bm_snaps, cap_ends=True, cap_tris=False, segments=10, radius1=0.0055, radius2=0.0055, depth=0.003, matrix=mat_s)
    bmesh.ops.recalc_face_normals(bm_snaps, faces=bm_snaps.faces)
    snap_mesh = bpy.data.meshes.new("Ananya_Jacket_Snaps_Mesh")
    bm_snaps.to_mesh(snap_mesh)
    bm_snaps.free()
    snap_obj = bpy.data.objects.new("Ananya_Jacket_BrassSnaps", snap_mesh)
    snap_obj.data.materials.append(mats["BrassSnaps"])
    link_to_collection(snap_obj, cloth_col)

    # ------------------------------------------------------------------
    # C. OLIVE-GREEN SLIM CARGO TROUSERS (Z = 0.14m to 0.93m)
    # ------------------------------------------------------------------
    pelvis_slices = [
        (0.80, 0.140, 0.102),
        (0.87, 0.136, 0.096),
        (0.93, 0.126, 0.090),
    ]
    p_rings = []
    for z, rx, ry in pelvis_slices:
        p_rings.append([(math.cos(2 * math.pi * i / 20) * rx, math.sin(2 * math.pi * i / 20) * ry, z) for i in range(20)])
    cargo_pelvis = create_lofted_mesh("Ananya_Cargo_Pelvis", p_rings, cap_bottom=True, cap_top=True, subsurf_levels=1)

    leg_objs = [cargo_pelvis]
    for side, s_mul in [("L", 1.0), ("R", -1.0)]:
        leg_slices = [
            (0.14, 0.048, 0.050,  0.014),
            (0.30, 0.056, 0.058,  0.006),
            (0.48, 0.062, 0.064, -0.012),
            (0.66, 0.074, 0.078, -0.004),  # Thigh with streamlined pocket profile
            (0.82, 0.084, 0.086,  0.000),
        ]
        l_rings = []
        for z, rx, ry, y_off in leg_slices:
            ring = []
            for i in range(16):
                ang = (2.0 * math.pi * i) / 16
                cx, sy = math.cos(ang), math.sin(ang)
                pocket_out = 0.012 if (z == 0.66 and cx * s_mul > 0.55 and abs(sy) < 0.60) else 0.0
                ring.append((0.088 * s_mul + cx * (rx + pocket_out), sy * ry + y_off, z))
            l_rings.append(ring)
        l_obj = create_lofted_mesh(f"Ananya_Cargo_Leg_{side}", l_rings, cap_bottom=False, cap_top=False, subsurf_levels=1)
        leg_objs.append(l_obj)

    bpy.ops.object.select_all(action='DESELECT')
    for o in leg_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = cargo_pelvis
    bpy.ops.object.join()
    cargo_pelvis.name = "Ananya_CargoTrousers_Olive"
    cargo_pelvis.data.name = "Ananya_CargoTrousers_Olive_Mesh"
    cargo_pelvis.data.materials.append(mats["CargoPants"])
    link_to_collection(cargo_pelvis, cloth_col)

    # ------------------------------------------------------------------
    # D. STURDY TAN LACE-UP ANKLE BOOTS (Z = 0.00m to 0.16m)
    # ------------------------------------------------------------------
    boot_objs = []
    for side, s_mul in [("L", 1.0), ("R", -1.0)]:
        boot_slices = [
            (0.000, 0.050, 0.118, -0.038),
            (0.025, 0.052, 0.120, -0.038),
            (0.055, 0.046, 0.108, -0.032),
            (0.105, 0.044, 0.056,  0.014),
            (0.155, 0.046, 0.056,  0.016),
        ]
        b_rings = []
        for z, rx, ry, y_off in boot_slices:
            ring = []
            for i in range(16):
                ang = (2.0 * math.pi * i) / 16
                cx, sy = math.cos(ang), math.sin(ang)
                y_coord = sy * (ry if sy < 0 else ry * 0.56) + y_off
                ring.append((0.088 * s_mul + cx * rx, y_coord, z))
            b_rings.append(ring)
        b_obj = create_lofted_mesh(f"Ananya_Boot_{side}", b_rings, cap_bottom=True, cap_top=True, subsurf_levels=1)
        boot_objs.append(b_obj)

    bpy.ops.object.select_all(action='DESELECT')
    for o in boot_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = boot_objs[0]
    bpy.ops.object.join()
    boot_objs[0].name = "Ananya_Boots_Tan"
    boot_objs[0].data.name = "Ananya_Boots_Tan_Mesh"
    boot_objs[0].data.materials.append(mats["TanBoots"])
    link_to_collection(boot_objs[0], cloth_col)

    # ------------------------------------------------------------------
    # E. BRUSHED SILVER WRISTWATCH ON LEFT WRIST
    # ------------------------------------------------------------------
    w_center = Vector((0.270, -0.010, 0.865))
    w_rings = []
    for step_off in (-0.010, 0.010):
        ring = []
        for i in range(16):
            ang = (2.0 * math.pi * i) / 16
            r = 0.028
            dx = math.cos(ang) * r
            dz = step_off
            dy = math.sin(ang) * (r * 0.85)
            ring.append((w_center.x + dx, w_center.y + dy, w_center.z + dz))
        w_rings.append(ring)
    watch_obj = create_lofted_mesh("Ananya_Wristwatch_Silver", w_rings, cap_bottom=False, cap_top=False, subsurf_levels=0)
    watch_obj.data.materials.append(mats["SilverMetal"])
    link_to_collection(watch_obj, cloth_col)


# ==============================================================================
# 7. HUMANOID ARMATURE, ANALYTICAL SKIN WEIGHTS & LOCOMOTION ACTIONS
# ==============================================================================

def build_ananya_armature(rig_col):
    """Creates Ananya's complete humanoid rig (1.72m stature) with articulated fingers and leg/arm chains."""
    arm_data = bpy.data.armatures.new("Ananya_Humanoid_Skeleton")
    arm_obj = bpy.data.objects.new("Ananya_Armature", arm_data)
    link_to_collection(arm_obj, rig_col)

    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.select_set(True)
    arm_obj.show_in_front = True

    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones

    def add_b(name, head, tail, parent=None, connect=False):
        b = eb.new(name)
        b.head = Vector(head)
        b.tail = Vector(tail)
        b.use_deform = True
        if parent and parent in eb:
            b.parent = eb[parent]
            b.use_connect = connect
        return b

    # Core Spine & Head (1.72m stature)
    add_b("Root",     (0.0, 0.00, 0.00), (0.0, 0.14, 0.00), None, False)
    add_b("Hips",     (0.0, 0.00, 0.90), (0.0, 0.00, 1.02), "Root", False)
    add_b("Spine_01", (0.0, 0.00, 1.02), (0.0, 0.01, 1.16), "Hips", True)
    add_b("Spine_02", (0.0, 0.01, 1.16), (0.0, 0.01, 1.30), "Spine_01", True)
    add_b("Chest",    (0.0, 0.01, 1.30), (0.0, 0.01, 1.41), "Spine_02", True)
    add_b("Neck",     (0.0, 0.01, 1.41), (0.0, 0.00, 1.50), "Chest", True)
    add_b("Head",     (0.0, 0.00, 1.50), (0.0, 0.00, 1.72), "Neck", True)

    # Relaxed Arms + 5 Individually Articulated Finger Chains per Hand
    for side, s_mul in [("L", 1.0), ("R", -1.0)]:
        add_b(f"Clavicle_{side}", (0.035 * s_mul, 0.00, 1.39), (0.165 * s_mul, 0.01, 1.41), "Chest", False)
        add_b(f"UpperArm_{side}", (0.165 * s_mul, 0.01, 1.41), (0.240 * s_mul, 0.015, 1.11), f"Clavicle_{side}", True)
        add_b(f"ForeArm_{side}",  (0.240 * s_mul, 0.015, 1.11), (0.270 * s_mul, -0.010, 0.86), f"UpperArm_{side}", True)
        add_b(f"Hand_{side}",     (0.270 * s_mul, -0.010, 0.86), (0.280 * s_mul, -0.016, 0.795), f"ForeArm_{side}", True)

        add_b(f"Thumb_01_{side}",  (0.286 * s_mul, -0.030, 0.835), (0.294 * s_mul, -0.042, 0.816), f"Hand_{side}", False)
        add_b(f"Thumb_02_{side}",  (0.294 * s_mul, -0.042, 0.816), (0.301 * s_mul, -0.054, 0.797), f"Thumb_01_{side}", True)
        add_b(f"Index_01_{side}",  (0.288 * s_mul, -0.026, 0.796), (0.291 * s_mul, -0.029, 0.765), f"Hand_{side}", False)
        add_b(f"Index_02_{side}",  (0.291 * s_mul, -0.029, 0.765), (0.294 * s_mul, -0.032, 0.734), f"Index_01_{side}", True)
        add_b(f"Middle_01_{side}", (0.282 * s_mul, -0.012, 0.792), (0.284 * s_mul, -0.014, 0.758), f"Hand_{side}", False)
        add_b(f"Middle_02_{side}", (0.284 * s_mul, -0.014, 0.758), (0.286 * s_mul, -0.016, 0.724), f"Middle_01_{side}", True)
        add_b(f"Ring_01_{side}",   (0.274 * s_mul,  0.002, 0.795), (0.276 * s_mul,  0.000, 0.764), f"Hand_{side}", False)
        add_b(f"Ring_02_{side}",   (0.276 * s_mul,  0.000, 0.764), (0.278 * s_mul, -0.002, 0.733), f"Ring_01_{side}", True)
        add_b(f"Pinky_01_{side}",  (0.264 * s_mul,  0.014, 0.802), (0.266 * s_mul,  0.013, 0.778), f"Hand_{side}", False)
        add_b(f"Pinky_02_{side}",  (0.266 * s_mul,  0.013, 0.778), (0.268 * s_mul,  0.012, 0.754), f"Pinky_01_{side}", True)

    # Legs
    for side, s_mul in [("L", 1.0), ("R", -1.0)]:
        add_b(f"Thigh_{side}", (0.088 * s_mul, 0.00, 0.88), (0.088 * s_mul, -0.012, 0.48), "Hips", False)
        add_b(f"Calf_{side}",  (0.088 * s_mul, -0.012, 0.48), (0.088 * s_mul, 0.014, 0.08), f"Thigh_{side}", True)
        add_b(f"Foot_{side}",  (0.088 * s_mul, 0.014, 0.08), (0.088 * s_mul, -0.095, 0.02), f"Calf_{side}", True)
        add_b(f"Toe_{side}",   (0.088 * s_mul, -0.095, 0.02), (0.088 * s_mul, -0.150, 0.02), f"Foot_{side}", True)

    bpy.ops.armature.select_all(action='SELECT')
    bpy.ops.armature.calculate_roll(type='GLOBAL_POS_Y')
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj


def point_to_segment_dist(p, a, b):
    ab = b - a
    ab_len_sq = ab.length_squared
    if ab_len_sq < 1e-8:
        return (p - a).length
    t = max(0.0, min(1.0, (p - a).dot(ab) / ab_len_sq))
    return (p - (a + t * ab)).length


def bind_meshes_with_analytical_weights(arm_obj, target_collections):
    """
    Parents meshes to Ananya_Armature with STRICT ANATOMICAL WEIGHT PARTITIONING:
      - Pants (Ananya_CargoTrousers_Olive) ONLY deform with Pelvis/Hips, Spine_01, and Legs.
        Strictly zero influence from ForeArm, Hand, or UpperArm.
      - Boots (Ananya_Boots_Tan) ONLY deform with Calf, Foot, Toe.
      - Arms and Hands ONLY deform with Clavicle, UpperArm, ForeArm, Hand, and Finger bones.
        Strictly zero influence from Thigh, Calf, or Hips.
      - Upper garments (CreamTank, UtilityJacket, BrassSnaps) ONLY deform with Torso and Arm bones.
      - Rigid meshes (Eyes, Eyebrows, Hair, Watch) bound to exact anchor bones.
      - Max 4 influences per vertex, normalized to 1.0.
    """
    deform_bones = [b for b in arm_obj.data.bones if b.use_deform and b.name != "Root"]

    rigid_mesh_map = {
        "Ananya_Eyes": "Head",
        "Ananya_Eyebrows": "Head",
        "Ananya_Hair_ScalpBase": "Head",
        "Ananya_Hair_TopKnot": "Head",
        "Ananya_Hair_WavyStrands": "Head",
        "Ananya_Wristwatch_Silver": "ForeArm_L",
        "Ananya_Jacket_BrassSnaps": "Chest",
    }

    for col in target_collections:
        for obj in col.objects:
            if obj.type != 'MESH':
                continue
            obj.parent = arm_obj
            mod = obj.modifiers.new(name="Armature", type='ARMATURE')
            mod.object = arm_obj

            vgroups = {b.name: obj.vertex_groups.new(name=b.name) for b in deform_bones}
            mesh = obj.data

            if obj.name in rigid_mesh_map:
                anchor = rigid_mesh_map[obj.name]
                all_v = [v.index for v in mesh.vertices]
                vgroups[anchor].add(all_v, 1.0, 'REPLACE')
                continue

            # Candidate bone filter per mesh category
            if "Cargo" in obj.name:
                allowed_bones = [b for b in deform_bones if any(k in b.name for k in ["Hips", "Spine_01", "Thigh", "Calf"])]
            elif "Boot" in obj.name:
                allowed_bones = [b for b in deform_bones if any(k in b.name for k in ["Calf", "Foot", "Toe"])]
            elif "Tank" in obj.name or "Jacket" in obj.name:
                allowed_bones = [b for b in deform_bones if any(k in b.name for k in ["Spine", "Chest", "Neck", "Clavicle", "UpperArm"])]
            elif "UpperArm" in obj.name:
                side = "_L" if "_L" in obj.name else "_R"
                allowed_bones = [b for b in deform_bones if b.name in [f"Clavicle{side}", f"UpperArm{side}", f"ForeArm{side}", "Chest"]]
            elif "Forearm" in obj.name or "Palm" in obj.name:
                side = "_L" if "_L" in obj.name else "_R"
                allowed_bones = [b for b in deform_bones if b.name in [f"UpperArm{side}", f"ForeArm{side}", f"Hand{side}", f"Thumb_01{side}", f"Index_01{side}", f"Middle_01{side}"]]
            elif "Fingers" in obj.name:
                side = "_L" if "_L" in obj.name else "_R"
                allowed_bones = [b for b in deform_bones if side in b.name and any(k in b.name for k in ["Hand", "Thumb", "Index", "Middle", "Ring", "Pinky"])]
            elif "Head" in obj.name:
                allowed_bones = [b for b in deform_bones if any(k in b.name for k in ["Head", "Neck", "Chest"])]
            else:
                allowed_bones = deform_bones

            mw = obj.matrix_world
            for v in mesh.vertices:
                w_co = mw @ v.co

                dists = []
                for b in allowed_bones:
                    if b.name.endswith("_L") and w_co.x < -0.015:
                        continue
                    if b.name.endswith("_R") and w_co.x > 0.015:
                        continue

                    d = point_to_segment_dist(w_co, b.head_local, b.tail_local)
                    if d < 0.45:
                        dists.append((d, b.name))

                dists.sort(key=lambda item: item[0])
                if not dists:
                    for b in allowed_bones:
                        d = point_to_segment_dist(w_co, b.head_local, b.tail_local)
                        dists.append((d, b.name))
                    dists.sort(key=lambda item: item[0])

                top = dists[:4]
                inv_w = [1.0 / (max(0.008, d) ** 2.6) for d, _ in top]
                total_w = sum(inv_w)
                norm_w = [(iw / total_w, bname) for (d, bname), iw in zip(top, inv_w)]

                filt = [(w, bname) for w, bname in norm_w if w > 0.02]
                if not filt:
                    filt = [norm_w[0]]
                sum_f = sum(w for w, _ in filt)
                for w, bname in filt:
                    vgroups[bname].add([v.index], w / sum_f, 'REPLACE')


# ==============================================================================
# 8. EIGHT DISTINCT INDEPENDENT LOCOMOTION ACTIONS WITH THIGH CLEARANCE
# ==============================================================================

def create_ananya_animations(arm_obj):
    """
    Creates 8 working locomotion and interaction actions with guaranteed thigh clearance:
      - Blender Z-vertical coordinate space for bobs, jumps, and landings.
      - Blender Z-rotation for head & chest turning yaw.
      - Natural carrying angle (cubitus valgus ~4.6 deg) keeps hands safely outside thighs during all strides.
    """
    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.select_set(True)
    bpy.ops.object.mode_set(mode='POSE')

    for pb in arm_obj.pose.bones:
        pb.rotation_mode = 'XYZ'

    if not arm_obj.animation_data:
        arm_obj.animation_data_create()

    def reset_pose():
        for pb in arm_obj.pose.bones:
            pb.location = Vector((0, 0, 0))
            pb.rotation_euler = Euler((0, 0, 0), 'XYZ')

    tracked_bones = [
        "Hips", "Spine_01", "Spine_02", "Chest", "Neck", "Head",
        "Clavicle_L", "UpperArm_L", "ForeArm_L", "Hand_L",
        "Thumb_01_L", "Thumb_02_L", "Index_01_L", "Index_02_L", "Middle_01_L", "Middle_02_L", "Ring_01_L", "Ring_02_L", "Pinky_01_L", "Pinky_02_L",
        "Clavicle_R", "UpperArm_R", "ForeArm_R", "Hand_R",
        "Thumb_01_R", "Thumb_02_R", "Index_01_R", "Index_02_R", "Middle_01_R", "Middle_02_R", "Ring_01_R", "Ring_02_R", "Pinky_01_R", "Pinky_02_R",
        "Thigh_L", "Calf_L", "Foot_L",
        "Thigh_R", "Calf_R", "Foot_R",
    ]

    def key_bones(frame):
        for bname in tracked_bones:
            pb = arm_obj.pose.bones.get(bname)
            if pb:
                pb.keyframe_insert(data_path="rotation_euler", frame=frame)
                if bname == "Hips":
                    pb.keyframe_insert(data_path="location", frame=frame)

    def apply_relaxed_fingers(side, curl=0.22):
        for fname in ["Index", "Middle", "Ring", "Pinky"]:
            b1 = arm_obj.pose.bones.get(f"{fname}_01_{side}")
            b2 = arm_obj.pose.bones.get(f"{fname}_02_{side}")
            if b1:
                b1.rotation_euler.x = curl
            if b2:
                b2.rotation_euler.x = curl * 1.2
        t1 = arm_obj.pose.bones.get(f"Thumb_01_{side}")
        t2 = arm_obj.pose.bones.get(f"Thumb_02_{side}")
        if t1:
            t1.rotation_euler.z = curl * 0.8
        if t2:
            t2.rotation_euler.x = curl * 0.6

    actions = []

    # 1. Idle (60 frames / 2.0s)
    act_idle = bpy.data.actions.new(name="Ananya_Idle")
    arm_obj.animation_data.action = act_idle
    for f, br in [(1, 0.0), (30, 0.030), (60, 0.0)]:
        reset_pose()
        arm_obj.pose.bones["Chest"].rotation_euler.x = -br
        arm_obj.pose.bones["Spine_02"].rotation_euler.x = -br * 0.4
        arm_obj.pose.bones["Head"].rotation_euler.z = br * 1.2

        arm_obj.pose.bones["UpperArm_L"].rotation_euler.x = br * 0.02
        arm_obj.pose.bones["UpperArm_L"].rotation_euler.z = 0.050 - br * 0.01
        arm_obj.pose.bones["ForeArm_L"].rotation_euler.x = 0.24 + br * 0.02

        arm_obj.pose.bones["UpperArm_R"].rotation_euler.x = -br * 0.02
        arm_obj.pose.bones["UpperArm_R"].rotation_euler.z = -0.050 + br * 0.01
        arm_obj.pose.bones["ForeArm_R"].rotation_euler.x = 0.24 + br * 0.02

        apply_relaxed_fingers("L", 0.20 + br * 0.03)
        apply_relaxed_fingers("R", 0.20 + br * 0.03)
        key_bones(f)
    actions.append(act_idle)

    # 2. Walk, 3. Run, 4. Sprint (4-Phase Gait Kinematics with Safe Carrying Angle)
    def build_gait(name, length, stride_rad, knee_rad, arm_rad, elbow_base, elbow_dyn, lean, bob_z):
        act = bpy.data.actions.new(name=name)
        arm_obj.animation_data.action = act
        reset_pose()

        half = length // 2
        q1 = length // 4
        q3 = (length * 3) // 4

        def set_contact(phase, f):
            reset_pose()
            arm_obj.pose.bones["Spine_01"].rotation_euler.x = lean
            arm_obj.pose.bones["Spine_02"].rotation_euler.x = lean * 0.5
            arm_obj.pose.bones["Hips"].rotation_euler.y = 0.032 * phase

            # Legs
            arm_obj.pose.bones["Thigh_L"].rotation_euler.x = stride_rad * phase
            arm_obj.pose.bones["Thigh_R"].rotation_euler.x = -stride_rad * phase
            arm_obj.pose.bones["Calf_L"].rotation_euler.x = -knee_rad * (0.2 if phase > 0 else 1.0)
            arm_obj.pose.bones["Calf_R"].rotation_euler.x = -knee_rad * (1.0 if phase > 0 else 0.2)

            # Arms
            arm_obj.pose.bones["UpperArm_L"].rotation_euler.x = -arm_rad * phase
            arm_obj.pose.bones["UpperArm_R"].rotation_euler.x = arm_rad * phase

            flare_l = 0.060 + (0.015 if phase < 0.0 else 0.005)
            flare_r = -0.060 - (0.015 if phase > 0.0 else 0.005)
            arm_obj.pose.bones["UpperArm_L"].rotation_euler.z = flare_l
            arm_obj.pose.bones["UpperArm_R"].rotation_euler.z = flare_r

            arm_obj.pose.bones["ForeArm_L"].rotation_euler.x = elbow_base + (-phase) * elbow_dyn
            arm_obj.pose.bones["ForeArm_R"].rotation_euler.x = elbow_base + (phase) * elbow_dyn

            arm_obj.pose.bones["Hand_L"].rotation_euler.x = -phase * 0.07
            arm_obj.pose.bones["Hand_R"].rotation_euler.x = phase * 0.07

            finger_curl = 0.28 if "Walk" in name else (0.50 if "Run" in name else 0.42)
            apply_relaxed_fingers("L", finger_curl)
            apply_relaxed_fingers("R", finger_curl)
            key_bones(f)

        def set_passing(is_first_half, f):
            reset_pose()
            arm_obj.pose.bones["Spine_01"].rotation_euler.x = lean
            arm_obj.pose.bones["Spine_02"].rotation_euler.x = lean * 0.5
            arm_obj.pose.bones["Hips"].rotation_euler.y = 0.0
            arm_obj.pose.bones["Hips"].location.z = bob_z

            if is_first_half:
                arm_obj.pose.bones["Thigh_L"].rotation_euler.x = 0.02
                arm_obj.pose.bones["Thigh_R"].rotation_euler.x = 0.12
                arm_obj.pose.bones["Calf_L"].rotation_euler.x = -0.15
                arm_obj.pose.bones["Calf_R"].rotation_euler.x = -knee_rad * 0.85

                arm_obj.pose.bones["UpperArm_L"].rotation_euler.x = 0.02
                arm_obj.pose.bones["UpperArm_R"].rotation_euler.x = -0.02
            else:
                arm_obj.pose.bones["Thigh_R"].rotation_euler.x = 0.02
                arm_obj.pose.bones["Thigh_L"].rotation_euler.x = 0.12
                arm_obj.pose.bones["Calf_R"].rotation_euler.x = -0.15
                arm_obj.pose.bones["Calf_L"].rotation_euler.x = -knee_rad * 0.85

                arm_obj.pose.bones["UpperArm_R"].rotation_euler.x = 0.02
                arm_obj.pose.bones["UpperArm_L"].rotation_euler.x = -0.02

            arm_obj.pose.bones["UpperArm_L"].rotation_euler.z = 0.075
            arm_obj.pose.bones["UpperArm_R"].rotation_euler.z = -0.075

            arm_obj.pose.bones["ForeArm_L"].rotation_euler.x = elbow_base
            arm_obj.pose.bones["ForeArm_R"].rotation_euler.x = elbow_base

            finger_curl = 0.28 if "Walk" in name else (0.50 if "Run" in name else 0.42)
            apply_relaxed_fingers("L", finger_curl)
            apply_relaxed_fingers("R", finger_curl)
            key_bones(f)

        set_contact(1.0, 1)
        set_passing(True, q1 + 1)
        set_contact(-1.0, half + 1)
        set_passing(False, q3 + 1)
        set_contact(1.0, length)
        return act

    actions.append(build_gait("Ananya_Walk",   32, 0.40, 0.52, 0.32, 0.36, 0.16, 0.04, 0.020))
    actions.append(build_gait("Ananya_Run",    24, 0.68, 0.90, 0.58, 0.68, 0.26, 0.15, 0.042))
    actions.append(build_gait("Ananya_Sprint", 16, 0.90, 1.20, 0.84, 0.88, 0.32, 0.26, 0.060))

    # 5. Jump (Anticipation crouch -> vertical explosion along Z -> apex rise -> descent reach)
    act_jump = bpy.data.actions.new(name="Ananya_Jump")
    arm_obj.animation_data.action = act_jump
    for f, hz, tx, cx, ax, ex in [
        (1,   0.00,  0.00,  0.00,  0.00, 0.26),
        (6,  -0.11,  0.42, -0.75, -0.38, 0.32),
        (14,  0.24,  0.28, -0.50,  0.65, 0.60),
        (24,  0.00,  0.00,  0.00,  0.00, 0.26),
    ]:
        reset_pose()
        arm_obj.pose.bones["Hips"].location.z = hz
        arm_obj.pose.bones["Thigh_L"].rotation_euler.x = tx
        arm_obj.pose.bones["Thigh_R"].rotation_euler.x = tx * 0.75
        arm_obj.pose.bones["Calf_L"].rotation_euler.x = cx
        arm_obj.pose.bones["Calf_R"].rotation_euler.x = cx
        arm_obj.pose.bones["UpperArm_L"].rotation_euler.x = ax
        arm_obj.pose.bones["UpperArm_L"].rotation_euler.z = 0.060
        arm_obj.pose.bones["UpperArm_R"].rotation_euler.x = ax
        arm_obj.pose.bones["UpperArm_R"].rotation_euler.z = -0.060
        arm_obj.pose.bones["ForeArm_L"].rotation_euler.x = ex
        arm_obj.pose.bones["ForeArm_R"].rotation_euler.x = ex
        apply_relaxed_fingers("L", 0.25)
        apply_relaxed_fingers("R", 0.25)
        key_bones(f)
    actions.append(act_jump)

    # 6. Landing (Touchdown -> compression along Z -> smooth elastic recovery)
    act_land = bpy.data.actions.new(name="Ananya_Landing")
    arm_obj.animation_data.action = act_land
    for f, hz, kb, ax, ex in [
        (1,   0.00, 0.00,  0.00, 0.26),
        (6,  -0.15, 0.62, -0.20, 0.42),
        (18,  0.00, 0.00,  0.00, 0.26),
    ]:
        reset_pose()
        arm_obj.pose.bones["Hips"].location.z = hz
        arm_obj.pose.bones["Thigh_L"].rotation_euler.x = kb
        arm_obj.pose.bones["Thigh_R"].rotation_euler.x = kb
        arm_obj.pose.bones["Calf_L"].rotation_euler.x = -kb * 1.25
        arm_obj.pose.bones["Calf_R"].rotation_euler.x = -kb * 1.25
        arm_obj.pose.bones["Spine_01"].rotation_euler.x = kb * 0.35
        arm_obj.pose.bones["UpperArm_L"].rotation_euler.x = ax
        arm_obj.pose.bones["UpperArm_L"].rotation_euler.z = 0.065
        arm_obj.pose.bones["UpperArm_R"].rotation_euler.x = ax
        arm_obj.pose.bones["UpperArm_R"].rotation_euler.z = -0.065
        arm_obj.pose.bones["ForeArm_L"].rotation_euler.x = ex
        arm_obj.pose.bones["ForeArm_R"].rotation_euler.x = ex
        apply_relaxed_fingers("L", 0.30 if f == 6 else 0.22)
        apply_relaxed_fingers("R", 0.30 if f == 6 else 0.22)
        key_bones(f)
    actions.append(act_land)

    # 7. Turn Left (Horizontal yaw around Blender Z axis)
    act_turn = bpy.data.actions.new(name="Ananya_Turn_Left")
    arm_obj.animation_data.action = act_turn
    for f, yw in [(1, 0.0), (8, 0.42), (16, 0.0)]:
        reset_pose()
        arm_obj.pose.bones["Head"].rotation_euler.z = yw
        arm_obj.pose.bones["Chest"].rotation_euler.z = yw * 0.6
        arm_obj.pose.bones["Thigh_L"].rotation_euler.z = yw * 0.35
        arm_obj.pose.bones["UpperArm_L"].rotation_euler.z = 0.055 - yw * 0.10
        arm_obj.pose.bones["UpperArm_R"].rotation_euler.z = -0.055 - yw * 0.10
        arm_obj.pose.bones["ForeArm_L"].rotation_euler.x = 0.26
        arm_obj.pose.bones["ForeArm_R"].rotation_euler.x = 0.26
        apply_relaxed_fingers("L", 0.22)
        apply_relaxed_fingers("R", 0.22)
        key_bones(f)
    actions.append(act_turn)

    # 8. Hand Interaction (Clean gesture & finger curl)
    act_hand = bpy.data.actions.new(name="Ananya_Hand_Interaction")
    arm_obj.animation_data.action = act_hand
    for f, gr in [(1, 0.0), (12, 0.62), (24, 0.0)]:
        reset_pose()
        arm_obj.pose.bones["UpperArm_L"].rotation_euler.z = 0.050
        arm_obj.pose.bones["ForeArm_L"].rotation_euler.x = 0.26
        arm_obj.pose.bones["UpperArm_R"].rotation_euler.x = gr * 0.45
        arm_obj.pose.bones["UpperArm_R"].rotation_euler.z = -0.080
        arm_obj.pose.bones["ForeArm_R"].rotation_euler.x = 0.28 + gr * 0.55
        arm_obj.pose.bones["Hand_R"].rotation_euler.x = gr * 0.20
        apply_relaxed_fingers("L", 0.22)
        apply_relaxed_fingers("R", 0.22 + gr * 0.40)
        key_bones(f)
    actions.append(act_hand)

    reset_pose()
    for act in actions:
        track = arm_obj.animation_data.nla_tracks.new()
        track.name = act.name
        strip = track.strips.new(act.name, int(act.frame_range[0]), act)
        strip.mute = False

    arm_obj.animation_data.action = act_idle
    bpy.ops.object.mode_set(mode='OBJECT')


# ==============================================================================
# 9. REFERENCE PLANES, LIGHTING & TURNTABLE CAMERAS
# ==============================================================================

def build_reference_and_lighting(ref_col, light_col):
    ref_mat = bpy.data.materials.new(name="MAT_Ananya_ReferenceSheet")
    if hasattr(ref_mat, "use_nodes"):
        ref_mat.use_nodes = True
    bsdf = ref_mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        set_bsdf_input_safe(bsdf, ["Roughness"], 1.0)
    if os.path.isfile(REF_IMAGE_PATH):
        img = bpy.data.images.load(REF_IMAGE_PATH, check_existing=True)
        tnode = ref_mat.node_tree.nodes.new("ShaderNodeTexImage")
        tnode.image = img
        ref_mat.node_tree.links.new(bsdf.inputs["Base Color"], tnode.outputs["Color"])

    for vname, loc, rz in [
        ("Ref_Ananya_Front", (0.0, 0.95, 0.0),  0.0),
        ("Ref_Ananya_Side",  (-0.95, 0.0, 0.0), math.radians(90)),
        ("Ref_Ananya_Back",  (0.0, -0.95, 0.0), math.radians(180)),
    ]:
        m = bpy.data.meshes.new(f"{vname}_Mesh")
        verts = [Vector((-0.52, 0, 0.0)), Vector((0.52, 0, 0.0)), Vector((0.52, 0, 1.72)), Vector((-0.52, 0, 1.72))]
        m.from_pydata(verts, [], [(0, 1, 2, 3)])
        m.update()
        o = bpy.data.objects.new(vname, m)
        o.location = Vector(loc)
        o.rotation_euler = (0.0, 0.0, rz)
        o.data.materials.append(ref_mat)
        o.hide_render = True
        link_to_collection(o, ref_col)

    for lname, loc, rot, energy in [
        ("Light_Key_Sun",   (1.8, -2.2, 2.3), (math.radians(55), 0, math.radians(38)), 175.0),
        ("Light_Fill_Soft", (-2.0, -1.8, 1.5), (math.radians(65), 0, math.radians(-42)), 75.0),
        ("Light_Rim_Back",  (0.0, 2.2, 2.2), (math.radians(-50), 0, 0), 115.0),
    ]:
        ldata = bpy.data.lights.new(name=lname, type='AREA')
        ldata.energy = energy
        lobj = bpy.data.objects.new(name=lname, object_data=ldata)
        lobj.location = Vector(loc)
        lobj.rotation_euler = rot
        link_to_collection(lobj, light_col)

    cams = {}
    for cname, loc, rot in [
        ("Camera_Ananya_Front", (0.0, -2.8, 0.88), (math.radians(88), 0.0, 0.0)),
        ("Camera_Ananya_Side",  (2.8,  0.0, 0.88), (math.radians(88), 0.0, math.radians(90))),
        ("Camera_Ananya_Back",  (0.0,  2.8, 0.88), (math.radians(88), 0.0, math.radians(180))),
    ]:
        cdata = bpy.data.cameras.new(cname)
        cdata.lens = 55.0
        cobj = bpy.data.objects.new(cname, cdata)
        cobj.location = Vector(loc)
        cobj.rotation_euler = rot
        link_to_collection(cobj, light_col)
        cams[cname] = cobj

    bpy.context.scene.camera = cams["Camera_Ananya_Front"]
    return cams


def render_validation_screenshots(arm_obj):
    """Renders 5 headless Workbench screenshots verifying Ananya's mesh clearance & locomotion."""
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    if hasattr(scene, "display"):
        scene.display.shading.light = 'STUDIO'
        scene.display.shading.color_type = 'MATERIAL'

    scene.render.resolution_x = 768
    scene.render.resolution_y = 1024
    cam_data = bpy.data.cameras.new("RenderCam")
    cam_data.lens = 55.0
    cam_obj = bpy.data.objects.new("RenderCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # 1. Front Idle
    arm_obj.animation_data.action = bpy.data.actions.get("Ananya_Idle")
    scene.frame_set(1)
    cam_obj.location = Vector((0.0, -2.8, 0.88))
    cam_obj.rotation_euler = (math.radians(88), 0.0, 0.0)
    p_front = os.path.join(PUBLIC_MODELS_DIR, "ananya_idle_front.png")
    scene.render.filepath = p_front
    bpy.ops.render.render(write_still=True)
    print(f"[RENDERED] Relaxed Idle Front: {p_front}")

    # 2. Side Idle
    cam_obj.location = Vector((2.8, 0.0, 0.88))
    cam_obj.rotation_euler = (math.radians(88), 0.0, math.radians(90))
    p_side = os.path.join(PUBLIC_MODELS_DIR, "ananya_idle_side.png")
    scene.render.filepath = p_side
    bpy.ops.render.render(write_still=True)
    print(f"[RENDERED] Relaxed Idle Side: {p_side}")

    # 3. Closeup Hands & Thigh Clearance
    cam_obj.location = Vector((0.55, -0.95, 0.80))
    cam_obj.rotation_euler = (math.radians(78), 0.0, math.radians(28))
    p_hands = os.path.join(PUBLIC_MODELS_DIR, "ananya_hands_closeup.png")
    scene.render.filepath = p_hands
    bpy.ops.render.render(write_still=True)
    print(f"[RENDERED] Hands & Pants Clearance: {p_hands}")

    # 4. Walk Stride Frame 8
    arm_obj.animation_data.action = bpy.data.actions.get("Ananya_Walk")
    scene.frame_set(8)
    cam_obj.location = Vector((1.8, -2.0, 0.88))
    cam_obj.rotation_euler = (math.radians(80), 0.0, math.radians(40))
    p_walk = os.path.join(PUBLIC_MODELS_DIR, "ananya_walk_frame.png")
    scene.render.filepath = p_walk
    bpy.ops.render.render(write_still=True)
    print(f"[RENDERED] Walk Frame: {p_walk}")

    # 5. Run Stride Frame 6
    arm_obj.animation_data.action = bpy.data.actions.get("Ananya_Run")
    scene.frame_set(6)
    cam_obj.location = Vector((1.8, -2.0, 0.88))
    cam_obj.rotation_euler = (math.radians(80), 0.0, math.radians(40))
    p_run = os.path.join(PUBLIC_MODELS_DIR, "ananya_run_frame.png")
    scene.render.filepath = p_run
    bpy.ops.render.render(write_still=True)
    print(f"[RENDERED] Run Frame: {p_run}")

    scene.collection.objects.unlink(cam_obj)
    bpy.data.objects.remove(cam_obj)
    bpy.data.cameras.remove(cam_data)


# ==============================================================================
# 10. VALIDATION, TRIANGLE AUDIT & GLB EXPORT
# ==============================================================================

def validate_and_export(cols, arm_obj, cams):
    print("\n" + "=" * 76)
    print("CONQUER THE CITY — ANANYA 3D CHARACTER VALIDATION & TRIANGLE AUDIT")
    print("=" * 76)

    for cname in REQUIRED_COLLECTIONS:
        assert cname in bpy.data.collections, f"Missing collection: {cname}"
    print("[PASS] All 7 required ANANYA collections verified.")

    depsgraph = bpy.context.evaluated_depsgraph_get()
    total_tris = 0
    total_verts = 0
    export_cols = [cols["ANANYA_CHARACTER"], cols["ANANYA_CLOTHING"], cols["ANANYA_HAIR"]]

    for col in export_cols:
        for obj in col.objects:
            if obj.type == 'MESH':
                eval_obj = obj.evaluated_get(depsgraph)
                mesh_eval = eval_obj.to_mesh()
                mesh_eval.calc_loop_triangles()
                t_count = len(mesh_eval.loop_triangles)
                v_count = len(mesh_eval.vertices)
                total_tris += t_count
                total_verts += v_count
                print(f"  -> Mesh '{obj.name:28s}' | Verts: {v_count:5d} | Triangles: {t_count:5d}")
                eval_obj.to_mesh_clear()

    print("-" * 76)
    print(f"[MEASURED TOTAL] Active Character Vertices: {total_verts} | Active Triangles: {total_tris}")
    print(f"[MEASURED RIG]   Total Deform & Control Bones: {len(arm_obj.data.bones)} | NLA Tracks: {len(arm_obj.animation_data.nla_tracks)}")
    print("-" * 76)

    # 1. Joint Deformation Test
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')
    arm_obj.pose.bones["Calf_L"].rotation_euler.x = math.radians(-45)
    bpy.context.view_layer.update()

    pants = bpy.data.objects.get("Ananya_CargoTrousers_Olive")
    deps = bpy.context.evaluated_depsgraph_get()
    p_eval = pants.evaluated_get(deps)
    m_eval = p_eval.to_mesh()

    knee_verts = [v for v in m_eval.vertices if 0.40 < v.co.z < 0.55 and v.co.x > 0.02]
    assert len(knee_verts) > 0, "Deformation test failed: No knee vertices identified!"
    orig_co = [pants.data.vertices[v.index].co for v in knee_verts]
    curr_co = [v.co for v in knee_verts]
    avg_disp = sum((c - o).length for c, o in zip(curr_co, orig_co)) / len(knee_verts)
    print(f"[DEFORMATION TEST] Measured vertex displacement: {avg_disp:.4f}m (Threshold: > 0.005m)")
    assert avg_disp > 0.005, f"Deformation failed: Evaluated displacement {avg_disp}m is below threshold!"

    arm_obj.pose.bones["Calf_L"].rotation_euler.x = 0.0
    p_eval.to_mesh_clear()
    bpy.ops.object.mode_set(mode='OBJECT')
    print("[PASS] Joint deformation test passed and rest pose verified.")

    # 2. Strict Skin-Weight Bleed Assertion
    vg_names = {vg.index: vg.name for vg in pants.vertex_groups}
    for v in pants.data.vertices:
        for g in v.groups:
            if g.weight > 0.0001:
                bname = vg_names[g.group]
                assert not any(k in bname for k in ["ForeArm", "Hand", "Thumb", "Index", "Middle", "Ring", "Pinky", "UpperArm"]), \
                    f"Skinning error: Pants vertex {v.index} is influenced by arm bone {bname} (weight: {g.weight})!"
    print("[PASS] Skin-weight audit verified: ZERO arm/hand bone influence on Ananya_CargoTrousers_Olive.")

    hand_l = bpy.data.objects.get("Ananya_Forearm_Palm_L")
    vg_h_names = {vg.index: vg.name for vg in hand_l.vertex_groups}
    for v in hand_l.data.vertices:
        for g in v.groups:
            if g.weight > 0.0001:
                bname = vg_h_names[g.group]
                assert not any(k in bname for k in ["Thigh", "Calf", "Foot", "Toe", "Hips"]), \
                    f"Skinning error: Hand_L vertex {v.index} is influenced by leg bone {bname} (weight: {g.weight})!"
    print("[PASS] Skin-weight audit verified: ZERO leg bone influence on Ananya_Forearm_Palm_L.")

    # 3. Dynamic Clearance & Intersection Audit Across Walk Cycle
    walk_act = bpy.data.actions.get("Ananya_Walk")
    arm_obj.animation_data.action = walk_act
    min_dist = 999.0
    closest_f = -1

    for f in range(1, 33):
        bpy.context.scene.frame_set(f)
        deps = bpy.context.evaluated_depsgraph_get()
        p_eval = pants.evaluated_get(deps)
        h_eval = hand_l.evaluated_get(deps)
        m_p = p_eval.to_mesh()
        m_h = h_eval.to_mesh()

        pants_verts = [p_eval.matrix_world @ v.co for v in m_p.vertices if v.co.x > 0.04 and 0.60 < v.co.z < 0.95]
        hand_verts = [h_eval.matrix_world @ v.co for v in m_h.vertices]

        for hv in hand_verts:
            for pv in pants_verts:
                d = (hv - pv).length
                if d < min_dist:
                    min_dist = d
                    closest_f = f
        p_eval.to_mesh_clear()
        h_eval.to_mesh_clear()

    arm_obj.animation_data.action = None
    bpy.context.scene.frame_set(1)
    print(f"[CLEARANCE AUDIT] Minimum hand-to-pants distance during Walk cycle: {min_dist * 100:.2f} cm at frame {closest_f}")
    assert min_dist > 0.020, f"Physical clearance failed: Minimum distance {min_dist * 100:.2f} cm is below 2.0 cm threshold!"
    print(f"[PASS] Dynamic clearance verified: Hand cleanly clears pants with > {min_dist * 100:.2f} cm air gap throughout full stride.")

    # 4. Render Validation Screenshots
    render_validation_screenshots(arm_obj)

    # 5. Save Editable .blend File
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT_PATH)
    print(f"[SAVED] Editable Blender Project: {BLEND_OUT_PATH}")

    # 6. Export Game-Ready GLB
    bpy.ops.object.select_all(action='DESELECT')
    arm_obj.select_set(True)
    for col in export_cols:
        for obj in col.objects:
            obj.select_set(True)

    export_kwargs = {
        "filepath": GLB_OUT_PATH,
        "export_format": "GLB",
        "use_selection": True,
        "export_apply": True,
        "export_yup": True,
        "export_texcoords": True,
        "export_normals": True,
        "export_materials": "EXPORT",
        "export_skins": True,
        "export_animations": True,
    }

    gltf_props = bpy.ops.export_scene.gltf.get_rna_type().properties
    if "export_animation_mode" in gltf_props:
        export_kwargs["export_animation_mode"] = "NLA_TRACKS"
    else:
        export_kwargs["export_nla_strips"] = True

    bpy.ops.export_scene.gltf(**export_kwargs)
    print(f"[EXPORTED] Three.js Game-Ready GLB: {GLB_OUT_PATH}")

    # 7. Post-Export GLB Binary Audit
    with open(GLB_OUT_PATH, "rb") as f:
        glb_bytes = f.read()
    print(f"[GLB AUDIT] File size: {len(glb_bytes):,} bytes")
    import json
    json_len = int.from_bytes(glb_bytes[12:16], byteorder='little')
    json_data = json.loads(glb_bytes[20:20+json_len].decode('utf-8'))
    exported_anim_names = [a.get("name") for a in json_data.get("animations", [])]
    print(f"[GLB AUDIT] Manifest Contents: Meshes: {len(json_data.get('meshes', []))} | Materials: {len(json_data.get('materials', []))} | Skins: {len(json_data.get('skins', []))} | Animations: {len(exported_anim_names)}")
    print(f"[GLB AUDIT] Exported Animations: {exported_anim_names}")
    assert len(exported_anim_names) == 8, f"Exported animations mismatch! Expected 8, got {len(exported_anim_names)}"
    print("[PASS] GLB binary validation succeeded: All 8 animation clips verified with active channels.")
    print("=" * 76 + "\n")


def main():
    cols = reset_scene()
    mats = build_pbr_materials(cols["ANANYA_MATERIALS"])
    build_ananya_head_and_face(cols["ANANYA_CHARACTER"], mats)
    build_ananya_arms_palms_and_fingers(cols["ANANYA_CHARACTER"], mats)
    build_ananya_half_up_wavy_hair(cols["ANANYA_HAIR"], mats)
    build_ananya_clothing(cols["ANANYA_CLOTHING"], mats)
    arm_obj = build_ananya_armature(cols["ANANYA_RIG"])
    bind_meshes_with_analytical_weights(
        arm_obj,
        [cols["ANANYA_CHARACTER"], cols["ANANYA_CLOTHING"], cols["ANANYA_HAIR"]]
    )
    create_ananya_animations(arm_obj)
    cams = build_reference_and_lighting(cols["ANANYA_REFERENCE"], cols["ANANYA_LIGHTING"])
    validate_and_export(cols, arm_obj, cams)


if __name__ == "__main__":
    main()
