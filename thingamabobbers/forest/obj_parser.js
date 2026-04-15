// Guaranteed FEATURE-FREE obj parser. Expects vertex colors and face normals
function parse_obj(data) {
    var lines = data.split("\n")

    var vertices = []
    var normals = []
    var faces = []

    for (var i = 0; i < lines.length; i++) {
        var parts = lines[i].split(" ")
        switch (parts[0]) {
            case "v":
				vertices.push(
					[
						parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]), // Position
						parseFloat(parts[4]), parseFloat(parts[5]), parseFloat(parts[6]), // Color
					])
                break
            case "vn":
                normals.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])])
                break
            case "f":
                var face = []
                for (var j = 1; j < 4; j++) {
                    var parts2 = parts[j].split("/")
                    face.push([parseFloat(parts2[0]) - 1, 0, parseFloat(parts2[2]) - 1])
                }
				faces.push(face)
                break
            default:
                break
        }
	}

	// console.log(faces)

    // Calculate vertex normals

	var vertexNormals = []
	for (var i = 0; i < vertices.length; i++) {
		vertexNormals.push([0, 0, 0])
	}

	// Sum up the face normals to find the vertex normals
	for (var i = 0; i < faces.length; i++) {
		var face = faces[i]
		for (var j = 0; j < 3; j++) {
			var vertex = face[j][0]
			var normal = face[j][2]

			for (var k = 0; k < 3; k++) {
				vertexNormals[vertex][k] += normals[normal][k]
			}
		}
	}

	// Normalize the normals (so they're normals)
	for (var i = 0; i < vertices.length; i++) {
		var normal = vertexNormals[i]
		var length = Math.sqrt(
			Math.pow(normal[0], 2),
			Math.pow(normal[1], 2),
			Math.pow(normal[2], 2)
		)
		vertices[i] = vertices[i].concat([
			normal[0] / length,
			normal[1] / length,
			normal[2] / length
		])
	}

	// console.log(vertices)

	return { "vertices": vertices, "faces": faces };
}
