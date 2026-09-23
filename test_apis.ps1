$base = "http://localhost:3000"

function Test-Api {
    param($label, $method, $url, $body)
    Write-Host "`n=== $label ===" -ForegroundColor Cyan
    Write-Host "$method $url"
    try {
        $params = @{
            Uri             = $url
            Method          = $method
            UseBasicParsing = $true
            TimeoutSec      = 20
        }
        if ($body) {
            $params.Body        = $body
            $params.ContentType = "application/json"
        }
        $r = Invoke-WebRequest @params
        Write-Host "HTTP Status : $($r.StatusCode) $($r.StatusDescription)" -ForegroundColor Green
        $c = $r.Content
        if ($c.Length -gt 500) { $c = $c.Substring(0, 500) + "..." }
        Write-Host "Response    : $c"
    } catch {
        $resp = $_.Exception.Response
        $code = if ($resp) { [int]$resp.StatusCode } else { 0 }
        $desc = if ($resp) { $resp.StatusDescription } else { "Connection Error" }
        Write-Host "HTTP Status : $code $desc" -ForegroundColor Yellow
        if ($resp) {
            try {
                $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
                $errBody = $reader.ReadToEnd()
                if ($errBody) { Write-Host "Response    : $errBody" }
            } catch {}
        }
    }
}

# 1. GET /api/stories  →  ใช้ endpoint หลัก stories/creators (public, ไม่ต้อง auth)
Test-Api "1. GET /api/stories" GET "$base/api/stories/creators"

# 2. POST /api/stories  →  ส่ง body ว่าง (ต้องการ auth → expect 401)
#    stories route หลักเป็น PATCH/DELETE ไม่มี POST
#    แต่ generate-story คือ create story จาก AI (POST)
Test-Api "2. POST /api/stories (empty body, no auth)" POST "$base/api/stories/creators" '{}'

# 3. GET /api/favorites (no auth → expect 401)
Test-Api "3. GET /api/favorites" GET "$base/api/favorites"

# 4. POST /api/sessions/[id]/generate → ใช้ generate-story route
#    (game-sessions/[sessionId] เป็น PATCH สำหรับ is_public flag)
#    ลอง session ID จาก ข้อมูล creators ที่ได้จาก test 1
Test-Api "4. POST /api/generate-story (session generate, no auth)" POST "$base/api/generate-story" '{"storyId":"824f0aaa-bf08-4406-9033-c96d5198a91c"}'

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "API Test Summary" -ForegroundColor Cyan
Write-Host "=============================================`n" -ForegroundColor Cyan
