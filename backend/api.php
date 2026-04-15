<?php
// backend/api.php
require_once 'config.php';
require_once 'auth.php';
require_once 'mailer.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['path']) ? $_GET['path'] : '';
$table = isset($_GET['table']) ? $_GET['table'] : '';
$id = isset($_GET['id']) ? $_GET['id'] : null;

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Manejo de pre-flight OPTIONS
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// MENSAJE DE PRUEBA PÚBLICO (Para verificar conexión)
if ($path === '' && $table === '') {
    echo json_encode(["message" => "API Clinica Nutricionista funcionando", "status" => "v1.1", "db" => "connected"]);
    exit;
}

// Rutas públicas (Login y Registro)
if ($path === 'login' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'];
    $password = $input['password'];

    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $token = generate_jwt([
            'id' => $user['id'],
            'email' => $user['email'],
            'rol' => $user['rol'],
            'exp' => time() + (60 * 60 * 24) // 24 horas
        ]);
        echo json_encode([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'nombre' => $user['nombre'],
                'email' => $user['email'],
                'rol' => $user['rol']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "Credenciales inválidas"]);
    }
    exit;
}

if ($path === 'register' && $method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $nombre = $input['nombre'] ?? '';
        $apellidos = $input['apellidos'] ?? '';
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        $telefono = $input['telefono'] ?? '';
        $rol = $input['rol'] ?? 'paciente';

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(["error" => "Email y contraseña son obligatorios"]);
            exit;
        }

        // Verificar si el usuario ya existe
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "El email ya está registrado"]);
            exit;
        }

        // Hash de la contraseña - Usamos PASSWORD_BCRYPT para asegurar compatibilidad
        $password_hash = password_hash($password, PASSWORD_BCRYPT);

        // Insertar en la tabla usuarios. Intentamos insertar los campos que vienen del formulario.
        // Si la tabla no tiene 'apellidos' o 'telefono', esto fallará y el catch nos dirá por qué.
        $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, apellidos, email, password_hash, telefono, rol) VALUES (?, ?, ?, ?, ?, ?)");
        $res = $stmt->execute([$nombre, $apellidos, $email, $password_hash, $telefono, $rol]);

        if ($res) {
            // Enviar email de bienvenida (sin bloquear si falla)
            try {
                send_welcome_email($email, $nombre);
            } catch (Exception $e) {
                // No detenemos el flujo si falla el email
            }
            echo json_encode(["success" => true, "message" => "Usuario registrado correctamente"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "No se pudo crear el usuario"]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        // Enviamos el mensaje de error para debuguear (en producción se debería quitar o loguear)
        echo json_encode(["error" => "Error de base de datos: " . $e->getMessage()]);
    }
    exit;
}

if ($path === 'request-password-reset' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? '';

    $stmt = $pdo->prepare("SELECT id, nombre FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        $token = bin2hex(random_bytes(32));
        // Guardar token (borrar anteriores primero)
        $pdo->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);
        $pdo->prepare("INSERT INTO password_resets (email, token) VALUES (?, ?)")->execute([$email, $token]);
        
        send_password_reset_email($email, $user['nombre'], $token);
    }
    
    // Por seguridad siempre respondemos éxito para no confirmar existencia de emails
    echo json_encode(["success" => true, "message" => "Si el email existe, se ha enviado un enlace"]);
    exit;
}

if ($path === 'reset-password' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $token = $input['token'] ?? '';
    $new_password = $input['password'] ?? '';

    $stmt = $pdo->prepare("SELECT email FROM password_resets WHERE token = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)");
    $stmt->execute([$token]);
    $reset = $stmt->fetch();

    if ($reset) {
        $password_hash = password_hash($new_password, PASSWORD_BCRYPT);
        $pdo->prepare("UPDATE usuarios SET password_hash = ? WHERE email = ?")->execute([$password_hash, $reset['email']]);
        $pdo->prepare("DELETE FROM password_resets WHERE token = ?")->execute([$token]);
        echo json_encode(["success" => true, "message" => "Contraseña actualizada correctamente"]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Token inválido o expirado"]);
    }
    exit;
}


// Rutas Públicas (Lectura de configuración y Envío de mensajes)
if ($method === 'GET' && in_array($table, ['site_config', 'legal_texts', 'tipos_visita', 'centros_salas', 'tecnicos'])) {
    // Estas tablas son públicas para que la web cargue su diseño y opciones
    // Podemos proceder directamente al CRUD genérico saltándonos el token
} elseif ($method === 'POST' && $table === 'mensajes') {
    // Permitir enviar mensajes de contacto de forma pública
} else {
    // Validación de Token para el resto de rutas (Privadas)
    $token = get_bearer_token();
    $tokenData = validate_jwt($token);

    if (!$tokenData) {
        http_response_code(401);
        echo json_encode(["error" => "Acceso no autorizado"]);
        exit;
    }
}

// CRUD Genérico
if ($table) {
    // Validar nombre de tabla para evitar inyección SQL
    $allowed_tables = ['usuarios', 'centros_salas', 'tecnicos', 'tipos_visita', 'pacientes', 'disponibilidad_slots', 'citas', 'site_config', 'legal_texts', 'mensajes'];
    if (!in_array($table, $allowed_tables)) {
        http_response_code(400);
        echo json_encode(["error" => "Tabla no permitida"]);
        exit;
    }

    try {
        switch ($method) {
            case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM $table WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode($stmt->fetch());
            } else {
                $sql = "SELECT * FROM $table";
                $conditions = [];
                $values = [];
                
                foreach ($_GET as $key => $value) {
                    if ($key === 'table' || $key === 'id' || $key === 'path') continue;
                    
                    // Support operators: field[gte], field[lte], etc.
                    if (preg_match('/^(.+)\[(gte|lte|gt|lt)\]$/', $key, $matches)) {
                        $field = $matches[1];
                        $op = $matches[2];
                        $sql_op = ['gte' => '>=', 'lte' => '<=', 'gt' => '>', 'lt' => '<'][$op];
                        $conditions[] = "$field $sql_op ?";
                        $values[] = $value;
                    } else {
                        $conditions[] = "$key = ?";
                        $values[] = $value;
                    }
                }
                
                if (!empty($conditions)) {
                    $sql .= " WHERE " . implode(" AND ", $conditions);
                }
                
                // Add default sorting by createdAt if exists
                $sql .= " ORDER BY id DESC"; // Fallback to ID
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($values);
                echo json_encode($stmt->fetchAll());
            }
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) throw new Exception("No input data");

            // Check if batch insert (array of objects)
            if (isset($input[0]) && is_array($input[0])) {
                $columns = implode(', ', array_keys($input[0]));
                $placeholders = '(' . implode(', ', array_fill(0, count($input[0]), '?')) . ')';
                $allPlaceholders = implode(', ', array_fill(0, count($input), $placeholders));
                
                $sql = "INSERT INTO $table ($columns) VALUES $allPlaceholders";
                $stmt = $pdo->prepare($sql);
                
                $flatValues = [];
                foreach ($input as $row) {
                    foreach ($row as $value) {
                        $flatValues[] = $value;
                    }
                }
                $stmt->execute($flatValues);
                echo json_encode(["message" => "Registros creados correctamente", "count" => count($input)]);
            } else {
                // If special handling for users table
                if ($table === 'usuarios') {
                    if (isset($input['password'])) {
                        $input['password_hash'] = password_hash($input['password'], PASSWORD_BCRYPT);
                        unset($input['password']);
                    }
                }

                $columns = implode(', ', array_keys($input));
                $placeholders = implode(', ', array_fill(0, count($input), '?'));
                $sql = "INSERT INTO $table ($columns) VALUES ($placeholders)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute(array_values($input));
                
                $newId = $pdo->lastInsertId();

                // Post-insert actions like sending emails
                if ($table === 'usuarios') {
                    send_welcome_email($input['email'] ?? '', $input['nombre'] ?? 'Usuario');
                }

                if ($table === 'mensajes') {
                    send_admin_message_notification($input);
                }

                echo json_encode(["id" => $newId, "message" => "Creado correctamente"]);
            }
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => "ID requerido"]);
                exit;
            }
            $input = json_decode(file_get_contents('php://input'), true);
            $sets = [];
            foreach ($input as $key => $value) {
                $sets[] = "$key = ?";
            }
            $sql = "UPDATE $table SET " . implode(", ", $sets) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $params = array_values($input);
            $params[] = $id;
            $stmt->execute($params);
            echo json_encode(["message" => "Actualizado correctamente"]);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => "ID requerido"]);
                exit;
            }
            $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["message" => "Eliminado correctamente"]);
            break;
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
