<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set error handler
function customErrorHandler($errno, $errstr, $errfile, $errline) {
    echo "<h2>Error Details:</h2>";
    echo "<p><strong>Error:</strong> [$errno] $errstr</p>";
    echo "<p><strong>File:</strong> $errfile</p>";
    echo "<p><strong>Line:</strong> $errline</p>";
    echo "<hr>";
}

set_error_handler("customErrorHandler");

// Test database connection
echo "<h2>Testing Database Connection</h2>";

try {
    require_once 'config/connection.php';
    echo "<p style='color: green;'>✅ Database connection successful!</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Database connection failed: " . $e->getMessage() . "</p>";
}

// Test if tables exist
echo "<h2>Testing Tables</h2>";

try {
    $tables = ['students', 'sbo_officers', 'faculty', 'attendance_records'];
    
    foreach($tables as $table) {
        $stmt = $conn->query("SHOW TABLES LIKE '$table'");
        if($stmt->rowCount() > 0) {
            echo "<p style='color: green;'>✅ Table '$table' exists</p>";
        } else {
            echo "<p style='color: red;'>❌ Table '$table' does not exist</p>";
        }
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error checking tables: " . $e->getMessage() . "</p>";
}

// Test API endpoints
echo "<h2>Testing API Endpoints</h2>";

$endpoints = [
    'api/student.php?action=get_all',
    'api/sbo.php?action=recent_attendance',
    'api/faculty.php?action=attendance_records'
];

foreach($endpoints as $endpoint) {
    $url = "http://localhost/qr/$endpoint";
    echo "<p>Testing: <code>$url</code></p>";
    
    $context = stream_context_create([
        'http' => [
            'timeout' => 5,
            'ignore_errors' => true
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    
    if($response === false) {
        echo "<p style='color: red;'>❌ Failed to access endpoint</p>";
    } else {
        echo "<p style='color: green;'>✅ Endpoint accessible</p>";
        echo "<pre>" . htmlspecialchars(substr($response, 0, 200)) . "...</pre>";
    }
    echo "<hr>";
}

echo "<h2>PHP Configuration</h2>";
echo "<p><strong>PHP Version:</strong> " . phpversion() . "</p>";
echo "<p><strong>PDO MySQL:</strong> " . (extension_loaded('pdo_mysql') ? 'Enabled' : 'Disabled') . "</p>";
echo "<p><strong>Error Reporting:</strong> " . (ini_get('display_errors') ? 'On' : 'Off') . "</p>";
?> 