<?php
// Database connection configuration
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "qr_attendance";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    // Set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Optional: Set charset to utf8
    $conn->exec("SET NAMES utf8");
    
} catch(PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
    die();
}

// Function to get connection
function getConnection() {
    global $conn;
    return $conn;
}

// Function to close connection
function closeConnection() {
    global $conn;
    $conn = null;
}

// Function to test connection
function testConnection() {
    global $conn;
    try {
        $stmt = $conn->query("SELECT 1");
        return true;
    } catch(PDOException $e) {
        return false;
    }
}

// Auto-close connection when script ends
register_shutdown_function('closeConnection');
?> 