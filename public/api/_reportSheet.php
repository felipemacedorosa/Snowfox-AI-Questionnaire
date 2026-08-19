<?php

declare(strict_types=1);

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

const REPORT_SHEET_ID = '18JbT6WO3bwYrIqkP8dqoQy-jXlDSJHzP7Y1ou0cdcMU';
const REPORT_SHEET_TAB = 'Sheet1';
const REPORT_SHEET_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

function report_sheet_base64url(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

/** @return array{status: int, body: string} */
function report_sheet_http(string $method, string $url, array $headers, ?string $body = null): array
{
    $curl = curl_init($url);
    if ($curl === false) {
        throw new RuntimeException('Could not initialize the Sheets request.');
    }

    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_FOLLOWLOCATION => false,
    ]);
    if ($body !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    }

    $responseBody = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    if (!is_string($responseBody) || $error !== '') {
        throw new RuntimeException('The Sheets request failed.');
    }
    return ['status' => $status, 'body' => $responseBody];
}

function report_sheet_access_token(string $credentialPath): string
{
    static $cachedToken = null;
    static $cachedUntil = 0;
    if (is_string($cachedToken) && time() < $cachedUntil) {
        return $cachedToken;
    }

    $credentialJson = file_get_contents($credentialPath);
    $credential = is_string($credentialJson) ? json_decode($credentialJson, true) : null;
    if (!is_array($credential) || !is_string($credential['client_email'] ?? null) || !is_string($credential['private_key'] ?? null)) {
        throw new RuntimeException('The Sheets credential is invalid.');
    }

    $now = time();
    $header = report_sheet_base64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR));
    $claims = report_sheet_base64url(json_encode([
        'iss' => $credential['client_email'],
        'scope' => REPORT_SHEET_SCOPE,
        'aud' => 'https://oauth2.googleapis.com/token',
        'iat' => $now,
        'exp' => $now + 3600,
    ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    $unsignedJwt = $header . '.' . $claims;
    $signature = '';
    if (!openssl_sign($unsignedJwt, $signature, $credential['private_key'], OPENSSL_ALGO_SHA256)) {
        throw new RuntimeException('Could not sign the Sheets credential.');
    }
    $jwt = $unsignedJwt . '.' . report_sheet_base64url($signature);
    $tokenResponse = report_sheet_http(
        'POST',
        'https://oauth2.googleapis.com/token',
        ['Content-Type: application/x-www-form-urlencoded'],
        http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ])
    );
    $tokenPayload = json_decode($tokenResponse['body'], true);
    if ($tokenResponse['status'] !== 200 || !is_array($tokenPayload) || !is_string($tokenPayload['access_token'] ?? null)) {
        throw new RuntimeException('Could not authorize the Sheets request.');
    }

    $cachedToken = $tokenPayload['access_token'];
    $cachedUntil = $now + max(60, (int) ($tokenPayload['expires_in'] ?? 3600) - 60);
    return $cachedToken;
}

function report_sheet_value(mixed $value): string|int|float
{
    return is_string($value) || is_int($value) || is_float($value) ? $value : '';
}

/** @return list<string|int|float> */
function report_sheet_row(array $saved): array
{
    $report = is_array($saved['report'] ?? null) ? $saved['report'] : [];
    $participant = is_array($saved['participant'] ?? null) ? $saved['participant'] : [];
    $strongest = is_array($report['strongest'] ?? null) ? $report['strongest'] : [];
    $weakest = is_array($report['weakest'] ?? null) ? $report['weakest'] : [];
    $result = is_array($report['result'] ?? null) ? $report['result'] : [];
    $priority = is_array($report['primaryPriority'] ?? null) ? $report['primaryPriority'] : [];
    $source = is_array($saved['source'] ?? null) ? $saved['source'] : [];
    $pillarScores = [];
    foreach (is_array($report['pillarScores'] ?? null) ? $report['pillarScores'] : [] as $pillar) {
        if (is_array($pillar) && is_string($pillar['id'] ?? null)) {
            $pillarScores[$pillar['id']] = report_sheet_value($pillar['score'] ?? '');
        }
    }

    return [
        report_sheet_value($saved['submissionId'] ?? ''),
        report_sheet_value($saved['receivedAt'] ?? ''),
        report_sheet_value($saved['clientSubmittedAt'] ?? ''),
        report_sheet_value($participant['name'] ?? ''),
        report_sheet_value($participant['email'] ?? ''),
        report_sheet_value($report['overallScore'] ?? ''),
        report_sheet_value($result['level'] ?? ''),
        report_sheet_value($result['blocker'] ?? ''),
        report_sheet_value($strongest['title'] ?? ''),
        report_sheet_value($strongest['score'] ?? ''),
        report_sheet_value($weakest['title'] ?? ''),
        report_sheet_value($weakest['score'] ?? ''),
        report_sheet_value($priority['title'] ?? ''),
        report_sheet_value($pillarScores['dados'] ?? ''),
        report_sheet_value($pillarScores['estrategia'] ?? ''),
        report_sheet_value($pillarScores['pessoas'] ?? ''),
        report_sheet_value($pillarScores['governanca'] ?? ''),
        report_sheet_value($pillarScores['tecnologia'] ?? ''),
        report_sheet_value($saved['assessmentVersion'] ?? ''),
        report_sheet_value($source['url'] ?? ''),
        report_sheet_value($source['utmSource'] ?? ''),
        report_sheet_value($source['utmMedium'] ?? ''),
        report_sheet_value($source['utmCampaign'] ?? ''),
        report_sheet_value($source['utmContent'] ?? ''),
        report_sheet_value($source['utmTerm'] ?? ''),
    ];
}

function sync_report_to_sheet(array $saved, string $reportDir): void
{
    $credentialPath = getenv('SNOWFOX_AI_SHEETS_CREDENTIAL') ?: $reportDir . DIRECTORY_SEPARATOR . '.google-service-account';
    if (!is_file($credentialPath)) {
        return;
    }

    $submissionId = $saved['submissionId'] ?? null;
    if (!is_string($submissionId) || $submissionId === '') {
        throw new RuntimeException('The report has no submission id.');
    }

    $token = report_sheet_access_token($credentialPath);
    $headers = ['Authorization: Bearer ' . $token, 'Content-Type: application/json'];
    $range = rawurlencode("'" . REPORT_SHEET_TAB . "'!A2:A");
    $baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets/' . REPORT_SHEET_ID . '/values/';
    $existingResponse = report_sheet_http('GET', $baseUrl . $range . '?majorDimension=ROWS', $headers);
    $existingPayload = json_decode($existingResponse['body'], true);
    if ($existingResponse['status'] !== 200 || !is_array($existingPayload)) {
        throw new RuntimeException('Could not inspect existing Sheet rows.');
    }
    foreach (is_array($existingPayload['values'] ?? null) ? $existingPayload['values'] : [] as $row) {
        if (is_array($row) && isset($row[0]) && hash_equals($submissionId, (string) $row[0])) {
            return;
        }
    }

    $appendRange = rawurlencode("'" . REPORT_SHEET_TAB . "'!A:Y");
    $appendBody = json_encode(['majorDimension' => 'ROWS', 'values' => [report_sheet_row($saved)]], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $appendResponse = report_sheet_http('POST', $baseUrl . $appendRange . ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS', $headers, $appendBody);
    if ($appendResponse['status'] !== 200) {
        throw new RuntimeException('Could not append the Sheet row.');
    }
}
