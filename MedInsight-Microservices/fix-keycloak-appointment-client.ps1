# Script pour créer le client appointment-service dans Keycloak
# Date: 2026-01-16

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Création du client appointment-service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Obtenir le token admin
Write-Host "1. Connexion à Keycloak..." -ForegroundColor Yellow
$body = @{
    username = "admin"
    password = "admin"
    grant_type = "password"
    client_id = "admin-cli"
}

try {
    $tokenResponse = Invoke-RestMethod -Uri "http://localhost:8180/realms/master/protocol/openid-connect/token" `
        -Method Post `
        -Body $body `
        -ContentType "application/x-www-form-urlencoded"
    
    $token = $tokenResponse.access_token
    Write-Host "   ✓ Token admin obtenu" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Erreur lors de l'obtention du token: $_" -ForegroundColor Red
    exit 1
}

# 2. Vérifier si le client existe déjà
Write-Host ""
Write-Host "2. Vérification de l'existence du client..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $existingClients = Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/microservices-realm/clients" `
        -Method Get `
        -Headers $headers
    
    $appointmentClient = $existingClients | Where-Object { $_.clientId -eq "appointment-service" }
    
    if ($appointmentClient) {
        Write-Host "   ⚠ Le client appointment-service existe déjà" -ForegroundColor Yellow
        Write-Host "   ID: $($appointmentClient.id)" -ForegroundColor Gray
        exit 0
    } else {
        Write-Host "   ℹ Le client appointment-service n'existe pas, création en cours..." -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ✗ Erreur lors de la vérification: $_" -ForegroundColor Red
    exit 1
}

# 3. Créer le client appointment-service
Write-Host ""
Write-Host "3. Création du client appointment-service..." -ForegroundColor Yellow

$clientConfig = @{
    clientId = "appointment-service"
    name = "Appointment Service"
    description = "Service de gestion des rendez-vous médicaux"
    enabled = $true
    publicClient = $false
    serviceAccountsEnabled = $true
    directAccessGrantsEnabled = $false
    standardFlowEnabled = $false
    implicitFlowEnabled = $false
    protocol = "openid-connect"
    attributes = @{
        "access.token.lifespan" = "3600"
    }
    defaultClientScopes = @("profile", "email", "roles")
    optionalClientScopes = @()
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/microservices-realm/clients" `
        -Method Post `
        -Headers $headers `
        -Body $clientConfig | Out-Null
    
    Write-Host "   ✓ Client appointment-service créé avec succès" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Erreur lors de la création du client: $_" -ForegroundColor Red
    exit 1
}

# 4. Récupérer l'ID du client créé
Write-Host ""
Write-Host "4. Récupération des informations du client..." -ForegroundColor Yellow

try {
    $clients = Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/microservices-realm/clients" `
        -Method Get `
        -Headers $headers
    
    $newClient = $clients | Where-Object { $_.clientId -eq "appointment-service" }
    
    if ($newClient) {
        Write-Host "   ✓ Client trouvé" -ForegroundColor Green
        Write-Host "     - Client ID: $($newClient.clientId)" -ForegroundColor Gray
        Write-Host "     - Internal ID: $($newClient.id)" -ForegroundColor Gray
        Write-Host "     - Enabled: $($newClient.enabled)" -ForegroundColor Gray
        Write-Host "     - Service Accounts: $($newClient.serviceAccountsEnabled)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Erreur lors de la récupération: $_" -ForegroundColor Red
}

# 5. Récupérer le secret du client
Write-Host ""
Write-Host "5. Récupération du secret du client..." -ForegroundColor Yellow

try {
    $secret = Invoke-RestMethod -Uri "http://localhost:8180/admin/realms/microservices-realm/clients/$($newClient.id)/client-secret" `
        -Method Get `
        -Headers $headers
    
    Write-Host "   ✓ Secret du client:" -ForegroundColor Green
    Write-Host "     $($secret.value)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   ⚠ IMPORTANT: Sauvegardez ce secret pour la configuration du service!" -ForegroundColor Yellow
} catch {
    Write-Host "   ✗ Erreur lors de la récupération du secret: $_" -ForegroundColor Red
}

# 6. Résumé
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Configuration terminée" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Ajouter le secret dans la configuration du appointment-service" -ForegroundColor White
Write-Host "2. Redémarrer le service appointment-service" -ForegroundColor White
Write-Host "3. Vérifier que le service peut s'authentifier auprès de Keycloak" -ForegroundColor White
Write-Host ""
