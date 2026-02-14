# KnowFoodie 🍎

KnowFoodie is a lightweight, modern web application that acts as a smart food scanner. It allows users to scan product barcodes (or enter them manually) to instantly retrieve detailed information about food products, including nutritional scores, vegetarian status, allergens, and a breakdown of additives.

## Features ✨

-   **Real-time Barcode Scanning**: integrated directly into the browser using `html5-qrcode`.
-   **Nutri-Score Visualization**: A visual color-coded scale (A-E) to easily understand the nutritional quality of a product.
-   **Additives Analysis**: 
    -   Displays detailed names of additives (e.g., "E322 - Lecithin") instead of just codes.
    -   Powered by a local, robustly parsed `additives.csv` database for reliability.
-   **Dietary Info**: Instantly identifies if a product is Vegan, Vegetarian, or Non-Vegetarian.
-   **Allergen Alerts**: Clearly lists allergens found in the product.
-   **Premium UI**: A glassmorphism-inspired design that is fully responsive for mobile and desktop.

## Project Structure 📂

```
KnowFoodie/
├── main.py                 # FastAPI Backend & CSV Parsing Logic
├── additives.csv           # Local database of food additives
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html          # Frontend HTML structure
└── static/
    ├── css/
    │   └── style.css       # Custom styling (Glassmorphism, Responsive)
    ├── js/
    │   └── script.js       # Frontend Logic (Scanner, API calls, UI updates)
    └── favicon.svg         # Application Icon
```

## Installation & Setup ⚙️

1.  **Clone or Open the Project**:
    Ensure you are in the project directory:
    ```bash
    cd d:/Docs/Python/KnowFoodie
    ```

2.  **Install Dependencies**:
    Install the required Python packages (FastAPI, Uvicorn, Requests, Jinja2):
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the Application**:
    Start the FastAPI server using Uvicorn. This will load the `additives.csv` file into memory and serve the application.
    ```bash
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```
    *Note: The `--reload` flag is useful for development as it restarts the server on code changes.*

4.  **Access the App**:
    Open your web browser and navigate to:
    [http://localhost:8000](http://localhost:8000)

## Usage 📱

1.  **Scan a Barcode**: Grant camera permissions when prompted. The scanner will automatically detect barcodes.
2.  **Manual Entry**: If scanning fails or you don't have a camera, type the barcode number into the input field and hit "Submit".
3.  **View Details**: The product card will appear with:
    -   Product Name & Image
    -   Nutri-Score (A-E visual scale)
    -   Vegetarian/Vegan Status
    -   List of Additives (with full names)
    -   Allergens

## Troubleshooting 🔧

-   **"Product not found"**: The barcode might not exist in the OpenFoodFacts database.
-   **Server not starting**: Ensure `requirements.txt` packages are installed and port 8000 is free.
-   **Additives showing as codes only**: Ensure the `additives.csv` file is present in the root directory and the server was restarted after any changes to it.

## Credits 

-   **Data Source**: Product data provided by the [OpenFoodFacts API](https://world.openfoodfacts.org/data).
-   **Scanning Library**: [html5-qrcode](https://github.com/mebjas/html5-qrcode).
