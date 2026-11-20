from app.catalogue import VEHICLES

def set_path(obj: dict, path: str, value):
    keys = path.split(".")
    target = obj
    for key in keys[:-1]:
        target = target.setdefault(key, {})
    target[keys[-1]] = value

def get_path(obj: dict, path: str):
    target = obj
    for key in path.split("."):
        if not isinstance(target, dict) or key not in target:
            return None
        target = target[key]
    return target

def validate_configuration(config: dict) -> tuple[dict, list[str]]:
    vehicle = VEHICLES.get(config.get("vehicle_id"))
    if not vehicle:
        raise ValueError("Unsupported vehicle_id. This module only contains configured vehicle profiles.")
    warnings = []
    for group, values in config.items():
        if not isinstance(values, dict):
            continue
        for key, value in list(values.items()):
            path = f"{group}.{key}"
            allowed = vehicle["options"].get(path)
            if allowed is None:
                warnings.append(f"{path} is not in the demo catalogue and was not accepted.")
                values.pop(key, None)
            elif value not in allowed:
                warnings.append(f"{value!r} is not an available demo option for {path}.")
                values.pop(key, None)
    config["validation_warnings"] = warnings
    return config, warnings

def apply_flat_values(config: dict, flat: dict):
    for path, value in flat.items():
        set_path(config, path, value)
    return config
