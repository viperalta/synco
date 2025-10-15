#!/bin/bash

# Script para GitHub Pages
# Este script debe ejecutarse después del build

# Crear archivo 404.html que redirija a index.html
echo '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
        // Redirigir a index.html manteniendo la ruta
        var pathSegmentsToKeep = 0;
        var l = window.location;
        l.replace(
            l.protocol + "//" + l.hostname + (l.port ? ":" + l.port : "") +
            l.pathname.split("/").slice(0, 1 + pathSegmentsToKeep).join("/") + "/?/" +
            l.pathname.slice(1).split("/").slice(pathSegmentsToKeep).join("/").replace(/&/g, "~and~") +
            (l.search ? "&" + l.search.slice(1).replace(/&/g, "~and~") : "") +
            l.hash
        );
    </script>
</head>
<body>
    <p>Redirecting...</p>
</body>
</html>' > dist/404.html

echo "Archivo 404.html creado para GitHub Pages"
