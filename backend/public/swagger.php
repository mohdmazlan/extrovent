<?php
/**
 * Swagger UI Handler
 * Serves both the HTML and the OpenAPI spec
 */

header('Content-Type: text/html; charset=utf-8');

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Health check (no auth required)
if ($path === '/health' || $path === 'health') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => [
            'status' => 'ok',
            'message' => 'Extrovent API is running',
            'timestamp' => date('c')
        ],
        'error' => null
    ]);
    exit;
}

// Serve the YAML spec if requested
if ($path === '/swagger/openapi.yaml' || $path === '/swagger/openapi.yaml/') {
    header('Content-Type: text/yaml; charset=utf-8');
    $yamlFile = __DIR__ . '/../swagger/openapi.yaml';
    if (file_exists($yamlFile)) {
        readfile($yamlFile);
        exit;
    }
}

// Serve the Swagger UI HTML
if ($path === '/swagger' || $path === '/swagger/' || $path === '/swagger/index.html') {
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Extrovent API Documentation</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.13.0/swagger-ui.css">
        <style>
            body { margin: 0; padding: 0; }
            .topbar { display: none; }
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>

        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.13.0/swagger-ui-bundle.min.js" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.13.0/swagger-ui-standalone-preset.min.js" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js" crossorigin="anonymous"></script>
        <script>
            window.onload = function() {
                // Fetch the YAML spec from the same server
                fetch('/swagger/openapi.yaml')
                    .then(response => response.text())
                    .then(yamlText => {
                        const parsedSpec = jsyaml.load(yamlText);
                        const ui = SwaggerUIBundle({
                            spec: parsedSpec,
                            dom_id: '#swagger-ui',
                            deepLinking: true,
                            presets: [
                                SwaggerUIBundle.presets.apis,
                                SwaggerUIStandalonePreset
                            ],
                            layout: "StandaloneLayout"
                        });
                    })
                    .catch(err => {
                        document.getElementById('swagger-ui').innerHTML = 
                            '<div style="padding:40px;text-align:center;color:#e74c3c;">' +
                            '<h3>Failed to load API documentation</h3>' +
                            '<p>Error: ' + err.message + '</p></div>';
                    });
            };
        </script>
    </body>
    </html>
    <?php
}
