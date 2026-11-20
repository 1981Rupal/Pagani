# DEMO ONLY. These options are illustrative and are not an official Pagani catalogue.
VEHICLES = {
    "pagani_utopia": {
        "id": "pagani_utopia",
        "name": "Pagani Utopia",
        "model_year_label": "Demo vehicle profile",
        "options": {
            "exterior.body_color": ["emerald_green", "midnight_blue", "obsidian_black", "pearl_white", "burgundy"],
            "exterior.carbon_finish": ["exposed_dark", "satin_dark", "gloss_dark"],
            "wheels.design": ["approved_wheel_01", "approved_wheel_02"],
            "wheels.finish": ["champagne_gold", "gloss_black", "polished_silver", "dark_titanium"],
            "interior.seat_material": ["leather", "alcantara"],
            "interior.seat_color": ["tan", "black", "ivory", "burgundy", "cognac"],
            "interior.stitching": ["brown", "gold", "black", "cream", "red"],
            "bespoke.embroidery": ["none", "customer_initials"]
        }
    }
}

EXTERIOR_THEMES = [
    {"id":"emerald_heritage","name":"Emerald Heritage","description":"Emerald green, exposed carbon and champagne accents","values":{"exterior.body_color":"emerald_green","exterior.carbon_finish":"exposed_dark","wheels.finish":"champagne_gold"}},
    {"id":"stealth_obsidian","name":"Stealth Obsidian","description":"Black finish with dark carbon and titanium accents","values":{"exterior.body_color":"obsidian_black","exterior.carbon_finish":"gloss_dark","wheels.finish":"dark_titanium"}},
    {"id":"arctic_elegance","name":"Arctic Elegance","description":"Pearl white with exposed carbon and polished accents","values":{"exterior.body_color":"pearl_white","exterior.carbon_finish":"exposed_dark","wheels.finish":"polished_silver"}},
    {"id":"rosso_imperiale","name":"Rosso Imperiale","description":"Burgundy with dark carbon and champagne accents","values":{"exterior.body_color":"burgundy","exterior.carbon_finish":"satin_dark","wheels.finish":"champagne_gold"}},
    {"id":"azure_royale","name":"Azure Royale","description":"Midnight blue with polished accents","values":{"exterior.body_color":"midnight_blue","exterior.carbon_finish":"exposed_dark","wheels.finish":"polished_silver"}},
    {"id":"oro_esclusivo","name":"Oro Esclusivo","description":"A champagne-inspired bespoke direction","values":{"exterior.body_color":"emerald_green","exterior.carbon_finish":"satin_dark","wheels.finish":"champagne_gold"}}
]
INTERIOR_THEMES = [
    {"id":"italian_heritage","name":"Italian Heritage","description":"Tan leather and warm brown stitching","values":{"interior.seat_material":"leather","interior.seat_color":"tan","interior.stitching":"brown"}},
    {"id":"dark_atelier","name":"Dark Atelier","description":"Black leather and black stitching","values":{"interior.seat_material":"leather","interior.seat_color":"black","interior.stitching":"black"}},
    {"id":"ivory_prestige","name":"Ivory Prestige","description":"Ivory leather with cream stitching","values":{"interior.seat_material":"leather","interior.seat_color":"ivory","interior.stitching":"cream"}},
    {"id":"rosso_classico","name":"Rosso Classico","description":"Burgundy leather and red stitching","values":{"interior.seat_material":"leather","interior.seat_color":"burgundy","interior.stitching":"red"}},
    {"id":"blu_notte","name":"Blu Notte","description":"Dark blue-inspired interior direction","values":{"interior.seat_material":"alcantara","interior.seat_color":"black","interior.stitching":"black"}},
    {"id":"cognac_signature","name":"Cognac Signature","description":"Cognac leather with cream accents","values":{"interior.seat_material":"leather","interior.seat_color":"cognac","interior.stitching":"cream"}}
]
