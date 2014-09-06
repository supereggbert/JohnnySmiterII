import bpy

print("[")
for object in bpy.data.objects:
    if object.type=="MESH":
    	print("{")
    	print("\t'name':'"+object.name+"',")
    	print("\t'scale':["+str(object.scale[0])+","+str(object.scale[1])+","+str(object.scale[2])+"],")
    	print("\t'rotation':["+str(object.rotation_quaternion.x)+","+str(object.rotation_quaternion.y)+","+str(object.rotation_quaternion.z)+","+str(object.rotation_quaternion.w)+"],")
    	print("\t'location':["+str(object.location.x)+","+str(object.location.y)+","+str(object.location.z)+"],")
    	print("\t'render':"+str(object.layers[0]).lower()+",")
    	print("\t'material':'"+str(getattr(object.active_material, 'name', 'material.000')).lower()+"',")
    	print("\t'modifiers':[")
    	for modifier in object.modifiers:
    		print("\t{")
    		print("\t\t'type':'"+modifier.type+"',")
    		if modifier.type=="BOOLEAN":
    			print("\t\t'operation':'"+modifier.operation+"',")
    			print("\t\t'object':'"+modifier.object.name+"',")
    		if modifier.type=="ARRAY":
    			print("\t\t'offset':["+str(modifier.constant_offset_displace[0])+","+str(modifier.constant_offset_displace[1])+","+str(modifier.constant_offset_displace[2])+"],")
    			print("\t\t'count':"+str(modifier.count))
    		print("\t},")
    	print("\t]")
    	print("},")
    if object.type=="EMPTY":
    	print("{")
    	print("\t'name':'"+object.name+"',")
    	print("\t'scale':["+str(object.scale[0])+","+str(object.scale[1])+","+str(object.scale[2])+"],")
    	print("\t'rotation':["+str(object.rotation_quaternion.x)+","+str(object.rotation_quaternion.y)+","+str(object.rotation_quaternion.z)+","+str(object.rotation_quaternion.w)+"],")
    	print("\t'location':["+str(object.location.x)+","+str(object.location.y)+","+str(object.location.z)+"],")
    	print("\t'render':"+str(object.layers[0]).lower()+",")
    	print("\t'object':'"+object.dupli_group.objects[0].name+"',")
    	print("},")
			
print("]")