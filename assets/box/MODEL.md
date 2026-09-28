# Box model reference

## File and structure

[designer-box-2-v1-icy.glb](designer-box-2-v1-icy.glb) is a glTF 2.0 binary, 1,322,324 bytes. Geometry, base materials, and two wordmark texture images are embedded. It has no external buffer or image dependencies, animation clips, or skeleton.

| Node name | Part | Opening behavior |
| --- | --- | --- |
| `Shell_Base` | Lower box body | Stationary |
| `Shell_Fitted_Cushion` | Interior watch cushion | Stationary |
| `Shell_Lid` | Upper shell/lid, including inner surface | Rotates around the hinge |
| `Shell_Seam` | Seam trim and lining | Stationary |
| `Shell_Wordmark` | MISTYBOX lettering attached to the lid | Moves with the lid |

A loader may represent a named part as a group containing multiple material meshes. The names above identify the complete parts.

## Coordinates and opening

The model uses a right-handed, Y-up coordinate system. The base rests at Y = 0. The closed bounds are approximately X = −0.56…0.56, Y = 0…1.1166, Z = −0.3799…0.3799. These values are model-space units.

The authored opening is a hinged rotation with these parameters, shared by `Shell_Lid` and `Shell_Wordmark`:

| Property | Value |
| --- | --- |
| Hinge pivot in model space | `[0, 0.914876, 0.359181]` |
| Rotation axis | `[1, 0, 0]` (positive X) |
| Closed angle | 0° |
| Fully open reference angle | +115° |
| Additional translation | `[0, 0, 0]` |

The moving parts are separate top-level nodes. Their vertices are authored in model space, with identity node transforms; their node origins are **not** hinge pivots. Rotate them about the supplied pivot, or establish an equivalent hinge parent while preserving the closed pose. Move the wordmark with the lid.

The approximate fully open bounds are X = −0.56…0.56, Y = 0…1.8654, Z = −0.6345…0.8543. These are useful for framing the whole opening.

There is no animation to play from the file. Timing, easing, camera movement, interaction, and reveal presentation are your design choices.

## Materials and images

The model includes these named materials:

- `ShellRole_Body_Matte`: outer body and lid.
- `ShellRole_Cavity_Bed`: cushion, including authored vertex colors.
- `ShellRole_Cavity_Inner`: inner lid surface.
- `ShellRole_SeamAccent_Accent`: colored seam trim.
- `ShellRole_Cavity_Lining`: lining on the seam part.
- `ShellRole_Body_Wordmark`: lettering with embedded base-color/alpha and normal textures.

The GLB uses standard PBR materials and the optional `KHR_materials_clearcoat` extension. It needs scene lighting supplied by your renderer; no lights or environment map are included. The embedded materials are sufficient to display the box. Material customization and lighting will affect its appearance; [reference.png](reference.png) is a visual reference, not a pixel-matching target.

The four [watch images](../watches/) are transparent PNGs and are separate from the box model.
