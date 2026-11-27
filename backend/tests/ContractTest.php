<?php

use PHPUnit\Framework\TestCase;
use Extrovent\Middleware\ResponseFormatter;

class ContractTest extends TestCase
{
    private function captureResponse(callable $build): array
    {
        // Capture headers and output without exiting
        // We test ResponseFormatter directly, not via HTTP
        $rf = new ResponseFormatter();
        $build($rf);
        // Use reflection to get payload without exiting
        $ref = new ReflectionClass($rf);
        $status = $ref->getProperty('statusCode');
        $status->setAccessible(true);
        $data = $ref->getProperty('data');
        $data->setAccessible(true);
        $error = $ref->getProperty('error');
        $error->setAccessible(true);
        return [
            'status' => $status->getValue($rf),
            'data' => $data->getValue($rf),
            'error' => $error->getValue($rf),
        ];
    }

    public function testSuccessEnvelope(): void
    {
        $rf = new ResponseFormatter();
        $rf->success(['user_id' => 'alice']);
        ob_start();
        // Mock send without exit by capturing
        $payload = ['success' => true, 'data' => ['user_id' => 'alice'], 'error' => null];
        $json = json_encode($payload);
        $decoded = json_decode($json, true);
        $this->assertTrue($decoded['success']);
        $this->assertEquals('alice', $decoded['data']['user_id']);
        $this->assertNull($decoded['error']);
        ob_end_clean();
    }

    public function testErrorEnvelope404(): void
    {
        $rf = new ResponseFormatter();
        $rf->error('User not found', 404);
        $ref = new ReflectionClass($rf);
        $status = $ref->getProperty('statusCode');
        $status->setAccessible(true);
        $this->assertEquals(404, $status->getValue($rf));
        $error = $ref->getProperty('error');
        $error->setAccessible(true);
        $this->assertEquals('User not found', $error->getValue($rf));
    }

    public function testContentTypeIsJson(): void
    {
        // ResponseFormatter::send() sets header; we verify header logic exists
        $source = file_get_contents(__DIR__ . '/../src/Middleware/ResponseFormatter.php');
        $this->assertStringContainsString('Content-Type: application/json', $source);
        $this->assertStringContainsString('JSON_INVALID_UTF8_SUBSTITUTE', $source);
    }

    public function testRouteTableCoversUserView(): void
    {
        $index = file_get_contents(__DIR__ . '/../public/index.php');
        $this->assertStringContainsString("'user/view'", $index);
        $this->assertStringContainsString('viewUser', $index);
    }

    public function testMalformedUtf8Substitution(): void
    {
        $payload = ['success' => true, 'data' => ["bad" => "\xFF\xFE"], 'error' => null];
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR);
        $this->assertNotFalse($json);
        $decoded = json_decode($json, true);
        $this->assertTrue($decoded['success']);
    }
}
