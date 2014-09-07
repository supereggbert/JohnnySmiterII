// Constructive Solid Geometry (CSG) is a modeling technique that uses Boolean
// operations like union and intersection to combine 3D solids. This library
// implements CSG operations on meshes elegantly and concisely using BSP trees,
// and is meant to serve as an easily understandable implementation of the
// algorithm. All edge cases involving overlapping coplanar polygons in both
// solids are correctly handled.
// 
// Example usage:
// 
//     var cube = CSG.cube();
//     var sphere = CSG.sphere({ radius: 1.3 });
//     var polygons = cube.subtract(sphere).toPolygons();
// 
// ## Implementation Details
// 
// All CSG operations are implemented in terms of two functions, `clipTo()` and
// `invert()`, which remove parts of a BSP tree inside another BSP tree and swap
// solid and empty space, respectively. To find the union of `a` and `b`, we
// want to remove everything in `a` inside `b` and everything in `b` inside `a`,
// then combine polygons from `a` and `b` into one solid:
// 
//     a.clipTo(b);
//     b.clipTo(a);
//     a.build(b.allPolygons());
// 
// The only tricky part is handling overlapping coplanar polygons in both trees.
// The code above keeps both copies, but we need to keep them in one tree and
// remove them in the other tree. To remove them from `b` we can clip the
// inverse of `b` against `a`. The code for union now looks like this:
// 
//     a.clipTo(b);
//     b.clipTo(a);
//     b.invert();
//     b.clipTo(a);
//     b.invert();
//     a.build(b.allPolygons());
// 
// Subtraction and intersection naturally follow from set operations. If
// union is `A | B`, subtraction is `A - B = ~(~A | B)` and intersection is
// `A & B = ~(~A | ~B)` where `~` is the complement operator.
// 
// ## License
// 
// Copyright (c) 2011 Evan Wallace (http://madebyevan.com/), under the MIT license.
// # class CSG
// Holds a binary space partition tree representing a 3D solid. Two solids can
// be combined using the `union()`, `subtract()`, and `intersect()` methods.
/**
 * @constructor
 */
var CSG = function() {
    this.polygons = [];
    this.mat = 0;
    this.trans = [0, 0, 0];
};

// Construct a CSG solid from a list of `CSG.Polygon` instances.
CSG.fromPolygons = function(polygons) {
    var csg = new CSG();
    csg.polygons = polygons;
    return csg;
};



CSG.prototype = {
    clone: function() {
        var csg = new CSG();
        csg.polygons = this.polygons.map(function(p) {
            return p.clone();
        });
        csg.mat = this.mat;
        return csg;
    },

    toPolygons: function() {
        return this.polygons;
    },

    // Return a new CSG solid representing space in either this solid or in the
    // solid `csg`. Neither this solid nor the solid `csg` are modified.
    // 
    //     A.union(B)
    // 
    //     +-------+            +-------+
    //     |       |            |       |
    //     |   A   |            |       |
    //     |    +--+----+   =   |       +----+
    //     +----+--+    |       +----+       |
    //          |   B   |            |       |
    //          |       |            |       |
    //          +-------+            +-------+
    // 
    union: function(csg) {
        var a = new CSG.Node(this.clone().polygons);
        var b = new CSG.Node(csg.clone().polygons);
        a.clipTo(b);
        b.clipTo(a);
        b.invert();
        b.clipTo(a);
        b.invert();
        a.build(b.allPolygons());
        return CSG.fromPolygons(a.allPolygons());
    },

    // Return a new CSG solid representing space in this solid but not in the
    // solid `csg`. Neither this solid nor the solid `csg` are modified.
    // 
    //     A.subtract(B)
    // 
    //     +-------+            +-------+
    //     |       |            |       |
    //     |   A   |            |       |
    //     |    +--+----+   =   |    +--+
    //     +----+--+    |       +----+
    //          |   B   |
    //          |       |
    //          +-------+
    // 
    subtract: function(csg) {
        var a = new CSG.Node(this.clone().polygons);
        var b = new CSG.Node(csg.clone().polygons);
        a.invert();
        a.clipTo(b);
        b.clipTo(a);
        b.invert();
        b.clipTo(a);
        b.invert();
        a.build(b.allPolygons());
        a.invert();
        return CSG.fromPolygons(a.allPolygons());
    },

    // Return a new CSG solid representing space both this solid and in the
    // solid `csg`. Neither this solid nor the solid `csg` are modified.
    // 
    //     A.intersect(B)
    // 
    //     +-------+
    //     |       |
    //     |   A   |
    //     |    +--+----+   =   +--+
    //     +----+--+    |       +--+
    //          |   B   |
    //          |       |
    //          +-------+
    // 
    intersect: function(csg) {
        var a = new CSG.Node(this.clone().polygons);
        var b = new CSG.Node(csg.clone().polygons);
        a.invert();
        b.clipTo(a);
        b.invert();
        a.clipTo(b);
        b.clipTo(a);
        a.build(b.allPolygons());
        a.invert();
        return CSG.fromPolygons(a.allPolygons());
    },

    // Return a new CSG solid with solid and empty space switched. This solid is
    // not modified.
    inverse: function() {
        var csg = this.clone();
        csg.polygons.map(function(p) {
            p.flip();
        });
        return csg;
    },

    // Sets the material on the CSG object
    material: function(mat) {
        this.mat = mat;
        return this;
    },
    
    // Scales the CSG Object
    scale: function(x, y, z) {
        var polygons = this.polygons;
        var newPolygons = [];
        for (var i = 0; i < polygons.length; i++) {
            for (var n = 0; n < polygons[i].vertices.length; n++) {
                polygons[i].vertices[n].pos.x *= x;
                polygons[i].vertices[n].pos.y *= y;
                polygons[i].vertices[n].pos.z *= z;
            }
            newPolygons.push(new CSG.Polygon(polygons[i].vertices, polygons[i].shared));
        }
        this.polygons = newPolygons;
        return this;
    },
    
    // Translates the CSG Object
    translate: function(x, y, z) {
        this.trans = [x, y, z];
        var polygons = this.polygons;
        var newPolygons = [];
        for (var i = 0; i < polygons.length; i++) {
            for (var n = 0; n < polygons[i].vertices.length; n++) {
                polygons[i].vertices[n].pos.x += x;
                polygons[i].vertices[n].pos.y += y;
                polygons[i].vertices[n].pos.z += z;
            }
            newPolygons.push(new CSG.Polygon(polygons[i].vertices, polygons[i].shared));
        }
        this.polygons = newPolygons;
        return this;
    },
    
    //Rotate the CSG Object
    rotate: function(x, y, z, w) {
        var x2 = x * x,
            y2 = y * y,
            z2 = z * z
        var m1 = 1 - 2 * y2 - 2 * z2,
            m2 = 2 * x * y - 2 * z * w,
            m3 = 2 * x * z + 2 * y * w;
        var m4 = 2 * x * y + 2 * z * w,
            m5 = 1 - 2 * x2 - 2 * z2,
            m6 = 2 * y * z - 2 * x * w;
        var m7 = 2 * x * z - 2 * y * w,
            m8 = 2 * y * z + 2 * x * w,
            m9 = 1 - 2 * x2 - 2 * y2;

        var polygons = this.polygons;
        var newPolygons = [];
        for (var i = 0; i < polygons.length; i++) {
            for (var n = 0; n < polygons[i].vertices.length; n++) {
                var pos = polygons[i].vertices[n].pos;
                var normal = polygons[i].vertices[n].normal;
                var x1 = pos.x,
                    y1 = pos.y,
                    z1 = pos.z;
                var nx1 = normal.x,
                    ny1 = normal.y,
                    nz1 = normal.z;
                pos.x = x1 * m1 + y1 * m2 + z1 * m3;
                pos.y = x1 * m4 + y1 * m5 + z1 * m6;
                pos.z = x1 * m7 + y1 * m8 + z1 * m9;
                normal.x = nx1 * m1 + ny1 * m2 + nz1 * m3;
                normal.y = nx1 * m4 + ny1 * m5 + nz1 * m6;
                normal.z = nx1 * m7 + ny1 * m8 + nz1 * m9;
            }
            newPolygons.push(new CSG.Polygon(polygons[i].vertices, polygons[i].shared));
        }
        this.polygons = newPolygons;
        return this;
    },
    
    // Creates and Array from the current CSG object
    array: function(x, y, z, steps) {
        var polygons = this.polygons;
        var newPolygons = [];
        for (var j = 0; j < steps; j++) {
            for (var i = 0; i < polygons.length; i++) {
                var verts = [];
                for (var n = 0; n < polygons[i].vertices.length; n++) {
                    var v = polygons[i].vertices[n].clone();
                    v.pos.x += x * j;
                    v.pos.y += y * j;
                    v.pos.z += z * j;
                    verts.push(v);
                }
                newPolygons.push(new CSG.Polygon(verts, polygons[i].shared));
            }
        }
        var polys = polygons.concat(newPolygons);
        this.polygons = polys;
        return this;
    }

};


// Convert from CSG solid to GL.Mesh object
CSG.prototype.toMesh = function() {
    var verts = [];
    var faces = [];
    this.toPolygons().map(function(polygon) {
        var indices = polygon.vertices.map(function(vertex) {
            var idx = verts.length / 6;
            verts.push(vertex.pos.x, vertex.pos.y, vertex.pos.z, vertex.normal.x, vertex.normal.y, vertex.normal.z);
            return idx;
        });
        for (var i = 2; i < indices.length; i++) {
            faces.push(indices[0], indices[i - 1], indices[i]);
        }
    });
    return [verts, faces, this.mat, this.trans];
};

// Construct an axis-aligned solid cuboid. Optional parameters are `center` and
// `radius`, which default to `[0, 0, 0]` and `[1, 1, 1]`. The radius can be
// specified using a single number or a list of three numbers, one for each axis.
// 
// Example code:
// 
//     var cube = CSG.cube({
//       center: [0, 0, 0],
//       radius: 1
//     });

CSG.cube = function(options) {
    options = options || {};
    var c = new CSG.Vector(options.center || [0, 0, 0]);
    var r = !options.radius ? [1, 1, 1] : options.radius.length ?
        options.radius : [options.radius, options.radius, options.radius];
    return CSG.fromPolygons([
        [
            [0, 4, 6, 2],
            [-1, 0, 0]
        ],
        [
            [1, 3, 7, 5],
            [+1, 0, 0]
        ],
        [
            [0, 1, 5, 4],
            [0, -1, 0]
        ],
        [
            [2, 6, 7, 3],
            [0, +1, 0]
        ],
        [
            [0, 2, 3, 1],
            [0, 0, -1]
        ],
        [
            [4, 5, 7, 6],
            [0, 0, +1]
        ]
    ].map(function(info) {
        return new CSG.Polygon(info[0].map(function(i) {
            var pos = new CSG.Vector(
                c.x + r[0] * (2 * !!(i & 1) - 1),
                c.y + r[1] * (2 * !!(i & 2) - 1),
                c.z + r[2] * (2 * !!(i & 4) - 1)
            );
            return new CSG.Vertex(pos, new CSG.Vector(info[1]));
        }));
    }));
};

// Construct a solid sphere. Optional parameters are `center`, `radius`,
// `slices`, and `stacks`, which default to `[0, 0, 0]`, `1`, `16`, and `8`.
// The `slices` and `stacks` parameters control the tessellation along the
// longitude and latitude directions.
// 
// Example usage:
// 
//     var sphere = CSG.sphere({
//       center: [0, 0, 0],
//       radius: 1,
//       slices: 16,
//       stacks: 8
//     });
CSG.sphere = function(options) {
    options = options || {};
    var c = new CSG.Vector(options.center || [0, 0, 0]);
    var r = options.radius || 1;
    var slices = options.slices || 16;
    var stacks = options.stacks || 8;
    var polygons = [],
        vertices;

    function vertex(theta, phi) {
        theta *= Math.PI * 2;
        phi *= Math.PI;
        var dir = new CSG.Vector(
            Math.cos(theta) * Math.sin(phi),
            Math.cos(phi),
            Math.sin(theta) * Math.sin(phi)
        );
        vertices.push(new CSG.Vertex(c.plus(dir.times(r)), dir));
    }
    for (var i = 0; i < slices; i++) {
        for (var j = 0; j < stacks; j++) {
            vertices = [];
            vertex(i / slices, j / stacks);
            if (j > 0) vertex((i + 1) / slices, j / stacks);
            if (j < stacks - 1) vertex((i + 1) / slices, (j + 1) / stacks);
            vertex(i / slices, (j + 1) / stacks);
            polygons.push(new CSG.Polygon(vertices));
        }
    }
    return CSG.fromPolygons(polygons);
};

// Construct a solid cylinder. 
CSG.cylinder = function() {
    var slices = 32;
    var polygons = [];
    var s = new CSG.Vector(0, 0, -1);
    var e = new CSG.Vector(0, 0, 1);
    var a = Math.PI * 2 / slices;
    for (var i = 0; i < slices; i++) {
        var top = new CSG.Vertex(s, s);
        var bottom = new CSG.Vertex(e, e);
        var p1 = new CSG.Vector(Math.sin(a * i), Math.cos(a * i), -1);
        var p2 = new CSG.Vector(Math.sin(a * i), Math.cos(a * i), 1);
        var p3 = new CSG.Vector(Math.sin(a * (i + 1)), Math.cos(a * (i + 1)), -1);
        var p4 = new CSG.Vector(Math.sin(a * (i + 1)), Math.cos(a * (i + 1)), 1);
        polygons.push(new CSG.Polygon([top, new CSG.Vertex(p1, top), new CSG.Vertex(p3, top)]));
        polygons.push(new CSG.Polygon([new CSG.Vertex(p1, p1), new CSG.Vertex(p2, p2), new CSG.Vertex(p4, p4), new CSG.Vertex(p3, p3)]));
        polygons.push(new CSG.Polygon([bottom, new CSG.Vertex(p4, bottom), new CSG.Vertex(p2, bottom)]));
    }
    return CSG.fromPolygons(polygons);
};

// # class Vector

// Represents a 3D vector.
// 
// Example usage:
// 
//     new CSG.Vector(1, 2, 3);
//     new CSG.Vector([1, 2, 3]);
//     new CSG.Vector({ x: 1, y: 2, z: 3 });
/**
 * @constructor
 */
CSG.Vector = function(x, y, z) {
    if (arguments.length == 3) {
        this.x = x;
        this.y = y;
        this.z = z;
    } else if ('x' in x) {
        this.x = x.x;
        this.y = x.y;
        this.z = x.z;
    } else {
        this.x = x[0];
        this.y = x[1];
        this.z = x[2];
    }
};

CSG.Vector.prototype = {
    clone: function() {
        return new CSG.Vector(this.x, this.y, this.z);
    },

    negated: function() {
        return new CSG.Vector(-this.x, -this.y, -this.z);
    },

    plus: function(a) {
        return new CSG.Vector(this.x + a.x, this.y + a.y, this.z + a.z);
    },

    minus: function(a) {
        return new CSG.Vector(this.x - a.x, this.y - a.y, this.z - a.z);
    },

    times: function(a) {
        return new CSG.Vector(this.x * a, this.y * a, this.z * a);
    },

    dividedBy: function(a) {
        return new CSG.Vector(this.x / a, this.y / a, this.z / a);
    },

    dot: function(a) {
        return this.x * a.x + this.y * a.y + this.z * a.z;
    },

    lerp: function(a, t) {
        return this.plus(a.minus(this).times(t));
    },

    length: function() {
        return Math.sqrt(this.dot(this));
    },

    unit: function() {
        return this.dividedBy(this.length());
    },

    cross: function(a) {
        return new CSG.Vector(
            this.y * a.z - this.z * a.y,
            this.z * a.x - this.x * a.z,
            this.x * a.y - this.y * a.x
        );
    }
};

// # class Vertex

// Represents a vertex of a polygon. Use your own vertex class instead of this
// one to provide additional features like texture coordinates and vertex
// colors. Custom vertex classes need to provide a `pos` property and `clone()`,
// `flip()`, and `interpolate()` methods that behave analogous to the ones
// defined by `CSG.Vertex`. This class provides `normal` so convenience
// functions like `CSG.sphere()` can return a smooth vertex normal, but `normal`
// is not used anywhere else.
/**
 * @constructor
 */
CSG.Vertex = function(pos, normal) {
    this.pos = new CSG.Vector(pos);
    this.normal = new CSG.Vector(normal);
};

CSG.Vertex.prototype = {
    clone: function() {
        return new CSG.Vertex(this.pos.clone(), this.normal.clone());
    },

    // Invert all orientation-specific data (e.g. vertex normal). Called when the
    // orientation of a polygon is flipped.
    flip: function() {
        this.normal = this.normal.negated();
    },

    // Create a new vertex between this vertex and `other` by linearly
    // interpolating all properties using a parameter of `t`. Subclasses should
    // override this to interpolate additional properties.
    interpolate: function(other, t) {
        return new CSG.Vertex(
            this.pos.lerp(other.pos, t),
            this.normal.lerp(other.normal, t)
        );
    }
};

// # class Plane

// Represents a plane in 3D space.
/**
 * @constructor
 */
CSG.Plane = function(normal, w) {
    this.normal = normal;
    this.w = w;
};

// `CSG.Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
// point is on the plane.
CSG.Plane.EPSILON = 1e-5;

CSG.Plane.fromPoints = function(a, b, c) {
    var n = b.minus(a).cross(c.minus(a)).unit();
    return new CSG.Plane(n, n.dot(a));
};

CSG.Plane.prototype = {
    clone: function() {
        return new CSG.Plane(this.normal.clone(), this.w);
    },

    flip: function() {
        this.normal = this.normal.negated();
        this.w = -this.w;
    },

    // Split `polygon` by this plane if needed, then put the polygon or polygon
    // fragments in the appropriate lists. Coplanar polygons go into either
    // `coplanarFront` or `coplanarBack` depending on their orientation with
    // respect to this plane. Polygons in front or in back of this plane go into
    // either `front` or `back`.
    splitPolygon: function(polygon, coplanarFront, coplanarBack, front, back) {
        var COPLANAR = 0;
        var FRONT = 1;
        var BACK = 2;
        var SPANNING = 3;

        // Classify each point as well as the entire polygon into one of the above
        // four classes.
        var polygonType = 0;
        var types = [];
        for (var i = 0; i < polygon.vertices.length; i++) {
            var t = this.normal.dot(polygon.vertices[i].pos) - this.w;
            var type = (t < -CSG.Plane.EPSILON) ? BACK : (t > CSG.Plane.EPSILON) ? FRONT : COPLANAR;
            polygonType |= type;
            types.push(type);
        }

        // Put the polygon in the correct list, splitting it when necessary.
        switch (polygonType) {
            case COPLANAR:
                (this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
                break;
            case FRONT:
                front.push(polygon);
                break;
            case BACK:
                back.push(polygon);
                break;
            case SPANNING:
                var f = [],
                    b = [];
                for (var i = 0; i < polygon.vertices.length; i++) {
                    var j = (i + 1) % polygon.vertices.length;
                    var ti = types[i],
                        tj = types[j];
                    var vi = polygon.vertices[i],
                        vj = polygon.vertices[j];
                    if (ti != BACK) f.push(vi);
                    if (ti != FRONT) b.push(ti != BACK ? vi.clone() : vi);
                    if ((ti | tj) == SPANNING) {
                        var t = (this.w - this.normal.dot(vi.pos)) / this.normal.dot(vj.pos.minus(vi.pos));
                        var v = vi.interpolate(vj, t);
                        f.push(v);
                        b.push(v.clone());
                    }
                }
                if (f.length >= 3) front.push(new CSG.Polygon(f, polygon.shared));
                if (b.length >= 3) back.push(new CSG.Polygon(b, polygon.shared));
                break;
        }
    }
};

// # class Polygon

// Represents a convex polygon. The vertices used to initialize a polygon must
// be coplanar and form a convex loop. They do not have to be `CSG.Vertex`
// instances but they must behave similarly (duck typing can be used for
// customization).
// 
// Each convex polygon has a `shared` property, which is shared between all
// polygons that are clones of each other or were split from the same polygon.
// This can be used to define per-polygon properties (such as surface color).
/**
 * @constructor
 */
CSG.Polygon = function(vertices, shared) {
    this.vertices = vertices;
    this.shared = shared;
    this.plane = CSG.Plane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
};

CSG.Polygon.prototype = {
    clone: function() {
        var vertices = this.vertices.map(function(v) {
            return v.clone();
        });
        return new CSG.Polygon(vertices, this.shared);
    },

    flip: function() {
        this.vertices.reverse().map(function(v) {
            v.flip();
        });
        this.plane.flip();
    }
};

// # class Node

// Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
// by picking a polygon to split along. That polygon (and all other coplanar
// polygons) are added directly to that node and the other polygons are added to
// the front and/or back subtrees. This is not a leafy BSP tree since there is
// no distinction between internal and leaf nodes.
/**
 * @constructor
 */
CSG.Node = function(polygons) {
    this.plane = null;
    this.front = null;
    this.back = null;
    this.polygons = [];
    if (polygons) this.build(polygons);
};

CSG.Node.prototype = {
    clone: function() {
        var node = new CSG.Node();
        node.plane = this.plane && this.plane.clone();
        node.front = this.front && this.front.clone();
        node.back = this.back && this.back.clone();
        node.polygons = this.polygons.map(function(p) {
            return p.clone();
        });
        return node;
    },

    // Convert solid space to empty space and empty space to solid space.
    invert: function() {
        for (var i = 0; i < this.polygons.length; i++) {
            this.polygons[i].flip();
        }
        this.plane.flip();
        if (this.front) this.front.invert();
        if (this.back) this.back.invert();
        var temp = this.front;
        this.front = this.back;
        this.back = temp;
    },

    // Recursively remove all polygons in `polygons` that are inside this BSP
    // tree.
    clipPolygons: function(polygons) {
        if (!this.plane) return polygons.slice();
        var front = [],
            back = [];
        for (var i = 0; i < polygons.length; i++) {
            this.plane.splitPolygon(polygons[i], front, back, front, back);
        }
        if (this.front) front = this.front.clipPolygons(front);
        if (this.back) back = this.back.clipPolygons(back);
        else back = [];
        return front.concat(back);
    },

    // Remove all polygons in this BSP tree that are inside the other BSP tree
    // `bsp`.
    clipTo: function(bsp) {
        this.polygons = bsp.clipPolygons(this.polygons);
        if (this.front) this.front.clipTo(bsp);
        if (this.back) this.back.clipTo(bsp);
    },

    // Return a list of all polygons in this BSP tree.
    allPolygons: function() {
        var polygons = this.polygons.slice();
        if (this.front) polygons = polygons.concat(this.front.allPolygons());
        if (this.back) polygons = polygons.concat(this.back.allPolygons());
        return polygons;
    },

    // Build a BSP tree out of `polygons`. When called on an existing tree, the
    // new polygons are filtered down to the bottom of the tree and become new
    // nodes there. Each set of polygons is partitioned using the first polygon
    // (no heuristic is used to pick a good split).
    build: function(polygons) {
        if (!polygons.length) return;
        if (!this.plane) this.plane = polygons[parseInt(Math.random() * polygons.length)].plane.clone();
        //if (!this.plane) this.plane = polygons[0].plane.clone();
        var front = [],
            back = [];
        for (var i = 0; i < polygons.length; i++) {
            this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
        }
        if (front.length) {
            if (!this.front) this.front = new CSG.Node();
            this.front.build(front);
        }
        if (back.length) {
            if (!this.back) this.back = new CSG.Node();
            this.back.build(back);
        }
    }
};

var C = new CSG;

// Gets a reference to deach of the used CSG methods help in minification
var bits = {
    B: CSG.cube,
    C: CSG.cylinder,
    E: 'dup',
    O: CSG.sphere,
    U: C.union,
    D: C.subtract,
    I: C.intersect,
    T: C.translate,
    R: C.rotate,
    S: C.scale,
    A: C.array,
    M: C.material
};

// Parses parameters when working though the map format
var parseParams = function(params) {
    if (params == '') return [];
    var arr = params.split(",");
    var i = arr.length;
    while (i-- > -1) {
        arr[i] = parseFloat(arr[i]);
        arr[i] = arr[i] ? arr[i] : 0;
    }
    return arr;
};

// Parsed the map format into a series of CSG calls to create the geometry
var parseCSG = function(s) {
    var o = s.split('|');
    var os = [];
    for (var i = 0; i < o.length; i++) {
        var s = '';
        var u = o[i];
        var l = 0;
        var x = null,
            y = null,
            z = '',
            obj = null,
            v = null,
            v2, t;
        while (l < u.length) {
            x = bits[u[l].toUpperCase()];
            if (x) {
                if (y) {
                    if (!obj) {
                        if (y == 'dup') {
                            var params = parseParams(z);
                            obj = os[params[0]].clone();
                        } else {
                            obj = y();
                        }
                        v2 = obj.v = v;
                        v = null;
                    } else {
                        t = obj.trans;
                        var params = parseParams(z);
                        if (params.length == 1) {
                            obj = y.call(obj, os[params[0]]);
                        } else {
                            obj = y.apply(obj, params);
                        }
                        obj.v = v2;
                        if (y != CSG.prototype.translate) obj.trans = t;
                    }
                }
                v = u[l].toUpperCase() == u[l];
                y = x;
                z = ''
            } else {
                z += u[l];
            }
            l++;
        }
        var params = parseParams(z);
        if (params.length == 1 && y != CSG.prototype.material) {
            obj = y.call(obj, os[params[0]]);
        } else {
            t = obj.trans;
            obj = y.apply(obj, params);
            if (y != CSG.prototype.translate) obj.trans = t;
        }
        obj.v = v2;

        os.push(obj);
    }
    o = [];
    for (i = 0; i < os.length; i++)
        if (os[i].v) o.push(os[i].toMesh());
    return o;
};