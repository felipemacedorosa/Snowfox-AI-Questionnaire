<?php

declare(strict_types=1);

require_once __DIR__ . '/_reportSheet.php';

const MAX_REPORT_BYTES = 262144;
const REPORT_KEYS = [
    'overallScore',
    'result',
    'pillarScores',
    'strongest',
    'weakest',
    'primaryPriority',
    'executiveSummary',
    'quarterlyRecommendations',
    'evidence',
    'profile',
    'criticalPath',
    'nextLevel',
    'riskSignals',
    'opportunityTracks',
];

function respond(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

function reject_request(int $status, string $code, string $message): never
{
    respond($status, ['error' => $message, 'code' => $code]);
}

function has_exact_keys(array $value, array $expected): bool
{
    $actual = array_keys($value);
    sort($actual);
    sort($expected);
    return $actual === $expected;
}

function canonicalize(mixed $value): mixed
{
    if (!is_array($value)) {
        return $value;
    }
    if (array_is_list($value)) {
        return array_map('canonicalize', $value);
    }
    ksort($value);
    foreach ($value as $key => $item) {
        $value[$key] = canonicalize($item);
    }
    return $value;
}

function is_object_array(mixed $value): bool
{
    return is_array($value) && !array_is_list($value);
}

function valid_timestamp(mixed $value): bool
{
    if (!is_string($value) || !preg_match('/(?:Z|[+-][0-9]{2}:[0-9]{2})$/', $value)) {
        return false;
    }
    try {
        new DateTimeImmutable($value);
        return true;
    } catch (Exception) {
        return false;
    }
}

function valid_answer_value(mixed $value): bool
{
    if (is_int($value) || is_float($value)) {
        return is_finite((float) $value);
    }
    if (is_string($value)) {
        return strlen($value) <= 2000;
    }
    if (!is_array($value) || !array_is_list($value)) {
        return false;
    }
    foreach ($value as $item) {
        if ((!is_int($item) && !is_float($item)) || !is_finite((float) $item)) {
            return false;
        }
    }
    return true;
}

function sync_saved_report(array $saved, string $reportDir): void
{
    try {
        sync_report_to_sheet($saved, $reportDir);
    } catch (Throwable) {
        $submissionId = is_string($saved['submissionId'] ?? null) ? $saved['submissionId'] : 'unknown';
        error_log('AI readiness Sheets sync failed for submission ' . $submissionId);
        reject_request(503, 'sheet_sync_unavailable', 'O relatório foi salvo, mas a planilha não pôde ser atualizada. Tente novamente.');
    }
}

function validate_payload(array $payload): void
{
    $topLevelKeys = ['schemaVersion', 'assessmentVersion', 'submissionId', 'participant', 'clientSubmittedAt', 'answers', 'report'];
    if (!has_exact_keys($payload, $topLevelKeys)) {
        reject_request(400, 'invalid_payload', 'Estrutura do relatório inválida.');
    }
    if ($payload['schemaVersion'] !== 1 || $payload['assessmentVersion'] !== 2) {
        reject_request(400, 'invalid_version', 'Versão do relatório inválida.');
    }
    if (!is_string($payload['submissionId']) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $payload['submissionId'])) {
        reject_request(400, 'invalid_submission_id', 'Identificador do relatório inválido.');
    }
    if (!valid_timestamp($payload['clientSubmittedAt'])) {
        reject_request(400, 'invalid_timestamp', 'Data de envio inválida.');
    }

    $participant = $payload['participant'];
    if (!is_object_array($participant) || !has_exact_keys($participant, ['name', 'email', 'storageAcknowledged'])) {
        reject_request(400, 'invalid_participant', 'Identificação inválida.');
    }
    $name = is_string($participant['name']) ? trim($participant['name']) : '';
    $nameLength = function_exists('mb_strlen') ? mb_strlen($name, 'UTF-8') : strlen($name);
    if ($nameLength < 2 || $nameLength > 120) {
        reject_request(400, 'invalid_name', 'Nome inválido.');
    }
    if (!is_string($participant['email']) || strlen($participant['email']) > 254 || filter_var($participant['email'], FILTER_VALIDATE_EMAIL) === false) {
        reject_request(400, 'invalid_email', 'E-mail inválido.');
    }
    if ($participant['storageAcknowledged'] !== true) {
        reject_request(400, 'acknowledgement_required', 'Confirmação de armazenamento obrigatória.');
    }

    $answers = $payload['answers'];
    if (!is_array($answers)) {
        reject_request(400, 'invalid_answers', 'Respostas inválidas.');
    }
    foreach ($answers as $key => $value) {
        if (!is_string($key) || !preg_match('/^[a-z0-9_]+$/', $key) || !valid_answer_value($value)) {
            reject_request(400, 'invalid_answers', 'Respostas inválidas.');
        }
    }

    $report = $payload['report'];
    if (!is_object_array($report) || !has_exact_keys($report, REPORT_KEYS)) {
        reject_request(400, 'invalid_report', 'Conteúdo do relatório inválido.');
    }
    if ((!is_int($report['overallScore']) && !is_float($report['overallScore'])) || !is_finite((float) $report['overallScore']) || $report['overallScore'] < 0 || $report['overallScore'] > 100) {
        reject_request(400, 'invalid_report', 'Conteúdo do relatório inválido.');
    }
    foreach (['result', 'strongest', 'weakest', 'primaryPriority', 'executiveSummary', 'profile', 'nextLevel'] as $key) {
        if (!is_object_array($report[$key])) {
            reject_request(400, 'invalid_report', 'Conteúdo do relatório inválido.');
        }
    }
    foreach (['pillarScores', 'quarterlyRecommendations', 'evidence', 'criticalPath', 'riskSignals', 'opportunityTracks'] as $key) {
        if (!is_array($report[$key]) || !array_is_list($report[$key])) {
            reject_request(400, 'invalid_report', 'Conteúdo do relatório inválido.');
        }
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    reject_request(405, 'method_not_allowed', 'Método não permitido.');
}

$host = strtolower(explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]);
$originHost = strtolower((string) parse_url($_SERVER['HTTP_ORIGIN'] ?? '', PHP_URL_HOST));
if ($host === '' || $originHost === '' || !hash_equals($host, $originHost)) {
    reject_request(403, 'origin_not_allowed', 'Origem não permitida.');
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') {
    reject_request(415, 'unsupported_media_type', 'Envie JSON.');
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > MAX_REPORT_BYTES) {
    reject_request(413, 'payload_too_large', 'Relatório excede o limite permitido.');
}

try {
    $raw = file_get_contents('php://input', false, null, 0, MAX_REPORT_BYTES + 1);
    if ($raw === false || $raw === '' || strlen($raw) > MAX_REPORT_BYTES) {
        reject_request(strlen((string) $raw) > MAX_REPORT_BYTES ? 413 : 400, strlen((string) $raw) > MAX_REPORT_BYTES ? 'payload_too_large' : 'invalid_json', strlen((string) $raw) > MAX_REPORT_BYTES ? 'Relatório excede o limite permitido.' : 'JSON inválido.');
    }
    $payload = json_decode($raw, true, 128, JSON_THROW_ON_ERROR);
    if (!is_object_array($payload)) {
        reject_request(400, 'invalid_payload', 'Estrutura do relatório inválida.');
    }
    validate_payload($payload);

    $canonicalJson = json_encode(canonicalize($payload), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $payloadHash = hash('sha256', $canonicalJson);
    $reportDir = getenv('SNOWFOX_AI_REPORT_DIR') ?: '/opt/snowfox-wordpress/data/ai-readiness-reports';
    if (!is_dir($reportDir) || !is_writable($reportDir)) {
        reject_request(500, 'storage_unavailable', 'Não foi possível salvar o relatório.');
    }

    $submissionId = strtolower($payload['submissionId']);
    $filePath = $reportDir . DIRECTORY_SEPARATOR . $submissionId . '.json';
    $lockPath = $filePath . '.lock';
    $lock = fopen($lockPath, 'c');
    if ($lock === false || !flock($lock, LOCK_EX)) {
        reject_request(500, 'storage_unavailable', 'Não foi possível salvar o relatório.');
    }

    if (is_file($filePath)) {
        $existing = json_decode((string) file_get_contents($filePath), true, 128, JSON_THROW_ON_ERROR);
        flock($lock, LOCK_UN);
        fclose($lock);
        @unlink($lockPath);
        if (!is_array($existing) || !isset($existing['payloadHash']) || !hash_equals((string) $existing['payloadHash'], $payloadHash)) {
            reject_request(409, 'submission_conflict', 'Identificador já utilizado para outro relatório.');
        }
        sync_saved_report($existing, $reportDir);
        respond(200, [
            'submissionId' => $submissionId,
            'receivedAt' => $existing['receivedAt'],
            'payloadHash' => $existing['payloadHash'],
        ]);
    }

    $receivedAt = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format(DateTimeInterface::ATOM);
    $saved = $payload;
    $saved['receivedAt'] = $receivedAt;
    $saved['payloadHash'] = $payloadHash;
    $encoded = json_encode($saved, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
    $tempPath = tempnam($reportDir, '.report-');
    $writeSucceeded = $tempPath !== false && file_put_contents($tempPath, $encoded, LOCK_EX) === strlen($encoded);
    $writeSucceeded = $writeSucceeded && chmod($tempPath, 0640) && rename($tempPath, $filePath);
    if (!$writeSucceeded) {
        if (is_string($tempPath) && is_file($tempPath)) {
            @unlink($tempPath);
        }
        flock($lock, LOCK_UN);
        fclose($lock);
        @unlink($lockPath);
        reject_request(500, 'storage_unavailable', 'Não foi possível salvar o relatório.');
    }

    flock($lock, LOCK_UN);
    fclose($lock);
    @unlink($lockPath);
    sync_saved_report($saved, $reportDir);
    respond(201, ['submissionId' => $submissionId, 'receivedAt' => $receivedAt, 'payloadHash' => $payloadHash]);
} catch (JsonException) {
    reject_request(400, 'invalid_json', 'JSON inválido.');
} catch (Throwable) {
    reject_request(500, 'storage_unavailable', 'Não foi possível salvar o relatório.');
}
