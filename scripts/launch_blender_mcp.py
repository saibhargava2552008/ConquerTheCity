import bpy
import time

try:
    bpy.ops.preferences.addon_enable(module="blender_mcp")
except Exception as e:
    print("Addon enable error:", e)

def start_server_timer():
    try:
        bpy.ops.blendermcp.start_server()
        print("Blender MCP server started successfully via timer!")
    except Exception as e:
        print("Timer start error:", e)
    return None

bpy.app.timers.register(start_server_timer, first_interval=1.0)
