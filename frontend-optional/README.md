# Optional frontend integration

The backend can be integrated into any existing frontend. You do not have to use this folder.
Set `VITE_ATELIER_API_URL` or `NEXT_PUBLIC_ATELIER_API_URL` to the backend URL.

## Suggested integration
1. When the customer selects a vehicle, pass its vehicle ID to the module.
2. Fetch `/api/v1/themes?vehicle_id=...` and `/api/v1/vehicles/{id}/options`.
3. Submit theme IDs and free-text brief to `/api/v1/ai/generate`.
4. Let the customer select a proposal.
5. Load the proposal into the 3D viewer.
6. On manual changes, call `PATCH /api/v1/configurations/{id}` and apply the same change locally to the Three.js scene.

The sample adapter is intentionally separate from your host app. Copy it into your existing React app or wrap it as a component/module.
