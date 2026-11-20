Install these dependencies in the existing React project if using the optional adapter:

```bash
npm install three @react-three/fiber @react-three/drei
```

The optional `AtelierConfigurator.tsx` itself uses React and fetch; it does not require a new app.
The Three.js adapter accepts a loaded `THREE.Object3D` root. For React Three Fiber, pass
`gltf.scene` to `applyConfiguration(gltf.scene, configuration)` after the GLB is loaded.

For a real production viewer, use a proper GLB scene with separate mesh/material slots and
add controls, environment lighting, camera presets, shadows and render quality settings.
