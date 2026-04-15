<?php
// backend/debug_mail.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Diagnóstico de Correo</h2>";

if (!function_exists('mail')) {
    echo "<p style='color:red'>❌ ERROR: La función mail() de PHP está DESACTIVADA en este servidor.</p>";
} else {
    echo "<p style='color:green'>✅ La función mail() está activada.</p>";
    
    $to = "info@gemmapascual.es";
    $subject = "Prueba de Diagnóstico - " . date('H:i:s');
    $message = "Este es un correo de prueba para verificar el envío desde el servidor.";
    $headers = "From: info@gemmapascual.es\r\n";
    $headers .= "Reply-To: info@gemmapascual.es\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    echo "<p>Intentando enviar correo de prueba a <b>$to</b>...</p>";
    
    if (mail($to, $subject, $message, $headers)) {
        echo "<p style='color:green; font-weight:bold'>¡ÉXITO! El servidor informa que el correo ha sido aceptado para su envío.</p>";
        echo "<p>Si no lo recibes en unos minutos, revisa la carpeta de SPAM o consulta con tu hosting por si tienen un bloqueo de salida.</p>";
    } else {
        echo "<p style='color:red; font-weight:bold'>❌ ERROR: El servidor ha rechazado el envío del correo.</p>";
        $error = error_get_last();
        if ($error) {
            echo "<p>Detalle del error: " . $error['message'] . "</p>";
        }
    }
}

echo "<hr><p>Si el éxito es verde pero no llega nada, la solución definitiva será configurar el **SMTP** con tu contraseña.</p>";
?>
