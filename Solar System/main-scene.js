window.Assignment_Three_Scene = window.classes.Assignment_Three_Scene =
class Assignment_Three_Scene extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   ) 
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 

        context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );
        this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );

        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );

        const shapes = { torus:  new Torus( 15, 15 ),
                         torus2: new ( Torus.prototype.make_flat_shaded_version() )( 20, 20 ),
                         //add four spheres with varying subdivisions per the spec
                         //planet 1
                         sphere_1: new ( Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
                         //planet 2
                         sphere_2: new Subdivision_Sphere(3),
                         //Sun, planet 3, and planet 4
                         sphere_34sun: new Subdivision_Sphere(4),
                         //planet 4 moon
                         sphere_5: new ( Subdivision_Sphere.prototype.make_flat_shaded_version())(1)
 
                                // TODO:  Fill in as many additional shape instances as needed in this key/value table.
                                //        (Requirement 1)
                       }
        this.submit_shapes( context, shapes );
                                     
                                     // Make some Material objects available to you:
        this.materials =
          { test:     context.get_instance( Phong_Shader ).material( Color.of( 1,1,0,1 ), { ambient:.2 } ),
            ring:     context.get_instance( Ring_Shader  ).material(),
            //sun, max ambient, color defaults orange
            sun:      context.get_instance( Phong_Shader ).material( Color.of( 1 ,0, 1 ,1 ), { ambient: 1 } ),
            //all planets ambient of 0
            //planet 1, color ice-gray, diffuse only
            planet1:  context.get_instance( Phong_Shader ).material( Color.of( 221/255, 238/255, 245/255, 1), {ambient: 0}, {diffusivity: 1}, {specularity: 0}, {smoothness: 0}),
            //planet 2, color swampy green-blue, max specular, low diffuse, default smooth shading.  (override if t == odd)
            planet2:  context.get_instance( Phong_Shader ).material( Color.of( 2/255, 50/255, 10/255, 1), {ambient: 0}, {diffusivity: .2}, {specularity: 1}),
            //planet 3, color muddy brown-orange, max diffuse and specular, 
            planet3:  context.get_instance( Phong_Shader ).material( Color.of( 231/255, 162/255, 93/255, 1), {ambient: 0}, {diffusivity: 1}, {specularity: 1}),
            //planet 4, color soft light blue, smooth phong, high specular
            planet4:  context.get_instance( Phong_Shader ).material( Color.of( 5/255, 50/255, 125/255, 1), {ambient: 0}, {specularity: 0.8}, {smoothness: 1}),
            //moon, any texture works, color dark green
            moon:     context.get_instance( Phong_Shader ).material( Color.of( 10/255, 30/255, 5/255, 1), {ambient: 0})

                                // TODO:  Fill in as many additional material objects as needed in this key/value table.
                                //        (Requirement 1)
          }

        this.lights = [ new Light( Vec.of( 5,-10,5,1 ), Color.of( 0, 1, 1, 1 ), 1000 ) ];
      }
    make_control_panel()            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
      { this.key_triggered_button( "View solar system",  [ "0" ], () => this.attached = () => this.initial_camera_location );
        this.new_line();
        this.key_triggered_button( "Attach to planet 1", [ "1" ], () => this.attached = () => this.planet_1 );
        this.key_triggered_button( "Attach to planet 2", [ "2" ], () => this.attached = () => this.planet_2 ); this.new_line();
        this.key_triggered_button( "Attach to planet 3", [ "3" ], () => this.attached = () => this.planet_3 );
        this.key_triggered_button( "Attach to planet 4", [ "4" ], () => this.attached = () => this.planet_4 ); this.new_line();
        this.key_triggered_button( "Attach to planet 5", [ "5" ], () => this.attached = () => this.planet_5 );
        this.key_triggered_button( "Attach to moon",     [ "m" ], () => this.attached = () => this.moon     );
      }
    draw_planets( graphics_state, t)
      {
        //create matrix to transform planets
        let model_transform = Mat4.identity();


        //Create and shape the sun
        //------------------------
        //get sun radius
        //5 second period, oscillates between size 1 and 3
        let rad_sun = 2 + Math.sin(.4 * Math.PI * t);
        model_transform = model_transform.times(Mat4.scale([rad_sun, rad_sun, rad_sun]));
        //create oscillating sun color
        //let color_sun = Color.of(.5 + .5 * Math.sin(.4 * Math.PI * t), 0, .5 -.5 * Math.sin(.4 * Math.PI * t), 1);
        let color_sun = Color.of((0.75 - .25*(2 - rad_sun)), //0.25,
                                 (0.10 + .10*(2 - rad_sun)),
                                 (0.65 + .35*(2 - rad_sun)), 1);
        //draw sun at origin
        this.shapes.sphere_34sun.draw(graphics_state, model_transform, this.materials.sun.override({color: color_sun}));
        //align scene lights to match sun color and size
        this.lights = [new Light(Vec.of(0,0,0,1), color_sun, 10**rad_sun)];
    



        //Create and shape planet1
        //------------------------
        //reset matrix
        model_transform = Mat4.identity();
        //make it orbit the sun radius 5 away from sun, at quickest orbit .9*t
        model_transform = model_transform.times( Mat4.translation([5 * Math.sin(.9 * t), 0, 5 * Math.cos(.9 * t)]));
        //draw the planet
        this.shapes.sphere_1.draw(graphics_state, model_transform, this.materials.planet1);
        //save matrix for camera placement
        this.planet_1 = model_transform;




        //Create and shape planet2
        //------------------------
        //reset matrix
        model_transform = Mat4.identity();
        //make it orbit the sun radius 8, slower orbit 
        model_transform = model_transform.times( Mat4.translation([8 * Math.sin(.6 * t), 0, 8 * Math.cos(.6 * t)]));
        //check if we need to override smoothness
        let curr = Math.floor(t%2);
        //dont override
        if (curr == 0)
          {
            //draw the planet
            this.shapes.sphere_2.draw(graphics_state, model_transform, this.materials.planet2);
          }
        //override
        else
          {
            //draw the planet
            this.shapes.sphere_2.draw(graphics_state, model_transform, this.materials.planet2.override({gourad: 1}));
          }
        //save matrix for camera placement
        this.planet_2 = model_transform;




        //Create and shape planet3
        //------------------------
        //reset matrix
        model_transform = Mat4.identity();
        //make it orbit the sun radius 11, slower orbit 
        model_transform = model_transform.times( Mat4.translation([11 * Math.sin(.45 * t), 0, 11 * Math.cos(.45 * t)]));
        //save matrix for camera placement - at planet center
        this.planet_3 = model_transform;
        //make the planet rotate on an x and y axis
        model_transform = model_transform.times( Mat4.rotation( 1, Vec.of(.2,.2,.2)))
                                       .times( Mat4.rotation( .4 * t, Vec.of(Math.sin(.2*t), Math.cos(.2*t), 0)));
        //draw the planet
        this.shapes.sphere_34sun.draw(graphics_state, model_transform, this.materials.planet3);
        //squash the torus2 into a ring
        model_transform = model_transform.times( Mat4.scale([0.8, 0.8, .01]));
        //add ring to the planet, give it same material
        this.shapes.torus2.draw(graphics_state, model_transform, this.materials.planet3);




        //Create and shape planet4
        //------------------------
        //reset matrix
        model_transform = Mat4.identity();
        //make it orbit the sun at radius 14, slower orbit
        model_transform = model_transform.times( Mat4.translation([14 * Math.sin(.3 * t), 0, 14 * Math.cos(.3 * t)]));
        //draw the planet4
        this.shapes.sphere_34sun.draw( graphics_state, model_transform, this.materials.planet4 );
        //save matrix for camera placement
        this.planet_4 = model_transform;




        //Create and shape moon around planet 4
        //---------------------
        //don't reset matrix because we want to keep it centered around planet4
        //update matrix to rotate around planet, radius 1.5
        model_transform = model_transform.times( Mat4.translation([2 * Math.sin(t), 0, 2 * Math.cos(t)]));
        //draw the moon
        this.shapes.sphere_5.draw(graphics_state, model_transform, this.materials.moon);
        //save matrix for camera placement
        this.moon = model_transform;


      }
    display( graphics_state )
      { graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
        
        //draw the solar system
        this.draw_planets(graphics_state, t);
        
        //handle camera angles (planet attachments)
        //if a button has been pushed
        if(this.attached) {
          //make a matrix "desired" that is 5 units away from the planet perspective
          var desired = Mat4.inverse(this.attached().times(Mat4.translation([0,0,5])));
          //invert the matrix
          desired = desired.map((x, i) => Vec.from( graphics_state.camera_transform[i]).mix(x, .1));
          //set equal to camera transformation
          graphics_state.camera_transform = desired;
        }


        // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 2 and 3)


        //this.shapes.torus2.draw( graphics_state, Mat4.identity(), this.materials.test );

      }
  }


// Extra credit begins here (See TODO comments below):

window.Ring_Shader = window.classes.Ring_Shader =
class Ring_Shader extends Shader              // Subclasses of Shader each store and manage a complete GPU program.
{ material() { return { shader: this } }      // Materials here are minimal, without any settings.
  map_attribute_name_to_buffer_name( name )       // The shader will pull single entries out of the vertex arrays, by their data fields'
    {                                             // names.  Map those names onto the arrays we'll pull them from.  This determines
                                                  // which kinds of Shapes this Shader is compatible with.  Thanks to this function, 
                                                  // Vertex buffers in the GPU can get their pointers matched up with pointers to 
                                                  // attribute names in the GPU.  Shapes and Shaders can still be compatible even
                                                  // if some vertex data feilds are unused. 
      return { object_space_pos: "positions" }[ name ];      // Use a simple lookup table.
    }
    // Define how to synchronize our JavaScript's variables to the GPU's:
  update_GPU( g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl )
      { const proj_camera = g_state.projection_transform.times( g_state.camera_transform );
                                                                                        // Send our matrices to the shader programs:
        gl.uniformMatrix4fv( gpu.model_transform_loc,             false, Mat.flatten_2D_to_1D( model_transform.transposed() ) );
        gl.uniformMatrix4fv( gpu.projection_camera_transform_loc, false, Mat.flatten_2D_to_1D(     proj_camera.transposed() ) );
      }
  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
              varying vec4 position;
              varying vec4 center;
      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return `
        attribute vec3 object_space_pos;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_transform;

        void main()
        { 
        }`;           // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    { return `
        void main()
        { 
        }`;           // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
    }
}

window.Grid_Sphere = window.classes.Grid_Sphere =
class Grid_Sphere extends Shape           // With lattitude / longitude divisions; this means singularities are at 
  { constructor( rows, columns, texture_range )             // the mesh's top and bottom.  Subdivision_Sphere is a better alternative.
      { super( "positions", "normals", "texture_coords" );
        

                      // TODO:  Complete the specification of a sphere with lattitude and longitude lines
                      //        (Extra Credit Part III)
      } }