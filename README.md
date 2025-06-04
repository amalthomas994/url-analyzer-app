# URL Analyzer Application

This project is a URL analysis tool that provides details about a user-supplied URL, including image statistics and nested links.

## Overview

The application consists of:
* A Flutter frontend for user interaction.
* A Node.js/TypeScript backend for processing URLs.

## Backend (Node.js / TypeScript / Express)

The backend is responsible for fetching the HTML content of a user supplied URL, parsing it, and extracting details about images and links.

### Prerequisites

* **Node.js:** Version 18.x or later. (Verify with `node -v`)
* **npm:**  (Verify with `npm -v`)

### Setup Instructions

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    This will read the `package.json` file and install all the necessary libraries listed under `dependencies` and `devDependencies`. The installed packages will reside in the `backend/node_modules/` directory.
    ```bash
    npm install
    ```

### Running the Backend

There are two main ways to run the backend server:

1.  **Development Mode (with auto-reload):**
    This mode uses `ts-node-dev` to run the TypeScript code directly and automatically restarts the server whenever changes are made to the source files. Use this for development.
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:3000` (or the port specified by the `PORT` environment variable). A confirmation message should be printed in the console:
    `Backend server is listening on http://localhost:3000`

2.  **Production Mode:**
    For a production environment, compile the TypeScript code into JavaScript, and then run the compiled JavaScript.
    * **Build the project:**
        This command uses the TypeScript compiler (`tsc`) to transpile the `.ts` files from the `src/` directory into JavaScript `.js` files in the `dist/` directory, according to the settings in `tsconfig.json`.
        ```bash
        npm run build
        ```
    * **Start the server:**
        This command runs the compiled JavaScript application using Node.js.
        ```bash
        npm start
        ```
        The server will start on `http://localhost:3000`.

### Backend API Endpoint

The backend exposes a single API endpoint for URL analysis:

* **Endpoint:** `GET /analyze_url`
* **Description:** Accepts a URL as a query parameter, fetches and analyzes the content of that URL.
* **Expected Query Parameter:**
    * `url` (string, required): The full URL of the webpage to be analyzed.
        * Example: `http://localhost:3000/analyze_url?url=https://google.com`
        * The backend will attempt to prepend `https://` if no scheme (`http://` or `https://`) is provided.
* **Success Response (200 OK):**
    A JSON object containing the analysis details.
    ```json
    {
        "message": "URL analysis successful!",
        "requestedURL": "[https://google.com](https://google.com)",
        "imageDetails": {
            ".png": {
                "count": 5,
                "totalSize": 150780, // Total size in bytes
                "sources": ["[https://google.com/image1.png](https://google.com/image1.png)", "..."]
            },
            ".jpg": {
                "count": 10,
                "totalSize": 875320,
                "sources": ["[https://google.com/photo.jpg](https://google.com/photo.jpg)", "..."]
            },
            ".unknown": { // For images where extension couldn't be determined from URL
                "count": 1,
                "totalSize": 0, 
                "sources": ["[https://google.com/some-dynamic-image-url](https://google.com/some-dynamic-image-url)"]
            }
            // ... other extensions
        },
        "internalLinks": [
            "[https://google.com/about](https://google.com/about)",
            "[https://google.com/contact](https://google.com/contact)"
            // ... other absolute internal URLs
        ],
        "externalLinks": [
            "[https://www.anotherdomain.com/](https://www.anotherdomain.com/)",
            "[http://someothersite.org/resource](http://someothersite.org/resource)"
            // ... other absolute external URLs
        ]
    }
    ```
* **Error Responses:**
    * **400 Bad Request:** If the `url` query parameter is missing or empty.
        ```json
        {
            "error": "URL Query parameter required!"
        }
        ```
    * **Other HTTP Status Codes (e.g., 404, 500, 504):** If the backend encounters an error fetching the target URL or during processing. The JSON response will include an `error` and `message` field.
        ```json
        // Example if target server returns 404
        {
            "message": "Server responded with the status 404",
            "requestedURL": "https://google.com/nonexistentpage",
            "error": "Failed to retrieve URL!"
        }
        ```

### Technologies Used

* **Node.js**
* **TypeScript**
* **Express.js:** Web application framework for Node.js.
* **Axios:** Promise-based HTTP client for making requests to fetch page content and image headers.
* **Cheerio:** Fast, flexible, and lean implementation of core jQuery designed specifically for the server to parse HTML.
* **Node.js `url` and `path` modules:** For URL parsing, resolution, and path manipulation.

## Frontend (Flutter)
