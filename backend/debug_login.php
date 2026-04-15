<?php
require_once 'config.php';
$email = 'admin@clinica.es';
$new_pass = 'admin123';
// Generamos el hash usando el propio motor de tu servidor para asegurar compatibilidad
$new_hash = password_hash($new_pass, PASSWORD_BCRYPT);

try {
    $stmt = $pdo->prepare("UPDATE usuarios SET password_hash = ? WHERE email = ?");
    $stmt->execute([$new_hash, $email]);
    echo "<h1>¡ARREGLADO!</h1>";
    echo "Tu servidor ha generado correctamente el código de seguridad para 'admin123'.<br>";
    echo "Código generado: <code>$new_hash</code><br><br>";
    echo "<strong>Ya puedes cerrar esta página y probar el LOGIN en la web principal.</strong>";
} catch (Exception $e) {
    echo "Error al actualizar la base de datos: " . $e->getMessage();
}
?>
