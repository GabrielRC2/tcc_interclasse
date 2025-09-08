$body = @{
    torneioId = 1
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/partidas/pontuacoes-aleatorias" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body

Write-Host "Status Code: $($response.StatusCode)"
Write-Host "Response:"
$response.Content
