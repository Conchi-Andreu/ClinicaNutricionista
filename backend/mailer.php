<?php
// backend/mailer.php
require_once 'config.php';

function send_email($to, $subject, $body) {
    $from = "info@gemmapascual.es";
    $from_name = "Clínica Nutricionista";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: $from_name <$from>" . "\r\n";
    $headers .= "Reply-To: $from" . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    $html_content = generate_html_template($body);
    
    // Enviamos el correo principal
    $success = mail($to, $subject, $html_content, $headers);
    
    // Si el correo no es para info@, enviamos una COPIA REAL a info@ para que aparezca en la bandeja
    if ($to !== $from) {
        $copy_subject = "[COPIA] " . $subject;
        mail($from, $copy_subject, $html_content, $headers);
    }
    
    return $success;
}

function generate_html_template($body) {
    return "
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { padding: 20px; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; }
            .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 20px; }
            .footer { font-size: 12px; color: #999; text-align: center; padding: 20px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1 style='color: white; margin: 0;'>Clínica Nutricionista</h1>
            </div>
            <div class='content'>
                $body
            </div>
            <div class='footer'>
                Este mensaje ha sido generado automáticamente por el sistema de la clínica.
            </div>
        </div>
    </body>
    </html>";
}

function send_welcome_email($email, $nombre) {
    $subject = "¡Bienvenido a la Clínica Nutricionista!";
    $body = "<h2>Hola $nombre,</h2>
             <p>Gracias por registrarte en nuestra plataforma.</p>
             <p>Ya puedes acceder a tu panel para gestionar tus citas.</p>
             <a href='https://www.gemmapascual.es/Programacion/login' style='background:#0ea5e9; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;'>Acceder</a>";
    return send_email($email, $subject, $body);
}

function send_password_reset_email($email, $nombre, $token) {
    $subject = "Restablecer tu contraseña - Clínica Nutricionista";
    $reset_link = "https://www.gemmapascual.es/Programacion/reset-password?token=" . $token;
    $body = "<h2>Hola $nombre,</h2>
             <p>Has solicitado restablecer tu contraseña. Haz clic en el botón:</p>
             <a href='$reset_link' style='background:#0ea5e9; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;'>Restablecer</a>";
    return send_email($email, $subject, $body);
}

function send_admin_message_notification($data) {
    $subject = "Nuevo Mensaje de Contacto: " . $data['asunto'];
    $body = "<h2>Has recibido un nuevo mensaje</h2>
             <p><b>De:</b> {$data['email']}</p>
             <p><b>Asunto:</b> {$data['asunto']}</p>
             <p><b>Mensaje:</b></p>
             <div style='background:#f9f9f9; padding:15px; border-radius:10px;'>{$data['mensaje']}</div>";
    return send_email("info@gemmapascual.es", $subject, $body);
}
