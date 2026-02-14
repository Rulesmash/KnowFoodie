from fastapi import FastAPI, Request, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import requests

app = FastAPI()

templates = Jinja2Templates(directory="templates")

import csv

# Load additives database
ADDITIVES_DB = {}
try:
    with open("additives.csv", mode="r", encoding="utf-8", errors="replace") as csvfile:
        for line in csvfile:
            # Skip empty lines
            if not line.strip():
                continue
            
            # Manual split by comma
            parts = line.split(",")
            
            # Expect at least 3 parts: id, e_code, title
            if len(parts) >= 3:
                # e_code is index 1, title is index 2
                code = parts[1].strip().upper()
                title = parts[2].strip()
                
                # Check if it looks like an E-code (starts with E)
                if code.startswith("E") and title and title != "title":
                    # Remove quotes from title if present
                    title = title.strip('"').strip("'")
                    ADDITIVES_DB[code] = title
                    
    print(f"Loaded {len(ADDITIVES_DB)} additives from CSV.")
except Exception as e:
    print(f"Error loading additives.csv: {e}")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/scan/{barcode}")
async def scan_barcode(barcode: str):
    # Try to enforce English if possible, though OFF defaults to local or mixed.
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") != 1:
            raise HTTPException(status_code=404, detail="Product not found")
            
        product = data.get("product", {})
        
        # Extract fields
        name = product.get("product_name", "Unknown Product")
        image_url = product.get("image_url", "")
        categories = product.get("categories", "Unknown Category").split(",")
        
        # Veg/Non-Veg Logic
        ingredients_tags = product.get("ingredients_analysis_tags", [])
        is_vegetarian = "en:vegetarian" in ingredients_tags
        is_vegan = "en:vegan" in ingredients_tags
        is_non_vegetarian = "en:non-vegetarian" in ingredients_tags
        
        veg_status = "Unknown"
        if is_vegan:
            veg_status = "Vegan"
        elif is_vegetarian:
            veg_status = "Vegetarian"
        elif is_non_vegetarian:
            veg_status = "Non-Vegetarian"
            
        # Allergens
        allergens = product.get("allergens_tags", [])
        allergens = [tag.replace("en:", "").replace("-", " ").title() for tag in allergens]
        
        # Additives - Lookup from CSV
        additives_tags = product.get("additives_tags", [])
        
        # Create user-friendly additive list
        additives_list = []
        for tag in additives_tags:
            # Clean tag e.g., "en:e322" -> "E322"
            # Some tags might be "en:e322i" -> "E322I" or "E322i", CSV has "E322"
            # CSV example lines: E100, E101, E101a
            
            code_clean = tag.replace("en:", "")
            # Example tag: e322, CSV: E322. tag e101a, CSV E101a.
            # Try exact match case-insensitive
            
            # Helper to find code in DB
            found_title = None
            
            # Try upper
            code_upper = code_clean.upper()
            if code_upper in ADDITIVES_DB:
                 found_title = ADDITIVES_DB[code_upper]
            
            # Try original casing if not found (though usually tags are lowercase in API and Mix/Upper in CSV)
            if not found_title and code_clean in ADDITIVES_DB:
                found_title = ADDITIVES_DB[code_clean]
                
            # Try extracting base code if suffix exists? e.g. e322i -> E322? 
            # User said "do not fetch from api", stick to CSV.
            
            if found_title:
                additives_list.append(f"{code_upper} - {found_title}")
            else:
                additives_list.append(code_upper) # Fallback to code if not in CSV
        
        # Health Score/Nutri-Score
        nutriscore = product.get("nutriscore_grade", "unknown").upper()
        
        return {
            "name": name,
            "image_url": image_url,
            "categories": [cat.strip() for cat in categories[:5]], # limit to 5
            "veg_status": veg_status,
            "allergens": allergens,
            "additives": additives_list,
            "nutriscore": nutriscore
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
